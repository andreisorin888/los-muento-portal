"use client";
import { useState, useTransition } from "react";
import { Trash2, ImageIcon } from "lucide-react";
import { cleanupProofImages } from "@/app/actions/activity";

const OPTIONS = [
  { label: "Mai vechi de 30 de zile", days: 30 },
  { label: "Mai vechi de 60 de zile", days: 60 },
  { label: "Mai vechi de 90 de zile", days: 90 },
  { label: "Toate pozele (oricând)", days: 0 },
];

export function ProofCleanupManager() {
  const [days, setDays] = useState(30);
  const [result, setResult] = useState<{ count?: number; error?: string } | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [pending, startTransition] = useTransition();

  function reset() {
    setResult(null);
    setConfirmed(false);
  }

  function run() {
    startTransition(async () => {
      const r = await cleanupProofImages(days === 0 ? 0 : days);
      setResult(r);
      setConfirmed(false);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-xl bg-white/[.03] border border-panel/60 p-4">
        <ImageIcon className="h-5 w-5 mt-0.5 shrink-0 text-muted" />
        <div className="text-sm text-muted leading-relaxed">
          Pozele încărcate ca dovezi sunt stocate în baza de date. Ștergerea lor eliberează spațiu fără a elimina activitățile sau punctele.
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          className="input w-auto"
          value={days}
          onChange={(e) => { setDays(Number(e.target.value)); reset(); }}
          disabled={pending}
        >
          {OPTIONS.map((o) => (
            <option key={o.days} value={o.days}>{o.label}</option>
          ))}
        </select>

        {!confirmed ? (
          <button
            className="btn-danger flex items-center gap-2"
            onClick={() => setConfirmed(true)}
            disabled={pending}
          >
            <Trash2 className="h-4 w-4" />
            Curăță pozele
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gold">Ești sigur?</span>
            <button className="btn-danger" onClick={run} disabled={pending}>
              {pending ? "Se curăță…" : "Da, șterge"}
            </button>
            <button className="btn-ghost" onClick={reset} disabled={pending}>Anulează</button>
          </div>
        )}
      </div>

      {result && (
        result.error ? (
          <p className="text-sm text-rose-400">{result.error}</p>
        ) : (
          <p className="text-sm text-emerald">
            {result.count === 0
              ? "Nicio poză de șters în perioada selectată."
              : `${result.count} ${result.count === 1 ? "poză ștearsă" : "poze șterse"} cu succes.`}
          </p>
        )
      )}
    </div>
  );
}
