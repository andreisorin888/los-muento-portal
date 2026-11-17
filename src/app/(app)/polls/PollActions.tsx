"use client";
import { useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Field } from "@/components/ui";
import { createPoll, votePoll, closePoll } from "@/app/actions/polls";

const RANK_OPTS = [
  { value: 20, label: "Toți (Associate+)" },
  { value: 30, label: "Soldier+" },
  { value: 50, label: "Sottocapo+" },
  { value: 60, label: "Capo+" },
  { value: 90, label: "Underboss+" },
];

export function CreatePollBtn() {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [description, setDescription] = useState("");
  const [minLevel, setMinLevel] = useState(20);
  const [endsAt, setEndsAt] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function close() {
    setOpen(false);
    setQuestion(""); setDescription(""); setMinLevel(20); setEndsAt("");
    setOptions(["", ""]); setError("");
  }

  function addOption() { setOptions((o) => [...o, ""]); }
  function removeOption(i: number) { setOptions((o) => o.filter((_, j) => j !== i)); }
  function setOption(i: number, v: string) {
    setOptions((o) => o.map((opt, j) => (j === i ? v : opt)));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const r = await createPoll({ question, description, minLevel, endsAt, options });
      if (r.error) { setError(r.error); return; }
      close();
    });
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary gap-2">
        <Plus className="h-4 w-4" /> Sondaj nou
      </button>
      <Modal open={open} onClose={close} title="Sondaj nou">
        <form onSubmit={submit} className="space-y-4">
          <Field label="Întrebare">
            <input className="input" value={question} onChange={(e) => setQuestion(e.target.value)} required />
          </Field>
          <Field label="Descriere (opțional)">
            <textarea rows={2} className="input" value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Acces minim">
              <select className="input" value={minLevel} onChange={(e) => setMinLevel(Number(e.target.value))}>
                {RANK_OPTS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </Field>
            <Field label="Expiră la">
              <input type="datetime-local" className="input" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} required />
            </Field>
          </div>
          <div className="space-y-2">
            <label className="label">Opțiuni</label>
            {options.map((opt, i) => (
              <div key={i} className="flex gap-2">
                <input
                  className="input flex-1"
                  placeholder={`Opțiunea ${i + 1}`}
                  value={opt}
                  onChange={(e) => setOption(i, e.target.value)}
                />
                {options.length > 2 && (
                  <button type="button" onClick={() => removeOption(i)} className="btn-danger p-2">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
            {options.length < 6 && (
              <button type="button" onClick={addOption} className="btn-ghost text-xs gap-1">
                <Plus className="h-3 w-3" /> Adaugă opțiune
              </button>
            )}
          </div>
          {error && <p className="text-sm text-rose-400">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className="btn-ghost" onClick={close} disabled={pending}>Anulează</button>
            <button type="submit" className="btn-primary" disabled={pending}>{pending ? "..." : "Creează"}</button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export function VoteBtn({
  pollId,
  optionId,
  voted,
}: {
  pollId: string;
  optionId: string;
  voted: boolean;
}) {
  const [pending, startTransition] = useTransition();

  function vote() {
    if (voted) return;
    startTransition(async () => { await votePoll(pollId, optionId); });
  }

  return (
    <button
      onClick={vote}
      disabled={pending || voted}
      className={`text-left w-full rounded-lg border px-3 py-2 text-sm transition-colors ${
        voted
          ? "border-pink/40 bg-pink/10 text-pink-soft cursor-default"
          : "border-line hover:border-pink/40 hover:bg-pink/5"
      }`}
    >
      {voted ? "✓ Votul tău" : "Votează"}
    </button>
  );
}

export function ClosePollBtn({ pollId }: { pollId: string }) {
  const [pending, startTransition] = useTransition();
  function close() {
    startTransition(async () => { await closePoll(pollId); });
  }
  return (
    <button onClick={close} disabled={pending} className="btn-danger text-xs px-2 py-1">
      {pending ? "..." : "Închide"}
    </button>
  );
}
