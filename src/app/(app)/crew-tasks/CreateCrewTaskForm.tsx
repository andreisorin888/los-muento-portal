"use client";
import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { createCrewTask } from "@/app/actions/crewTasks";
import { Field } from "@/components/ui";

type Crew = { id: string; name: string };

export function CreateCrewTaskForm({ crews }: { crews: Crew[] }) {
  const [open, setOpen] = useState(false);
  const [crewId, setCrewId] = useState(crews[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function reset() {
    setTitle("");
    setDescription("");
    setDueDate("");
    setError("");
    setOpen(false);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const r = await createCrewTask({ crewId, title, description, dueDate: dueDate || undefined });
      if (r.error) {
        setError(r.error);
      } else {
        reset();
      }
    });
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-primary flex items-center gap-2">
        <Plus className="h-4 w-4" />
        Task nou
      </button>
    );
  }

  return (
    <div className="panel p-5 space-y-4">
      <h3 className="font-semibold">Task nou pentru echipă</h3>
      <form onSubmit={submit} className="space-y-4">
        {crews.length > 1 && (
          <Field label="Echipă">
            <select className="input" value={crewId} onChange={(e) => setCrewId(e.target.value)} disabled={pending}>
              {crews.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
        )}
        <Field label="Ce trebuie să aducă echipa?">
          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="ex. 10 TEC + 500 gloanțe"
            required
            maxLength={120}
            disabled={pending}
          />
        </Field>
        <Field label="Detalii (opțional)">
          <textarea
            className="input min-h-[72px] resize-y"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Instrucțiuni suplimentare..."
            maxLength={500}
            disabled={pending}
          />
        </Field>
        <Field label="Termen limită (opțional)">
          <input
            className="input"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            disabled={pending}
          />
        </Field>
        {error && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-400">{error}</p>}
        <div className="flex gap-2">
          <button type="submit" className="btn-primary" disabled={pending}>{pending ? "Se salvează…" : "Creează task"}</button>
          <button type="button" className="btn-ghost" onClick={reset} disabled={pending}>Anulează</button>
        </div>
      </form>
    </div>
  );
}
