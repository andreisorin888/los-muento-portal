import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Hammer } from "lucide-react";
import { MODULES } from "@/config/nav";
import { Badge, Card } from "@/components/ui";
import { DataTable } from "@/components/DataTable";

export const dynamicParams = false;
const pages = MODULES.filter((m) => !["dashboard", "members"].includes(m.slug));
export function generateStaticParams() { return pages.map((m) => ({ module: m.slug })); }
export function generateMetadata({ params }: { params: { module: string } }): Metadata {
  return { title: pages.find((m) => m.slug === params.module)?.label ?? "Modul" };
}

export default function ModulePage({ params }: { params: { module: string } }) {
  const m = pages.find((x) => x.slug === params.module);
  if (!m) notFound();
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-xl bg-pink/12 text-pink"><m.icon className="h-7 w-7" /></div>
          <div><h1 className="h-page">{m.label}</h1><p className="mt-1 max-w-2xl text-sm text-muted">{m.summary}</p></div>
        </div>
        <Badge tone="violet">{`Se construiește în Faza ${m.phase}`}</Badge>
      </div>
      {m.table && <Card title={m.table.title} pad={false}><div className="p-5 pt-4"><DataTable columns={m.table.columns} rows={m.table.rows} /></div></Card>}
      <Card title="Ce va face acest modul">
        <div className="flex gap-4">
          <Hammer className="mt-0.5 h-5 w-5 shrink-0 text-gold" aria-hidden />
          <div>
            <ul className="grid gap-x-8 gap-y-2 text-sm text-white/80 sm:grid-cols-2">{m.scope.map((s) => <li key={s} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald" />{s}</li>)}</ul>
            <p className="mt-4 text-xs text-muted">{m.table ? "Tabelul de mai sus folosește date demo." : "Această pagină este deocamdată un schelet de navigare."} Formularele, salvarea în baza de date și verificarea permisiunilor se conectează în Faza {m.phase}.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
