"use client";
import { useState, useTransition } from "react";
import { Clock, Check } from "lucide-react";
import { updateGameMonths } from "@/app/actions/member";

export function GameMonthsWidget({ current }: { current: number }) {
  const [value, setValue] = useState(current);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function save() {
    setError("");
    setSaved(false);
    startTransition(async () => {
      const r = await updateGameMonths(value);
      if (r.error) {
        setError(r.error);
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 text-muted">
        <Clock className="h-4 w-4 shrink-0" />
        <span className="text-sm">Luni în joc:</span>
        <span className="font-display font-bold text-violet text-lg">{current}</span>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={0}
          max={999}
          value={value}
          onChange={(e) => { setValue(Math.max(0, Math.min(999, Number(e.target.value)))); setSaved(false); }}
          className="input w-20 text-center"
          disabled={pending}
        />
        <button
          onClick={save}
          disabled={pending || value === current}
          className="btn-primary flex items-center gap-1.5 text-sm py-1.5 px-3 disabled:opacity-40"
        >
          {saved ? <Check className="h-3.5 w-3.5" /> : null}
          {saved ? "Salvat" : pending ? "…" : "Actualizează"}
        </button>
      </div>
      {error && <p className="w-full text-xs text-rose-400">{error}</p>}
    </div>
  );
}
