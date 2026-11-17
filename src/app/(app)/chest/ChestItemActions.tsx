"use client";

import { useState, useTransition } from "react";
import { Plus, Check, X } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Field } from "@/components/ui";
import { submitItemTx, approveItemTx } from "@/app/actions/chestItems";
import type { ChestItemTxType } from "@prisma/client";

type ItemType = { id: string; label: string; emoji: string; unit: string };

export function SubmitItemTxBtn({ itemTypes }: { itemTypes: ItemType[] }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<ChestItemTxType>("DEPUNERE");
  const [note, setNote] = useState("");
  const [qtys, setQtys] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function handleOpen() {
    setType("DEPUNERE"); setNote(""); setQtys({}); setError(""); setOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const lines = Object.entries(qtys)
      .map(([itemTypeId, q]) => ({ itemTypeId, quantity: Number(q) }))
      .filter((l) => l.quantity > 0);
    if (!lines.length) { setError("Introdu cantitatea pentru cel puțin un articol."); return; }
    startTransition(async () => {
      const r = await submitItemTx({ type, note, lines });
      if (r.error) { setError(r.error); return; }
      setOpen(false);
    });
  }

  return (
    <>
      <button className="btn-ghost gap-1.5 text-sm" onClick={handleOpen}>
        <Plus className="h-4 w-4" /> Tranzacție articole
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Tranzacție articole seif">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Tip tranzacție">
            <select className="input" value={type} onChange={(e) => setType(e.target.value as ChestItemTxType)}>
              <option value="DEPUNERE">Depunere</option>
              <option value="RETRAGERE">Retragere</option>
              <option value="CORECTIE">Corecție</option>
            </select>
          </Field>
          <Field label="Notă">
            <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="ex. Jaf reușit, misiune..." required />
          </Field>
          <div className="space-y-2">
            <p className="label">Articole</p>
            {itemTypes.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <span className="w-6 text-lg">{item.emoji}</span>
                <span className="flex-1 text-sm">{item.label}</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number" min={0} max={99999}
                    value={qtys[item.id] ?? ""}
                    onChange={(e) => setQtys((p) => ({ ...p, [item.id]: e.target.value }))}
                    className="input w-24 py-1 text-sm text-center"
                    placeholder="0"
                  />
                  <span className="text-xs text-muted">{item.unit}</span>
                </div>
              </div>
            ))}
          </div>
          {error && <p className="text-sm text-rose-400">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className="btn-ghost" onClick={() => setOpen(false)} disabled={pending}>Anulează</button>
            <button type="submit" className="btn-primary" disabled={pending}>{pending ? "Se trimite..." : "Trimite spre aprobare"}</button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export function ApproveItemTxBtn({ txId }: { txId: string }) {
  const [pending, startTransition] = useTransition();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectNote, setRejectNote] = useState("");

  function approve() {
    startTransition(async () => { await approveItemTx(txId, "APROBAT"); });
  }

  function reject(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await approveItemTx(txId, "RESPINS", rejectNote);
      setRejectOpen(false);
    });
  }

  return (
    <>
      <div className="flex gap-2">
        <button onClick={approve} disabled={pending} className="flex items-center gap-1 rounded-lg bg-emerald/20 px-3 py-1.5 text-xs font-medium text-emerald-soft hover:bg-emerald/30 disabled:opacity-50">
          <Check className="h-3 w-3" /> Aprobă
        </button>
        <button onClick={() => setRejectOpen(true)} disabled={pending} className="flex items-center gap-1 rounded-lg bg-rose-500/15 px-3 py-1.5 text-xs font-medium text-rose-400 hover:bg-rose-500/25 disabled:opacity-50">
          <X className="h-3 w-3" /> Respinge
        </button>
      </div>
      <Modal open={rejectOpen} onClose={() => setRejectOpen(false)} title="Respinge tranzacție articole">
        <form onSubmit={reject} className="space-y-4">
          <Field label="Motiv respingere">
            <input className="input" value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} placeholder="Motiv..." required />
          </Field>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className="btn-ghost" onClick={() => setRejectOpen(false)}>Anulează</button>
            <button type="submit" className="btn-danger" disabled={pending}>Respinge</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
