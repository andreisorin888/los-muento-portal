"use client";
import { useState } from "react";
import { ClipboardPlus, Package, Siren, ListPlus } from "lucide-react";
import { useToast } from "./Toast";
import { Field } from "./ui";
import { Modal } from "./Modal";

const actions = [
  { key: "activity", label: "Trimite activitate", icon: ClipboardPlus, phase: 4 },
  { key: "chest", label: "Tranzacție seif", icon: Package, phase: 4 },
  { key: "robbery", label: "Raportează jaf", icon: Siren, phase: 4 },
  { key: "task", label: "Task nou", icon: ListPlus, phase: 4 },
] as const;

type Props = {
  banner: string | null;
  name: string;
  rank: string;
  dept: string;
};

export function Welcome({ banner, name, rank, dept }: Props) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const firstName = name.split(" ")[0];

  return (
    <section className="panel relative overflow-hidden p-6 sm:p-8">
      {banner ? (
        <div className="absolute inset-0 bg-cover bg-center opacity-40" style={{ backgroundImage: `url(${banner})` }} />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(600px_220px_at_90%_0%,rgba(255,46,147,.28),transparent),radial-gradient(500px_240px_at_60%_120%,rgba(139,61,255,.3),transparent),linear-gradient(90deg,rgba(18,184,134,.1),transparent_40%)]" />
      )}
      <div className="relative">
        <p className="text-sm text-gold-soft">{rank}{dept ? `, ${dept}` : ""}</p>
        <h1 className="h-page mt-1">Bine ai revenit, {firstName}</h1>
        <p className="mt-2 max-w-xl text-sm text-white/70">Bine ai venit în portalul organizației.</p>
        <div className="mt-5 flex flex-wrap gap-2.5">
          {actions.map((a, i) => (
            <button key={a.key} className={i === 0 ? "btn-primary" : "btn-ghost"} onClick={() => (a.key === "activity" ? setOpen(true) : toast(`${a.label} va funcționa începând cu Faza ${a.phase}.`))}>
              <a.icon className="h-4 w-4" />{a.label}
            </button>
          ))}
        </div>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Trimite activitate">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setOpen(false); toast("Redirecționare spre Activitățile mele..."); }}>
          <Field label="Categorie">
            <select className="input">{["Ore lucrate", "Ședință organizație", "Operațiune teritoriu", "Instruire", "Escortă"].map((c) => <option key={c}>{c}</option>)}</select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Data"><input type="date" className="input" /></Field>
            <Field label="Durată (ore)"><input type="number" min="0" step="0.25" className="input" placeholder="2" /></Field>
          </div>
          <Field label="Descriere"><textarea rows={3} className="input" placeholder="Ce ai făcut?" /></Field>
          <Field label="Link dovadă" hint="Capturile de ecran se vor putea încărca după conectarea stocării de fișiere."><input type="url" className="input" placeholder="https://" /></Field>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Anulează</button>
            <button type="submit" className="btn-primary">Trimite spre verificare</button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
