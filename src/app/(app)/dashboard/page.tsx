import type { Metadata } from "next";
import Link from "next/link";
import { Activity, Clock, Crown, Flame, Radio, Users } from "lucide-react";
import { Badge, Card, StatCard } from "@/components/ui";
import { DataTable } from "@/components/DataTable";
import { ChestChart, HoursChart } from "@/components/charts";
import { Welcome } from "@/components/Welcome";
import { getAssetUrl } from "@/config/assets";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import * as d from "@/lib/demo-data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Panou" };

const pending = d.activity.filter((a) => a.status === "În așteptare");
const totalHours = d.members.reduce((s, m) => s + m.hours, 0);
const topFive = [...d.members].sort((a, b) => b.score - a.score).slice(0, 5);
const link = (href: string, label: string) => <Link href={href} className="text-xs font-semibold text-pink-soft hover:underline">{label}</Link>;

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const member = session?.user?.memberId
    ? await db.member.findUnique({
        where: { id: session.user.memberId },
        select: { name: true, rankName: true, dept: { select: { name: true } } },
      })
    : null;

  const name = member?.name ?? session?.user?.name ?? "Membru";
  const rank = member?.rankName ?? session?.user?.rankName ?? "";
  const dept = member?.dept?.name ?? "";

  return (
    <div className="space-y-5">
      <Welcome banner={getAssetUrl("dashboardHero")} name={name} rank={rank} dept={dept} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total membri" value={d.members.length} note="1 în perioadă de probă" icon={Users} accent="pink" />
        <StatCard label="Online acum" value={d.members.filter((m) => m.online).length} note="Din prezența Discord" icon={Radio} accent="emerald" />
        <StatCard label="Activi săptămâna aceasta" value={d.members.length} note="Toți membrii au trimis ore" icon={Flame} accent="violet" />
        <StatCard label="Ore de activitate" value={totalHours} note="În total" icon={Clock} accent="gold" />
      </div>

      <div className="grid gap-5 xl:grid-cols-12">
        <Card title="Orele de activitate din această săptămână" className="xl:col-span-8" action={link("/activity", "Deschide activitatea")}>
          <HoursChart data={d.hoursSeries} />
        </Card>
        <section className="panel relative overflow-hidden border-gold/30 p-5 shadow-gold xl:col-span-4">
          <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-gold/15 blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-2 text-gold"><Crown className="h-5 w-5" /><h2 className="h-card">Gangsterul Lunii</h2></div>
            <p className="mt-0.5 text-xs text-muted">{d.gotm.month}</p>
            <p className="mt-4 font-display text-4xl font-extrabold">{d.gotm.name}</p>
            <p className="text-sm text-gold-soft">{d.gotm.score} puncte</p>
            <ul className="mt-4 space-y-2">
              {d.gotm.breakdown.map(([k, v]) => (
                <li key={k} className="text-xs">
                  <div className="mb-1 flex justify-between text-white/80"><span>{k}</span><span>{v}</span></div>
                  <div className="h-1.5 rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-gold-deep to-gold-soft" style={{ width: `${(v / 220) * 100}%` }} /></div>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-muted">Recompensă: {d.gotm.reward}</p>
          </div>
        </section>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card title="Aprobări în așteptare" action={<Badge tone="gold">{`${pending.length} în așteptare`}</Badge>}>
          <ul className="space-y-3">
            {pending.map((p) => (
              <li key={String(p.ref)} className="flex items-center justify-between gap-3 rounded-xl bg-white/[.03] p-3">
                <div className="min-w-0"><p className="truncate text-sm font-semibold">{p.category}</p><p className="text-xs text-muted">{p.member}, {p.duration}</p></div>
                <span className="font-mono text-xs text-gold-soft">{p.ref}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted">După conectarea botului, poți aproba sau respinge direct din Discord.</p>
        </Card>
        <Card title="Activitate recentă" action={link("/activity", "Vezi tot")}>
          <ul className="space-y-3">
            {d.activity.slice(0, 4).map((a) => (
              <li key={String(a.ref)} className="flex items-center justify-between gap-3">
                <div className="min-w-0"><p className="truncate text-sm">{a.member}</p><p className="truncate text-xs text-muted">{a.category}, {a.duration}</p></div>
                <Badge>{String(a.status)}</Badge>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Top cinci membri" action={link("/rankings", "Clasamente")}>
          <ol className="space-y-3">
            {topFive.map((m, i) => (
              <li key={m.id} className="flex items-center gap-3">
                <span className={`w-5 text-center font-display text-xl font-extrabold ${i === 0 ? "text-gold" : "text-muted"}`}>{i + 1}</span>
                <span className="grid h-9 w-9 place-items-center rounded-full font-display text-base font-extrabold text-ink" style={{ background: m.hue }}>{m.initials}</span>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{m.name}</p><p className="text-xs text-muted">{m.rank}</p></div>
                <span className="text-sm font-bold">{m.score}</span>
              </li>
            ))}
          </ol>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-12">
        <Card title="Inventarul seifului" className="xl:col-span-5" action={link("/chest", "Deschide seiful")}>
          <ul className="space-y-3.5">
            {d.inventory.map((i) => {
              const low = i.qty < i.min;
              return (
                <li key={i.item}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">{i.item}{low && <Badge tone="rose">Stoc redus</Badge>}</span>
                    <span className="text-muted">{i.qty.toLocaleString("en")} {i.unit}</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10"><div className={`h-full rounded-full ${low ? "bg-rose-400" : "bg-emerald"}`} style={{ width: `${Math.min(100, (i.qty / (i.min * 2)) * 100)}%` }} /></div>
                </li>
              );
            })}
          </ul>
        </Card>
        <Card title="Mișcările din seif în această săptămână" className="xl:col-span-7"><ChestChart data={d.chestSeries} /></Card>
      </div>

      <Card title="Tranzacții recente cu seiful" action={link("/chest", "Vezi tot")} pad={false}>
        <div className="p-5 pt-4">
          <DataTable columns={[{ key: "ref", label: "Ref.", kind: "mono" }, { key: "member", label: "Membru" }, { key: "type", label: "Tip" }, { key: "items", label: "Obiecte" }, { key: "status", label: "Stare", kind: "badge" }]} rows={d.chestTx} />
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card title="Taskuri" action={link("/tasks", "Deschide taskurile")}>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-violet/15 p-4"><p className="font-display text-4xl font-extrabold">{d.tasks.filter((t) => t.status !== "Finalizat").length}</p><p className="text-xs text-muted">Active</p></div>
            <div className="rounded-xl bg-emerald/12 p-4"><p className="font-display text-4xl font-extrabold">{d.tasks.filter((t) => t.status === "Finalizat").length}</p><p className="text-xs text-muted">Finalizate</p></div>
          </div>
          <ul className="mt-4 space-y-2.5">
            {d.tasks.slice(0, 3).map((t) => <li key={String(t.title)} className="flex items-center justify-between gap-2 text-sm"><span className="truncate">{t.title}</span><Badge>{String(t.status)}</Badge></li>)}
          </ul>
        </Card>
        <Card title="Situația teritoriilor" action={link("/territories", "Deschide harta")}>
          <ul className="space-y-3">
            {d.territories.map((t) => (
              <li key={String(t.name)} className="flex items-center justify-between gap-3">
                <div><p className="text-sm font-semibold">{t.name}</p><p className="text-xs text-muted">{t.lead}</p></div>
                <Badge>{String(t.status)}</Badge>
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Jafuri recente" action={link("/robberies", "Vezi tot")}>
          <ul className="space-y-3">
            {d.robberies.map((r) => (
              <li key={String(r.ref)} className="flex items-center justify-between gap-3">
                <div><p className="text-sm font-semibold">{r.type}</p><p className="text-xs text-muted">{r.leader}, {r.reward}</p></div>
                <Badge>{String(r.status)}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card title="Ultimele anunțuri" action={link("/announcements", "Vezi tot")}>
        <ul className="divide-y divide-line">
          {d.announcements.map((a) => (
            <li key={String(a.title)} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <Activity className="h-4 w-4 shrink-0 text-pink" aria-hidden />
              <p className="min-w-0 flex-1 truncate text-sm font-medium">{a.title}</p>
              <p className="shrink-0 text-xs text-muted">{a.author}, {a.date}</p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
