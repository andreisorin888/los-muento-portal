import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card } from "@/components/ui";
import { canConfirmWinner } from "@/lib/permissions";
import type { MemberStatus } from "@prisma/client";
import { ConfirmWinnerBtn } from "./ConfirmWinnerBtn";
import { Trophy, Crown } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Clasamente" };

const MONTH_NAMES = [
  "Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie",
  "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie",
];

export default async function RankingsPage() {
  const session = await getServerSession(authOptions);
  const actorId = session?.user?.memberId ?? "";
  const actorLevel = session?.user?.rankLevel ?? 0;
  const actor = { id: actorId, rankLevel: actorLevel, status: "ACTIV" as MemberStatus };
  const canConfirm = canConfirmWinner(actor);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const startOfMonth = new Date(year, month - 1, 1);

  const [members, pastWinners] = await Promise.all([
    db.member.findMany({
      where: { status: "ACTIV" },
      select: { id: true, name: true, memberCode: true, rankName: true, points: true },
      orderBy: [{ points: "desc" }, { name: "asc" }],
    }),
    db.monthlyWinner.findMany({
      include: { winner: { select: { name: true, memberCode: true } } },
      orderBy: [{ year: "desc" }, { month: "desc" }],
      take: 12,
    }),
  ]);

  const thisMonthActivities = await db.activity.groupBy({
    by: ["memberId"],
    where: { createdAt: { gte: startOfMonth } },
    _sum: { points: true },
  });

  const pointsMap = new Map(thisMonthActivities.map((a) => [a.memberId, a._sum.points ?? 0]));
  const leaderboard = members
    .map((m) => ({ ...m, monthPoints: pointsMap.get(m.id) ?? 0 }))
    .filter((m) => m.monthPoints > 0)
    .sort((a, b) => b.monthPoints - a.monthPoints);

  const thisMonthWinner = pastWinners.find((w) => w.year === year && w.month === month);
  const confirmed = thisMonthWinner?.confirmedAt != null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="h-page">Clasamente</h1>
          <p className="mt-1 text-sm text-muted">Clasamentul lunar și Gangsterul Lunii.</p>
        </div>
        {canConfirm && !confirmed && leaderboard.length > 0 && (
          <ConfirmWinnerBtn year={year} month={month} topMembers={leaderboard.slice(0, 10).map((m) => ({ id: m.id, name: m.name, points: m.monthPoints }))} />
        )}
      </div>

      {confirmed && thisMonthWinner && (
        <div className="panel flex items-center gap-5 p-6">
          <Crown className="h-12 w-12 shrink-0 text-gold" />
          <div>
            <p className="text-sm text-muted">Gangsterul Lunii — {MONTH_NAMES[month - 1]} {year}</p>
            <p className="font-display text-3xl font-extrabold text-gold">{thisMonthWinner.winner.name}</p>
            {thisMonthWinner.note && <p className="mt-1 text-sm text-muted">{thisMonthWinner.note}</p>}
          </div>
        </div>
      )}

      <Card title={`Clasament ${MONTH_NAMES[month - 1]} ${year}`} pad={false}>
        {leaderboard.length === 0 ? (
          <p className="p-5 text-sm text-muted">Nu există activități înregistrate luna aceasta.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="th w-10">#</th>
                  <th className="th">Membru</th>
                  <th className="th">Grad</th>
                  <th className="th text-right">Puncte luna</th>
                  <th className="th text-right">Total puncte</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((m, i) => (
                  <tr key={m.id} className={i === 0 ? "bg-gold/5" : ""}>
                    <td className="td">
                      {i === 0 ? <Trophy className="h-4 w-4 text-gold" /> : <span className="text-muted">{i + 1}</span>}
                    </td>
                    <td className="td font-medium">{m.name}</td>
                    <td className="td text-muted">{m.rankName}</td>
                    <td className="td text-right font-display font-bold text-gold">{m.monthPoints}</td>
                    <td className="td text-right text-muted">{m.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {pastWinners.filter((w) => !(w.year === year && w.month === month)).length > 0 && (
        <Card title="Sala Faimei">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pastWinners.filter((w) => !(w.year === year && w.month === month)).map((w) => (
              <div key={w.id} className="flex items-center gap-3 rounded-xl border border-gold/20 bg-gold/5 p-4">
                <Crown className="h-6 w-6 shrink-0 text-gold" />
                <div>
                  <p className="font-semibold">{w.winner.name}</p>
                  <p className="text-xs text-muted">{MONTH_NAMES[w.month - 1]} {w.year}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
