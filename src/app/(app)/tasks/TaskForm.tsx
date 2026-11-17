"use client";
import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Field } from "@/components/ui";
import { createTask } from "@/app/actions/tasks";
import type { AssigneeType, TaskPriority } from "@prisma/client";

type MemberOpt = { id: string; name: string; memberCode: string };
type DeptOpt = { id: string; name: string };
type RankOpt = { rankLevel: number; rankName: string };

const PRIORITY_OPTS: { value: TaskPriority; label: string }[] = [
  { value: "SCAZUTA", label: "Scăzută" },
  { value: "NORMAL", label: "Normal" },
  { value: "RIDICATA", label: "Ridicată" },
  { value: "URGENTA", label: "Urgentă" },
];

const ASSIGNEE_OPTS: { value: AssigneeType; label: string }[] = [
  { value: "TOTI", label: "Toți membrii" },
  { value: "GRAD", label: "Un grad specific" },
  { value: "DEPARTAMENT", label: "Un departament" },
  { value: "MEMBRU", label: "Un singur membru" },
];

export function TaskForm({
  members,
  depts,
  ranks,
}: {
  members: MemberOpt[];
  depts: DeptOpt[];
  ranks: RankOpt[];
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("NORMAL");
  const [dueDate, setDueDate] = useState("");
  const [assigneeType, setAssigneeType] = useState<AssigneeType>("TOTI");
  const [assigneeId, setAssigneeId] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function close() {
    setOpen(false); setTitle(""); setDescription(""); setPriority("NORMAL");
    setDueDate(""); setAssigneeType("TOTI"); setAssigneeId(""); setError("");
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const r = await createTask({
        title,
        description: description || undefined,
        priority,
        dueDate: dueDate || undefined,
        assigneeType,
        assigneeId: (assigneeType !== "TOTI" ? assigneeId : undefined),
      });
      if (r.error) { setError(r.error); return; }
      close();
    });
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary gap-2">
        <Plus className="h-4 w-4" /> Task nou
      </button>
      <Modal open={open} onClose={close} title="Task nou">
        <form onSubmit={submit} className="space-y-4">
          <Field label="Titlu">
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </Field>
          <Field label="Descriere (opțional)">
            <textarea rows={2} className="input" value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Prioritate">
              <select className="input" value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}>
                {PRIORITY_OPTS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </Field>
            <Field label="Data limită (opțional)">
              <input type="date" className="input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </Field>
          </div>
          <Field label="Destinat">
            <select className="input" value={assigneeType} onChange={(e) => { setAssigneeType(e.target.value as AssigneeType); setAssigneeId(""); }}>
              {ASSIGNEE_OPTS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
          </Field>
          {assigneeType === "GRAD" && (
            <Field label="Grad">
              <select className="input" value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} required>
                <option value="">— Selectează —</option>
                {ranks.map((r) => <option key={r.rankLevel} value={String(r.rankLevel)}>{r.rankName}</option>)}
              </select>
            </Field>
          )}
          {assigneeType === "DEPARTAMENT" && (
            <Field label="Departament">
              <select className="input" value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} required>
                <option value="">— Selectează —</option>
                {depts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </Field>
          )}
          {assigneeType === "MEMBRU" && (
            <Field label="Membru">
              <select className="input" value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} required>
                <option value="">— Selectează —</option>
                {members.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.memberCode})</option>)}
              </select>
            </Field>
          )}
          {error && <p className="text-sm text-rose-400">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className="btn-ghost" onClick={close} disabled={pending}>Anulează</button>
            <button type="submit" className="btn-primary" disabled={pending}>{pending ? "Se salvează..." : "Creează sarcina"}</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
