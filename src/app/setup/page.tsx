import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { Check, Clock } from "lucide-react";
import { SceneBackdrop } from "@/components/SceneBackdrop";
import { SkullEmblem } from "@/components/SkullEmblem";
import { getAssetUrl } from "@/config/assets";
import { authOptions } from "@/lib/auth";
import { memberCount } from "@/lib/members";
import { SetupForm } from "./SetupForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Configurare inițială" };

export default async function SetupPage() {
  const session = await getServerSession(authOptions);
  const count = await memberCount().catch(() => null);

  // DB not configured
  if (count === null) {
    return (
      <main className="relative grid min-h-screen place-items-center px-4 py-10">
        <SceneBackdrop slot="pendingBg" strength="heavy" />
        <div className="w-full max-w-lg rounded-2xl border border-rose-500/30 bg-ink/80 p-7 backdrop-blur-md">
          <SkullEmblem src={getAssetUrl("logoEmblem")} className="h-14 w-14" />
          <h1 className="mt-4 font-display text-3xl font-extrabold text-rose-300">Baza de date nu este configurată</h1>
          <p className="mt-2 text-sm text-muted">
            Adaugă <code className="rounded bg-white/10 px-1">DATABASE_URL</code> în fișierul{" "}
            <code className="rounded bg-white/10 px-1">.env.local</code> și repornește serverul.
          </p>
        </div>
      </main>
    );
  }

  // Not logged in and no members → show login prompt
  if (!session) redirect("/login");

  // First user: create Boss profile
  if (count === 0) {
    return (
      <main className="relative grid min-h-screen place-items-center px-4 py-10">
        <SceneBackdrop slot="pendingBg" strength="heavy" />
        <div className="w-full max-w-lg">
          <div className="rounded-2xl border border-gold/25 bg-ink/80 p-7 shadow-gold backdrop-blur-md">
            <SkullEmblem src={getAssetUrl("logoEmblem")} className="h-14 w-14" />
            <h1 className="mt-4 font-display text-4xl font-extrabold">Bine ai venit, Boss</h1>
            <p className="mt-2 text-sm text-muted">
              Acesta este primul cont creat pe portal. Completează profilul tău ca Boss al organizației LOS MUENTO.
            </p>
            <SetupForm userId={session.user.id} discordName={session.user.name ?? ""} />
          </div>
        </div>
      </main>
    );
  }

  // Members exist but this user has no member record → waiting for approval
  const discordName = session.user.name ?? session.user.email ?? "utilizatorul tău";
  const steps = [
    { t: "Cont Discord verificat", d: `Autentificat ca ${discordName}`, done: true },
    { t: "În așteptarea verificării", d: "Un Boss sau Underboss îți va aproba contul și îți va atribui un grad.", done: false },
  ];

  return (
    <main className="relative grid min-h-screen place-items-center px-4 py-10">
      <SceneBackdrop slot="pendingBg" strength="heavy" />
      <div className="w-full max-w-lg rounded-2xl border border-gold/25 bg-ink/75 p-7 shadow-gold backdrop-blur-md">
        <SkullEmblem src={getAssetUrl("logoEmblem")} className="h-14 w-14" />
        <h1 className="mt-4 font-display text-4xl font-extrabold">Cererea ta este în curs de verificare</h1>
        <p className="mt-2 text-sm text-muted">
          Nu poți deschide portalul până când conducerea îți aprobă contul. Vei primi un mesaj pe Discord când se ia o decizie.
        </p>
        <ol className="mt-6 space-y-4">
          {steps.map((s, i) => (
            <li key={i} className="flex gap-3">
              <span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full ${s.done ? "bg-emerald text-ink" : "bg-gold/20 text-gold ring-1 ring-gold/50"}`}>
                {s.done ? <Check className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
              </span>
              <div><p className="text-sm font-semibold">{s.t}</p><p className="text-sm text-muted">{s.d}</p></div>
            </li>
          ))}
        </ol>
        <a href="/api/auth/signout" className="btn-ghost mt-7 w-full text-center block">
          Deconectare
        </a>
      </div>
    </main>
  );
}
