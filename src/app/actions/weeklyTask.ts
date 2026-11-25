"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { canManageTasks } from "@/lib/permissions";
import type { MemberStatus } from "@prisma/client";

const TASK_CATEGORY_SLUG = "PREDARE_TASK";

async function getActor() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.memberId) throw new Error("Neautentificat.");
  const m = await db.member.findUnique({
    where: { id: session.user.memberId },
    select: { id: true, rankLevel: true, status: true, role: true, crewId: true },
  });
  if (!m) throw new Error("Profil de membru negăsit.");
  return m;
}

export type WeeklyTarget = {
  rankMin: number;
  rankMax: number;
  crewIds: string[];
  roles: string[];
};

function memberMatchesTarget(
  member: { rankLevel: number; role: string; crewId: string | null },
  target: WeeklyTarget,
): boolean {
  if (member.rankLevel < target.rankMin || member.rankLevel > target.rankMax) return false;
  if (target.roles.length > 0 && !target.roles.includes(member.role)) return false;
  if (target.crewIds.length > 0 && (!member.crewId || !target.crewIds.includes(member.crewId))) return false;
  return true;
}

export async function createWeeklyTask(data: {
  title: string;
  description?: string;
  target: WeeklyTarget;
}): Promise<{ error?: string }> {
  try {
    const actor = await getActor();
    if (actor.rankLevel < 100) return { error: "Doar Boss-ul poate crea taskul săptămânal." };
    if (!data.title.trim()) return { error: "Titlul este obligatoriu." };

    await db.$transaction(async (tx) => {
      // close any existing active task
      await tx.weeklyTask.updateMany({ where: { status: "ACTIV" }, data: { status: "INCHIS" } });
      await tx.weeklyTask.create({
        data: {
          title: data.title.trim(),
          description: data.description?.trim() || null,
          targetJson: data.target as object,
          createdById: actor.id,
        },
      });
    });

    revalidatePath("/tasks");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Eroare necunoscută." };
  }
}

export async function submitWeeklyTask(data: {
  taskId: string;
  note?: string;
  proofUrl?: string;
}): Promise<{ error?: string }> {
  try {
    const actor = await getActor();
    const task = await db.weeklyTask.findUnique({ where: { id: data.taskId } });
    if (!task || task.status !== "ACTIV") return { error: "Task inexistent sau închis." };

    const target = task.targetJson as WeeklyTarget;
    if (!memberMatchesTarget({ rankLevel: actor.rankLevel, role: actor.role, crewId: actor.crewId }, target)) {
      return { error: "Nu faci parte din grupul țintă al acestui task." };
    }

    await db.weeklyTaskSubmission.upsert({
      where: { taskId_memberId: { taskId: data.taskId, memberId: actor.id } },
      create: {
        taskId: data.taskId,
        memberId: actor.id,
        note: data.note?.trim() || null,
        proofUrl: data.proofUrl?.trim() || null,
        status: "PREDAT",
      },
      update: {
        note: data.note?.trim() || null,
        proofUrl: data.proofUrl?.trim() || null,
        status: "PREDAT",
        confirmedById: null,
        confirmedAt: null,
        rejectReason: null,
      },
    });

    revalidatePath("/tasks");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Eroare necunoscută." };
  }
}

