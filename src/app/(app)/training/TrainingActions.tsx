"use client";
import { useState, useTransition } from "react";
import { Plus, X, Trash2 } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Field } from "@/components/ui";
import { createTrainingPlan, completeTrainingStep, deleteTrainingPlan } from "@/app/actions/training";

export function CreatePlanBtn() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState([{ title: "", description: "" }]);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function close() {
    setOpen(false);
    setTitle(""); setDescription(""); setSteps([{ title: "", description: "" }]); setError("");
  }

  function addStep() { setSteps((s) => [...s, { title: "", description: "" }]); }
  function removeStep(i: number) { setSteps((s) => s.filter((_, j) => j !== i)); }
  function setStep(i: number, field: "title" | "description", v: string) {
    setSteps((s) => s.map((step, j) => j === i ? { ...step, [field]: v } : step));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const r = await createTrainingPlan({
        title,
        description,
        steps: steps.map((s, i) => ({ order: i + 1, title: s.title, description: s.description })),
      });
      if (r.error) { setError(r.error); return; }
      close();
    });
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary gap-2">
        <Plus className="h-4 w-4" /> Plan nou
      </button>
      <Modal open={open} onClose={close} title="Plan de antrenament nou">
        <form onSubmit={submit} className="space-y-4">
          <Field label="Titlu plan">
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </Field>
          <Field label="Descriere (opțional)">
            <textarea rows={2} className="input" value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
          <div className="space-y-2">
            <label className="label">Pași</label>
            {steps.map((step, i) => (
              <div key={i} className="rounded-lg border border-line p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted">Pasul {i + 1}</span>
                  {steps.length > 1 && (
                    <button type="button" onClick={() => removeStep(i)} className="btn-danger p-1">
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <input
                  className="input"
                  placeholder="Titlu pas"
                  value={step.title}
                  onChange={(e) => setStep(i, "title", e.target.value)}
                  required
                />
                <input
                  className="input"
                  placeholder="Descriere (opțional)"
                  value={step.description}
                  onChange={(e) => setStep(i, "description", e.target.value)}
                />
              </div>
            ))}
            {steps.length < 10 && (
              <button type="button" onClick={addStep} className="btn-ghost text-xs gap-1">
                <Plus className="h-3 w-3" /> Adaugă pas
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

export function CompleteStepBtn({
  planId,
  stepId,
  completed,
}: {
  planId: string;
  stepId: string;
  completed: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function close() { setOpen(false); setNote(""); setProofUrl(""); setError(""); }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const r = await completeTrainingStep(planId, stepId, { note, proofUrl });
      if (r.error) { setError(r.error); return; }
      close();
    });
  }

  if (completed) {
    return <span className="text-xs text-emerald-400 font-medium">✓ Finalizat</span>;
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-gold text-xs px-2 py-1">Marchează finalizat</button>
      <Modal open={open} onClose={close} title="Finalizare pas">
        <form onSubmit={submit} className="space-y-4">
          <Field label="Notă (opțional)">
            <textarea rows={3} className="input" value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
          <Field label="Link dovadă (opțional)">
            <input className="input" placeholder="YouTube, Streamable, Imgur..." value={proofUrl} onChange={(e) => setProofUrl(e.target.value)} />
          </Field>
          {error && <p className="text-sm text-rose-400">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className="btn-ghost" onClick={close} disabled={pending}>Anulează</button>
            <button type="submit" className="btn-gold" disabled={pending}>{pending ? "..." : "Confirmă"}</button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export function DeletePlanBtn({ planId }: { planId: string }) {
  const [pending, startTransition] = useTransition();
  function del() {
    startTransition(async () => { await deleteTrainingPlan(planId); });
  }
  return (
    <button onClick={del} disabled={pending} className="btn-danger p-1.5" title="Șterge plan">
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );
}
