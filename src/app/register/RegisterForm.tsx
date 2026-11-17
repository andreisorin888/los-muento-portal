"use client";

import { useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { registerMember } from "@/app/actions/register";
import { Field } from "@/components/ui";

type Member = { id: string; name: string; rankName: string };

export default function RegisterForm({ members }: { members: Member[] }) {
  const { update } = useSession();
  const router = useRouter();
  const [name, setName] = useState("");
  const [recruiterId, setRecruiterId] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await registerMember({ name, recruiterId });
      if (result.error) {
        setError(result.error);
        return;
      }
      await update();
      router.push("/dashboard");
    });
  }

  return (
    <div className="panel p-6">
      <h2 className="mb-1 text-lg font-semibold">Bine ai venit!</h2>
      <p className="mb-6 text-sm text-muted">
        Vei primi gradul de <span className="text-gold font-medium">Vizitator</span> până când
        conducerea îți va aproba cererea din panoul de recrutare.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Nume în joc (roleplay)">
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ex. Marco Romano"
            required
            minLength={2}
            maxLength={60}
          />
        </Field>
        <Field label="Cine te-a recrutat?">
          {members.length === 0 ? (
            <p className="text-sm text-muted">Niciun membru activ găsit. Contactează conducerea.</p>
          ) : (
            <select
              className="input"
              value={recruiterId}
              onChange={(e) => setRecruiterId(e.target.value)}
              required
            >
              <option value="">— Selectează recrutorul —</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} · {m.rankName}
                </option>
              ))}
            </select>
          )}
        </Field>
        {error && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-400">{error}</p>}
        <button
          type="submit"
          className="btn-gold w-full"
          disabled={pending || members.length === 0}
        >
          {pending ? "Se procesează..." : "Alătură-te familiei"}
        </button>
      </form>
    </div>
  );
}
