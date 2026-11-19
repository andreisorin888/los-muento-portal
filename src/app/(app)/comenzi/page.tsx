import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db as prisma } from "@/lib/db";
import { ComenziPage } from "./ComenziPage";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Comenzi" };

export default async function Page() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.memberId) redirect("/login");

  const actor = await prisma.member.findUnique({
    where: { id: session.user.memberId },
    select: { id: true, rankLevel: true, role: true },
  });

  if (!actor || actor.role !== "ILEGAL") redirect("/dashboard");

  const isManager = actor.rankLevel >= 60;

  const [myOrders, allOrders] = await Promise.all([
    prisma.order.findMany({
      where: { buyerId: actor.id, status: { not: "ARHIVATA" } },
      include: { buyer: { select: { id: true, name: true, rankName: true } } },
      orderBy: { createdAt: "desc" },
    }),
    isManager
      ? prisma.order.findMany({
          where: { status: { not: "ARHIVATA" } },
          include: {
            buyer: { select: { id: true, name: true, rankName: true } },
          },
          orderBy: { createdAt: "desc" },
        })
      : [],
  ]);

  return (
    <ComenziPage
      actorId={actor.id}
      isManager={isManager}
      myOrders={myOrders}
      allOrders={allOrders}
    />
  );
}
