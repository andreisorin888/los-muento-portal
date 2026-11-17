"use client";
import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { submitActivity } from "@/app/actions/activity";
import { Field } from "@/components/ui";
import { Modal } from "@/components/Modal";

type Category = { slug: string; label: string; points: number };

export function ActivityForm({ categories }: { categories: Category[] }) {
  const defaultSlug = categories[0]?.slug ?? "ALTELE";
  const [open, setOpen] = useState(false);
  const [type, setType] = useState(defaultSlug);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const selectedPts = categories.find((c) => c.slug === type)?.points ?? 1;

  function close() {
    setOpen(false);
    setTitle("");
    setDescription("");
    setProofUrl("");
    setError("");
    setType(defaultSlug);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const r = await submitActivity({ title, description: description || undefined, type, proofUrl: proofUrl || undefined });
      if (r.error) { setError(r.error); return; }
      close();
    });
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary gap-2">
        <Plus className="h-4 w-4" /> Adaugă activitate
      </button>

      <Modal open={open} onClose={close} title="Adaugă activitate">
        <form onSubmit={submit} className="space-y-4">
          <Field label="Tip activitate">
            <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>{c.label} (+{c.points} {c.points === 1 ? "punct" : "puncte"})</option>
              ))}
            </select>
          </Field>
          <Field label="Titlu">
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ex. Jaf la bijuterie cu echipa Cruz"
              required
            />
          </Field>
          <Field label="Descriere (opțional)">
            <textarea
              rows={3}
              className="input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ce ai făcut?"
            />
          </Field>
          <Field label="Link dovadă (YouTube, Streamable etc.)" hint="Linkul trebuie să fie public.">
            <input
              type="url"
              className="input"
              value={proofUrl}
              onChange={(e) => setProofUrl(e.target.value)}
              placeholder="https://youtube.com/..."
            />
          </Field>
          <p className="rounded-xl bg-emerald/10 px-4 py-3 text-sm text-emerald-soft">
            Această activitate va adăuga <span className="font-bold">+{selectedPts} {selectedPts === 1 ? "punct" : "puncte"}</span> contului tău imediat după trimitere.
          </p>
          {error && <p className="text-sm text-rose-400">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className="btn-ghost" onClick={close} disabled={pending}>Anulează</button>
            <button type="submit" className="btn-primary" disabled={pending}>
              {pending ? "Se trimite..." : "Trimite activitatea"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
