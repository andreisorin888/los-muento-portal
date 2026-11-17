"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { canWriteManagementNote, requirePermission, type ActorInfo } from "@/lib/permissions";

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

export async function createManagementNote(data: {
  title: string;
  body: string;
}): Promise<{ error?: string }> {
  try {
    const actor = await getActor();
    requirePermission(canWriteManagementNote(actor));
    if (!data.title.trim()) return { error: "Titlul este obligatoriu." };
    if (!data.body.trim()) return { error: "Conținutul este obligatoriu." };

    await db.managementNote.create({
      data: { title: data.title.trim(), body: data.body.trim(), authorId: actor.id },
    });

    revalidatePath("/management");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Eroare necunoscută." };
  }
}

export async function deleteManagementNote(noteId: string): Promise<{ error?: string }> {
  try {
    const actor = await getActor();
    requirePermission(canWriteManagementNote(actor));

    const note = await db.managementNote.findUnique({ where: { id: noteId } });
    if (!note) return { error: "Nota nu a fost găsită." };
    if (note.authorId !== actor.id && actor.rankLevel < 100) {
      return { error: "Poți șterge doar notele proprii." };
    }

    await db.managementNote.delete({ where: { id: noteId } });
    revalidatePath("/management");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Eroare necunoscută." };
  }
}
