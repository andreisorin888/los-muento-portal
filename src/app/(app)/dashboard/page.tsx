import type { Metadata } from "next";
import Link from "next/link";
import { Activity as ActivityIcon, Clock, Crown, Flame, Shield, Users } from "lucide-react";
import { Badge, Card, StatCard } from "@/components/ui";
import { ChestChart, HoursChart } from "@/components/charts";
import { Welcome } from "@/components/Welcome";
import { getAssetUrl } from "@/config/assets";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Panou" };

function fmt(cents: number) {
  return new Intl.NumberFormat("ro-RO", {
    style: "currency", currency: "USD",
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(cents / 100);
}

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = ["#ff2e93", "#8b3dff", "#12b886", "#c8a84b", "#3d7fff", "#ff6b35", "#00bcd4"];
function avatarColor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[h];
}

function last7Labels() {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toLocaleDateString("ro-RO", { weekday: "short" }));
  }
  return days;
}

function dayLabel(date: Date) {
  return date.toLocaleDateString("ro-RO", { weekday: "short" });
}

const MONTH_NAMES = ["Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie",
  "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie"];

const ROBBERY_STATUS: Record<string, string> = {
  PLANIFICAT: "Planificat", REUSIT: "Reușit", ESUAT: "Eșuat", ANULAT: "Anulat",
};
const TERRITORY_STATUS: Record<string, string> = {
  CONTROLAT: "Controlat", CONTESTAT: "Contestat", NEUTRU: "Neutru",
};
const TASK_STATUS: Record<string, string> = {
  ACTIV: "Activ", FINALIZAT: "Finalizat", ANULAT: "Anulat",
};

type TerritoryTone = "emerald" | "gold" | undefined;
function territoryTone(s: string): TerritoryTone {
  if (s === "CONTROLAT") return "emerald";
  if (s === "CONTESTAT") return "gold";
  return undefined;
}
type RobberyTone = "emerald" | undefined;
function robberyTone(s: string): RobberyTone {
  return s === "REUSIT" ? "emerald" : undefined;
}

