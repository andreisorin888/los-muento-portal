"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { canApproveChestTx, canManageConfig, requirePermission, type ActorInfo } from "@/lib/permissions";
import { auditLogTx } from "@/lib/audit";
import type { ApprovalStatus, ChestItemTxType } from "@prisma/client";

async function getActor(): Promise<ActorInfo> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.memberId) throw new Error("Neautentificat.");
  const m = await db.member.findUnique({
    where: { id: session.user.memberId },
    select: { id: true, rankLevel: true, status: true },
  });
  if (!m) throw new Error("Profil de membru negăsit.");
  return m;
}

function toSlug(label: string): string {
  return label
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/(^_|_$)/g, "");
}

// ── ChestItemType CRUD ────────────────────────────────────────────────────────

export async function getChestItemTypes() {
  return db.chestItemType.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
}

export async function createChestItemType(data: {
  label: string;
  emoji: string;
  unit: string;
}): Promise<{ error?: string }> {
  try {
    const actor = await getActor();
    requirePermission(canManageConfig(actor));
    const slug = toSlug(data.label);
    if (!slug) return { error: "Eticheta este invalidă." };
    const max = await db.chestItemType.aggregate({ _max: { sortOrder: true } });
    await db.chestItemType.create({
      data: { slug, label: data.label.trim(), emoji: data.emoji.trim() || "📦", unit: data.unit.trim() || "buc.", sortOrder: (max._max.sortOrder ?? 0) + 1 },
    });
    revalidatePath("/configuration");
    revalidatePath("/chest");
    return {};
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Eroare necunoscută.";
    if (msg.includes("Unique constraint")) return { error: "Există deja un articol cu acest slug." };
    return { error: msg };
  }
}

export async function updateChestItemType(
  id: string,
  data: { label: string; emoji: string; unit: string; isActive: boolean },
): Promise<{ error?: string }> {
  try {
    const actor = await getActor();
    requirePermission(canManageConfig(actor));
    await db.chestItemType.update({
      where: { id },
      data: { label: data.label.trim(), emoji: data.emoji.trim() || "📦", unit: data.unit.trim() || "buc.", isActive: data.isActive },
    });
    revalidatePath("/configuration");
    revalidatePath("/chest");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Eroare necunoscută." };
  }
}

export async function reorderChestItemType(id: string, dir: "up" | "down"): Promise<void> {
  const actor = await getActor();
  requirePermission(canManageConfig(actor));
  const all = await db.chestItemType.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
  const idx = all.findIndex((c) => c.id === id);
  if (idx < 0) return;
  const swap = dir === "up" ? idx - 1 : idx + 1;
  if (swap < 0 || swap >= all.length) return;
  const a = all[idx];
  const b = all[swap];
  await db.$transaction([
    db.chestItemType.update({ where: { id: a.id }, data: { sortOrder: b.sortOrder } }),
    db.chestItemType.update({ where: { id: b.id }, data: { sortOrder: a.sortOrder } }),
  ]);
  revalidatePath("/configuration");
}

// ── Chest item stock ──────────────────────────────────────────────────────────

export async function getChestItemStock(chestId: string) {
  return db.chestItemStock.findMany({
    where: { chestId },
    include: { itemType: true },
    orderBy: { itemType: { sortOrder: "asc" } },
  });
}

// ── Item transactions ─────────────────────────────────────────────────────────

export async function submitItemTx(data: {
  type: ChestItemTxType;
  note: string;
  lines: { itemTypeId: string; quantity: number }[];
}): Promise<{ error?: string }> {
  try {
    const actor = await getActor();
    if (!data.note.trim()) return { error: "Nota este obligatorie." };
    if (!data.lines.length) return { error: "Selectează cel puțin un articol." };
    for (const l of data.lines) {
      if (l.quantity <= 0) return { error: "Cantitățile trebuie să fie pozitive." };
    }

    const chest = await db.chest.findFirst({ orderBy: { createdAt: "asc" } });
    if (!chest) return { error: "Seiful nu există. Contactează un administrator." };

    await db.chestItemTx.create({
      data: {
        chestId: chest.id,
        type: data.type,
        note: data.note.trim(),
        submittedById: actor.id,
        lines: { create: data.lines },
      },
    });

    revalidatePath("/chest");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Eroare necunoscută." };
  }
}

export async function approveItemTx(
  txId: string,
  status: ApprovalStatus,
  rejectionNote?: string,
): Promise<{ error?: string }> {
  try {
    const actor = await getActor();
    requirePermission(canApproveChestTx(actor));
    if (status === "ASTEPTARE") return { error: "Status invalid." };

    const record = await db.chestItemTx.findUnique({
      where: { id: txId },
      include: { lines: true },
    });
    if (!record) return { error: "Tranzacția nu a fost găsită." };
    if (record.approvalStatus !== "ASTEPTARE") return { error: "Tranzacția a fost deja procesată." };

    await db.$transaction(async (tx) => {
      await tx.chestItemTx.update({
        where: { id: txId },
        data: {
          approvalStatus: status,
          approvedById: actor.id,
          rejectionNote: status === "RESPINS" ? (rejectionNote || null) : null,
        },
      });

      if (status === "APROBAT") {
        for (const line of record.lines) {
          const delta = record.type === "DEPUNERE" || record.type === "CORECTIE" ? line.quantity : -line.quantity;
          await tx.chestItemStock.upsert({
            where: { chestId_itemTypeId: { chestId: record.chestId, itemTypeId: line.itemTypeId } },
            create: { chestId: record.chestId, itemTypeId: line.itemTypeId, quantity: Math.max(0, delta) },
            update: { quantity: { increment: delta } },
          });
        }
      }

      await auditLogTx(tx, actor.id, "CHEST_ITEM_TX_REVIEWED", "ChestItemTx", txId, {
        after: { status, type: record.type },
      });
    });

    revalidatePath("/chest");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Eroare necunoscută." };
  }
}

export async function getPendingItemTxs(chestId: string) {
  return db.chestItemTx.findMany({
    where: { chestId, approvalStatus: "ASTEPTARE" },
    include: {
      submittedBy: { select: { name: true } },
      lines: { include: { itemType: { select: { label: true, emoji: true, unit: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getItemTxHistory(chestId: string) {
  return db.chestItemTx.findMany({
    where: { chestId, approvalStatus: { not: "ASTEPTARE" } },
    include: {
      submittedBy: { select: { name: true } },
      approvedBy: { select: { name: true } },
      lines: { include: { itemType: { select: { label: true, emoji: true, unit: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}