export async function confirmWeeklySubmission(submissionId: string): Promise<{ error?: string }> {
  try {
    const actor = await getActor();
    const a = { id: actor.id, rankLevel: actor.rankLevel, status: actor.status as MemberStatus };
    if (!canManageTasks(a)) return { error: "Permisiuni insuficiente." };

    const sub = await db.weeklyTaskSubmission.findUnique({
      where: { id: submissionId },
      include: { task: true },
    });
    if (!sub) return { error: "Predare negăsită." };
    if (sub.status === "CONFIRMAT") return {};

    const category = await db.activityCategory.findUnique({ where: { slug: TASK_CATEGORY_SLUG } });
    const pts = category?.points ?? 5;

    await db.$transaction(async (tx) => {
      await tx.weeklyTaskSubmission.update({
        where: { id: submissionId },
        data: { status: "CONFIRMAT", confirmedById: actor.id, confirmedAt: new Date() },
      });
      await tx.activity.create({
        data: {
          memberId: sub.memberId,
          title: sub.task.title,
          description: sub.note || null,
          type: TASK_CATEGORY_SLUG,
          proofUrl: sub.proofUrl || null,
          points: pts,
        },
      });
      await tx.member.update({
        where: { id: sub.memberId },
        data: { points: { increment: pts } },
      });
    });

    revalidatePath("/tasks");
    revalidatePath("/activitati");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Eroare necunoscută." };
  }
}

export async function confirmAllWeeklySubmissions(taskId: string): Promise<{ confirmed: number; error?: string }> {
  try {
    const actor = await getActor();
    const a = { id: actor.id, rankLevel: actor.rankLevel, status: actor.status as MemberStatus };
    if (!canManageTasks(a)) return { confirmed: 0, error: "Permisiuni insuficiente." };

    const pending = await db.weeklyTaskSubmission.findMany({
      where: { taskId, status: "PREDAT" },
      include: { task: true },
    });
    if (pending.length === 0) return { confirmed: 0 };

    const category = await db.activityCategory.findUnique({ where: { slug: TASK_CATEGORY_SLUG } });
    const pts = category?.points ?? 5;
    const now = new Date();

    await db.$transaction(async (tx) => {
      for (const sub of pending) {
        await tx.weeklyTaskSubmission.update({
          where: { id: sub.id },
          data: { status: "CONFIRMAT", confirmedById: actor.id, confirmedAt: now },
        });
        await tx.activity.create({
          data: {
            memberId: sub.memberId,
            title: sub.task.title,
            description: sub.note || null,
            type: TASK_CATEGORY_SLUG,
            proofUrl: sub.proofUrl || null,
            points: pts,
          },
        });
        await tx.member.update({
          where: { id: sub.memberId },
          data: { points: { increment: pts } },
        });
      }
    });

    revalidatePath("/tasks");
    revalidatePath("/activitati");
    return { confirmed: pending.length };
  } catch (e) {
    return { confirmed: 0, error: e instanceof Error ? e.message : "Eroare necunoscută." };
  }
}

export async function rejectWeeklySubmission(submissionId: string, reason?: string): Promise<{ error?: string }> {
  try {
    const actor = await getActor();
    const a = { id: actor.id, rankLevel: actor.rankLevel, status: actor.status as MemberStatus };
    if (!canManageTasks(a)) return { error: "Permisiuni insuficiente." };

    await db.weeklyTaskSubmission.update({
      where: { id: submissionId },
      data: { status: "RESPINS", rejectReason: reason?.trim() || null, confirmedById: actor.id, confirmedAt: new Date() },
    });

    revalidatePath("/tasks");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Eroare necunoscută." };
  }
}

export async function editWeeklyTask(data: {
  taskId: string;
  title: string;
  description?: string;
}): Promise<{ error?: string }> {
  try {
    const actor = await getActor();
    if (actor.rankLevel < 100) return { error: "Doar Boss-ul poate edita taskul săptămânal." };
    if (!data.title.trim()) return { error: "Titlul este obligatoriu." };
    await db.weeklyTask.update({
      where: { id: data.taskId },
      data: { title: data.title.trim(), description: data.description?.trim() || null },
    });
    revalidatePath("/tasks");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Eroare necunoscută." };
  }
}

export async function closeWeeklyTask(taskId: string): Promise<{ error?: string }> {
  try {
    const actor = await getActor();
    if (actor.rankLevel < 100) return { error: "Doar Boss-ul poate închide taskul." };
    await db.weeklyTask.update({ where: { id: taskId }, data: { status: "INCHIS" } });
    revalidatePath("/tasks");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Eroare necunoscută." };
  }
}
