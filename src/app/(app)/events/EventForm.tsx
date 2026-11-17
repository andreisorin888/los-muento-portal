"use client";
import { useState, useTransition } from "react";
import { CalendarPlus } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Field } from "@/components/ui";
import { createEvent } from "@/app/actions/events";
import type { EventType } from "@prisma/client";

type MemberOpt = { id: string; name: string; memberCode: string };

const TYPE_OPTS: { value: EventType; label: string }[] = [
  { value: "SEDINTA", label: "Ședință" },
  { value: "OPERATIUNE", label: "Operațiune" },
  { value: "INSTRUIRE", label: "Instruire" },
  { value: "ALTELE", label: "Altele" },
];

export function EventForm({ members }: { members: MemberOpt[] }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<EventType>("SEDINTA");
  const [description, setDescription] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function close() {
    setOpen(false); setTitle(""); setType("SEDINTA"); setDescription("");
    setScheduledAt(""); setSelected([]); setError("");
  }

  function toggleMember(id: string) {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  function selectAll() { setSelected(members.map((m) => m.id)); }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const r = await createEvent({ title, type, description: description || undefined, scheduledAt, invitedIds: selected });
      if (r.error) { setError(r.error); return; }
      close();
    });
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary gap-2">
        <CalendarPlus className="h-4 w-4" /> Eveniment nou
      </button>
      <Modal open={open} onClose={close} title="Eveniment nou">
        <form onSubmit={submit} className="space-y-4">
          <Field label="Titlu">
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </Field>
          <Field label="Tip">
            <select className="input" value={type} onChange={(e) => setType(e.target.value as EventType)}>
              {TYPE_OPTS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Field>
          <Field label="Data și ora">
            <input type="datetime-local" className="input" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} required />
          </Field>
          <Field label="Descriere (opțional)">
            <textarea rows={2} className="input" value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
          <Field label={`Invitați (${selected.length}/${members.length})`}>
            <div className="mb-2 flex gap-2">
              <button type="button" className="btn-ghost text-xs" onClick={selectAll}>Toți</button>
              <button type="button" className="btn-ghost text-xs" onClick={() => setSelected([])}>Niciunul</button>
            </div>
            <div className="max-h-44 space-y-1 overflow-y-auto rounded-xl border border-line p-2">
              {members.map((m) => (
                <label key={m.id} className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-white/5">
                  <input type="checkbox" checked={selected.includes(m.id)} onChange={() => toggleMember(m.id)} className="accent-pink-soft" />
                  <span className="text-sm">{m.name}</span>
                  <span className="ml-auto font-mono text-xs text-muted">{m.memberCode}</span>
                </label>
              ))}
            </div>
          </Field>
          {error && <p className="text-sm text-rose-400">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className="btn-ghost" onClick={close} disabled={pending}>Anulează</button>
            <button type="submit" className="btn-primary" disabled={pending}>{pending ? "Se salvează..." : "Creează evenimentul"}</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