const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  const [
    currentMember,
    totalMembers,
    activeMembers,
    weekActivities,
    allActivities,
    topFive,
    chestFull,
    pendingChestCount,
    pendingRecruits,
    tasks,
    territories,
    robberies,
    announcements,
    monthlyWinner,
  ] = await Promise.all([
    session?.user?.memberId
      ? db.member.findUnique({
          where: { id: session.user.memberId },
          select: { name: true, rankName: true, dept: { select: { name: true } } },
        })
      : Promise.resolve(null),
    db.member.count({ where: { status: { not: "ARHIVAT" } } }),
    db.member.count({ where: { status: "ACTIV" } }),
    db.activity.findMany({
      where: { createdAt: { gte: weekStart } },
      select: { createdAt: true, points: true },
    }),
    db.activity.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        member: { select: { name: true } },
        category: { select: { label: true } },
      },
    }),
    db.member.findMany({
      where: { status: { not: "ARHIVAT" } },
      orderBy: { points: "desc" },
      take: 5,
      select: { id: true, name: true, rankName: true, points: true },
    }),
    db.chest.findFirst({
      include: {
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: { submittedBy: { select: { name: true } } },
        },
        itemStocks: {
          where: { quantity: { gt: 0 } },
          include: { itemType: { select: { emoji: true, label: true, unit: true, sortOrder: true } } },
          orderBy: { itemType: { sortOrder: "asc" } },
        },
      },
    }),
    db.chestTransaction.count({ where: { approvalStatus: "ASTEPTARE" } }),
    db.recruit.count({ where: { status: "CANDIDAT" } }),
    db.task.findMany({
      where: { status: { not: "ANULAT" } },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: { id: true, title: true, status: true, priority: true },
    }),
    db.territory.findMany({
      take: 5,
      orderBy: { updatedAt: "desc" },
      include: { controlledBy: { select: { name: true } } },
    }),
    db.robbery.findMany({
      take: 3,
      orderBy: { createdAt: "desc" },
      include: { leader: { select: { name: true } } },
    }),
    db.announcement.findMany({
      take: 3,
      orderBy: { createdAt: "desc" },
      include: { author: { select: { name: true } } },
    }),
    db.monthlyWinner.findFirst({
      orderBy: [{ year: "desc" }, { month: "desc" }],
      include: { winner: { select: { name: true, rankName: true, points: true } } },
    }),
  ]);

  const name = currentMember?.name ?? session?.user?.name ?? "Membru";
  const rank = currentMember?.rankName ?? session?.user?.rankName ?? "";
  const dept = currentMember?.dept?.name ?? "";

  const link = (href: string, label: string) => (
    <Link href={href} className="text-xs font-semibold text-pink-soft hover:underline">{label}</Link>
  );

  // Build 7-day chart data
  const days7 = last7Labels();
  const dayPts: Record<string, number> = {};
  for (const a of weekActivities) {
    const lbl = dayLabel(new Date(a.createdAt));
    dayPts[lbl] = (dayPts[lbl] ?? 0) + a.points;
  }
  const hoursSeries = days7.map((day) => ({ day, hours: dayPts[day] ?? 0 }));

  const chestDayMap: Record<string, { deposits: number; withdrawals: number }> = {};
  for (const d of days7) chestDayMap[d] = { deposits: 0, withdrawals: 0 };
  for (const tx of chestFull?.transactions ?? []) {
    if (tx.approvalStatus !== "APROBAT") continue;
    const lbl = dayLabel(new Date(tx.createdAt));
    if (!chestDayMap[lbl]) continue;
    if (tx.type === "DEPUNERE") chestDayMap[lbl].deposits += tx.amount / 100;
    else if (tx.type === "RETRAGERE") chestDayMap[lbl].withdrawals += tx.amount / 100;
  }
  const chestSeries = days7.map((d) => ({ day: d, ...chestDayMap[d] }));

  const totalPendingApprovals = pendingChestCount + pendingRecruits;
  const weekPoints = weekActivities.reduce((s, a) => s + a.points, 0);

  const activeTasks = tasks.filter((t) => t.status === "ACTIV").length;
  const finishedTasks = tasks.filter((t) => t.status === "FINALIZAT").length;

  return (
    <div className="space-y-5">
      <Welcome banner={getAssetUrl("dashboardHero")} name={name} rank={rank} dept={dept} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total membri" value={totalMembers} note={`${activeMembers} activi`} icon={Users} accent="pink" />
        <StatCard label="Membri activi" value={activeMembers} note="Statut ACTIV" icon={Shield} accent="emerald" />
        <StatCard label="Activități (7 zile)" value={weekActivities.length} note={`${weekPoints} puncte acumulate`} icon={Flame} accent="violet" />
        <StatCard label="Aprobare necesară" value={totalPendingApprovals} note={`${pendingChestCount} seif · ${pendingRecruits} recruți`} icon={Clock} accent="gold" />
      </div>

      <div className="grid gap-5 xl:grid-cols-12">
        <Card title="Puncte activitate (7 zile)" className="xl:col-span-8" action={link("/activitati", "Deschide activitățile")}>
          <HoursChart data={hoursSeries} />
        </Card>
        {monthlyWinner ? (
          <section className="panel relative overflow-hidden border-gold/30 p-5 shadow-gold xl:col-span-4">
            <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-gold/15 blur-3xl" />
            <div className="relative">
              <div className="flex items-center gap-2 text-gold"><Crown className="h-5 w-5" /><h2 className="h-card">Gangsterul Lunii</h2></div>
              <p className="mt-0.5 text-xs text-muted">
                {MONTH_NAMES[(monthlyWinner.month ?? 1) - 1]} {monthlyWinner.year}
              </p>
              <p className="mt-4 font-display text-4xl font-extrabold">{monthlyWinner.winner.name}</p>
              <p className="text-sm text-gold-soft">{monthlyWinner.winner.rankName}</p>
              <p className="mt-2 font-display text-2xl font-bold text-gold">{monthlyWinner.points} <span className="text-sm font-normal text-muted">puncte</span></p>
            </div>
          </section>
        ) : (
          <section className="panel relative overflow-hidden border-gold/30 p-5 xl:col-span-4">
            <div className="flex items-center gap-2 text-gold mb-3"><Crown className="h-5 w-5" /><h2 className="h-card">Gangsterul Lunii</h2></div>
            <p className="text-sm text-muted">Niciun câștigător confirmat pentru luna aceasta.</p>
            <p className="mt-1 text-xs text-muted">Conducerea confirmă câștigătorul din <Link href="/rankings" className="text-pink-soft hover:underline">Clasamente</Link>.</p>
          </section>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card
          title="Aprobare necesară"
          action={<Badge tone={totalPendingApprovals > 0 ? "gold" : undefined}>{totalPendingApprovals > 0 ? `${totalPendingApprovals} în așteptare` : "Totul în regulă"}</Badge>}
        >
          {totalPendingApprovals === 0 ? (
            <p className="text-sm text-muted">Nicio aprobare în așteptare.</p>
          ) : (
            <ul className="space-y-3">
              {pendingChestCount > 0 && (
                <li className="flex items-center justify-between gap-3 rounded-xl bg-white/[.03] p-3">
                  <div><p className="text-sm font-semibold">Tranzacții seif</p><p className="text-xs text-muted">Necesită aprobare</p></div>
                  <Link href="/chest"><Badge tone="gold">{String(pendingChestCount)}</Badge></Link>
                </li>
              )}
              {pendingRecruits > 0 && (
                <li className="flex items-center justify-between gap-3 rounded-xl bg-white/[.03] p-3">
                  <div><p className="text-sm font-semibold">Recruți noi</p><p className="text-xs text-muted">Înregistrați automat</p></div>
                  <Link href="/recruitment"><Badge tone="gold">{String(pendingRecruits)}</Badge></Link>
                </li>
              )}
            </ul>
          )}
        </Card>

        <Card title="Activitate recentă" action={link("/activitati", "Vezi tot")}>
          {allActivities.length === 0 ? (
            <p className="text-sm text-muted">Nicio activitate înregistrată încă.</p>
          ) : (
            <ul className="space-y-3">
              {allActivities.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm">{a.member.name}</p>
                    <p className="truncate text-xs text-muted">{a.category.label} · {a.title}</p>
                  </div>
                  <span className="shrink-0 font-display text-sm font-bold text-gold">+{a.points}p</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Top cinci membri" action={link("/rankings", "Clasamente")}>
          {topFive.length === 0 ? (
            <p className="text-sm text-muted">Niciun membru cu puncte înregistrate.</p>
          ) : (
            <ol className="space-y-3">
              {topFive.map((m, i) => (
                <li key={m.id} className="flex items-center gap-3">
                  <span className={`w-5 text-center font-display text-xl font-extrabold ${i === 0 ? "text-gold" : "text-muted"}`}>{i + 1}</span>
                  <span
                    className="grid h-9 w-9 place-items-center rounded-full font-display text-base font-extrabold text-ink"
                    style={{ background: avatarColor(m.id) }}
                  >
                    {initials(m.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{m.name}</p>
                    <p className="text-xs text-muted">{m.rankName}</p>
                  </div>
                  <span className="text-sm font-bold">{m.points}</span>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-12">
        <Card title="Inventarul seifului" className="xl:col-span-5" action={link("/chest", "Deschide seiful")}>
          {!chestFull || chestFull.itemStocks.length === 0 ? (
            <p className="text-sm text-muted">Seiful este gol sau neinitialized.</p>
          ) : (
            <ul className="space-y-3.5">
              {chestFull.itemStocks.map((s) => (
                <li key={s.id}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">{s.itemType.emoji} {s.itemType.label}</span>
                    <span className="text-muted">{s.quantity.toLocaleString("ro-RO")} {s.itemType.unit}</span>
                  </div>
                </li>
              ))}
              {chestFull && (
                <li className="border-t border-line pt-3 flex items-center justify-between text-sm">
                  <span className="text-muted">Sold seif</span>
                  <span className={`font-display font-bold ${chestFull.balance < 0 ? "text-rose-400" : "text-emerald-400"}`}>
                    {fmt(chestFull.balance)}
                  </span>
                </li>
              )}
            </ul>
          )}
        </Card>
        <Card title="Mișcările din seif (7 zile)" className="xl:col-span-7">
          <ChestChart data={chestSeries} />
        </Card>
      </div>

      {chestFull && chestFull.transactions.length > 0 && (
        <Card title="Tranzacții recente cu seiful" action={link("/chest", "Vezi tot")} pad={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="th">Tip</th>
                  <th className="th">Sumă</th>
                  <th className="th">Trimis de</th>
                  <th className="th">Status</th>
                </tr>
              </thead>
              <tbody>
                {chestFull.transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td className="td">{tx.type === "DEPUNERE" ? "Depunere" : tx.type === "RETRAGERE" ? "Retragere" : tx.type === "TRANSFER" ? "Transfer" : "Corecție"}</td>
                    <td className="td font-mono">{fmt(tx.amount)}</td>
                    <td className="td">{tx.submittedBy.name}</td>
                    <td className="td">
                      <Badge tone={tx.approvalStatus === "APROBAT" ? "emerald" : tx.approvalStatus === "ASTEPTARE" ? "gold" : undefined}>
                        {tx.approvalStatus === "APROBAT" ? "Aprobat" : tx.approvalStatus === "ASTEPTARE" ? "Așteptare" : "Respins"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <Card title="Taskuri" action={link("/tasks", "Deschide taskurile")}>
          {tasks.length === 0 ? (
            <p className="text-sm text-muted">Niciun task creat.</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="rounded-xl bg-violet/15 p-4"><p className="font-display text-4xl font-extrabold">{activeTasks}</p><p className="text-xs text-muted">Active</p></div>
                <div className="rounded-xl bg-emerald/12 p-4"><p className="font-display text-4xl font-extrabold">{finishedTasks}</p><p className="text-xs text-muted">Finalizate</p></div>
              </div>
              <ul className="space-y-2.5">
                {tasks.map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate">{t.title}</span>
                    <Badge>{TASK_STATUS[t.status] ?? t.status}</Badge>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>

        <Card title="Situația teritoriilor" action={link("/territories", "Deschide harta")}>
          {territories.length === 0 ? (
            <p className="text-sm text-muted">Niciun teritoriu înregistrat.</p>
          ) : (
            <ul className="space-y-3">
              {territories.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-muted">{t.controlledBy?.name ?? "Nealocat"}</p>
                  </div>
                  <Badge tone={territoryTone(t.status)}>{TERRITORY_STATUS[t.status] ?? t.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Jafuri recente" action={link("/robberies", "Vezi tot")}>
          {robberies.length === 0 ? (
            <p className="text-sm text-muted">Niciun jaf înregistrat.</p>
          ) : (
            <ul className="space-y-3">
              {robberies.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{r.type}</p>
                    <p className="text-xs text-muted">{r.leader.name} · {fmt(r.reward)}</p>
                  </div>
                  <Badge tone={robberyTone(r.status)}>{ROBBERY_STATUS[r.status] ?? r.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {announcements.length > 0 && (
        <Card title="Ultimele anunțuri" action={link("/announcements", "Vezi tot")}>
          <ul className="divide-y divide-line">
            {announcements.map((a) => (
              <li key={a.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <ActivityIcon className="h-4 w-4 shrink-0 text-pink" aria-hidden />
                <p className="min-w-0 flex-1 truncate text-sm font-medium">{a.title}</p>
                <p className="shrink-0 text-xs text-muted">{a.author.name} · {new Date(a.createdAt).toLocaleDateString("ro-RO")}</p>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
