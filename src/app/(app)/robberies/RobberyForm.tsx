"use client";
import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Field } from "@/components/ui";
import { createRobbery } from "@/app/actions/robberies";

type MemberOption = { id: string; name: string; memberCode: string };

const TYPES = ["Jaf la bijuterie", "Jaf la banca", "Jaf la magazin", "Jaf la depozit", "Altele"];

export function RobberyForm({ members }: { members: MemberOption[] }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState(TYPES[0]);
  const [customType, setCustomType] = useState("");
  const [description, setDescription] = useState("");
  const [reward, setReward] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function close() {
    setOpen(false);
    setType(TYPES[0]);
    setCustomType("");
    setDescription("");
    setReward(0);
    setSelected([]);
    setError("");
  }

  function toggleMember(id: string) {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const finalType = type === "Altele" ? customType : type;
    startTransition(async () => {
      const r = await createRobbery({
        type: finalType,
        description: description || undefined,
        reward,
        participantIds: selected,
      });
      if (r.error) { setError(r.error); return; }
      close();
    });
  }

  const perPerson = selected.length > 0 ? Math.floor(reward / selected.length) : reward;

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary gap-2">
        <Plus className="h-4 w-4" /> Raport jaf
      </button>

      <Modal open={open} onClose={close} title="Raport jaf nou">
        <form onSubmit={submit} className="space-y-4">
          <Field label="Tip jaf">
            <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
              {TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>
          {type === "Altele" && (
            <Field label="Specificați tipul">
              <input className="input" value={customType} onChange={(e) => setCustomType(e.target.value)} required />
            </Field>
          )}
          <Field label="Descriere (opțional)">
            <textarea rows={2} className="input" value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
          <Field label="Recompensă totală ($)">
            <input type="number" min={0} className="input" value={reward} onChange={(e) => setReward(Number(e.target.value))} />
          </Field>
          <Field label={`Participanți (${selected.length} selectați${selected.length > 0 ? ` · $${perPerson} fiecare` : ""})`}>
            <div className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-line p-2">
              {members.map((m) => (
                <label key={m.id} className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-white/5">
                  <input
                    type="checkbox"
                    checked={selected.includes(m.id)}
                    onChange={() => toggleMember(m.id)}
                    className="accent-pink-soft"
                  />
                  <span className="text-sm font-medium">{m.name}</span>
                  <span className="ml-auto font-mono text-xs text-muted">{m.memberCode}</span>
                </label>
              ))}
            </div>
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
