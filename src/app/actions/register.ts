"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateNextMemberCode } from "@/lib/members";

export async function registerMember(data: {
  name: string;
  recruiterId: string;
  gameMonths?: number;
}): Promise<{ error?: string }> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return { error: "Neautentificat." };

    const userId = session.user.id;

    if (session.user.memberId) return { error: "Ești deja înregistrat ca membru." };

    const existing = await db.member.findUnique({ where: { userId } });
    if (existing) return { error: "Ești deja înregistrat ca membru." };

    if (!data.name.trim()) return { error: "Numele este obligatoriu." };
    if (data.name.trim().length < 2) return { error: "Numele trebuie să aibă minim 2 caractere." };
    if (!data.recruiterId) return { error: "Selectează un recrutor." };

    const recruiter = await db.member.findUnique({
      where: { id: data.recruiterId, status: "ACTIV" },
      select: { id: true },
    });
    if (!recruiter) return { error: "Recrutorul selectat nu este valid." };

    const account = await db.account.findFirst({
      where: { userId, provider: "discord" },
      select: { providerAccountId: true },
    });

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    await db.$transaction(async (tx) => {
      const memberCode = await generateNextMemberCode();

      const member = await tx.member.create({
        data: {
          memberCode,
          userId,
          discordId: account?.providerAccountId ?? `uid_${userId.slice(0, 8)}`,
          discordName: user?.name ?? "Necunoscut",
          name: data.name.trim(),
          rankName: "Vizitator",
          rankLevel: 10,
          status: "PROBATORIE",
          recruitedById: data.recruiterId,
          gameMonths: Math.max(0, Math.min(999, data.gameMonths ?? 0)),
        },
      });

      await tx.recruit.create({
        data: {
          discordName: user?.name ?? "Necunoscut",
          discordId: account?.providerAccountId ?? null,
          recruitedById: data.recruiterId,
          memberId: member.id,
          notes: `Înregistrat automat prin portal (${new Date().toLocaleDateString("ro-RO")})`,
        },
      });
    });

    revalidatePath("/recruitment");
    revalidatePath("/members");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Eroare necunoscută." };
  }
}
