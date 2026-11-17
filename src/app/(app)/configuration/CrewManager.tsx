"use client";
import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { createCrew, disbandCrew } from "@/app/actions/crew";
import { Card, Field } from "@/components/ui";

type Crew = {
  id: string;
  name: string;
  capo: { id: string; name: string; memberCode: string };
  dept: { id: string; name: string } | null;
  _count: { members: number };
};
type Capo = { id: string; name: string; memberCode: string; rankName: string };
type Dept = { id: string; name: string };

export function CrewManager({
  crews,
  freeCapos,
  depts,
}: {
  crews: Crew[];
  freeCapos: Capo[];
  depts: Dept[];
}) {
  const [name, setName] = useState("");
  const [capoId, setCapoId] = useState(freeCapos[0]?.id ?? "");
  const [deptId, setDeptId] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!capoId) { setError("Selectează un capo."); return; }
    startTransition(async () => {
      const r = await createCrew(name, capoId, deptId || undefined);
      if (r.error) { setError(r.error); return; }
      setName("");
    });
  }

  function handleDisband(id: string, crewName: string) {
    if (!confirm(`Dizolvi echipa "${crewName}"? Membrii rămân în organizație dar nu vor mai face parte dintr-o echipă.`)) return;
    startTransition(async () => {
      const r = await disbandCrew(id);
      if (r.error) alert(r.error);
    });
  }

  return (
    <Card title="Echipe">
      {freeCapos.length > 0 ? (
        <form onSubmit={submitCreate} className="mb-4 grid gap-2 sm:grid-cols-4">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input sm:col-span-2"
            placeholder="Numele echipei"
            required
          />
          <select value={capoId} onChange={(e) => setCapoId(e.target.value)} className="input">
            <option value="">— Capo —</option>
            {freeCapos.map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({c.rankName})</option>
            ))}
          </select>
          <select value={deptId} onChange={(e) => setDeptId(e.target.value)} className="input">
            <option value="">— Dept. (opț.) —</option>
            {depts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <button type="submit" className="btn-primary gap-1.5 sm:col-span-4" disabled={pending}>
            <Plus className="h-4 w-4" /> Creează echipa
          </button>
        </form>
      ) : (
        <p className="mb-4 text-sm text-muted">Nu există Capo disponibil fără echipă.</p>
      )}
      {error && <p className="mb-3 text-sm text-rose-400">{error}</p>}

      {crews.length === 0 ? (
        <p className="text-sm text-muted">Nicio echipă creată.</p>
      ) : (
        <ul className="space-y-2">
          {crews.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/[.04] px-4 py-3">
              <div>
                <p className="font-semibold">{c.name}</p>
                <p className="text-xs text-muted">
                  Capo: {c.capo.name} · {c._count.members} membri
                  {c.dept && ` · Dept: ${c.dept.name}`}
                </p>
              </div>
              <button
                onClick={() => handleDisband(c.id, c.name)}
                className="btn-danger p-2"
                title="Dizolvă echipa"
                disabled={pending}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
