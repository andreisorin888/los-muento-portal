"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { canManageRobberies, requirePermission, type ActorInfo } from "@/lib/permissions";
import { auditLogTx } from "@/lib/audit";
import type { RobberyStatus } from "@prisma/client";

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

async function nextRobberyRef(): Promise<string> {
  const count = await db.robbery.count();
  return `JF-${String(count + 1).padStart(4, "0")}`;
}

export async function createRobbery(data: {
  type: string;
  description?: string;
  reward: number;
  participantIds: string[];
}): Promise<{ error?: string }> {
  try {
    const actor = await getActor();
    requirePermission(canManageRobberies(actor));
    if (!data.type.trim()) return { error: "Tipul este obligatoriu." };

    const ref = await nextRobberyRef();
    const share = data.participantIds.length > 0
      ? Math.floor(data.reward / data.participantIds.length)
      : 0;

    await db.$transaction(async (tx) => {
      const robbery = await tx.robbery.create({
        data: {
          ref,
          type: data.type.trim(),
          description: data.description?.trim() || null,
          reward: data.reward,
          leaderId: actor.id,
        },
      });
      if (data.participantIds.length > 0) {
        await tx.robberyParticipant.createMany({
          data: data.participantIds.map((memberId) => ({
            robberyId: robbery.id,
            memberId,
            share,
          })),
          skipDuplicates: true,
        });
      }
      await auditLogTx(tx, actor.id, "ROBBERY_CREATED", "Robbery", robbery.id, {
        after: { ref, type: data.type, reward: data.reward },
      });
    });

    revalidatePath("/robberies");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Eroare necunoscută." };
  }
}

export async function updateRobberyStatus(
  robberyId: string,
  status: RobberyStatus,
): Promise<{ error?: string }> {
  try {
    const actor = await getActor();
    requirePermission(canManageRobberies(actor));

    await db.$transaction(async (tx) => {
      const before = await tx.robbery.findUnique({ where: { id: robberyId }, select: { status: true } });
      await tx.robbery.update({ where: { id: robberyId }, data: { status } });
      await auditLogTx(tx, actor.id, "ROBBERY_STATUS", "Robbery", robberyId, {
        before: { status: before?.status },
        after: { status },
      });
    });

    revalidatePath("/robberies");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Eroare necunoscută." };
  }
}
