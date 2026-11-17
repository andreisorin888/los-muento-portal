"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { canConfirmWinner, requirePermission, type ActorInfo } from "@/lib/permissions";

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

export async function confirmMonthlyWinner(
  year: number,
  month: number,
  winnerId: string,
  note?: string,
): Promise<{ error?: string }> {
  try {
    const actor = await getActor();
    requirePermission(canConfirmWinner(actor));

    await db.monthlyWinner.upsert({
      where: { year_month: { year, month } },
      update: {
        winnerId,
        confirmedById: actor.id,
        confirmedAt: new Date(),
        note: note || null,
      },
      create: {
        year,
        month,
        winnerId,
        points: 0,
        confirmedById: actor.id,
        confirmedAt: new Date(),
        note: note || null,
      },
    });

    revalidatePath("/rankings");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Eroare necunoscută." };
  }
}
