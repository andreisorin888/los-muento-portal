"use client";
import { useState, useTransition } from "react";
import { advanceToProbation, approveRecruit, rejectRecruit } from "@/app/actions/recruit";
import { RANKS } from "@/config/nav";
import { Field } from "@/components/ui";

type RecruitStatus = "CANDIDAT" | "PROBATIE" | "APROBAT" | "RESPINS";

export function RecruitActions({
  recruitId,
  status,
  recruiterId,
  canApprove,
  actorId,
  actorLevel,
}: {
  recruitId: string;
  status: RecruitStatus;
  recruiterId: string;
  canApprove: boolean;
  actorId: string;
  actorLevel: number;
}) {
  const [modal, setModal] = useState<"approve" | "reject" | null>(null);
  const [memberName, setMemberName] = useState("");
  const [rankName, setRankName] = useState("Associate");
  const [rejectNote, setRejectNote] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const isMyRecruit = actorId === recruiterId;
  const availableRanks = RANKS.filter((r) => r.level < actorLevel);

  function handleProbation() {
    startTransition(async () => {
      await advanceToProbation(recruitId);
    });
  }

  function submitApprove(e: React.FormEvent) {
    e.preventDefault();
    const rank = RANKS.find((r) => r.name === rankName);
    if (!rank) return;
    startTransition(async () => {
      const r = await approveRecruit(recruitId, memberName, rankName, rank.level);
      if (r.error) { setError(r.error); return; }
      setModal(null);
    });
  }

  function submitReject(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const r = await rejectRecruit(recruitId, rejectNote);
      if (r.error) { setError(r.error); return; }
      setModal(null);
    });
  }

  return (
    <>
      <div className="flex gap-1.5">
        {status === "CANDIDAT" && (isMyRecruit || canApprove) && (
          <button onClick={handleProbation} className="btn-ghost py-1 text-xs" disabled={pending}>
            → Probă
          </button>
        )}
        {canApprove && (status === "CANDIDAT" || status === "PROBATIE") && (
          <>
            <button onClick={() => setModal("approve")} className="btn-primary py-1 text-xs" disabled={pending}>
              Aprobă
            </button>
            <button onClick={() => setModal("reject")} className="btn-danger py-1 text-xs" disabled={pending}>
              Respinge
            </button>
          </>
        )}
      </div>

      {modal === "approve" && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/70 p-4 sm:items-center" onClick={() => setModal(null)}>
          <div className="w-full max-w-md rounded-2xl border border-line bg-charcoal p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="h-card mb-4">Aprobă recrut ca membru</h2>
            <form onSubmit={submitApprove} className="space-y-3">
              <Field label="Numele personajului (în joc)">
                <input value={memberName} onChange={(e) => setMemberName(e.target.value)} className="input" required />
              </Field>
              <Field label="Gradul inițial">
                <select value={rankName} onChange={(e) => setRankName(e.target.value)} className="input">
                  {availableRanks.map((r) => <option key={r.name} value={r.name}>{r.name}</option>)}
                </select>
              </Field>
              {error && <p className="text-sm text-rose-400">{error}</p>}
              <div className="flex gap-3">
                <button type="button" onClick={() => setModal(null)} className="btn-ghost flex-1">Anulează</button>
                <button type="submit" className="btn-primary flex-1" disabled={pending}>
                  {pending ? "Se procesează..." : "Creează cont de membru"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modal === "reject" && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/70 p-4 sm:items-center" onClick={() => setModal(null)}>
          <div className="w-full max-w-md rounded-2xl border border-line bg-charcoal p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="h-card mb-4">Respinge recrut</h2>
            <form onSubmit={submitReject} className="space-y-3">
              <Field label="Motiv respingere">
                <textarea value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} className="input min-h-[80px]" required />
              </Field>
              {error && <p className="text-sm text-rose-400">{error}</p>}
              <div className="flex gap-3">
                <button type="button" onClick={() => setModal(null)} className="btn-ghost flex-1">Anulează</button>
                <button type="submit" className="btn-danger flex-1" disabled={pending}>
                  {pending ? "Se procesează..." : "Respinge"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
