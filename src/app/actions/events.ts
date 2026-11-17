"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { canManageEvents, requirePermission, type ActorInfo } from "@/lib/permissions";
import { auditLogTx } from "@/lib/audit";
import type { AttendanceStatus, EventType } from "@prisma/client";

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

export async function createEvent(data: {
  title: string;
  type: EventType;
  description?: string;
  scheduledAt: string;
  invitedIds: string[];
}): Promise<{ error?: string }> {
  try {
    const actor = await getActor();
    requirePermission(canManageEvents(actor));
    if (!data.title.trim()) return { error: "Titlul este obligatoriu." };
    const scheduledAt = new Date(data.scheduledAt);
    if (isNaN(scheduledAt.getTime())) return { error: "Data nu este validă." };

    await db.$transaction(async (tx) => {
      const event = await tx.orgEvent.create({
        data: {
          title: data.title.trim(),
          type: data.type,
          description: data.description?.trim() || null,
          scheduledAt,
          createdById: actor.id,
        },
      });
      if (data.invitedIds.length > 0) {
        await tx.eventAttendance.createMany({
          data: data.invitedIds.map((memberId) => ({ eventId: event.id, memberId })),
          skipDuplicates: true,
        });
      }
      await auditLogTx(tx, actor.id, "EVENT_CREATED", "OrgEvent", event.id, {
        after: { title: data.title, type: data.type, scheduledAt: data.scheduledAt },
      });
    });

    revalidatePath("/events");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Eroare necunoscută." };
  }
}

export async function updateAttendance(
  eventId: string,
  status: AttendanceStatus,
): Promise<{ error?: string }> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.memberId) return { error: "Neautentificat." };
    const memberId = session.user.memberId;

    await db.eventAttendance.upsert({
      where: { eventId_memberId: { eventId, memberId } },
      update: { status },
      create: { eventId, memberId, status },
    });

    revalidatePath("/events");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Eroare necunoscută." };
  }
}
