"use client";
import { useState, useTransition } from "react";
import { CheckCircle } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Field } from "@/components/ui";
import { completeTask } from "@/app/actions/tasks";

export function CompleteBtn({ taskId }: { taskId: string }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await completeTask(taskId, note || undefined);
      setOpen(false);
      setNote("");
    });
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-ghost gap-1 text-xs">
        <CheckCircle className="h-3.5 w-3.5" /> Finalizează
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Finalizează sarcina">
        <form onSubmit={submit} className="space-y-4">
          <Field label="Notă (opțional)">
            <textarea rows={2} className="input" placeholder="Cum ai îndeplinit sarcina?" value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className="btn-ghost" onClick={() => setOpen(false)} disabled={pending}>Anulează</button>
            <button type="submit" className="btn-primary" disabled={pending}>{pending ? "..." : "Confirmă"}</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
