"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { canCreateAnnouncement, requirePermission, type ActorInfo } from "@/lib/permissions";

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

export async function createAnnouncement(data: {
  title: string;
  body: string;
  minLevel: number;
}): Promise<{ error?: string }> {
  try {
    const actor = await getActor();
    requirePermission(canCreateAnnouncement(actor));
    if (!data.title.trim()) return { error: "Titlul este obligatoriu." };
    if (!data.body.trim()) return { error: "Conținutul este obligatoriu." };

    await db.announcement.create({
      data: {
        title: data.title.trim(),
        body: data.body.trim(),
        minLevel: data.minLevel,
        authorId: actor.id,
      },
    });

    revalidatePath("/announcements");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Eroare necunoscută." };
  }
}

export async function markAnnouncementRead(announcementId: string): Promise<{ error?: string }> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.memberId) return { error: "Neautentificat." };
    const memberId = session.user.memberId;

    await db.announcementRead.upsert({
      where: { announcementId_memberId: { announcementId, memberId } },
      update: {},
      create: { announcementId, memberId },
    });

    revalidatePath("/announcements");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Eroare necunoscută." };
  }
}

export async function deleteAnnouncement(announcementId: string): Promise<{ error?: string }> {
  try {
    const actor = await getActor();
    requirePermission(canCreateAnnouncement(actor));

    const ann = await db.announcement.findUnique({ where: { id: announcementId } });
    if (!ann) return { error: "Anunțul nu a fost găsit." };
    if (ann.authorId !== actor.id && actor.rankLevel < 90) {
      return { error: "Poți șterge doar anunțurile proprii." };
    }

    await db.announcement.delete({ where: { id: announcementId } });
    revalidatePath("/announcements");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Eroare necunoscută." };
  }
}
