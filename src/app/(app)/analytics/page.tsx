import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card } from "@/components/ui";
import type { MemberStatus } from "@prisma/client";
import { AnalyticsCharts } from "./AnalyticsCharts";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Statistici" };

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  const actorLevel = session?.user?.rankLevel ?? 0;

  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [
    membersByRank,
    activitiesByMonth,
    robberyStats,
    financeStats,
  ] = await Promise.all([
    db.member.groupBy({
      by: ["rankName"],
      where: { status: "ACTIV" },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    }),
    db.activity.groupBy({
      by: ["type"],
      where: { createdAt: { gte: sixMonthsAgo } },
      _count: { id: true },
      _sum: { points: true },
    }),
    db.robbery.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
    db.financeRecord.aggregate({
      where: { approvalStatus: "APROBAT" },
      _sum: { amount: true },
    }),
  ]);

  const totalActive = await db.member.count({ where: { status: "ACTIV" } });
  const totalRobberies = robberyStats.reduce((s, r) => s + r._count.id, 0);
  const robberySuccess = robberyStats.find((r) => r.status === "REUSIT")?._count.id ?? 0;
  const totalActivities = activitiesByMonth.reduce((s, a) => s + a._count.id, 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="h-page">Statistici</h1>
        <p className="mt-1 text-sm text-muted">Grafice și indicatori ai organizației.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          ["Membri activi", totalActive],
          ["Jafuri total", totalRobberies],
          ["Rată succes jafuri", totalRobberies > 0 ? `${Math.round(robberySuccess / totalRobberies * 100)}%` : "—"],
          ["Activități (6 luni)", totalActivities],
        ].map(([k, v]) => (
          <div key={k as string} className="panel p-5">
            <p className="font-display text-4xl font-extrabold">{v}</p>
            <p className="mt-1 text-sm text-muted">{k}</p>
          </div>
        ))}
      </div>

      <AnalyticsCharts
        membersByRank={membersByRank.map((r) => ({ name: r.rankName, value: r._count.id }))}
        activitiesByType={activitiesByMonth.map((a) => ({ name: a.type, count: a._count.id, points: a._sum.points ?? 0 }))}
        robberyByStatus={robberyStats.map((r) => ({ name: r.status, value: r._count.id }))}
      />
    </div>
  );
}
