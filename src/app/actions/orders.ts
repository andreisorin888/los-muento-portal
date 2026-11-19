"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db as prisma } from "@/lib/db";
import { OrderStatus, StashItem } from "@prisma/client";

async function getActor() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.memberId) throw new Error("Neautentificat");
  const member = await prisma.member.findUnique({
    where: { id: session.user.memberId },
    select: { id: true, rankLevel: true, role: true, status: true },
  });
  if (!member || member.status === "ARHIVAT" || member.status === "SUSPENDAT") {
    throw new Error("Acces interzis");
  }
  return member;
}

export async function createOrder(data: {
  item: StashItem;
  quantity: number;
  notes?: string;
}) {
  const actor = await getActor();
  if (actor.role !== "ILEGAL") throw new Error("Doar membrii ILEGAL pot plasa comenzi");
  if (data.quantity < 1) throw new Error("Cantitate invalidă");

  await prisma.order.create({
    data: {
      buyerId: actor.id,
      item: data.item,
      quantity: data.quantity,
      notes: data.notes ?? null,
      status: "DEPUSA",
    },
  });

  revalidatePath("/comenzi");
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const actor = await getActor();
  if (actor.rankLevel < 60) throw new Error("Doar Capo+ pot gestiona comenzile");

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("Comanda nu există");

  const validTransitions: Record<OrderStatus, OrderStatus[]> = {
    DEPUSA: ["IN_PROGRES"],
    IN_PROGRES: ["FINALIZATA"],
    FINALIZATA: ["ARHIVATA"],
    ARHIVATA: [],
  };

  if (!validTransitions[order.status].includes(status)) {
    throw new Error("Tranziție de status invalidă");
  }

  await prisma.$transaction(async (tx) => {
    await tx.order.update({ where: { id: orderId }, data: { status } });

    if (status === "FINALIZATA") {
      const existing = await tx.stashListing.findUnique({
        where: { memberId_item: { memberId: order.buyerId, item: order.item } },
      });
      if (existing) {
        await tx.stashListing.update({
          where: { memberId_item: { memberId: order.buyerId, item: order.item } },
          data: { quantity: existing.quantity + order.quantity },
        });
      } else {
        await tx.stashListing.create({
          data: {
            memberId: order.buyerId,
            item: order.item,
            quantity: order.quantity,
            price: 0,
          },
        });
      }
    }
  });

  revalidatePath("/comenzi");
}

export async function archiveOrder(orderId: string) {
  return updateOrderStatus(orderId, "ARHIVATA");
}
