import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Badge, Card, StatCard } from "@/components/ui";
import { ActivityForm } from "./ActivityForm";
import { Flame, Trophy } from "lucide-react";
import { getActivityCategories } from "@/app/actions/activityCategories";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Activitățile mele" };

export default async function ActivitatiPage() {
  const session = await getServerSession(authOptions);
  const memberId = session?.user?.memberId;

  if (!memberId) return null;

  const [member, activities, categories] = await Promise.all([
    db.member.findUnique({ where: { id: memberId }, select: { name: true, points: true } }),
    db.activity.findMany({
      where: { memberId },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    getActivityCategories(true),
  ]);

  const categoryMap = Object.fromEntries(categories.map((c) => [c.slug, c]));

  const totalThisMonth = activities
    .filter((a) => {
      const now = new Date();
      const d = new Date(a.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((s, a) => s + a.points, 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="h-page">Activitățile mele</h1>
          <p className="mt-1 text-sm text-muted">Înregistrează misiunile, antrenamentele și evenimentele tale. Fiecare activitate generează puncte automat.</p>
        </div>
        <ActivityForm categories={categories} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total puncte" value={member?.points ?? 0} note="Acumulate din toate activitățile" icon={Trophy} accent="gold" />
        <StatCard label="Puncte luna aceasta" value={totalThisMonth} note="Luna curentă" icon={Flame} accent="violet" />
        <StatCard label="Activități totale" value={activities.length} note="Înregistrate de tine" icon={Flame} accent="pink" />
      </div>

      <Card title="Activitățile mele" pad={false}>
        {activities.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-muted">Nu ai înregistrat nicio activitate încă.</p>
            <p className="mt-1 text-sm text-muted">Apasă „Adaugă activitate" pentru a începe.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-white/[.03]">
                <tr>
                  {["Titlu", "Tip", "Puncte", "Dovadă", "Data"].map((h) => (
                    <th key={h} className="th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activities.map((a) => (
                  <tr key={a.id} className="border-t border-line">
                    <td className="td font-medium">{a.title}</td>
                    <td className="td">
                      <Badge>{categoryMap[a.type]?.label ?? a.type}</Badge>
                    </td>
                    <td className="td">
                      <span className="font-display font-bold text-gold">+{a.points}</span>
                    </td>
                    <td className="td">
                      {a.proofUrl ? (
                        <a
                          href={a.proofUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-pink-soft underline hover:no-underline"
                        >
                          Vezi dovada
                        </a>
                      ) : (
                        <span className="text-xs text-muted">—</span>
                      )}
                    </td>
                    <td className="td text-sm text-muted">
                      {new Date(a.createdAt).toLocaleDateString("ro-RO")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
