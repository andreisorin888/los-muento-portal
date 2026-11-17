"use client";
import { useState, useTransition } from "react";
import { Plus, Trash2, Eye } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Field } from "@/components/ui";
import { createAnnouncement, deleteAnnouncement, markAnnouncementRead } from "@/app/actions/announcements";

const RANK_OPTS = [
  { level: 20, label: "Toți membrii (Associate+)" },
  { level: 30, label: "Soldier+" },
  { level: 50, label: "Sottocapo+" },
  { level: 60, label: "Capo+" },
  { level: 90, label: "Conducere (Underboss+)" },
];

export function NewAnnouncementBtn() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [minLevel, setMinLevel] = useState(20);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function close() { setOpen(false); setTitle(""); setBody(""); setMinLevel(20); setError(""); }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const r = await createAnnouncement({ title, body, minLevel });
      if (r.error) { setError(r.error); return; }
      close();
    });
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary gap-2">
        <Plus className="h-4 w-4" /> Anunț nou
      </button>
      <Modal open={open} onClose={close} title="Anunț nou">
        <form onSubmit={submit} className="space-y-4">
          <Field label="Titlu">
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </Field>
          <Field label="Conținut">
            <textarea rows={5} className="input" value={body} onChange={(e) => setBody(e.target.value)} required />
          </Field>
          <Field label="Vizibil pentru">
            <select className="input" value={minLevel} onChange={(e) => setMinLevel(Number(e.target.value))}>
              {RANK_OPTS.map((r) => <option key={r.level} value={r.level}>{r.label}</option>)}
            </select>
          </Field>
          {error && <p className="text-sm text-rose-400">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className="btn-ghost" onClick={close} disabled={pending}>Anulează</button>
            <button type="submit" className="btn-primary" disabled={pending}>{pending ? "..." : "Publică"}</button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export function DeleteAnnouncementBtn({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  function del() {
    startTransition(async () => { await deleteAnnouncement(id); });
  }

  return (
    <button onClick={del} disabled={pending} className="btn-danger p-1.5" title="Șterge">
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );
}

export function MarkReadBtn({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  function mark() {
    startTransition(async () => { await markAnnouncementRead(id); });
  }

  return (
    <button onClick={mark} disabled={pending} className="btn-ghost gap-1 text-xs">
      <Eye className="h-3.5 w-3.5" /> Marchează citit
    </button>
  );
}
