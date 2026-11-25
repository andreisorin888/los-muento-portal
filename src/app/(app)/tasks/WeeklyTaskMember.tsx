"use client";
import { useState, useTransition } from "react";
import { CheckCircle2, Upload } from "lucide-react";
import { submitWeeklyTask } from "@/app/actions/weeklyTask";
import { Field } from "@/components/ui";

type Props = {
  taskId: string;
  taskTitle: string;
  taskDescription: string | null;
  mySubmission: { status: string; note: string | null } | null;
};

export function WeeklyTaskMemberCard({ taskId, taskTitle, taskDescription, mySubmission }: Props) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState(mySubmission?.note ?? "");
  const [proofType, setProofType] = useState<"link" | "image">("link");
  const [proofLink, setProofLink] = useState("");
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const already = mySubmission !== null;

  function onImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setProofImage(reader.result as string);
    reader.readAsDataURL(file);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const proofUrl = proofType === "link" ? proofLink.trim() || undefined : proofImage || undefined;
    startTransition(async () => {
      const r = await submitWeeklyTask({ taskId, note: note.trim() || undefined, proofUrl });
      if (r.error) { setError(r.error); return; }
      setOpen(false);
    });
  }

  if (already) {
    return (
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <p className="font-semibold">{taskTitle}</p>
          {taskDescription && <p className="mt-0.5 text-sm text-muted">{taskDescription}</p>}
          {mySubmission.note && <p className="mt-1 text-xs text-muted">Nota ta: {mySubmission.note}</p>}
        </div>
        <span className="inline-flex items-center gap-1.5 text-sm text-emerald">
          <CheckCircle2 className="h-4 w-4" /> Finalizat
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="font-semibold">{taskTitle}</p>
        {taskDescription && <p className="mt-0.5 text-sm text-muted">{taskDescription}</p>}
      </div>

      {!open ? (
        <button className="btn-primary" onClick={() => setOpen(true)}>Predau taskul</button>
      ) : (
        <form onSubmit={submit} className="space-y-3 rounded-xl border border-line bg-white/[.03] p-4">
          <Field label="Notă predare (opțional)">
            <textarea
              className="input resize-none"
              rows={2}
              placeholder="Ce ai făcut?"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </Field>

          <div className="space-y-2">
            <label className="label">Dovadă (opțional)</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setProofType("link")}
                className={`btn-ghost text-xs py-1 px-3 ${proofType === "link" ? "border-pink text-pink" : ""}`}>
                🔗 Link video
              </button>
              <button type="button" onClick={() => setProofType("image")}
                className={`btn-ghost text-xs py-1 px-3 ${proofType === "image" ? "border-pink text-pink" : ""}`}>
                <Upload className="inline h-3 w-3 mr-1" /> Poză
              </button>
            </div>
            {proofType === "link" && (
              <input className="input text-sm" placeholder="https://..." value={proofLink} onChange={(e) => setProofLink(e.target.value)} />
            )}
            {proofType === "image" && (
              <input type="file" accept="image/*" className="text-sm text-muted" onChange={onImageChange} />
            )}
          </div>

          {error && <p className="text-sm text-rose-400">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" className="btn-primary" disabled={pending}>
              {pending ? "Se trimite…" : "Trimite predarea"}
            </button>
            <button type="button" className="btn-ghost" onClick={() => setOpen(false)} disabled={pending}>Anulează</button>
          </div>
        </form>
      )}
    </div>
  );
}
