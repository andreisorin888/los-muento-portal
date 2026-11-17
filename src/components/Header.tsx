"use client";
import { useState } from "react";
import { Bell, Menu, Search } from "lucide-react";
import { notifications } from "@/lib/demo-data";
import { useToast } from "./Toast";
import { cn } from "@/lib/utils";

export function Header({ onMenu, showDemo }: { onMenu: () => void; showDemo: boolean }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(notifications);
  const toast = useToast();
  const unread = items.filter((i) => i.unread).length;

  return (
    <header className="sticky top-0 z-30 flex h-[72px] items-center gap-3 border-b border-line bg-ink/80 px-4 backdrop-blur-md sm:px-6">
      <button onClick={onMenu} className="rounded-lg p-2 text-white/80 hover:bg-white/10 lg:hidden" aria-label="Deschide meniul"><Menu className="h-5 w-5" /></button>
      <form
        className="relative max-w-xl flex-1"
        onSubmit={(e) => { e.preventDefault(); toast("Căutarea globală apare în Faza 5. Va returna doar înregistrările pe care ai voie să le vezi."); }}
        role="search"
      >
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input className="input pl-10" placeholder="Caută membri, sarcini, rapoarte" aria-label="Căutare globală" />
      </form>
      {showDemo && <span className="hidden rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs font-semibold text-gold-soft md:inline">Date demo</span>}
      <div className="relative ml-auto">
        <button onClick={() => setOpen((o) => !o)} className="relative rounded-lg p-2.5 text-white/80 hover:bg-white/10" aria-label={`Notificări, ${unread} necitite`} aria-expanded={open}>
          <Bell className="h-5 w-5" />
          {unread > 0 && <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-pink px-1 text-[10px] font-bold">{unread}</span>}
        </button>
        {open && (
          <>
            <button aria-label="Închide notificările" className="fixed inset-0 z-40 cursor-default" onClick={() => setOpen(false)} />
            <div className="absolute right-0 z-50 mt-2 w-[min(92vw,380px)] overflow-hidden rounded-2xl border border-line bg-charcoal shadow-2xl">
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <h2 className="h-card">Notificări</h2>
                <button className="text-xs font-semibold text-pink-soft hover:underline" onClick={() => setItems((s) => s.map((i) => ({ ...i, unread: false })))}>Marchează tot ca citit</button>
              </div>
              <ul>
                {items.map((n) => (
                  <li key={n.id} className={cn("flex gap-3 border-b border-line px-4 py-3 last:border-0", n.unread && "bg-pink/[.06]")}>
                    <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", n.unread ? "bg-pink" : "bg-white/15")} />
                    <div><p className="text-sm">{n.title}</p><p className="text-xs text-muted">{n.when}</p></div>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
