"use client";
import { useState, useTransition } from "react";
import { Trophy } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Field } from "@/components/ui";
import { confirmMonthlyWinner } from "@/app/actions/rankings";

type MemberOpt = { id: string; name: string; points: number };

export function ConfirmWinnerBtn({
  year,
  month,
  topMembers,
}: {
  year: number;
  month: number;
  topMembers: MemberOpt[];
}) {
  const [open, setOpen] = useState(false);
  const [winnerId, setWinnerId] = useState(topMembers[0]?.id ?? "");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function close() { setOpen(false); setNote(""); setError(""); }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const r = await confirmMonthlyWinner(year, month, winnerId, note || undefined);
      if (r.error) { setError(r.error); return; }
      close();
    });
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-gold gap-2">
        <Trophy className="h-4 w-4" /> Confirmă câștigătorul
      </button>
      <Modal open={open} onClose={close} title="Confirmă Gangsterul Lunii">
        <form onSubmit={submit} className="space-y-4">
          <Field label="Câștigător">
            <select className="input" value={winnerId} onChange={(e) => setWinnerId(e.target.value)} required>
              {topMembers.map((m) => (
                <option key={m.id} value={m.id}>{m.name} — {m.points} pct.</option>
              ))}
            </select>
          </Field>
          <Field label="Notă (opțional)">
            <textarea rows={2} className="input" value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
          {error && <p className="text-sm text-rose-400">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className="btn-ghost" onClick={close} disabled={pending}>Anulează</button>
            <button type="submit" className="btn-gold" disabled={pending}>{pending ? "..." : "Confirmă"}</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
