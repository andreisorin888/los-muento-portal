"use client";
import { useState, useTransition } from "react";
import { UserPlus } from "lucide-react";
import { addRecruit } from "@/app/actions/recruit";
import { Field } from "@/components/ui";

export function AddRecruitForm({ actorId }: { actorId: string }) {
  const [open, setOpen] = useState(false);
  const [discord, setDiscord] = useState("");
  const [discordId, setDiscordId] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const r = await addRecruit(discord, discordId || undefined, notes || undefined);
      if (r.error) { setError(r.error); return; }
      setOpen(false);
      setDiscord("");
      setDiscordId("");
      setNotes("");
    });
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-primary gap-2">
        <UserPlus className="h-4 w-4" /> Adaugă recrut
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/70 p-4 sm:items-center" onClick={() => setOpen(false)}>
      <div className="w-full max-w-md rounded-2xl border border-line bg-charcoal p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="h-card mb-4">Adaugă recrut nou</h2>
        <form onSubmit={submit} className="space-y-3">
          <Field label="Nume Discord" hint="Exact cum apare în Discord.">
            <input value={discord} onChange={(e) => setDiscord(e.target.value)} className="input" required />
          </Field>
          <Field label="ID Discord (opțional)">
            <input value={discordId} onChange={(e) => setDiscordId(e.target.value)} className="input" placeholder="ex. 123456789012345678" />
          </Field>
          <Field label="Note (opțional)">
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="input min-h-[72px]" />
          </Field>
          {error && <p className="text-sm text-rose-400">{error}</p>}
          <div className="flex gap-3">
            <button type="button" onClick={() => setOpen(false)} className="btn-ghost flex-1" disabled={pending}>Anulează</button>
            <button type="submit" className="btn-primary flex-1" disabled={pending}>
              {pending ? "Se salvează..." : "Adaugă"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
