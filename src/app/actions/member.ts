"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  canPromoteDemote,
  canIssueWarning,
  canResolveWarning,
  canChangeStatus,
  canArchiveMember,
  canEditMemberProfile,
  canEditCoreProfile,
  requirePermission,
  type ActorInfo,
} from "@/lib/permissions";
import { auditLogTx } from "@/lib/audit";
import type { MemberRole, MemberStatus } from "@prisma/client";
import { RANKS } from "@/config/nav";

async function getActor(): Promise<ActorInfo> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.memberId) throw new Error("Neautentificat.");
  const member = await db.member.findUnique({
    where: { id: session.user.memberId },
    select: { id: true, rankLevel: true, status: true },
  });
  if (!member) throw new Error("Profil de membru negăsit.");
  return member;
}

export async function changeRank(
  memberId: string,
  newRankName: string,
  reason: string,
): Promise<{ error?: string }> {
  try {
    const actor = await getActor();
    const target = await db.member.findUnique({
      where: { id: memberId },
      select: { id: true, rankName: true, rankLevel: true },
    });
    if (!target) return { error: "Membrul nu a fost găsit." };

    const newRank = RANKS.find((r) => r.name === newRankName);
    if (!newRank) return { error: "Grad invalid." };

    requirePermission(canPromoteDemote(actor, target.rankLevel));
    requirePermission(actor.rankLevel > newRank.level, "Nu poți promova la sau peste gradul tău.");
    if (!reason.trim()) return { error: "Motivul este obligatoriu." };

    await db.$transaction(async (tx) => {
      await tx.member.update({
        where: { id: memberId },
        data: { rankName: newRankName, rankLevel: newRank.level },
      });
      await tx.rankHistory.create({
        data: {
          memberId,
          fromRank: target.rankName,
          toRank: newRankName,
          fromLevel: target.rankLevel,
          toLevel: newRank.level,
          reason,
          performedById: actor.id,
        },
      });
      await auditLogTx(tx, actor.id, "RANK_CHANGE", "Member", memberId, {
        before: { rankName: target.rankName, rankLevel: target.rankLevel },
        after: { rankName: newRankName, rankLevel: newRank.level },
        note: reason,
      });
    });

    revalidatePath(`/members/${memberId}`);
    revalidatePath("/members");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Eroare necunoscută." };
  }
}

export async function issueWarning(
  memberId: string,
  severity: "MINOR" | "MAJOR" | "FINAL",
  reason: string,
  notes?: string,
): Promise<{ error?: string }> {
  try {
    const actor = await getActor();
    requirePermission(canIssueWarning(actor));
    if (!reason.trim()) return { error: "Motivul este obligatoriu." };

    await db.$transaction(async (tx) => {
      const warning = await tx.warning.create({
        data: { memberId, severity, reason, notes, issuedById: actor.id },
      });
      await auditLogTx(tx, actor.id, "WARNING_ISSUED", "Warning", warning.id, {
        after: { memberId, severity, reason },
      });
    });

    revalidatePath(`/members/${memberId}`);
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Eroare necunoscută." };
  }
}

export async function resolveWarning(
  warningId: string,
  resolvedNote: string,
): Promise<{ error?: string }> {
  try {
    const actor = await getActor();
    requirePermission(canResolveWarning(actor));

    const warning = await db.warning.findUnique({ where: { id: warningId } });
    if (!warning) return { error: "Avertismentul nu a fost găsit." };

    await db.$transaction(async (tx) => {
      await tx.warning.update({
        where: { id: warningId },
        data: { resolvedAt: new Date(), resolvedNote },
      });
      await auditLogTx(tx, actor.id, "WARNING_RESOLVED", "Warning", warningId, {
        note: resolvedNote,
      });
    });

    revalidatePath(`/members/${warning.memberId}`);
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Eroare necunoscută." };
  }
}

export async function changeStatus(
  memberId: string,
  newStatus: MemberStatus,
  note?: string,
): Promise<{ error?: string }> {
  try {
    const actor = await getActor();
    requirePermission(canChangeStatus(actor));

    const target = await db.member.findUnique({
      where: { id: memberId },
      select: { id: true, status: true },
    });
    if (!target) return { error: "Membrul nu a fost găsit." };
    if (newStatus === "ARHIVAT") return { error: "Folosește acțiunea de arhivare." };

    await db.$transaction(async (tx) => {
      await tx.member.update({ where: { id: memberId }, data: { status: newStatus } });
      await auditLogTx(tx, actor.id, "STATUS_CHANGE", "Member", memberId, {
        before: { status: target.status },
        after: { status: newStatus },
        note,
      });
    });

    revalidatePath(`/members/${memberId}`);
    revalidatePath("/members");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Eroare necunoscută." };
  }
}

