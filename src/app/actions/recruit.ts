"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { canApproveRecruit, canManageRecruit, requirePermission, type ActorInfo } from "@/lib/permissions";
import { auditLogTx } from "@/lib/audit";
import { generateNextMemberCode } from "@/lib/members";

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

export async function addRecruit(
  discordName: string,
  discordId?: string,
  notes?: string,
): Promise<{ error?: string }> {
  try {
    const actor = await getActor();
    requirePermission(canManageRecruit(actor));
    if (!discordName.trim()) return { error: "Numele Discord este obligatoriu." };

    await db.$transaction(async (tx) => {
      const recruit = await tx.recruit.create({
        data: {
          discordName: discordName.trim(),
          discordId: discordId?.trim() || null,
          notes,
          recruitedById: actor.id,
        },
      });
      await auditLogTx(tx, actor.id, "RECRUIT_ADDED", "Recruit", recruit.id, {
        after: { discordName, recruitedById: actor.id },
      });
    });

    revalidatePath("/recruitment");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Eroare necunoscută." };
  }
}

export async function advanceToProbation(
  recruitId: string,
  notes?: string,
): Promise<{ error?: string }> {
  try {
    const actor = await getActor();
    const recruit = await db.recruit.findUnique({ where: { id: recruitId } });
    if (!recruit) return { error: "Recrutatul nu a fost găsit." };
    if (recruit.status !== "CANDIDAT") return { error: "Recrutatul nu este în stadiul de candidat." };
    requirePermission(canManageRecruit(actor, recruit.recruitedById));

    await db.$transaction(async (tx) => {
      await tx.recruit.update({
        where: { id: recruitId },
        data: { status: "PROBATIE", probationStart: new Date(), notes: notes ?? recruit.notes },
      });
      await auditLogTx(tx, actor.id, "RECRUIT_PROBATION", "Recruit", recruitId, {
        before: { status: "CANDIDAT" },
        after: { status: "PROBATIE" },
      });
    });

    revalidatePath("/recruitment");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Eroare necunoscută." };
  }
}

export async function approveRecruit(
  recruitId: string,
  memberName: string,
  rankName: string,
  rankLevel: number,
  deptId?: string,
): Promise<{ error?: string }> {
  try {
    const actor = await getActor();
    requirePermission(canApproveRecruit(actor));

    const recruit = await db.recruit.findUnique({ where: { id: recruitId } });
    if (!recruit) return { error: "Recrutatul nu a fost găsit." };
    if (recruit.status !== "PROBATIE" && recruit.status !== "CANDIDAT") {
      return { error: "Recrutatul nu poate fi aprobat în starea actuală." };
    }
    if (!memberName.trim()) return { error: "Numele membrului este obligatoriu." };

    const session = await getServerSession(authOptions);
    const userId = session!.user.id;

    await db.$transaction(async (tx) => {
      let resolvedMemberId: string;

      if (recruit.memberId) {
        // Auto-registered via portal: update existing Vizitator member
        await tx.member.update({
          where: { id: recruit.memberId },
          data: {
            name: memberName.trim(),
            rankName,
            rankLevel,
            status: "ACTIV",
            deptId: deptId || null,
          },
        });
        resolvedMemberId = recruit.memberId;
      } else {
        // Classic flow: create new member
        const memberCode = await generateNextMemberCode();
        const member = await tx.member.create({
          data: {
            memberCode,
            userId,
            discordId: recruit.discordId ?? `discord_${recruit.id}`,
            discordName: recruit.discordName,
            name: memberName.trim(),
            rankName,
            rankLevel,
            status: "PROBATORIE",
            recruitedById: recruit.recruitedById,
            deptId: deptId || null,
          },
        });
        resolvedMemberId = member.id;
      }

      await tx.recruit.update({
        where: { id: recruitId },
        data: {
          status: "APROBAT",
          approvedById: actor.id,
          approvedAt: new Date(),
          memberId: resolvedMemberId,
        },
      });
      await auditLogTx(tx, actor.id, "RECRUIT_APPROVED", "Recruit", recruitId, {
        after: { memberId: resolvedMemberId, rankName, rankLevel },
      });
    });

    revalidatePath("/recruitment");
    revalidatePath("/members");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Eroare necunoscută." };
  }
}

export async function rejectRecruit(
  recruitId: string,
  note: string,
): Promise<{ error?: string }> {
  try {
    const actor = await getActor();
    const recruit = await db.recruit.findUnique({ where: { id: recruitId } });
    if (!recruit) return { error: "Recrutatul nu a fost găsit." };
    requirePermission(canApproveRecruit(actor));
    if (!note.trim()) return { error: "Motivul respingerii este obligatoriu." };

    await db.$transaction(async (tx) => {
      await tx.recruit.update({
        where: { id: recruitId },
        data: { status: "RESPINS", rejectedNote: note, approvedById: actor.id },
      });
      await auditLogTx(tx, actor.id, "RECRUIT_REJECTED", "Recruit", recruitId, {
        after: { status: "RESPINS", note },
      });
    });

    revalidatePath("/recruitment");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Eroare necunoscută." };
  }
}
