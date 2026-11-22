"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function submitActivity(data: {
  title: string;
  description?: string;
  type: string;
  proofUrl?: string;
}): Promise<{ error?: string }> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.memberId) return { error: "Neautentificat." };

    const memberId = session.user.memberId;

    if (!data.title.trim()) return { error: "Titlul este obligatoriu." };
    if (data.proofUrl) {
      const isUrl = /^https?:\/\/.+/.test(data.proofUrl);
      const isImage = /^data:image\/(jpeg|jpg|png|gif|webp|bmp|svg\+xml);base64,/.test(data.proofUrl);
      if (!isUrl && !isImage) return { error: "Dovada trebuie să fie un link valid sau o poză." };
    }

    const category = await db.activityCategory.findUnique({ where: { slug: data.type } });
    if (!category) return { error: "Tip de activitate invalid." };

    const pts = category.points;

    await db.$transaction(async (tx) => {
      await tx.activity.create({
        data: {
          memberId,
          title: data.title.trim(),
          description: data.description?.trim() || null,
          type: data.type,
          proofUrl: data.proofUrl?.trim() || null,
          points: pts,
        },
      });
      await tx.member.update({
        where: { id: memberId },
        data: { points: { increment: pts } },
      });
    });

    revalidatePath("/activitati");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Eroare necunoscută." };
  }
}

export async function cleanupProofImages(olderThanDays = 30): Promise<{ count?: number; error?: string }> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.memberId) return { error: "Neautentificat." };

    const actor = await db.member.findUnique({
      where: { id: session.user.memberId },
      select: { rankLevel: true },
    });
    if (!actor || actor.rankLevel < 100) return { error: "Doar Boss-ul poate curăța pozele." };

    const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);

    const { count } = await db.activity.updateMany({
      where: {
        proofUrl: { startsWith: "data:image/" },
        createdAt: { lt: cutoff },
      },
      data: { proofUrl: null },
    });

    revalidatePath("/activitati");
    revalidatePath("/activity");
    return { count };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Eroare necunoscută." };
  }
}

export async function getMyActivities() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.memberId) return [];

  return db.activity.findMany({
    where: { memberId: session.user.memberId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}
