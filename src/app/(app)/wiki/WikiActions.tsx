"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Pencil } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Field } from "@/components/ui";
import { createWikiPage, updateWikiPage, deleteWikiPage } from "@/app/actions/wiki";

const RANK_OPTS = [
  { value: 20, label: "Toți (Associate+)" },
  { value: 30, label: "Soldier+" },
  { value: 50, label: "Sottocapo+" },
  { value: 60, label: "Capo+" },
  { value: 90, label: "Underboss+" },
];

export function CreatePageBtn() {
  const router = useRouter();
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
      const r = await createWikiPage({ title, body, minLevel });
      if (r.error) { setError(r.error); return; }
      close();
      if (r.slug) router.push(`/wiki/${r.slug}`);
    });
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary gap-2">
        <Plus className="h-4 w-4" /> Pagină nouă
      </button>
      <Modal open={open} onClose={close} title="Pagină wiki nouă">
        <form onSubmit={submit} className="space-y-4">
          <Field label="Titlu">
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </Field>
          <Field label="Acces minim">
            <select className="input" value={minLevel} onChange={(e) => setMinLevel(Number(e.target.value))}>
              {RANK_OPTS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </Field>
          <Field label="Conținut">
            <textarea rows={10} className="input font-mono text-sm" value={body} onChange={(e) => setBody(e.target.value)} required placeholder="Scrie conținutul paginii..." />
          </Field>
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

export function EditPageBtn({
  pageId,
  initialTitle,
  initialBody,
  initialMinLevel,
}: {
  pageId: string;
  initialTitle: string;
  initialBody: string;
  initialMinLevel: number;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);
  const [minLevel, setMinLevel] = useState(initialMinLevel);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function close() { setOpen(false); setError(""); }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const r = await updateWikiPage(pageId, { title, body, minLevel });
      if (r.error) { setError(r.error); return; }
      close();
    });
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-ghost gap-2 text-sm">
        <Pencil className="h-3.5 w-3.5" /> Editează
      </button>
      <Modal open={open} onClose={close} title="Editează pagina wiki">
        <form onSubmit={submit} className="space-y-4">
          <Field label="Titlu">
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </Field>
          <Field label="Acces minim">
            <select className="input" value={minLevel} onChange={(e) => setMinLevel(Number(e.target.value))}>
              {RANK_OPTS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </Field>
          <Field label="Conținut">
            <textarea rows={12} className="input font-mono text-sm" value={body} onChange={(e) => setBody(e.target.value)} required />
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

export function DeletePageBtn({ pageId }: { pageId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  function del() {
    if (!confirm("Ștergi definitiv această pagină?")) return;
    startTransition(async () => {
      await deleteWikiPage(pageId);
      router.push("/wiki");
    });
  }
  return (
    <button onClick={del} disabled={pending} className="btn-danger gap-2 text-sm">
      <Trash2 className="h-3.5 w-3.5" /> Șterge
    </button>
  );
}
