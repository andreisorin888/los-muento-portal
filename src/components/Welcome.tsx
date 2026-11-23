"use client";
import Link from "next/link";
import { ClipboardPlus, Package, Siren, ListPlus } from "lucide-react";

const ACTIONS = [
  { label: "Trimite activitate", icon: ClipboardPlus, href: "/activitati" },
  { label: "Tranzacție seif",    icon: Package,       href: "/chest" },
  { label: "Raportează jaf",     icon: Siren,         href: "/robberies" },
  { label: "Task nou",           icon: ListPlus,      href: "/tasks" },
] as const;

type Props = {
  banner: string | null;
  name: string;
  rank: string;
  dept: string;
};

export function Welcome({ banner, name, rank, dept }: Props) {
  const firstName = name.split(" ")[0];

  return (
    <section className="panel relative overflow-hidden p-6 sm:p-8">
      {banner ? (
        <div className="absolute inset-0 bg-cover bg-center opacity-40" style={{ backgroundImage: `url(${banner})` }} />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(600px_220px_at_90%_0%,rgba(255,46,147,.28),transparent),radial-gradient(500px_240px_at_60%_120%,rgba(139,61,255,.3),transparent),linear-gradient(90deg,rgba(18,184,134,.1),transparent_40%)]" />
      )}
      <div className="relative">
        <p className="text-sm text-gold-soft">{rank}{dept ? `, ${dept}` : ""}</p>
        <h1 className="h-page mt-1">Bine ai revenit, {firstName}</h1>
        <p className="mt-2 max-w-xl text-sm text-white/70">Bine ai venit în portalul organizației.</p>
        <div className="mt-5 flex flex-wrap gap-2.5">
          {ACTIONS.map((a, i) => (
            <Link key={a.href} href={a.href} className={`inline-flex items-center gap-2 ${i === 0 ? "btn-primary" : "btn-ghost"}`}>
              <a.icon className="h-4 w-4" />{a.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
