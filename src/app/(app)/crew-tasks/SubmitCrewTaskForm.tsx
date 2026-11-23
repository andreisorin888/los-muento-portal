"use client";
import { useState, useTransition } from "react";
import { CheckCircle2 } from "lucide-react";
import { submitCrewTask } from "@/app/actions/crewTasks";
import { Field } from "@/components/ui";

export function SubmitCrewTaskForm({ taskId, alreadySubmitted }: { taskId: string; alreadySubmitted: boolean }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const r = await submitCrewTask({ taskId, note });
      if (r.error) {
        setError(r.error);
      } else {
        setOpen(false);
        setNote("");
      }
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-semibold transition-colors hover:bg-white/10 ${
          alreadySubmitted ? "text-emerald" : "text-gold border border-gold/30"
        }`}
      >
        <CheckCircle2 className="h-3.5 w-3.5" />
        {alreadySubmitted ? "Predat ✓" : "Predă"}
      </button>
    );
  }

  return (
    <div className="mt-3 rounded-xl bg-white/[.03] border border-panel/60 p-4 space-y-3">
      <form onSubmit={submit} className="space-y-3">
        <Field label={alreadySubmitted ? "Actualizează nota predării" : "Notă predare (opțional)"}>
          <input
            className="input"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="ex. Am adus 10 TEC la seif"
            maxLength={200}
            disabled={pending}
          />
        </Field>
        {error && <p className="text-xs text-rose-400">{error}</p>}
        <div className="flex gap-2">
          <button type="submit" className="btn-primary text-sm py-1.5 px-3" disabled={pending}>
            {pending ? "…" : alreadySubmitted ? "Actualizează" : "Confirmă predarea"}
          </button>
          <button type="button" className="btn-ghost text-sm py-1.5 px-3" onClick={() => setOpen(false)} disabled={pending}>
            Anulează
          </button>
        </div>
      </form>
    </div>
  );
}
