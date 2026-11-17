"use client";
import { useState, useTransition } from "react";
import { Plus, Check, X } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Field } from "@/components/ui";
import { submitFinanceRecord, approveFinanceRecord, createCategory } from "@/app/actions/finances";
import type { ApprovalStatus, FinanceCategoryType, FinanceTxType } from "@prisma/client";

type CategoryOpt = { id: string; name: string; type: FinanceCategoryType };

const TX_TYPES: { value: FinanceTxType; label: string }[] = [
  { value: "VENIT", label: "Venit" },
  { value: "CHELTUIALA", label: "Cheltuială" },
  { value: "TRANSFER", label: "Transfer" },
  { value: "AJUSTARE", label: "Ajustare" },
];

export function AddRecordBtn({ categories }: { categories: CategoryOpt[] }) {
  const [open, setOpen] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [type, setType] = useState<FinanceTxType>("VENIT");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function close() { setOpen(false); setCategoryId(""); setType("VENIT"); setAmount(""); setNote(""); setDate(""); setError(""); }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const r = await submitFinanceRecord({
        categoryId,
        type,
        amount: Math.round(Number(amount) * 100),
        note,
        date: date || undefined,
      });
      if (r.error) { setError(r.error); return; }
      close();
    });
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary gap-2">
        <Plus className="h-4 w-4" /> Înregistrare nouă
      </button>
      <Modal open={open} onClose={close} title="Înregistrare financiară">
        <form onSubmit={submit} className="space-y-3">
          <Field label="Categorie">
            <select className="input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
              <option value="">— Selectează —</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Tip tranzacție">
            <select className="input" value={type} onChange={(e) => setType(e.target.value as FinanceTxType)}>
              {TX_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Sumă ($)">
              <input type="number" min={0.01} step={0.01} className="input" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </Field>
            <Field label="Data (opțional)">
              <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
          </div>
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

export function ApproveRecordBtn({ recordId }: { recordId: string }) {
  const [pending, startTransition] = useTransition();

  function decide(status: ApprovalStatus) {
    startTransition(async () => { await approveFinanceRecord(recordId, status); });
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

export function AddCategoryBtn() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<FinanceCategoryType>("VENIT");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function close() { setOpen(false); setName(""); setType("VENIT"); setError(""); }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const r = await createCategory({ name, type });
      if (r.error) { setError(r.error); return; }
      close();
    });
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-ghost gap-2 text-sm">
        <Plus className="h-4 w-4" /> Categorie nouă
      </button>
      <Modal open={open} onClose={close} title="Categorie financiară nouă">
        <form onSubmit={submit} className="space-y-3">
          <Field label="Nume">
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <Field label="Tip">
            <select className="input" value={type} onChange={(e) => setType(e.target.value as FinanceCategoryType)}>
              <option value="VENIT">Venit</option>
              <option value="CHELTUIALA">Cheltuială</option>
            </select>
          </Field>
          {error && <p className="text-sm text-rose-400">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className="btn-ghost" onClick={close} disabled={pending}>Anulează</button>
            <button type="submit" className="btn-primary" disabled={pending}>{pending ? "..." : "Adaugă"}</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
