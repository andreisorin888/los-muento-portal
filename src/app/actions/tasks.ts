"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { canManageTasks, requirePermission, type ActorInfo } from "@/lib/permissions";
import { auditLogTx } from "@/lib/audit";
import type { AssigneeType, MemberRole, TaskPriority, TaskStatus } from "@prisma/client";

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

export async function createTask(data: {
  title: string;
  description?: string;
  priority: TaskPriority;
  dueDate?: string;
  assigneeType: AssigneeType;
  assigneeId?: string;
  role?: MemberRole;
}): Promise<{ error?: string }> {
  try {
    const actor = await getActor();
    requirePermission(canManageTasks(actor));
    if (!data.title.trim()) return { error: "Titlul este obligatoriu." };

    let dueDate: Date | null = null;
    if (data.dueDate) {
      dueDate = new Date(data.dueDate);
      if (isNaN(dueDate.getTime())) return { error: "Data limită nu este validă." };
    }

    await db.$transaction(async (tx) => {
      const task = await tx.task.create({
        data: {
          title: data.title.trim(),
          description: data.description?.trim() || null,
          priority: data.priority,
          dueDate,
          assigneeType: data.assigneeType,
          assigneeId: data.assigneeId || null,
          role: data.role ?? "ILEGAL",
          createdById: actor.id,
        },
      });
      await auditLogTx(tx, actor.id, "TASK_CREATED", "Task", task.id, {
        after: { title: data.title, priority: data.priority, assigneeType: data.assigneeType },
      });
    });

    revalidatePath("/tasks");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Eroare necunoscută." };
  }
}

export async function completeTask(
  taskId: string,
  note?: string,
): Promise<{ error?: string }> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.memberId) return { error: "Neautentificat." };
    const memberId = session.user.memberId;

    const task = await db.task.findUnique({ where: { id: taskId } });
    if (!task) return { error: "Sarcina nu a fost găsită." };
    if (task.status !== "ACTIV") return { error: "Sarcina nu mai este activă." };

    await db.$transaction(async (tx) => {
      const existing = await tx.taskCompletion.findUnique({
        where: { taskId_memberId: { taskId, memberId } },
      });
      await tx.taskCompletion.upsert({
        where: { taskId_memberId: { taskId, memberId } },
        update: { note: note || null },
        create: { taskId, memberId, note: note || null },
      });
      if (!existing) {
        const cat = await tx.activityCategory.findUnique({ where: { slug: "PREDARE_TASK" } });
        const pts = cat?.points ?? 5;
        await tx.activity.create({
          data: { memberId, title: `Task: ${task.title}`, type: "PREDARE_TASK", points: pts },
        });
        await tx.member.update({ where: { id: memberId }, data: { points: { increment: pts } } });
      }
    });

    revalidatePath("/tasks");
    revalidatePath("/members");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Eroare necunoscută." };
  }
}

export async function updateTaskStatus(
  taskId: string,
  status: TaskStatus,
): Promise<{ error?: string }> {
  try {
    const actor = await getActor();
    requirePermission(canManageTasks(actor));

    await db.$transaction(async (tx) => {
      await tx.task.update({ where: { id: taskId }, data: { status } });
      await auditLogTx(tx, actor.id, "TASK_STATUS_UPDATED", "Task", taskId, { after: { status } });
    });

    revalidatePath("/tasks");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Eroare necunoscută." };
  }
}
