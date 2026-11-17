"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import type { StashItem } from "@prisma/client";

export async function getStashListings() {
  return db.stashListing.findMany({
    where: { quantity: { gt: 0 } },
    include: {
      member: { select: { id: true, name: true, memberCode: true, rankName: true } },
    },
    orderBy: { price: "asc" },
  });
}

export async function upsertStashListing(data: {
  item: StashItem;
  quantity: number;
  price: number;
}): Promise<{ error?: string }> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.memberId) return { error: "Neautentificat." };

    if (data.quantity < 0) return { error: "Cantitatea nu poate fi negativă." };
    if (data.price < 0) return { error: "Prețul nu poate fi negativ." };
    if (data.quantity > 9999) return { error: "Cantitate prea mare." };
    if (data.price > 9999999) return { error: "Preț prea mare." };

    await db.stashListing.upsert({
      where: { memberId_item: { memberId: session.user.memberId, item: data.item } },
      create: { memberId: session.user.memberId, item: data.item, quantity: data.quantity, price: data.price },
      update: { quantity: data.quantity, price: data.price },
    });

    revalidatePath("/armory");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Eroare necunoscută." };
  }
}

export async function removeStashListing(item: StashItem): Promise<{ error?: string }> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.memberId) return { error: "Neautentificat." };

    await db.stashListing.deleteMany({
      where: { memberId: session.user.memberId, item },
    });

    revalidatePath("/armory");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Eroare necunoscută." };
  }
}

export async function getMyListings(memberId: string) {
  return db.stashListing.findMany({
    where: { memberId },
    orderBy: { item: "asc" },
  });
}
