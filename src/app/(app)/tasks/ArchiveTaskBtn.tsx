"use client";
import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { updateTaskStatus } from "@/app/actions/tasks";

export function ArchiveTaskBtn({ taskId }: { taskId: string }) {
  const [confirm, setConfirm] = useState(false);
  const [pending, startTransition] = useTransition();

  function archive() {
    startTransition(async () => {
      await updateTaskStatus(taskId, "ANULAT");
      setConfirm(false);
    });
  }

  if (!confirm) {
    return (
      <button
        onClick={() => setConfirm(true)}
        className="rounded-lg p-1.5 text-muted hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
        title="Arhivează task"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted">Arhivezi?</span>
      <button onClick={archive} disabled={pending} className="btn-danger text-xs py-1 px-2">
        {pending ? "…" : "Da"}
      </button>
      <button onClick={() => setConfirm(false)} className="btn-ghost text-xs py-1 px-2">Nu</button>
    </div>
  );
}
