"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { canManageTerritories, canManageConfig, requirePermission, type ActorInfo } from "@/lib/permissions";
import { auditLogTx } from "@/lib/audit";
import type { TerritoryStatus } from "@prisma/client";

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

export async function createTerritory(data: {
  name: string;
  description?: string;
}): Promise<{ error?: string }> {
  try {
    const actor = await getActor();
    requirePermission(canManageConfig(actor));
    if (!data.name.trim()) return { error: "Numele este obligatoriu." };

    await db.territory.create({
      data: { name: data.name.trim(), description: data.description?.trim() || null },
    });

    revalidatePath("/territories");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Eroare necunoscută." };
  }
}

export async function updateTerritoryStatus(
  territoryId: string,
  status: TerritoryStatus,
  note?: string,
  controlledById?: string | null,
): Promise<{ error?: string }> {
  try {
    const actor = await getActor();
    requirePermission(canManageTerritories(actor));

    await db.$transaction(async (tx) => {
      const before = await tx.territory.findUnique({
        where: { id: territoryId },
        select: { status: true },
      });
      await tx.territory.update({
        where: { id: territoryId },
        data: { status, controlledById: controlledById ?? null },
      });
      await tx.territoryHistory.create({
        data: {
          territoryId,
          fromStatus: before?.status ?? null,
          toStatus: status,
          note: note || null,
          changedById: actor.id,
        },
      });
      await auditLogTx(tx, actor.id, "TERRITORY_STATUS", "Territory", territoryId, {
        before: { status: before?.status },
        after: { status },
        note,
      });
    });

    revalidatePath("/territories");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Eroare necunoscută." };
  }
}
