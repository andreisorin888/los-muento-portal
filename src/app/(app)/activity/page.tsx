import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Badge, Card } from "@/components/ui";
import { Flame } from "lucide-react";
import { getActivityCategories } from "@/app/actions/activityCategories";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Activitate" };

export default async function ActivityPage() {
  const session = await getServerSession(authOptions);
  void session;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [activities, categories] = await Promise.all([
    db.activity.findMany({
      where: { createdAt: { gte: startOfMonth } },
      include: { member: { select: { id: true, name: true, memberCode: true, rankName: true } } },
      orderBy: { createdAt: "desc" },
    }),
    getActivityCategories(),
  ]);

  const categoryMap = Object.fromEntries(categories.map((c) => [c.slug, c.label]));

  const byMember = new Map<string, { name: string; memberCode: string; rankName: string; points: number; count: number }>();
  for (const a of activities) {
    const existing = byMember.get(a.memberId);
    if (existing) {
      existing.points += a.points;
      existing.count += 1;
    } else {
      byMember.set(a.memberId, {
        name: a.member.name,
        memberCode: a.member.memberCode,
        rankName: a.member.rankName,
        points: a.points,
        count: 1,
      });
    }
  }

  const leaderboard = Array.from(byMember.entries())
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.points - a.points);

  // Dynamic type counts per category
  const typeCounts: Record<string, number> = {};
  for (const a of activities) {
    typeCounts[a.type] = (typeCounts[a.type] ?? 0) + 1;
  }

  // Top 2 categories by activity count for the stat cards
  const topTypes = categories
    .map((c) => ({ slug: c.slug, label: c.label, count: typeCounts[c.slug] ?? 0 }))
    .slice(0, 2);

  const monthLabel = now.toLocaleDateString("ro-RO", { month: "long", year: "numeric" });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="h-page">Activitate</h1>
        <p className="mt-1 text-sm text-muted">Activitatea organizației în {monthLabel}.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="panel p-5">
          <p className="font-display text-4xl font-extrabold">{activities.length}</p>
          <p className="mt-1 text-sm text-muted">Activități luna aceasta</p>
        </div>
        <div className="panel p-5">
          <p className="font-display text-4xl font-extrabold">{leaderboard.length}</p>
          <p className="mt-1 text-sm text-muted">Membri activi</p>
        </div>
        {topTypes.map((t) => (
          <div key={t.slug} className="panel p-5">
            <p className="font-display text-4xl font-extrabold">{t.count}</p>
            <p className="mt-1 text-sm text-muted">{t.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title={`Clasament ${monthLabel}`} pad={false}>
          {leaderboard.length === 0 ? (
            <p className="p-5 text-sm text-muted">Nu există activități înregistrate luna aceasta.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="th w-8">#</th>
                    <th className="th">Membru</th>
                    <th className="th">Grad</th>
                    <th className="th text-right">Activități</th>
                    <th className="th text-right">Puncte</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((m, i) => (
                    <tr key={m.id}>
                      <td className="td text-muted">{i + 1}</td>
                      <td className="td font-medium">{m.name}</td>
                      <td className="td text-muted text-xs">{m.rankName}</td>
                      <td className="td text-right">{m.count}</td>
                      <td className="td text-right font-display font-bold text-gold">{m.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card title="Activități recente">
          {activities.length === 0 ? (
            <p className="text-sm text-muted">Nu există activități luna aceasta.</p>
          ) : (
            <div className="space-y-2">
              {activities.slice(0, 15).map((a) => (
                <div key={a.id} className="flex items-center gap-3 text-sm">
                  <Flame className="h-3.5 w-3.5 shrink-0 text-gold" />
                  <span className="flex-1">{a.member.name}</span>
                  <Badge>{categoryMap[a.type] ?? a.type}</Badge>
                  <span className="font-display font-bold text-gold">+{a.points}</span>
                </div>
              ))}
              {activities.length > 15 && (
                <p className="pt-1 text-xs text-muted">+{activities.length - 15} mai multe...</p>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
