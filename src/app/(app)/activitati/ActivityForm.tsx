"use client";
import { useState, useTransition, useRef } from "react";
import { Plus, Link, ImageIcon, X } from "lucide-react";
import { submitActivity } from "@/app/actions/activity";
import { Field } from "@/components/ui";
import { Modal } from "@/components/Modal";

type Category = { slug: string; label: string; points: number };

const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp", "image/bmp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function ActivityForm({ categories }: { categories: Category[] }) {
  const defaultSlug = categories[0]?.slug ?? "ALTELE";
  const [open, setOpen] = useState(false);
  const [type, setType] = useState(defaultSlug);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [proofMode, setProofMode] = useState<"link" | "image">("link");
  const [proofUrl, setProofUrl] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [fileError, setFileError] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const selectedPts = categories.find((c) => c.slug === type)?.points ?? 1;

  function close() {
    setOpen(false);
    setTitle("");
    setDescription("");
    setProofUrl("");
    setProofMode("link");
    setImagePreview(null);
    setImageData(null);
    setFileError("");
    setError("");
    setType(defaultSlug);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    setFileError("");
    const file = e.target.files?.[0];
    if (!file) { setImagePreview(null); setImageData(null); return; }
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setFileError("Format nesuportat. Acceptat: JPG, PNG, GIF, WebP, BMP.");
      setImagePreview(null); setImageData(null); return;
    }
    if (file.size > MAX_SIZE) {
      setFileError(`Poza este prea mare (${(file.size / 1024 / 1024).toFixed(1)} MB). Maxim 5 MB.`);
      setImagePreview(null); setImageData(null); return;
    }
    const data = await fileToBase64(file);
    setImageData(data);
    setImagePreview(data);
  }

  function clearImage() {
    setImagePreview(null);
    setImageData(null);
    setFileError("");
    if (fileRef.current) fileRef.current.value = "";
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const proof = proofMode === "image" ? (imageData ?? undefined) : (proofUrl || undefined);
    startTransition(async () => {
      const r = await submitActivity({ title, description: description || undefined, type, proofUrl: proof });
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

          <div>
            <p className="label mb-2">Dovadă (opțional)</p>
            <div className="flex gap-1 mb-3 p-1 rounded-lg bg-white/[.04] w-fit">
              <button
                type="button"
                onClick={() => setProofMode("link")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${proofMode === "link" ? "bg-white/10 text-white" : "text-muted hover:text-white"}`}
              >
                <Link className="h-3.5 w-3.5" /> Link video
              </button>
              <button
                type="button"
                onClick={() => setProofMode("image")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${proofMode === "image" ? "bg-white/10 text-white" : "text-muted hover:text-white"}`}
              >
                <ImageIcon className="h-3.5 w-3.5" /> Poză
              </button>
            </div>

            {proofMode === "link" ? (
              <input
                type="url"
                className="input w-full"
                value={proofUrl}
                onChange={(e) => setProofUrl(e.target.value)}
                placeholder="https://youtube.com/..."
              />
            ) : (
              <div>
                {imagePreview ? (
                  <div className="relative inline-block">
                    <img
                      src={imagePreview}
                      alt="Previzualizare dovadă"
                      className="max-h-40 rounded-lg border border-panel object-contain"
                    />
                    <button
                      type="button"
                      onClick={clearImage}
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-charcoal border border-panel flex items-center justify-center hover:bg-rose-900/60 transition-colors"
                      aria-label="Șterge poza"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-panel/60 bg-white/[.02] px-6 py-6 cursor-pointer hover:bg-white/[.04] transition-colors">
                    <ImageIcon className="h-6 w-6 text-muted" />
                    <span className="text-sm text-muted">Apasă pentru a alege o poză</span>
                    <span className="text-xs text-muted/60">JPG, PNG, GIF, WebP, BMP — max 5 MB</span>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/bmp"
                      className="sr-only"
                      onChange={handleFile}
                    />
                  </label>
                )}
                {fileError && <p className="mt-1.5 text-sm text-rose-400">{fileError}</p>}
              </div>
            )}
          </div>

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
