"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { canCreatePoll, canVote, requirePermission, type ActorInfo } from "@/lib/permissions";

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

export async function createPoll(data: {
  question: string;
  description?: string;
  minLevel: number;
  endsAt: string;
  options: string[];
}): Promise<{ error?: string }> {
  try {
    const actor = await getActor();
    requirePermission(canCreatePoll(actor));
    if (!data.question.trim()) return { error: "Întrebarea este obligatorie." };
    if (data.options.filter((o) => o.trim()).length < 2)
      return { error: "Sunt necesare cel puțin 2 opțiuni." };

    const endsAt = new Date(data.endsAt);
    if (isNaN(endsAt.getTime()) || endsAt <= new Date())
      return { error: "Data de expirare trebuie să fie în viitor." };

    await db.poll.create({
      data: {
        question: data.question.trim(),
        description: data.description?.trim() || null,
        minLevel: data.minLevel,
        endsAt,
        createdById: actor.id,
        options: {
          create: data.options
            .filter((o) => o.trim())
            .map((text) => ({ text: text.trim() })),
        },
      },
    });

    revalidatePath("/polls");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Eroare necunoscută." };
  }
}

export async function votePoll(
  pollId: string,
  optionId: string,
): Promise<{ error?: string }> {
  try {
    const actor = await getActor();
    requirePermission(canVote(actor));

    const poll = await db.poll.findUnique({
      where: { id: pollId },
      select: { endsAt: true, minLevel: true },
    });
    if (!poll) return { error: "Sondajul nu a fost găsit." };
    if (new Date() > poll.endsAt) return { error: "Sondajul s-a încheiat." };
    if (actor.rankLevel < poll.minLevel)
      return { error: "Gradul tău nu permite participarea la acest sondaj." };

    const existing = await db.pollVote.findUnique({
      where: { pollId_memberId: { pollId, memberId: actor.id } },
    });
    if (existing) return { error: "Ai votat deja în acest sondaj." };

    await db.pollVote.create({
      data: { pollId, optionId, memberId: actor.id },
    });

    revalidatePath("/polls");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Eroare necunoscută." };
  }
}

export async function closePoll(pollId: string): Promise<{ error?: string }> {
  try {
    const actor = await getActor();
    requirePermission(canCreatePoll(actor));

    const poll = await db.poll.findUnique({ where: { id: pollId } });
    if (!poll) return { error: "Sondajul nu a fost găsit." };
    if (poll.createdById !== actor.id && actor.rankLevel < 100)
      return { error: "Poți închide doar sondajele proprii." };

    await db.poll.update({
      where: { id: pollId },
      data: { endsAt: new Date() },
    });

    revalidatePath("/polls");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Eroare necunoscută." };
  }
}
