"use client";
import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { createDepartment, updateDepartment, deleteDepartment } from "@/app/actions/department";
import { Card, Field } from "@/components/ui";

type Dept = { id: string; name: string; _count: { members: number; crews: number } };

export function DeptManager({ depts }: { depts: Dept[] }) {
  const [newName, setNewName] = useState("");
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const r = await createDepartment(newName);
      if (r.error) { setError(r.error); return; }
      setNewName("");
    });
  }

  function submitEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setError("");
    startTransition(async () => {
      const r = await updateDepartment(editing.id, editing.name);
      if (r.error) { setError(r.error); return; }
      setEditing(null);
    });
  }

  function handleDelete(id: string, name: string) {
    if (!confirm(`Ștergi departamentul "${name}"? Acțiunea nu poate fi anulată.`)) return;
    startTransition(async () => {
      const r = await deleteDepartment(id);
      if (r.error) alert(r.error);
    });
  }

  return (
    <Card title="Departamente">
      <form onSubmit={submitCreate} className="mb-4 flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="input flex-1"
          placeholder="Nume departament nou"
          required
        />
        <button type="submit" className="btn-primary gap-1.5" disabled={pending}>
          <Plus className="h-4 w-4" /> Adaugă
        </button>
      </form>
      {error && <p className="mb-3 text-sm text-rose-400">{error}</p>}

      {depts.length === 0 ? (
        <p className="text-sm text-muted">Niciun departament creat.</p>
      ) : (
        <ul className="space-y-2">
          {depts.map((d) =>
            editing?.id === d.id ? (
              <li key={d.id}>
                <form onSubmit={submitEdit} className="flex gap-2">
                  <input
                    value={editing.name}
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                    className="input flex-1"
                    required
                  />
                  <button type="submit" className="btn-primary" disabled={pending}>Salvează</button>
                  <button type="button" onClick={() => setEditing(null)} className="btn-ghost" disabled={pending}>Anulează</button>
                </form>
              </li>
            ) : (
              <li key={d.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/[.04] px-4 py-3">
                <div>
                  <p className="font-semibold">{d.name}</p>
                  <p className="text-xs text-muted">{d._count.members} membri · {d._count.crews} echipe</p>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => setEditing({ id: d.id, name: d.name })} className="btn-ghost p-2" title="Editează">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(d.id, d.name)}
                    className="btn-danger p-2"
                    title="Șterge"
                    disabled={d._count.members > 0 || pending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ),
          )}
        </ul>
      )}
    </Card>
  );
}
