"use client";
import { useState, useTransition } from "react";
import { Plus, Check, X } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Field } from "@/components/ui";
import { submitChestTx, approveChestTx, initChest } from "@/app/actions/chest";
import type { ApprovalStatus, ChestTxType } from "@prisma/client";

type MemberOpt = { id: string; name: string };

const TX_TYPES: { value: ChestTxType; label: string }[] = [
  { value: "DEPUNERE", label: "Depunere" },
  { value: "RETRAGERE", label: "Retragere" },
  { value: "TRANSFER", label: "Transfer" },
  { value: "CORECTIE", label: "Corecție" },
];

export function SubmitTxBtn({ canTransfer, members }: { canTransfer: boolean; members: MemberOpt[] }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<ChestTxType>("DEPUNERE");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [targetId, setTargetId] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function close() { setOpen(false); setType("DEPUNERE"); setAmount(""); setNote(""); setTargetId(""); setError(""); }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const r = await submitChestTx({
        type,
        amount: Math.round(Number(amount) * 100),
        note,
        targetMemberId: type === "TRANSFER" ? targetId : undefined,
      });
      if (r.error) { setError(r.error); return; }
      close();
    });
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary gap-2">
        <Plus className="h-4 w-4" /> Tranzacție nouă
      </button>
      <Modal open={open} onClose={close} title="Tranzacție seif">
        <form onSubmit={submit} className="space-y-3">
          <Field label="Tip">
            <select className="input" value={type} onChange={(e) => setType(e.target.value as ChestTxType)}>
              {TX_TYPES.filter((t) => canTransfer || t.value !== "CORECTIE").map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Sumă ($)">
            <input type="number" min={0.01} step={0.01} className="input" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          </Field>
          {type === "TRANSFER" && (
            <Field label="Destinatar">
              <select className="input" value={targetId} onChange={(e) => setTargetId(e.target.value)} required>
                <option value="">— Selectează —</option>
                {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </Field>
          )}
          <Field label="Notă">
            <textarea rows={2} className="input" value={note} onChange={(e) => setNote(e.target.value)} required />
          </Field>
          {error && <p className="text-sm text-rose-400">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className="btn-ghost" onClick={close} disabled={pending}>Anulează</button>
            <button type="submit" className="btn-primary" disabled={pending}>{pending ? "..." : "Trimite"}</button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export function ApproveTxBtn({ txId }: { txId: string }) {
  const [pending, startTransition] = useTransition();

  function decide(status: ApprovalStatus) {
    startTransition(async () => { await approveChestTx(txId, status); });
  }

  return (
    <div className="flex gap-1">
      <button onClick={() => decide("APROBAT")} disabled={pending} className="btn-gold flex items-center gap-1 px-3 py-1.5 text-xs">
        <Check className="h-3 w-3" /> Aprobă
      </button>
      <button onClick={() => decide("RESPINS")} disabled={pending} className="btn-danger flex items-center gap-1 px-3 py-1.5 text-xs">
        <X className="h-3 w-3" /> Respinge
      </button>
    </div>
  );
}

export function InitChestBtn() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function init() {
    startTransition(async () => {
      const r = await initChest();
      if (r.error) setError(r.error);
    });
  }

  return (
    <div className="space-y-2">
      <button onClick={init} disabled={pending} className="btn-primary">{pending ? "..." : "Inițializează seiful"}</button>
      {error && <p className="text-sm text-rose-400">{error}</p>}
    </div>
  );
}
