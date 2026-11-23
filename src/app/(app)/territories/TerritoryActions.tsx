"use client";
import { useState, useTransition } from "react";
import { updateTerritoryStatus, createTerritory, bulkImportTerritories } from "@/app/actions/territories";
import { Modal } from "@/components/Modal";
import { Field } from "@/components/ui";
import { Plus, Upload, Check } from "lucide-react";
import type { TerritoryStatus } from "@prisma/client";

type MemberOpt = { id: string; name: string };

const STATUS_OPTS: { value: TerritoryStatus; label: string }[] = [
  { value: "CONTROLAT", label: "Controlat" },
  { value: "CONTESTAT", label: "Contestat" },
  { value: "NEUTRU", label: "Neutru" },
  { value: "CU_ARME", label: "Cu arme" },
  { value: "FARA_ARME", label: "Fără arme" },
];

export function TerritoryStatusBtn({
  territoryId,
  current,
  currentControllerName,
  members,
}: {
  territoryId: string;
  current: TerritoryStatus;
  currentControllerName: string | null;
  members: MemberOpt[];
}) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<TerritoryStatus>(current);
  const [note, setNote] = useState("");
  const [controllerName, setControllerName] = useState(currentControllerName ?? "");
  const [controlledById, setControlledById] = useState("");
  const [pending, startTransition] = useTransition();

  function close() {
    setOpen(false); setNote(""); setStatus(current);
    setControllerName(currentControllerName ?? ""); setControlledById("");
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await updateTerritoryStatus(
        territoryId, status, note || undefined,
        controlledById || null, controllerName || null,
      );
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
          <Field label="Facțiune / Gang controlant">
            <input
              className="input"
              value={controllerName}
              onChange={(e) => setControllerName(e.target.value)}
              placeholder="ex. Yakuza, Norteños, —"
            />
          </Field>
          {members.length > 0 && (
            <Field label="Responsabil intern (opțional)">
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
  const [zone, setZone] = useState("");
  const [controllerName, setControllerName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function close() { setOpen(false); setName(""); setZone(""); setControllerName(""); setDescription(""); setError(""); }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const r = await createTerritory({ name, zone: zone || undefined, controllerName: controllerName || undefined, description: description || undefined });
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
          <Field label="Zonă (ex. Oraș, Cayo)">
            <input className="input" value={zone} onChange={(e) => setZone(e.target.value)} placeholder="Oraș" />
          </Field>
          <Field label="Facțiune controlantă">
            <input className="input" value={controllerName} onChange={(e) => setControllerName(e.target.value)} placeholder="ex. Yakuza" />
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

const PLACEHOLDER = `Oraș
El Burro - Norteños
Groove - Bratva

Cayo
Alcol - Benedetto
Arme - The Brokers`;

export function BulkImportBtn() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [result, setResult] = useState<{ imported?: number; error?: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function close() { setOpen(false); setText(""); setResult(null); }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    startTransition(async () => {
      const r = await bulkImportTerritories(text);
      setResult(r);
      if (!r.error) setText("");
    });
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-ghost gap-2">
        <Upload className="h-4 w-4" /> Actualizează din text
      </button>
      <Modal open={open} onClose={close} title="Actualizează teritorii din text">
        <form onSubmit={submit} className="space-y-4">
          <div className="rounded-xl bg-white/[.03] border border-panel/60 p-3 text-xs text-muted space-y-1">
            <p className="font-semibold text-white/70">Format acceptat:</p>
            <pre className="font-mono whitespace-pre-wrap leading-relaxed">{PLACEHOLDER}</pre>
            <p className="mt-2">Liniile fără „ - " devin titluri de zonă. Rândurile „Teritoriu - Facțiune" sunt adăugate sau actualizate automat.</p>
          </div>
          <Field label="Lipește lista de teritorii">
            <textarea
              className="input min-h-[180px] resize-y font-mono text-sm"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={PLACEHOLDER}
              required
              disabled={pending}
            />
          </Field>
          {result?.error && <p className="text-sm text-rose-400">{result.error}</p>}
          {result?.imported !== undefined && !result.error && (
            <p className="flex items-center gap-2 text-sm text-emerald">
              <Check className="h-4 w-4" />
              {result.imported} teritorii actualizate cu succes.
            </p>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className="btn-ghost" onClick={close} disabled={pending}>Închide</button>
            <button type="submit" className="btn-primary" disabled={pending || !text.trim()}>
              {pending ? "Se importă…" : "Importă"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
