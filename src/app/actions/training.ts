"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { canManageTraining, requirePermission, type ActorInfo } from "@/lib/permissions";

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

export async function createTrainingPlan(data: {
  title: string;
  description?: string;
  steps: { order: number; title: string; description?: string }[];
}): Promise<{ error?: string }> {
  try {
    const actor = await getActor();
    requirePermission(canManageTraining(actor));
    if (!data.title.trim()) return { error: "Titlul este obligatoriu." };
    if (data.steps.length === 0) return { error: "Adaugă cel puțin un pas." };

    await db.trainingPlan.create({
      data: {
        title: data.title.trim(),
        description: data.description?.trim() || null,
        createdById: actor.id,
        steps: {
          create: data.steps.map((s) => ({
            order: s.order,
            title: s.title.trim(),
            description: s.description?.trim() || null,
          })),
        },
      },
    });

    revalidatePath("/training");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Eroare necunoscută." };
  }
}

export async function completeTrainingStep(
  planId: string,
  stepId: string,
  data: { note?: string; proofUrl?: string },
): Promise<{ error?: string }> {
  try {
    const actor = await getActor();
    if (!actor) throw new Error("Neautentificat.");

    const step = await db.trainingStep.findUnique({
      where: { id: stepId },
      select: { planId: true },
    });
    if (!step || step.planId !== planId)
      return { error: "Pasul nu a fost găsit." };

    await db.trainingProgress.upsert({
      where: { stepId_memberId: { stepId, memberId: actor.id } },
      create: {
        planId,
        stepId,
        memberId: actor.id,
        note: data.note?.trim() || null,
        proofUrl: data.proofUrl?.trim() || null,
      },
      update: {
        note: data.note?.trim() || null,
        proofUrl: data.proofUrl?.trim() || null,
        completedAt: new Date(),
      },
    });

    revalidatePath("/training");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Eroare necunoscută." };
  }
}

export async function deleteTrainingPlan(planId: string): Promise<{ error?: string }> {
  try {
    const actor = await getActor();
    requirePermission(canManageTraining(actor));

    const plan = await db.trainingPlan.findUnique({ where: { id: planId } });
    if (!plan) return { error: "Planul nu a fost găsit." };
    if (plan.createdById !== actor.id && actor.rankLevel < 100)
      return { error: "Poți șterge doar planurile proprii." };

    await db.trainingPlan.delete({ where: { id: planId } });
    revalidatePath("/training");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Eroare necunoscută." };
  }
}
