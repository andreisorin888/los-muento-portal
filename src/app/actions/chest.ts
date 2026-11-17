"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { canSubmitChestTx, canApproveChestTx, requirePermission, type ActorInfo } from "@/lib/permissions";
import { auditLogTx } from "@/lib/audit";
import type { ApprovalStatus, ChestTxType } from "@prisma/client";

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

export async function submitChestTx(data: {
  type: ChestTxType;
  amount: number;
  note: string;
  targetMemberId?: string;
}): Promise<{ error?: string }> {
  try {
    const actor = await getActor();
    requirePermission(canSubmitChestTx(actor));
    if (data.amount <= 0) return { error: "Suma trebuie să fie pozitivă." };
    if (!data.note.trim()) return { error: "Nota este obligatorie." };

    const chest = await db.chest.findFirst({ orderBy: { createdAt: "asc" } });
    if (!chest) return { error: "Seiful nu există. Contactează un administrator." };

    await db.$transaction(async (tx) => {
      const txRecord = await tx.chestTransaction.create({
        data: {
          chestId: chest.id,
          type: data.type,
          amount: data.amount,
          note: data.note.trim(),
          submittedById: actor.id,
          targetMemberId: data.targetMemberId || null,
        },
      });
      await auditLogTx(tx, actor.id, "CHEST_TX_SUBMITTED", "ChestTransaction", txRecord.id, {
        after: { type: data.type, amount: data.amount },
      });
    });

    revalidatePath("/chest");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Eroare necunoscută." };
  }
}

export async function approveChestTx(
  txId: string,
  status: ApprovalStatus,
  rejectionNote?: string,
): Promise<{ error?: string }> {
  try {
    const actor = await getActor();
    requirePermission(canApproveChestTx(actor));
    if (status === "ASTEPTARE") return { error: "Status invalid." };

    const record = await db.chestTransaction.findUnique({
      where: { id: txId },
      include: { chest: true },
    });
    if (!record) return { error: "Tranzacția nu a fost găsită." };
    if (record.approvalStatus !== "ASTEPTARE") return { error: "Tranzacția a fost deja procesată." };

    await db.$transaction(async (tx) => {
      await tx.chestTransaction.update({
        where: { id: txId },
        data: {
          approvalStatus: status,
          approvedById: actor.id,
          rejectionNote: status === "RESPINS" ? (rejectionNote || null) : null,
        },
      });

      if (status === "APROBAT") {
        let delta = 0;
        if (record.type === "DEPUNERE" || record.type === "CORECTIE") delta = record.amount;
        if (record.type === "RETRAGERE") delta = -record.amount;

        await tx.chest.update({
          where: { id: record.chestId },
          data: { balance: { increment: delta } },
        });
      }

      await auditLogTx(tx, actor.id, "CHEST_TX_REVIEWED", "ChestTransaction", txId, {
        after: { status, delta: status === "APROBAT" ? record.amount : 0 },
      });
    });

    revalidatePath("/chest");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Eroare necunoscută." };
  }
}

export async function initChest(): Promise<{ error?: string }> {
  try {
    const actor = await getActor();
    requirePermission(canApproveChestTx(actor));
    const existing = await db.chest.findFirst();
    if (existing) return { error: "Seiful există deja." };
    await db.chest.create({ data: { balance: 0 } });
    revalidatePath("/chest");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Eroare necunoscută." };
  }
}
