"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, ChevronUp, ChevronDown } from "lucide-react";
import { Card, Field } from "@/components/ui";
import { Modal } from "@/components/Modal";
import {
  createChestItemType,
  updateChestItemType,
  reorderChestItemType,
} from "@/app/actions/chestItems";

type ItemType = {
  id: string;
  slug: string;
  label: string;
  emoji: string;
  unit: string;
  isActive: boolean;
  sortOrder: number;
};

export function ChestItemTypeManager({ items }: { items: ItemType[] }) {
  const [pending, startTransition] = useTransition();
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [emoji, setEmoji] = useState("📦");
  const [unit, setUnit] = useState("buc.");
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState("");

  function openCreate() {
    setLabel(""); setEmoji("📦"); setUnit("buc."); setIsActive(true); setError("");
    setShowCreate(true);
  }

  function openEdit(item: ItemType) {
    setLabel(item.label); setEmoji(item.emoji); setUnit(item.unit); setIsActive(item.isActive); setError("");
    setEditId(item.id);
  }

  function close() { setShowCreate(false); setEditId(null); setError(""); }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const r = await createChestItemType({ label, emoji, unit });
      if (r.error) { setError(r.error); return; }
      close();
    });
  }

  function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editId) return;
    setError("");
    startTransition(async () => {
      const r = await updateChestItemType(editId, { label, emoji, unit, isActive });
      if (r.error) { setError(r.error); return; }
      close();
    });
  }

  function handleReorder(id: string, dir: "up" | "down") {
    startTransition(async () => { await reorderChestItemType(id, dir); });
  }

  return (
    <>
      <Card
        title="Tipuri articole seif"
        action={
          <button className="btn-primary gap-1.5 text-sm" onClick={openCreate}>
            <Plus className="h-3.5 w-3.5" /> Adaugă articol
          </button>
        }
        pad={false}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px]">
            <thead className="bg-white/[.03]">
              <tr>
                {["Ordine", "Emoji", "Etichetă", "Slug", "Unitate", "Activ", "Acțiuni"].map((h) => (
                  <th key={h} className="th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={item.id} className="border-t border-line">
                  <td className="td w-16">
                    <div className="flex gap-0.5">
                      <button disabled={i === 0 || pending} onClick={() => handleReorder(item.id, "up")} className="rounded p-0.5 text-muted hover:text-pink disabled:opacity-30"><ChevronUp className="h-4 w-4" /></button>
                      <button disabled={i === items.length - 1 || pending} onClick={() => handleReorder(item.id, "down")} className="rounded p-0.5 text-muted hover:text-pink disabled:opacity-30"><ChevronDown className="h-4 w-4" /></button>
                    </div>
                  </td>
                  <td className="td text-xl">{item.emoji}</td>
                  <td className="td font-semibold">{item.label}</td>
                  <td className="td font-mono text-xs text-muted">{item.slug}</td>
                  <td className="td text-muted">{item.unit}</td>
                  <td className="td">
                    <span className={`text-xs font-medium ${item.isActive ? "text-emerald" : "text-muted"}`}>
                      {item.isActive ? "Da" : "Nu"}
                    </span>
                  </td>
                  <td className="td">
                    <button onClick={() => openEdit(item)} className="rounded p-1.5 text-muted hover:text-pink" title="Editează">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={7} className="td text-center text-muted">Nicio categorie definită. Adaugă articolele de mai sus.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="px-5 pb-4 pt-2 text-xs text-muted">
          Slug-ul se generează automat la creare. Articolele inactive nu apar în formularul de tranzacție.
        </p>
      </Card>

      <Modal open={showCreate} onClose={close} title="Adaugă articol seif">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-[1fr_80px] gap-3">
            <Field label="Etichetă">
              <input className="input" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="ex. Cocaină" required />
            </Field>
            <Field label="Emoji">
              <input className="input" value={emoji} onChange={(e) => setEmoji(e.target.value)} placeholder="📦" />
            </Field>
          </div>
          <Field label="Unitate" hint="ex. buc., kg, doze, $">
            <input className="input" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="buc." />
          </Field>
          {error && <p className="text-sm text-rose-400">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className="btn-ghost" onClick={close} disabled={pending}>Anulează</button>
            <button type="submit" className="btn-primary" disabled={pending}>{pending ? "Se salvează..." : "Adaugă"}</button>
          </div>
        </form>
      </Modal>

      <Modal open={editId !== null} onClose={close} title="Editează articol seif">
        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="grid grid-cols-[1fr_80px] gap-3">
            <Field label="Etichetă">
              <input className="input" value={label} onChange={(e) => setLabel(e.target.value)} required />
            </Field>
            <Field label="Emoji">
              <input className="input" value={emoji} onChange={(e) => setEmoji(e.target.value)} />
            </Field>
          </div>
          <Field label="Unitate">
            <input className="input" value={unit} onChange={(e) => setUnit(e.target.value)} />
          </Field>
          <Field label="Stare">
            <label className="flex cursor-pointer items-center gap-2">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4 rounded" />
              <span className="text-sm">Activ (apare în formularul de tranzacție)</span>
            </label>
          </Field>
          {error && <p className="text-sm text-rose-400">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className="btn-ghost" onClick={close} disabled={pending}>Anulează</button>
            <button type="submit" className="btn-primary" disabled={pending}>{pending ? "Se salvează..." : "Salvează"}</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
