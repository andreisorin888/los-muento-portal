import Link from "next/link";
import type { Metadata } from "next";
import { Check, Clock } from "lucide-react";
import { SceneBackdrop } from "@/components/SceneBackdrop";
import { SkullEmblem } from "@/components/SkullEmblem";
import { getAssetUrl } from "@/config/assets";

export const metadata: Metadata = { title: "Acces în așteptare" };

const steps = [
  { t: "Cont Discord verificat", d: "Autentificat ca luis.ortega", done: true },
  { t: "Datele personajului au fost trimise", d: "Luis Ortega, grad solicitat: Associate", done: true },
  { t: "În așteptarea verificării", d: "Un Boss sau Underboss îți va aproba sau respinge cererea.", done: false },
];

export default function PendingPage() {
  return (
    <main className="relative grid min-h-screen place-items-center px-4 py-10">
      <SceneBackdrop slot="pendingBg" strength="heavy" />
      <div className="w-full max-w-lg rounded-2xl border border-gold/25 bg-ink/75 p-7 shadow-gold backdrop-blur-md">
        <SkullEmblem src={getAssetUrl("logoEmblem")} className="h-14 w-14" />
        <h1 className="mt-4 font-display text-4xl font-extrabold">Cererea ta este în curs de verificare</h1>
        <p className="mt-2 text-sm text-muted">Nu poți deschide portalul până când conducerea îți aprobă contul. Vei primi un mesaj pe Discord când se ia o decizie.</p>
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
        <Link href="/login" className="btn-ghost mt-7 w-full">Înapoi la autentificare</Link>
      </div>
    </main>
  );
}
