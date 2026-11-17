"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Field } from "@/components/ui";

async function createBoss(userId: string, name: string, discordName: string): Promise<{ error?: string }> {
  const res = await fetch("/api/setup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, name, discordName }),
  });
  return res.json();
}

export function SetupForm({ userId, discordName }: { userId: string; discordName: string }) {
  const [name, setName] = useState("");
  const [dname, setDname] = useState(discordName);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const { update } = useSession();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) { setError("Numele personajului este obligatoriu."); return; }
    startTransition(async () => {
      const result = await createBoss(userId, name.trim(), dname.trim() || discordName);
      if (result.error) { setError(result.error); return; }
      await update(); // refresh JWT token so memberId is populated
      router.push("/dashboard");
    });
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      <Field label="Numele personajului (în joc)">
        <input
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="ex. Dante Reyes"
          required
        />
      </Field>
      <Field label="Numele pe Discord" hint="Se completează automat din contul tău Discord.">
        <input
          className="input"
          value={dname}
          onChange={(e) => setDname(e.target.value)}
          placeholder="ex. dante.reyes"
        />
      </Field>
      {error && <p className="text-sm text-rose-400">{error}</p>}
      <button type="submit" className="btn-gold w-full" disabled={pending}>
        {pending ? "Se configurează..." : "Configurează profilul Boss"}
      </button>
    </form>
  );
}
