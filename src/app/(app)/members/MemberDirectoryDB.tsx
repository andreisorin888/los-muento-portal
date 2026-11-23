"use client";
import Link from "next/link";
import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, CheckCircle2, XCircle, AlertTriangle, Square } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import { RANKS } from "@/config/nav";
import type { MemberRow } from "@/lib/members";
import type { TaskWeeklyStatus } from "./page";
import type { MemberRole, MemberStatus } from "@prisma/client";
import { setTaskCompletionForMember } from "@/app/actions/tasks";

const STATUS_LABELS: Record<MemberStatus, string> = {
  ACTIV: "Activ",
  INACTIV: "Inactiv",
  SUSPENDAT: "Suspendat",
  PROBATORIE: "Perioadă de probă",
  ARHIVAT: "Arhivat",
};

const ROLE_LABELS: Record<MemberRole, string> = { LEGAL: "Legal", ILEGAL: "Ilegal" };
const ROLE_TONE: Record<MemberRole, "emerald" | "rose"> = { LEGAL: "emerald", ILEGAL: "rose" };

export function MemberDirectoryDB({
  members,
  total,
  actorLevel,
  taskStatusMap,
  latestTaskId,
  canManageTasks,
}: {
  members: MemberRow[];
  total: number;
  actorLevel: number;
  taskStatusMap: Record<string, TaskWeeklyStatus>;
  latestTaskId: string | null;
  canManageTasks: boolean;
}) {
  const [q, setQ] = useState("");
  const [rankFilter, setRankFilter] = useState("Toate");
  const [sort, setSort] = useState<"rank" | "name">("rank");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function toggleCompletion(memberId: string, completed: boolean) {
    if (!latestTaskId) return;
    startTransition(async () => {
      await setTaskCompletionForMember(memberId, latestTaskId, completed);
      router.refresh();
    });
  }

  const rows = useMemo(() => {
    let r = members.filter(
      (m) =>
        (rankFilter === "Toate" || m.rankName === rankFilter) &&
        (m.name + m.discordName + m.memberCode).toLowerCase().includes(q.toLowerCase()),
    );
    if (sort === "name") r = [...r].sort((a, b) => a.name.localeCompare(b.name));
    return r;
  }, [members, q, rankFilter, sort]);

  return (
    <Card pad={false}>
      <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="input pl-10"
            placeholder="Caută după nume, Discord sau ID"
            aria-label="Caută membri"
          />
        </div>
        <select
          value={rankFilter}
          onChange={(e) => setRankFilter(e.target.value)}
          className="input sm:w-44"
          aria-label="Filtrează după grad"
        >
          <option value="Toate">Toate gradele</option>
          {RANKS.map((r) => (
            <option key={r.name}>{r.name}</option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as "rank" | "name")}
          className="input sm:w-44"
          aria-label="Sortează membrii"
        >
          <option value="rank">Grad (descrescător)</option>
          <option value="name">Nume A-Z</option>
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px]">
          <thead className="bg-white/[.03]">
            <tr>
              <th className="th">Membru</th>
              <th className="th">Grad</th>
              <th className="th">Rol</th>
              <th className="th">Departament</th>
              <th className="th">Echipă</th>
              <th className="th">Stare</th>
              <th className="th">Luni joc</th>
              <th className="th">Task săpt.</th>
              <th className="th">Înscris la</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => {
              const ts = taskStatusMap?.[m.id];
              return (
                <tr key={m.id} className="border-t border-line hover:bg-white/[.03]">
                  <td className="td">
                    <Link href={`/members/${m.id}`} className="flex items-center gap-3 group/row">
                      <span className="block font-gta font-semibold uppercase tracking-wider text-base group-hover/row:text-pink-soft">{m.name}</span>
                      <span className="text-xs text-muted font-gta tracking-wide">{m.memberCode}</span>
                    </Link>
                  </td>
                  <td className="td font-gta font-semibold tracking-wider uppercase text-sm">{m.rankName}</td>
                  <td className="td"><Badge tone={ROLE_TONE[m.role]}>{ROLE_LABELS[m.role]}</Badge></td>
                  <td className="td">{m.dept?.name ?? "—"}</td>
                  <td className="td">{m.crew?.name ?? "—"}</td>
                  <td className="td"><Badge>{STATUS_LABELS[m.status]}</Badge></td>
                  <td className="td">
                    <span className="font-display font-bold text-sm">
                      {m.gameMonths > 0 ? (
                        <span className="text-violet">{m.gameMonths}<span className="text-xs font-normal text-muted ml-0.5">luni</span></span>
                      ) : (
                        <span className="text-muted text-xs">—</span>
                      )}
                    </span>
                  </td>
                  <td className="td">
                    {canManageTasks && latestTaskId ? (
                      <button
                        onClick={() => toggleCompletion(m.id, !ts?.completedLatest)}
                        disabled={pending}
                        title={ts?.completedLatest ? "Bifat ca predat — apasă pentru a anula" : "Apasă pentru a bifa ca predat"}
                        className={`inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs font-gta font-semibold tracking-wide transition-colors hover:bg-white/10 disabled:opacity-50 ${
                          ts?.completedLatest
                            ? "text-emerald"
                            : ts?.missedCount && ts.missedCount >= 3
                            ? "text-rose-400"
                            : "text-gold"
                        }`}
                      >
                        {ts?.completedLatest ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : ts?.missedCount && ts.missedCount >= 3 ? (
                          <AlertTriangle className="h-3.5 w-3.5" />
                        ) : (
                          <Square className="h-3.5 w-3.5" />
                        )}
                        {ts?.completedLatest
                          ? "Predat"
                          : ts?.missedCount && ts.missedCount >= 3
                          ? `${ts.missedCount} nep.`
                          : ts?.missedCount
                          ? `${ts.missedCount} nep.`
                          : "Nepredat"}
                      </button>
                    ) : !ts ? (
                      <span className="text-xs text-muted">—</span>
                    ) : ts.completedLatest ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald font-gta font-semibold tracking-wide">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Predat
                      </span>
                    ) : ts.missedCount >= 3 ? (
                      <span className="inline-flex items-center gap-1 text-xs text-rose-400 font-gta font-semibold tracking-wide" title={`${ts.missedCount} taskuri consecutive nepredate`}>
                        <AlertTriangle className="h-3.5 w-3.5" /> {ts.missedCount} nepredate
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-gold font-gta font-semibold tracking-wide">
                        <XCircle className="h-3.5 w-3.5" /> {ts.missedCount} nepred.
                      </span>
                    )}
                  </td>
                  <td className="td text-sm text-muted">
                    {new Date(m.joinedAt).toLocaleDateString("ro-RO")}
                  </td>
                </tr>
              );
            })}
            {!rows.length && (
              <tr>
                <td colSpan={9} className="td py-10 text-center text-muted">
                  Niciun membru nu corespunde. Șterge căutarea sau alege alt grad.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="border-t border-line px-4 py-3 text-xs text-muted">
        Se afișează {rows.length} din {total}.
      </p>
    </Card>
  );
}
