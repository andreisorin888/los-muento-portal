import { cn, toneFor, type Tone } from "@/lib/utils";

const TONES: Record<Tone, string> = {
  emerald: "bg-emerald/15 text-emerald-soft ring-1 ring-emerald/30",
  gold: "bg-gold/15 text-gold-soft ring-1 ring-gold/30",
  rose: "bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30",
  orange: "bg-sunset/15 text-orange-300 ring-1 ring-sunset/30",
  violet: "bg-violet/20 text-violet-soft ring-1 ring-violet/35",
  neutral: "bg-white/8 text-white/70 ring-1 ring-white/10",
};

export function Badge({ children, tone }: { children: string; tone?: Tone }) {
  return <span className={cn("badge", TONES[tone ?? toneFor(children)])}>{children}</span>;
}

export function Card({ title, action, children, className, pad = true }: { title?: string; action?: React.ReactNode; children: React.ReactNode; className?: string; pad?: boolean }) {
  return (
    <section className={cn("panel", className)}>
      {title && (
        <header className="flex items-center justify-between gap-3 px-5 pt-5">
          <h2 className="h-card">{title}</h2>
          {action}
        </header>
      )}
      <div className={cn(pad && "p-5", title && pad && "pt-4")}>{children}</div>
    </section>
  );
}

export function StatCard({ label, value, note, icon: Icon, accent = "pink" }: { label: string; value: string | number; note?: string; icon: React.ComponentType<{ className?: string }>; accent?: "pink" | "violet" | "emerald" | "gold" }) {
  const c = { pink: "text-pink bg-pink/12", violet: "text-violet-soft bg-violet/15", emerald: "text-emerald-soft bg-emerald/12", gold: "text-gold bg-gold/12" }[accent];
  return (
    <div className="panel flex items-center gap-4 p-5">
      <div className={cn("grid h-12 w-12 shrink-0 place-items-center rounded-xl", c)}><Icon className="h-6 w-6" /></div>
      <div className="min-w-0">
        <p className="text-sm text-muted">{label}</p>
        <p className="font-display text-4xl font-extrabold leading-none">{value}</p>
        {note && <p className="mt-1 truncate text-xs text-muted">{note}</p>}
      </div>
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

