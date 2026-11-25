"use client";
import { useState, useTransition } from "react";
import { CheckCircle2, XCircle, Users } from "lucide-react";
import { createWeeklyTask, confirmWeeklySubmission, confirmAllWeeklySubmissions, rejectWeeklySubmission, closeWeeklyTask } from "@/app/actions/weeklyTask";
import { Field } from "@/components/ui";
import type { WeeklyTarget } from "@/app/actions/weeklyTask";

const RANKS = [
  { level: 100, name: "Boss" },
  { level: 90, name: "Underboss" },
  { level: 80, name: "Consigliere" },
  { level: 60, name: "Capo" },
  { level: 50, name: "Sottocapo" },
  { level: 30, name: "Soldier" },
  { level: 20, name: "Associate" },
];

type Crew = { id: string; name: string };
type Submission = {
  id: string;
  status: string;
  note: string | null;
  proofUrl: string | null;
  createdAt: Date;
  rejectReason: string | null;
  member: { name: string; memberCode: string };
};
type ActiveTask = {
  id: string;
  title: string;
  description: string | null;
  targetJson: unknown;
  status: string;
  submissions: Submission[];
};

export function WeeklyTaskCreateForm({ crews }: { crews: Crew[] }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [rankMin, setRankMin] = useState(20);
  const [rankMax, setRankMax] = useState(100);
  const [selectedCrews, setSelectedCrews] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);
  const [pending, startTransition] = useTransition();

  function toggleCrew(id: string) {
    setSelectedCrews((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]);
  }
  function toggleRole(r: string) {
    setRoles((prev) => prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setOk(false);
    const target: WeeklyTarget = { rankMin, rankMax, crewIds: selectedCrews, roles };
    startTransition(async () => {
      const r = await createWeeklyTask({ title, description, target });
      if (r.error) { setError(r.error); return; }
      setOk(true); setTitle(""); setDescription("");
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-line bg-panel/60 p-5">
      <h3 className="font-semibold text-white/80">Setează task săptămânal</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Titlu task">
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="ex. Livrare Cayo x3" />
        </Field>
        <Field label="Descriere (opțional)">
          <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detalii suplimentare…" />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Grad minim">
          <select className="input" value={rankMin} onChange={(e) => setRankMin(Number(e.target.value))}>
            {RANKS.map((r) => <option key={r.level} value={r.level}>{r.name}</option>)}
          </select>
        </Field>
        <Field label="Grad maxim">
          <select className="input" value={rankMax} onChange={(e) => setRankMax(Number(e.target.value))}>
            {RANKS.map((r) => <option key={r.level} value={r.level}>{r.name}</option>)}
          </select>
        </Field>
      </div>

      {crews.length > 0 && (
        <Field label="Grupe (gol = toate)">
          <div className="flex flex-wrap gap-2 pt-1">
            {crews.map((c) => (
              <label key={c.id} className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm hover:bg-white/5">
                <input type="checkbox" className="accent-pink" checked={selectedCrews.includes(c.id)} onChange={() => toggleCrew(c.id)} />
                {c.name}
              </label>
            ))}
          </div>
        </Field>
      )}

      <Field label="Rol (gol = toți)">
        <div className="flex gap-3 pt-1">
          {["LEGAL", "ILEGAL"].map((r) => (
            <label key={r} className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm hover:bg-white/5">
              <input type="checkbox" className="accent-pink" checked={roles.includes(r)} onChange={() => toggleRole(r)} />
              {r === "LEGAL" ? "Legal" : "Ilegal"}
            </label>
          ))}
        </div>
      </Field>

      {error && <p className="text-sm text-rose-400">{error}</p>}
      {ok && <p className="text-sm text-emerald">Task săptămânal publicat! Taskul anterior a fost închis automat.</p>}
      <div className="flex justify-end">
        <button type="submit" className="btn-primary" disabled={pending || !title.trim()}>
          {pending ? "Se publică…" : "Publică task"}
        </button>
      </div>
    </form>
  );
}

export function WeeklyTaskBossPanel({ task }: { task: ActiveTask }) {
  const [pending, startTransition] = useTransition();
  const [confirmAllResult, setConfirmAllResult] = useState<string | null>(null);

  const predate = task.submissions.filter((s) => s.status === "PREDAT");
  const confirmate = task.submissions.filter((s) => s.status === "CONFIRMAT");
  const respinse = task.submissions.filter((s) => s.status === "RESPINS");

  function confirmAll() {
    startTransition(async () => {
      const r = await confirmAllWeeklySubmissions(task.id);
      setConfirmAllResult(r.error ? r.error : `${r.confirmed} predări confirmate.`);
    });
  }

  function closeTask() {
    startTransition(async () => { await closeWeeklyTask(task.id); });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted" />
          <span className="text-sm text-muted">
            {task.submissions.length} predări — {confirmate.length} confirmate, {predate.length} în așteptare
          </span>
        </div>
        <div className="flex gap-2">
          {predate.length > 0 && (
            <button className="btn-primary text-xs" onClick={confirmAll} disabled={pending}>
              Confirmă toți ({predate.length})
            </button>
          )}
          <button className="btn-ghost text-xs" onClick={closeTask} disabled={pending}>
            Închide task
          </button>
        </div>
      </div>

      {confirmAllResult && <p className="text-sm text-emerald">{confirmAllResult}</p>}

      {task.submissions.length === 0 && (
        <p className="text-sm text-muted">Nicio predare încă.</p>
      )}

      {task.submissions.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-white/[.03]">
              <tr>
                <th className="th">Membru</th>
                <th className="th">Notă predare</th>
                <th className="th">Status</th>
                <th className="th">Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {task.submissions.map((s) => (
                <SubmissionRow key={s.id} sub={s} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SubmissionRow({ sub }: { sub: Submission }) {
  const [pending, startTransition] = useTransition();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");

  function confirm() {
    startTransition(async () => { await confirmWeeklySubmission(sub.id); });
  }
  function reject() {
    startTransition(async () => {
      await rejectWeeklySubmission(sub.id, reason);
      setRejectOpen(false);
    });
  }

  return (
    <>
      <tr className="border-t border-line hover:bg-white/[.02]">
        <td className="td">
          <span className="font-semibold">{sub.member.name}</span>
          <span className="ml-1.5 text-xs text-muted">{sub.member.memberCode}</span>
        </td>
        <td className="td text-muted">{sub.note || <span className="text-muted/40">—</span>}</td>
        <td className="td">
          {sub.status === "CONFIRMAT" && (
            <span className="inline-flex items-center gap-1 text-xs text-emerald"><CheckCircle2 className="h-3.5 w-3.5" /> Confirmat</span>
          )}
          {sub.status === "PREDAT" && (
            <span className="text-xs text-gold">Așteptare</span>
          )}
          {sub.status === "RESPINS" && (
            <span className="inline-flex items-center gap-1 text-xs text-rose-400"><XCircle className="h-3.5 w-3.5" /> Respins</span>
          )}
        </td>
        <td className="td">
          {sub.status === "PREDAT" && (
            <div className="flex gap-2">
              <button className="btn-ghost text-xs py-1 px-2" onClick={confirm} disabled={pending}>✓ Confirmă</button>
              <button className="btn-danger text-xs py-1 px-2" onClick={() => setRejectOpen((o) => !o)} disabled={pending}>✗ Respinge</button>
            </div>
          )}
          {sub.proofUrl && (
            <a href={sub.proofUrl.startsWith("data:") ? sub.proofUrl : sub.proofUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-violet hover:underline">dovadă</a>
          )}
        </td>
      </tr>
      {rejectOpen && (
        <tr className="border-t border-line bg-rose-500/5">
          <td colSpan={4} className="px-4 py-2">
            <div className="flex gap-2">
              <input className="input flex-1 py-1 text-sm" placeholder="Motiv (opțional)…" value={reason} onChange={(e) => setReason(e.target.value)} />
              <button className="btn-danger text-xs" onClick={reject} disabled={pending}>Confirmă respingere</button>
              <button className="btn-ghost text-xs" onClick={() => setRejectOpen(false)}>Anulează</button>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
