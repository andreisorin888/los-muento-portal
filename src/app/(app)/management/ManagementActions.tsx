"use client";
import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Field } from "@/components/ui";
import { createManagementNote, deleteManagementNote } from "@/app/actions/management";

export function NewNoteBtn() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function close() { setOpen(false); setTitle(""); setBody(""); setError(""); }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const r = await createManagementNote({ title, body });
      if (r.error) { setError(r.error); return; }
      close();
    });
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary gap-2">
        <Plus className="h-4 w-4" /> Notă nouă
      </button>
      <Modal open={open} onClose={close} title="Notă internă nouă">
        <form onSubmit={submit} className="space-y-4">
          <Field label="Titlu">
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </Field>
          <Field label="Conținut">
            <textarea rows={6} className="input" value={body} onChange={(e) => setBody(e.target.value)} required />
          </Field>
          {error && <p className="text-sm text-rose-400">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className="btn-ghost" onClick={close} disabled={pending}>Anulează</button>
            <button type="submit" className="btn-primary" disabled={pending}>{pending ? "..." : "Salvează"}</button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export function DeleteNoteBtn({ noteId }: { noteId: string }) {
  const [pending, startTransition] = useTransition();

  function del() {
    startTransition(async () => { await deleteManagementNote(noteId); });
  }

  return (
    <button onClick={del} disabled={pending} className="btn-danger p-1.5" title="Șterge">
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );
}
