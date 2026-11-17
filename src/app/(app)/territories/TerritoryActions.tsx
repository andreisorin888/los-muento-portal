"use client";
import { useState, useTransition } from "react";
import { updateTerritoryStatus, createTerritory } from "@/app/actions/territories";
import { Modal } from "@/components/Modal";
import { Field } from "@/components/ui";
import { Plus } from "lucide-react";
import type { TerritoryStatus } from "@prisma/client";

type MemberOpt = { id: string; name: string };

const STATUS_OPTS: { value: TerritoryStatus; label: string }[] = [
  { value: "CONTROLAT", label: "Controlat" },
  { value: "CONTESTAT", label: "Contestat" },
  { value: "NEUTRU", label: "Neutru" },
];

export function TerritoryStatusBtn({
  territoryId,
  current,
  members,
}: {
  territoryId: string;
  current: TerritoryStatus;
  members: MemberOpt[];
}) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<TerritoryStatus>(current);
  const [note, setNote] = useState("");
  const [controlledById, setControlledById] = useState("");
  const [pending, startTransition] = useTransition();

  function close() { setOpen(false); setNote(""); setStatus(current); setControlledById(""); }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await updateTerritoryStatus(territoryId, status, note || undefined, controlledById || null);
      close();
    });
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-ghost text-xs">Actualizează</button>
      <Modal open={open} onClose={close} title="Actualizează teritoriu">
        <form onSubmit={submit} className="space-y-3">
          <Field label="Stare nouă">
            <select className="input" value={status} onChange={(e) => setStatus(e.target.value as TerritoryStatus)}>
              {STATUS_OPTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </Field>
          {status === "CONTROLAT" && (
            <Field label="Controlat de (opțional)">
              <select className="input" value={controlledById} onChange={(e) => setControlledById(e.target.value)}>
                <option value="">— Niciunul —</option>
                {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </Field>
          )}
          <Field label="Notă (opțional)">
            <input className="input" value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className="btn-ghost" onClick={close} disabled={pending}>Anulează</button>
            <button type="submit" className="btn-primary" disabled={pending}>{pending ? "..." : "Salvează"}</button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export function AddTerritoryBtn() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function close() { setOpen(false); setName(""); setDescription(""); setError(""); }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const r = await createTerritory({ name, description: description || undefined });
      if (r.error) { setError(r.error); return; }
      close();
    });
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-ghost gap-2">
        <Plus className="h-4 w-4" /> Teritoriu nou
      </button>
      <Modal open={open} onClose={close} title="Adaugă teritoriu">
        <form onSubmit={submit} className="space-y-3">
          <Field label="Nume teritoriu">
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <Field label="Descriere (opțional)">
            <textarea rows={2} className="input" value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
          {error && <p className="text-sm text-rose-400">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className="btn-ghost" onClick={close} disabled={pending}>Anulează</button>
            <button type="submit" className="btn-primary" disabled={pending}>{pending ? "..." : "Adaugă"}</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
