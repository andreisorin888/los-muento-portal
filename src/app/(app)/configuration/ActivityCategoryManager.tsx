"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, Check, X } from "lucide-react";
import { Card, Field } from "@/components/ui";
import { Modal } from "@/components/Modal";
import {
  createActivityCategory,
  updateActivityCategory,
  deleteActivityCategory,
  reorderActivityCategory,
} from "@/app/actions/activityCategories";

type Category = {
  id: string;
  slug: string;
  label: string;
  points: number;
  isActive: boolean;
  sortOrder: number;
  _count: { activities: number };
};

export function ActivityCategoryManager({ categories }: { categories: Category[] }) {
  const [pending, startTransition] = useTransition();
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [points, setPoints] = useState(1);
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState("");

  function openCreate() {
    setLabel("");
    setPoints(1);
    setIsActive(true);
    setError("");
    setShowCreate(true);
  }

  function openEdit(c: Category) {
    setLabel(c.label);
    setPoints(c.points);
    setIsActive(c.isActive);
    setError("");
    setEditId(c.id);
  }

  function closeModals() {
    setShowCreate(false);
    setEditId(null);
    setError("");
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const r = await createActivityCategory({ label, points });
      if (r.error) { setError(r.error); return; }
      closeModals();
    });
  }

  function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editId) return;
    setError("");
    startTransition(async () => {
      const r = await updateActivityCategory(editId, { label, points, isActive });
      if (r.error) { setError(r.error); return; }
      closeModals();
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Ștergi definitiv această categorie?")) return;
    startTransition(async () => {
      const r = await deleteActivityCategory(id);
      if (r.error) alert(r.error);
    });
  }

  function handleReorder(id: string, dir: "up" | "down") {
    startTransition(async () => {
      await reorderActivityCategory(id, dir);
    });
  }

  return (
    <>
      <Card
        title="Tipuri de activitate"
        action={
          <button className="btn-primary gap-1.5 text-sm" onClick={openCreate}>
            <Plus className="h-3.5 w-3.5" /> Adaugă tip
          </button>
        }
        pad={false}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px]">
            <thead className="bg-white/[.03]">
              <tr>
                {["Ordine", "Etichetă", "Slug", "Puncte", "Activități", "Activ", "Acțiuni"].map((h) => (
                  <th key={h} className="th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.map((c, i) => (
                <tr key={c.id} className="border-t border-line">
                  <td className="td w-16">
                    <div className="flex gap-0.5">
                      <button
                        disabled={i === 0 || pending}
                        onClick={() => handleReorder(c.id, "up")}
                        className="rounded p-0.5 text-muted hover:text-pink disabled:opacity-30"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                      <button
                        disabled={i === categories.length - 1 || pending}
                        onClick={() => handleReorder(c.id, "down")}
                        className="rounded p-0.5 text-muted hover:text-pink disabled:opacity-30"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                  <td className="td font-semibold">{c.label}</td>
                  <td className="td font-mono text-xs text-muted">{c.slug}</td>
                  <td className="td">
                    <span className="font-display font-bold text-gold">+{c.points}</span>
                  </td>
                  <td className="td text-muted">{c._count.activities}</td>
                  <td className="td">
                    {c.isActive
                      ? <Check className="h-4 w-4 text-emerald" />
                      : <X className="h-4 w-4 text-muted" />}
                  </td>
                  <td className="td">
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEdit(c)}
                        className="rounded p-1.5 text-muted hover:text-pink"
                        title="Editează"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        disabled={c._count.activities > 0 || pending}
                        className="rounded p-1.5 text-muted hover:text-rose-400 disabled:opacity-30"
                        title={c._count.activities > 0 ? "Are activități — nu poate fi șters" : "Șterge"}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td colSpan={7} className="td text-center text-muted">Nicio categorie definită.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="px-5 pb-4 pt-2 text-xs text-muted">
          Slug-ul se generează automat din etichetă și nu poate fi schimbat ulterior. Categoriile cu activități existente nu pot fi șterse.
        </p>
      </Card>

      {/* Create modal */}
      <Modal open={showCreate} onClose={closeModals} title="Adaugă tip de activitate">
        <form onSubmit={handleCreate} className="space-y-4">
          <Field label="Etichetă" hint="ex. Patrulare, Eveniment special">
            <input
              className="input"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Numele tipului de activitate"
              required
            />
          </Field>
          <Field label="Puncte acordate">
            <input
              type="number"
              min={0}
              max={100}
              className="input"
              value={points}
              onChange={(e) => setPoints(Number(e.target.value))}
              required
            />
          </Field>
          {label.trim() && (
            <p className="text-xs text-muted">
              Slug generat: <span className="font-mono text-pink-soft">{
                label.trim().toUpperCase()
                  .normalize("NFD").replace(/[̀-ͯ]/g, "")
                  .replace(/[^A-Z0-9]+/g, "_").replace(/(^_|_$)/g, "")
              }</span>
            </p>
          )}
          {error && <p className="text-sm text-rose-400">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className="btn-ghost" onClick={closeModals} disabled={pending}>Anulează</button>
            <button type="submit" className="btn-primary" disabled={pending}>
              {pending ? "Se salvează..." : "Adaugă"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit modal */}
      <Modal open={editId !== null} onClose={closeModals} title="Editează tip de activitate">
        <form onSubmit={handleUpdate} className="space-y-4">
          <Field label="Etichetă">
            <input
              className="input"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              required
            />
          </Field>
          <Field label="Puncte acordate">
            <input
              type="number"
              min={0}
              max={100}
              className="input"
              value={points}
              onChange={(e) => setPoints(Number(e.target.value))}
              required
            />
          </Field>
          <Field label="Stare">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded"
              />
              <span className="text-sm">Activ (apare în formularul de activitate)</span>
            </label>
          </Field>
          {error && <p className="text-sm text-rose-400">{error}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className="btn-ghost" onClick={closeModals} disabled={pending}>Anulează</button>
            <button type="submit" className="btn-primary" disabled={pending}>
              {pending ? "Se salvează..." : "Salvează"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
