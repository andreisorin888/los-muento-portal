"use client";
import { useState, useTransition } from "react";
import { ShieldAlert, CheckCircle } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import { issueWarning, resolveWarning } from "@/app/actions/member";
import type { WarningSeverity } from "@prisma/client";

type WarningEntry = {
  id: string;
  severity: WarningSeverity;
  reason: string;
  notes: string | null;
  issuedById: string;
  resolvedAt: Date | null;
  createdAt: Date;
};

const SEV_LABEL: Record<WarningSeverity, string> = {
  MINOR: "Minor",
  MAJOR: "Major",
  FINAL: "Final",
};

export function WarningsSection({
  warnings,
  actorId,
  canWarn,
  memberId,
}: {
  warnings: WarningEntry[];
  actorId: string;
  canWarn: boolean;
  memberId: string;
}) {
  const [showForm, setShowForm] = useState(false);
  const [severity, setSeverity] = useState<WarningSeverity>("MINOR");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function submitWarning(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const r = await issueWarning(memberId, severity, reason, notes || undefined);
      if (r.error) { setError(r.error); return; }
      setShowForm(false);
      setReason("");
      setNotes("");
    });
  }

  function handleResolve(warningId: string) {
    const note = prompt("Notă rezolvare (opțional):");
    if (note === null) return;
    startTransition(async () => {
      await resolveWarning(warningId, note);
    });
  }

  const active = warnings.filter((w) => !w.resolvedAt);
  const resolved = warnings.filter((w) => w.resolvedAt);

  return (
    <Card
      title={`Avertismente (${active.length} active)`}
      action={
        canWarn && !showForm ? (
          <button onClick={() => setShowForm(true)} className="btn-ghost text-sm gap-1.5">
            <ShieldAlert className="h-4 w-4" /> Emite avertisment
          </button>
        ) : undefined
      }
    >
      {showForm && (
        <form onSubmit={submitWarning} className="mb-5 space-y-3 rounded-xl bg-white/[.04] p-4">
          <label className="block">
            <span className="label">Severitate</span>
            <select value={severity} onChange={(e) => setSeverity(e.target.value as WarningSeverity)} className="input">
              <option value="MINOR">Minor</option>
              <option value="MAJOR">Major</option>
              <option value="FINAL">Final</option>
            </select>
          </label>
          <label className="block">
            <span className="label">Motiv</span>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="input min-h-[72px]"
              required
            />
          </label>
          <label className="block">
            <span className="label">Note suplimentare (opțional)</span>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} className="input" />
          </label>
          {error && <p className="text-sm text-rose-400">{error}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="btn-ghost flex-1" disabled={pending}>Anulează</button>
            <button type="submit" className="btn-primary flex-1" disabled={pending}>
              {pending ? "Se salvează..." : "Emite"}
            </button>
          </div>
        </form>
      )}

      {warnings.length === 0 ? (
        <p className="text-sm text-muted">Niciun avertisment.</p>
      ) : (
        <div className="space-y-3">
          {[...active, ...resolved].map((w) => (
            <div
              key={w.id}
              className={`rounded-xl p-4 ${w.resolvedAt ? "bg-white/[.02] opacity-60" : "bg-rose-500/10"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge tone={w.severity === "FINAL" ? "rose" : w.severity === "MAJOR" ? "orange" : "neutral"}>
                      {SEV_LABEL[w.severity]}
                    </Badge>
                    <span className="text-xs text-muted">{new Date(w.createdAt).toLocaleDateString("ro-RO")}</span>
                  </div>
                  <p className="mt-1 text-sm">{w.reason}</p>
                  {w.notes && <p className="mt-0.5 text-xs text-muted">{w.notes}</p>}
                  {w.resolvedAt && (
                    <p className="mt-1 text-xs text-emerald-400">
                      Rezolvat la {new Date(w.resolvedAt).toLocaleDateString("ro-RO")}
                    </p>
                  )}
                </div>
                {canWarn && !w.resolvedAt && (
                  <button
                    onClick={() => handleResolve(w.id)}
                    className="shrink-0 rounded-lg p-1.5 text-muted hover:bg-white/10 hover:text-emerald-400"
                    title="Marchează ca rezolvat"
                    disabled={pending}
                  >
                    <CheckCircle className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
