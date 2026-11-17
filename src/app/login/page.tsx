import Link from "next/link";
import type { Metadata } from "next";
import { SceneBackdrop } from "@/components/SceneBackdrop";
import { SkullEmblem } from "@/components/SkullEmblem";
import { getAssetUrl } from "@/config/assets";
import { site } from "@/config/site";
import { DiscordLoginButton } from "./DiscordLoginButton";

export const metadata: Metadata = { title: "Autentificare" };

export default function LoginPage() {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden px-4 py-10">
      <SceneBackdrop slot="loginBg" />
      <div className="w-full max-w-md text-center">
        <div className="rise-1 mx-auto w-fit drop-shadow-[0_0_30px_rgba(217,169,60,.35)]">
          <SkullEmblem src={getAssetUrl("logoEmblem")} className="mx-auto h-28 w-28 sm:h-32 sm:w-32" />
        </div>
        <h1 className="rise-2 mt-5 font-display text-6xl font-black tracking-[.08em] sm:text-7xl">{site.name}</h1>
        <p className="rise-2 mt-1 font-display text-xl font-bold tracking-[.22em] text-gold sm:text-2xl">{site.slogan}</p>

        <div className="rise-3 mt-9 rounded-2xl border border-gold/25 bg-ink/65 p-6 text-left shadow-gold backdrop-blur-md">
          <h2 className="text-lg font-bold">Autentifică-te în portal</h2>
          <p className="mt-1 text-sm text-muted">
            Folosește contul Discord legat de personajul tău. Ești nou? Vei completa datele personajului, iar cererea ta este verificată de Boss sau Underboss.
          </p>
          <DiscordLoginButton />
          {site.showDemo && (
            <p className="mt-4 rounded-lg border border-gold/25 bg-gold/10 px-3 py-2 text-xs text-gold-soft">
              Mod demo activ. Autentificarea Discord necesită credențiale reale în <code>.env.local</code>.{" "}
              <Link href="/dashboard" className="font-semibold underline">Deschide panoul demo</Link>
            </p>
          )}
        </div>
        <p className="mt-6 text-xs text-white/50">Doar pentru membri. Accesul este verificat de conducere.</p>
      </div>
    </main>
  );
}
