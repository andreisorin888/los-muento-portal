"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { members } from "@/lib/demo-data";
import { Badge, Card } from "./ui";

export function MemberDirectory() {
  const [q, setQ] = useState("");
  const [rank, setRank] = useState("Toate");
  const [sort, setSort] = useState<"hours" | "name">("hours");
  const rows = useMemo(() => {
    const r = members.filter((m) => (rank === "Toate" || m.rank === rank) && (m.name + m.discord).toLowerCase().includes(q.toLowerCase()));
    return r.sort((a, b) => (sort === "hours" ? b.hours - a.hours : a.name.localeCompare(b.name)));
  }, [q, rank, sort]);

  return (
    <Card pad={false}>
      <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} className="input pl-10" placeholder="Caută după nume sau Discord" aria-label="Caută membri" />
        </div>
        <select value={rank} onChange={(e) => setRank(e.target.value)} className="input sm:w-44" aria-label="Filtrează după grad">
          {["Toate", "Boss", "Capo", "Soldier"].map((r) => <option key={r}>{r}</option>)}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as "hours" | "name")} className="input sm:w-44" aria-label="Sortează membrii">
          <option value="hours">Cele mai multe ore</option><option value="name">Nume A-Z</option>
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px]">
          <thead className="bg-white/[.03]"><tr>{["Membru", "Grad", "Departament", "Echipă", "Stare", "Ore", "Taskuri finalizate"].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
          <tbody>
            {rows.map((m) => (
              <tr key={m.id} className="border-t border-line hover:bg-white/[.03]">
                <td className="td">
                  <Link href={`/members/${m.id}`} className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-full font-display text-lg font-extrabold text-ink" style={{ background: m.hue }}>{m.initials}</span>
                    <span><span className="block font-semibold hover:text-pink-soft">{m.name}</span><span className="text-xs text-muted">{m.discord}, {m.id}</span></span>
                  </Link>
                </td>
                <td className="td">{m.rank}</td><td className="td">{m.dept}</td><td className="td">{m.crew}</td>
                <td className="td"><Badge>{m.status}</Badge></td>
                <td className="td font-semibold">{m.hours}</td><td className="td">{m.tasksDone}</td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={7} className="td py-10 text-center text-muted">Niciun membru nu corespunde. Șterge căutarea sau alege alt grad.</td></tr>}
          </tbody>
        </table>
      </div>
      <p className="border-t border-line px-4 py-3 text-xs text-muted">Se afișează {rows.length} din {members.length}. Paginarea se activează după conectarea bazei de date.</p>
    </Card>
  );
}
