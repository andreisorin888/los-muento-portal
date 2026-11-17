"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { canManageArmory, requirePermission, type ActorInfo } from "@/lib/permissions";
import { auditLogTx } from "@/lib/audit";
import type { WeaponHistoryType, WeaponStatus } from "@prisma/client";

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

export async function addWeapon(data: {
  name: string;
  type: string;
  serial?: string;
  notes?: string;
}): Promise<{ error?: string }> {
  try {
    const actor = await getActor();
    requirePermission(canManageArmory(actor));
    if (!data.name.trim()) return { error: "Numele armei este obligatoriu." };

    await db.$transaction(async (tx) => {
      const weapon = await tx.weapon.create({
        data: {
          name: data.name.trim(),
          type: data.type.trim(),
          serial: data.serial?.trim() || null,
          notes: data.notes?.trim() || null,
        },
      });
      await auditLogTx(tx, actor.id, "WEAPON_ADDED", "Weapon", weapon.id, {
        after: { name: data.name, type: data.type },
      });
    });

    revalidatePath("/armory");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Eroare necunoscută." };
  }
}

export async function assignWeapon(
  weaponId: string,
  memberId: string | null,
  type: WeaponHistoryType,
  note?: string,
): Promise<{ error?: string }> {
  try {
    const actor = await getActor();
    requirePermission(canManageArmory(actor));

    const weapon = await db.weapon.findUnique({ where: { id: weaponId } });
    if (!weapon) return { error: "Arma nu a fost găsită." };

    let newStatus: WeaponStatus = "DISPONIBIL";
    if (type === "ATRIBUIRE" && memberId) newStatus = "ATRIBUIT";
    if (type === "PIERDERE") newStatus = "PIERDUT";
    if (type === "RETURNARE" || type === "TRANSFER") newStatus = "DISPONIBIL";

    await db.$transaction(async (tx) => {
      await tx.weapon.update({
        where: { id: weaponId },
        data: { status: newStatus, assignedToId: type === "ATRIBUIRE" ? memberId : null },
      });
      await tx.weaponHistory.create({
        data: {
          weaponId,
          memberId,
          type,
          note: note || null,
          recordedById: actor.id,
        },
      });
      await auditLogTx(tx, actor.id, "WEAPON_ASSIGNED", "Weapon", weaponId, {
        after: { type, memberId, status: newStatus },
      });
    });

    revalidatePath("/armory");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Eroare necunoscută." };
  }
}

export async function updateAmmoStock(
  ammoType: string,
  quantity: number,
  note?: string,
): Promise<{ error?: string }> {
  try {
    const actor = await getActor();
    requirePermission(canManageArmory(actor));
    if (!ammoType.trim()) return { error: "Tipul de muniție este obligatoriu." };
    if (quantity < 0) return { error: "Cantitatea nu poate fi negativă." };

    await db.ammoStock.upsert({
      where: { ammoType },
      update: { quantity, updatedById: actor.id, note: note || null },
      create: { ammoType, quantity, updatedById: actor.id, note: note || null },
    });

    revalidatePath("/armory");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Eroare necunoscută." };
  }
}
