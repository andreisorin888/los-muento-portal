import { Badge } from "./ui";
import type { Column } from "@/config/nav";

export function DataTable({ columns, rows }: { columns: Column[]; rows: Record<string, string | number>[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <table className="w-full min-w-[560px] border-collapse">
        <thead className="bg-white/[.03]">
          <tr>{columns.map((c) => <th key={c.key} className="th">{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-line transition-colors hover:bg-white/[.03]">
              {columns.map((c) => (
                <td key={c.key} className={`td ${c.kind === "mono" ? "font-mono text-xs text-gold-soft" : ""}`}>
                  {c.kind === "badge" ? <Badge>{String(r[c.key])}</Badge> : r[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
