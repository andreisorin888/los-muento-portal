"use client";
import { useTransition } from "react";
import { updateAttendance } from "@/app/actions/events";
import type { AttendanceStatus } from "@prisma/client";

const OPTS: { value: AttendanceStatus; label: string; cls: string }[] = [
  { value: "CONFIRMAT", label: "Confirm", cls: "btn-gold" },
  { value: "PREZENT", label: "Prezent", cls: "btn-primary" },
  { value: "ABSENT", label: "Absent", cls: "btn-danger" },
];

export function AttendanceBtn({ eventId, current }: { eventId: string; current?: AttendanceStatus }) {
  const [pending, startTransition] = useTransition();

  function pick(status: AttendanceStatus) {
    startTransition(async () => { await updateAttendance(eventId, status); });
  }

  return (
    <div className="flex gap-1">
      {OPTS.map((o) => (
        <button
          key={o.value}
          onClick={() => pick(o.value)}
          disabled={pending || current === o.value}
          className={`${o.cls} px-3 py-1.5 text-xs ${current === o.value ? "opacity-100 ring-2 ring-white/30" : "opacity-60 hover:opacity-100"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