export async function archiveMember(
  memberId: string,
  note: string,
): Promise<{ error?: string }> {
  try {
    const actor = await getActor();
    requirePermission(canArchiveMember(actor));
    if (!note.trim()) return { error: "Motivul arhivării este obligatoriu." };
    if (actor.id === memberId) return { error: "Nu te poți arhiva singur." };

    const target = await db.member.findUnique({
      where: { id: memberId },
      select: { id: true, status: true, rankLevel: true },
    });
    if (!target) return { error: "Membrul nu a fost găsit." };
    if (target.status === "ARHIVAT") return { error: "Membrul este deja arhivat." };
    if (target.rankLevel >= actor.rankLevel) {
      return { error: "Nu poți arhiva un membru cu grad egal sau mai mare decât al tău." };
    }

    await db.$transaction(async (tx) => {
      await tx.member.update({
        where: { id: memberId },
        data: { status: "ARHIVAT", archivedAt: new Date(), archivedNote: note },
      });
      await auditLogTx(tx, actor.id, "MEMBER_ARCHIVED", "Member", memberId, {
        before: { status: target.status },
        after: { status: "ARHIVAT" },
        note,
      });
    });

    revalidatePath(`/members/${memberId}`);
    revalidatePath("/members");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Eroare necunoscută." };
  }
}

export async function changeRole(
  memberId: string,
  newRole: MemberRole,
): Promise<{ error?: string }> {
  try {
    const actor = await getActor();
    requirePermission(canEditMemberProfile(actor, memberId));

    const target = await db.member.findUnique({
      where: { id: memberId },
      select: { id: true, role: true },
    });
    if (!target) return { error: "Membrul nu a fost găsit." };

    await db.$transaction(async (tx) => {
      await tx.member.update({ where: { id: memberId }, data: { role: newRole } });
      await auditLogTx(tx, actor.id, "ROLE_CHANGE", "Member", memberId, {
        before: { role: target.role },
        after: { role: newRole },
      });
    });

    revalidatePath(`/members/${memberId}`);
    revalidatePath("/members");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Eroare necunoscută." };
  }
}

export async function editMemberDetails(
  memberId: string,
  data: { name: string; discordName: string; deptId: string | null; crewId: string | null },
): Promise<{ error?: string }> {
  try {
    const actor = await getActor();
    requirePermission(canEditCoreProfile(actor));
    if (!data.name.trim()) return { error: "Numele este obligatoriu." };

    const before = await db.member.findUnique({
      where: { id: memberId },
      select: { name: true, discordName: true, deptId: true, crewId: true },
    });
    if (!before) return { error: "Membrul nu a fost găsit." };

    await db.$transaction(async (tx) => {
      await tx.member.update({
        where: { id: memberId },
        data: {
          name: data.name.trim(),
          discordName: data.discordName.trim(),
          deptId: data.deptId || null,
          crewId: data.crewId || null,
        },
      });
      await auditLogTx(tx, actor.id, "PROFILE_UPDATE", "Member", memberId, {
        before,
        after: data,
      });
    });

    revalidatePath(`/members/${memberId}`);
    revalidatePath("/members");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Eroare necunoscută." };
  }
}

export async function updateGameMonths(
  months: number,
): Promise<{ error?: string }> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.memberId) return { error: "Neautentificat." };
    const memberId = session.user.memberId;

    const value = Math.max(0, Math.min(9999, Math.round(months)));

    await db.member.update({
      where: { id: memberId },
      data: { gameMonths: value },
    });

    revalidatePath("/dashboard");
    revalidatePath("/members");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Eroare necunoscută." };
  }
}

export async function updateProfile(
  memberId: string,
  data: { name?: string; discordName?: string },
): Promise<{ error?: string }> {
  try {
    const actor = await getActor();
    requirePermission(canEditMemberProfile(actor, memberId));

    await db.$transaction(async (tx) => {
      const before = await tx.member.findUnique({
        where: { id: memberId },
        select: { name: true, discordName: true },
      });
      await tx.member.update({ where: { id: memberId }, data });
      await auditLogTx(tx, actor.id, "PROFILE_UPDATE", "Member", memberId, {
        before: before ?? undefined,
        after: data,
      });
    });

    revalidatePath(`/members/${memberId}`);
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Eroare necunoscută." };
  }
}
