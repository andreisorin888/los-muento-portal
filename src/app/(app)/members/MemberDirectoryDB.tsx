"use client";
import Link from "next/link";
import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import { RANKS } from "@/config/nav";
import type { MemberRow } from "@/lib/members";
import type { MemberRole, MemberStatus } from "@prisma/client";

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
}: {
  members: MemberRow[];
  total: number;
  actorLevel: number;
}) {
  const [q, setQ] = useState("");
  const [rankFilter, setRankFilter] = useState("Toate");
  const [sort, setSort] = useState<"rank" | "name">("rank");

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
              {["Membru", "Grad", "Rol", "Departament", "Echipă", "Stare", "Înscris la"].map((h) => (
                <th key={h} className="th">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => (
              <tr key={m.id} className="border-t border-line hover:bg-white/[.03]">
                <td className="td">
                  <Link href={`/members/${m.id}`} className="flex items-center gap-3">
                    <span className="block font-semibold hover:text-pink-soft">{m.name}</span>
                    <span className="text-xs text-muted">{m.discordName} · {m.memberCode}</span>
                  </Link>
                </td>
                <td className="td">{m.rankName}</td>
                <td className="td"><Badge tone={ROLE_TONE[m.role]}>{ROLE_LABELS[m.role]}</Badge></td>
                <td className="td">{m.dept?.name ?? "—"}</td>
                <td className="td">{m.crew?.name ?? "—"}</td>
                <td className="td">
                  <Badge>{STATUS_LABELS[m.status]}</Badge>
                </td>
                <td className="td text-sm text-muted">
                  {new Date(m.joinedAt).toLocaleDateString("ro-RO")}
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={7} className="td py-10 text-center text-muted">
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
