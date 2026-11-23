"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

async function getActorMember() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.memberId) return null;
  return db.member.findUnique({
    where: { id: session.user.memberId },
    select: { id: true, rankLevel: true, crewId: true, captainOfCrew: { select: { id: true } } },
  });
}

export async function getCrewTasksForActor() {
  const actor = await getActorMember();
  if (!actor) return { tasks: [], myCrewId: null, isCapo: false };

  const isCapo = actor.rankLevel >= 60;
  // Boss/Underboss (90+) sees all crews; Capo sees only their crew
  let crewIds: string[] = [];

  if (actor.rankLevel >= 90) {
    const crews = await db.crew.findMany({ select: { id: true } });
    crewIds = crews.map((c) => c.id);
  } else if (actor.captainOfCrew) {
    crewIds = [actor.captainOfCrew.id];
  } else if (actor.crewId) {
    crewIds = [actor.crewId];
  }

  if (crewIds.length === 0) return { tasks: [], myCrewId: actor.crewId, isCapo };

  const tasks = await db.crewTask.findMany({
    where: { crewId: { in: crewIds }, status: { not: "ANULAT" } },
    include: {
      crew: {
        select: {
          id: true,
          name: true,
          members: { select: { id: true, name: true, rankName: true } },
        },
      },
      submissions: {
        select: { id: true, memberId: true, note: true, proofUrl: true, createdAt: true,
          member: { select: { name: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return { tasks, myCrewId: actor.crewId ?? actor.captainOfCrew?.id ?? null, isCapo };
}

export async function createCrewTask(data: {
  crewId: string;
  title: string;
  description?: string;
  dueDate?: string;
}): Promise<{ error?: string }> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.memberId) return { error: "Neautentificat." };
    const actor = await db.member.findUnique({
      where: { id: session.user.memberId },
      select: { id: true, rankLevel: true, captainOfCrew: { select: { id: true } } },
    });
    if (!actor) return { error: "Profil negăsit." };
    if (actor.rankLevel < 60) return { error: "Doar Capo+ poate crea taskuri de echipă." };

    // Capo can only create for their own crew; Boss/Underboss for any crew
    if (actor.rankLevel < 90 && actor.captainOfCrew?.id !== data.crewId) {
      return { error: "Poți crea taskuri doar pentru echipa ta." };
    }

    if (!data.title.trim()) return { error: "Titlul este obligatoriu." };

    await db.crewTask.create({
      data: {
        crewId: data.crewId,
        title: data.title.trim(),
        description: data.description?.trim() || null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        createdById: actor.id,
      },
    });

    revalidatePath("/crew-tasks");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Eroare necunoscută." };
  }
}

export async function submitCrewTask(data: {
  taskId: string;
  note?: string;
  proofUrl?: string;
}): Promise<{ error?: string }> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.memberId) return { error: "Neautentificat." };
    const memberId = session.user.memberId;

    const member = await db.member.findUnique({
      where: { id: memberId },
      select: { crewId: true },
    });

    const task = await db.crewTask.findUnique({
      where: { id: data.taskId },
      select: { crewId: true, status: true },
    });
    if (!task) return { error: "Taskul nu a fost găsit." };
    if (task.status !== "ACTIV") return { error: "Taskul nu mai este activ." };
    if (member?.crewId !== task.crewId) return { error: "Nu faci parte din această echipă." };

    if (data.proofUrl) {
      const isUrl = /^https?:\/\/.+/.test(data.proofUrl);
      const isImage = /^data:image\/(jpeg|jpg|png|gif|webp|bmp);base64,/.test(data.proofUrl);
      if (!isUrl && !isImage) return { error: "Dovada trebuie să fie un link valid sau o poză." };
    }

    await db.crewTaskSubmission.upsert({
      where: { taskId_memberId: { taskId: data.taskId, memberId } },
      create: { taskId: data.taskId, memberId, note: data.note?.trim() || null, proofUrl: data.proofUrl || null },
      update: { note: data.note?.trim() || null, proofUrl: data.proofUrl || null },
    });

    revalidatePath("/crew-tasks");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Eroare necunoscută." };
  }
}

export async function finishCrewTask(taskId: string): Promise<{ error?: string }> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.memberId) return { error: "Neautentificat." };
    const actor = await db.member.findUnique({
      where: { id: session.user.memberId },
      select: { rankLevel: true, captainOfCrew: { select: { id: true } } },
    });
    if (!actor || actor.rankLevel < 60) return { error: "Doar Capo+ poate finaliza taskuri." };

    const task = await db.crewTask.findUnique({ where: { id: taskId }, select: { crewId: true } });
    if (!task) return { error: "Taskul nu a fost găsit." };
    if (actor.rankLevel < 90 && actor.captainOfCrew?.id !== task.crewId) {
      return { error: "Poți finaliza doar taskurile echipei tale." };
    }

    await db.crewTask.update({ where: { id: taskId }, data: { status: "FINALIZAT" } });
    revalidatePath("/crew-tasks");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Eroare necunoscută." };
  }
}

export async function cancelCrewTask(taskId: string): Promise<{ error?: string }> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.memberId) return { error: "Neautentificat." };
    const actor = await db.member.findUnique({
      where: { id: session.user.memberId },
      select: { rankLevel: true, captainOfCrew: { select: { id: true } } },
    });
    if (!actor || actor.rankLevel < 60) return { error: "Doar Capo+ poate anula taskuri." };

    const task = await db.crewTask.findUnique({ where: { id: taskId }, select: { crewId: true } });
    if (!task) return { error: "Taskul nu a fost găsit." };
    if (actor.rankLevel < 90 && actor.captainOfCrew?.id !== task.crewId) {
      return { error: "Poți anula doar taskurile echipei tale." };
    }

    await db.crewTask.update({ where: { id: taskId }, data: { status: "ANULAT" } });
    revalidatePath("/crew-tasks");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Eroare necunoscută." };
  }
}
