"use client";
import { useState, useTransition } from "react";
import { updateRobberyStatus } from "@/app/actions/robberies";
import type { RobberyStatus } from "@prisma/client";

const OPTS: { value: RobberyStatus; label: string }[] = [
  { value: "PLANIFICAT", label: "Planificat" },
  { value: "REUSIT", label: "Reușit" },
  { value: "ESUAT", label: "Eșuat" },
  { value: "ANULAT", label: "Anulat" },
];

export function StatusButton({ robberyId, current }: { robberyId: string; current: RobberyStatus }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function pick(status: RobberyStatus) {
    startTransition(async () => {
      await updateRobberyStatus(robberyId, status);
      setOpen(false);
    });
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} className="btn-ghost text-xs" disabled={pending}>
        Schimbă starea
      </button>
      {open && (
        <div className="absolute right-0 top-9 z-20 w-40 rounded-xl border border-line bg-charcoal p-1 shadow-xl">
          {OPTS.map((o) => (
            <button
              key={o.value}
              onClick={() => pick(o.value)}
              className={`w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-white/10 ${o.value === current ? "text-gold" : ""}`}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
