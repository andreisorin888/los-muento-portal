"use client";
import { useTransition } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { finishCrewTask, cancelCrewTask } from "@/app/actions/crewTasks";

export function CrewTaskActions({ taskId }: { taskId: string }) {
  const [pending, startTransition] = useTransition();

  function finish() {
    startTransition(async () => { await finishCrewTask(taskId); });
  }

  function cancel() {
    startTransition(async () => { await cancelCrewTask(taskId); });
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={finish}
        disabled={pending}
        className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold text-emerald hover:bg-emerald/10 transition-colors disabled:opacity-50"
      >
        <CheckCircle2 className="h-3.5 w-3.5" />
        Finalizează
      </button>
      <button
        onClick={cancel}
        disabled={pending}
        className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold text-muted hover:bg-white/10 transition-colors disabled:opacity-50"
      >
        <XCircle className="h-3.5 w-3.5" />
        Anulează
      </button>
    </div>
  );
}
