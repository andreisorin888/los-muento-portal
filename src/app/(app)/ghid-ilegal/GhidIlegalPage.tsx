"use client";

import { useState } from "react";
import {
  Calculator, BookOpen, Map as MapIcon, Clock, Swords,
  CheckCircle2, ExternalLink, FlaskConical, Pickaxe,
  ArrowRightLeft, ShoppingBag, Wrench, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Data ────────────────────────────────────────────────────────────────────

const BONUS_OPTIONS = [
  { label: "Fără bonus — Preț standard", value: 1 },
  { label: "20:00 – 21:59 — Bonus +20%", value: 1.2 },
  { label: "22:00 – 23:59 — Bonus +25%", value: 1.25 },
];

type Accent = "emerald" | "violet" | "pink";
type ZoneItem = { id: string; label: string; price: number; note?: string };
type Zone = { id: string; name: string; accent: Accent; items: ZoneItem[] };

const ZONES: Zone[] = [
  {
    id: "groove", name: "Groove", accent: "emerald",
    items: [
      { id: "lsd",       label: "LSD",       price: 3400 },
      { id: "tigari",    label: "Țigări",     price: 5400 },
      { id: "cocaina",   label: "Cocaină",    price: 2900 },
      { id: "trabucuri", label: "Trabucuri",  price: 1750 },
    ],
  },
  {
    id: "elburro", name: "El Burro", accent: "violet",
    items: [
      { id: "teava",         label: "Țeavă",          price: 13000 },
      { id: "maner",         label: "Mâner",           price: 13000 },
      { id: "element",       label: "Element (×2)",    price: 6500, note: "Elementele se livrează câte două" },
      { id: "metafetamina",  label: "Metafetamină",    price: 21000 },
    ],
  },
  {
    id: "vespucii", name: "Vespucii", accent: "pink",
    items: [
      { id: "alcool_v",  label: "Alcool",    price: 12000 },
      { id: "marihuana", label: "Marihuana", price: 1900  },
      { id: "stick",     label: "Stick",     price: 10000 },
    ],
  },
];

const JOBS = [
  { name: "Traficant de Țigări",        hours: 50  },
  { name: "Traficant de Trabucuri",     hours: 75  },
  { name: "Hacker",                     hours: 100 },
  { name: "Dealer de Marijuana",        hours: 100 },
  { name: "Traficant de Marijuana",     hours: 150 },
  { name: "Dealer de Cocaină",          hours: 175 },
  { name: "Scafandru Ilegal",           hours: 180 },
  { name: "Traficant de Cocaină",       hours: 225 },
  { name: "Dealer de LSD",              hours: 250 },
  { name: "Traficant de LSD",           hours: 300 },
  { name: "Vânător Braconier",          hours: 350 },
  { name: "Dealer de Arme",             hours: 400 },
  { name: "Traficant de Arme",          hours: 450 },
  { name: "Dealer de Alcool",           hours: 600 },
  { name: "Traficant de Alcool",        hours: 650 },
  { name: "Dealer de Metamfetamina",    hours: 850 },
  { name: "Traficant de Metamfetamina", hours: 950 },
];

const WEAPONS = [
  { name: "Tec-9",             mat: "14× Fier + 14× Aluminiu" },
  { name: "Compact Rifle",     mat: "20× Fier + 20× Aluminiu" },
  { name: "Micro SMG / SMG",   mat: "20× Fier + 20× Aluminiu" },
  { name: "Double Action",     mat: "40× Fier + 40× Aluminiu" },
  { name: "AK-47",             mat: "50× Fier + 50× Aluminiu" },
  { name: "MG",                mat: "60× Fier + 60× Aluminiu" },
];

const MAPS = [
  { src: "https://i.imgur.com/aK1Z6vw.png", label: "Zone Cayo",     large: true },
  { src: "https://i.imgur.com/XhSCgkp.png", label: "Vespucii" },
  { src: "https://i.imgur.com/wzRindk.png", label: "Groove" },
  { src: "https://i.imgur.com/sQwspK4.png", label: "El Burro" },
  { src: "https://i.imgur.com/4xobzHM.png", label: "Mina Ilegală" },
  { src: "https://i.imgur.com/P6qnAe5.png", label: "Joint" },
  { src: "https://i.imgur.com/qkivSiA.png", label: "Timbre LSD" },
  { src: "https://i.imgur.com/0Ku3QnK.png", label: "Black Market" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return Math.round(n).toLocaleString("ro-RO");
}

function NumInput({
  value, onChange, wide,
}: { value: number; onChange: (v: number) => void; wide?: boolean }) {
  return (
    <input
      type="number"
      min={0}
      value={value === 0 ? "" : value}
      placeholder="0"
      onChange={(e) => onChange(Math.max(0, parseInt(e.target.value) || 0))}
      className={cn("input text-center py-1.5 text-sm", wide ? "w-32" : "w-20")}
    />
  );
}

// ─── Accent helpers ───────────────────────────────────────────────────────────

const ACCENT_TEXT: Record<Accent, string> = {
  emerald: "text-emerald",
  violet:  "text-violet-400",
  pink:    "text-pink-soft",
};
const ACCENT_BORDER: Record<Accent, string> = {
  emerald: "border-emerald/40",
  violet:  "border-violet-400/40",
  pink:    "border-pink/40",
};
const ACCENT_BG: Record<Accent, string> = {
  emerald: "bg-emerald/10",
  violet:  "bg-violet-400/10",
  pink:    "bg-pink/10",
};

// ─── Zone calculator ──────────────────────────────────────────────────────────

function ZoneCalc({ zone, bonus }: { zone: Zone; bonus: number }) {
  const [qtys, setQtys] = useState<Record<string, number>>(
    Object.fromEntries(zone.items.map((i) => [i.id, 0])),
  );

  const base   = zone.items.reduce((s, item) => s + (qtys[item.id] || 0) * item.price, 0);
  const total  = base * bonus;
  const tax    = base * 0.1;
  const profit = total - tax;
  const hasNote = zone.items.find((i) => i.note);

  return (
    <div className={cn("panel p-5 space-y-4 border", ACCENT_BORDER[zone.accent])}>
      <div className="flex items-center justify-between">
        <span className={cn("font-gta text-base font-bold uppercase tracking-widest", ACCENT_TEXT[zone.accent])}>
          {zone.name}
        </span>
        {bonus > 1 && (
          <span className={cn("text-xs font-gta font-semibold tracking-wide px-2 py-0.5 rounded", ACCENT_BG[zone.accent], ACCENT_TEXT[zone.accent])}>
            ×{bonus}
          </span>
        )}
      </div>

      <div className="space-y-2">
        {zone.items.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <span className="text-sm">{item.label}</span>
              <span className="ml-2 text-xs text-muted">{fmt(item.price)} $</span>
            </div>
            <NumInput value={qtys[item.id]} onChange={(v) => setQtys((s) => ({ ...s, [item.id]: v }))} />
          </div>
        ))}
      </div>

      {hasNote && <p className="text-xs text-muted italic">* {hasNote.note}</p>}

      <div className="border-t border-line pt-3 space-y-1.5 text-sm">
        <div className="flex justify-between text-muted">
          <span>Total brut</span>
          <span className="font-gta tracking-wide">{fmt(total)} $</span>
        </div>
        <div className="flex justify-between text-muted">
          <span>Taxă 10%</span>
          <span className="font-gta tracking-wide text-rose-400">−{fmt(tax)} $</span>
        </div>
        <div className={cn("flex justify-between font-bold pt-1.5 border-t border-line", ACCENT_TEXT[zone.accent])}>
          <span>Profit net</span>
          <span className="font-gta text-lg tracking-wide">{fmt(profit)} $</span>
        </div>
      </div>
    </div>
  );
}

// ─── Componente calculator ────────────────────────────────────────────────────

function ComponenteCalc() {
  const [fier, setFier] = useState(0);
  const [alu, setAlu]   = useState(0);
  const seturi = Math.floor(Math.min(fier / 60, alu / 60));

  return (
    <div className="panel p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Wrench className="h-4 w-4 text-gold" />
        <h3 className="font-gta text-sm font-bold uppercase tracking-widest text-gold">Componente</h3>
      </div>
      <p className="text-xs text-muted bg-white/[.03] rounded px-3 py-2">
        60 Fier + 60 Aluminiu → 10 Mânere + 10 Țevi + 20 Elemente
      </p>
      <div className="space-y-2">
        {([["Fier deținut", fier, setFier], ["Aluminiu deținut", alu, setAlu]] as const).map(([label, val, set]) => (
          <div key={label as string} className="flex items-center justify-between gap-3">
            <span className="text-sm">{label}</span>
            <NumInput value={val as number} onChange={set as (v: number) => void} />
          </div>
        ))}
      </div>
      <div className="border-t border-line pt-3 grid grid-cols-3 gap-2 text-center">
        {([ ["Mânere", seturi * 10], ["Țevi", seturi * 10], ["Elemente", seturi * 20] ] as const).map(([k, v]) => (
          <div key={k as string} className="bg-white/[.03] rounded p-2">
            <div className="font-gta text-xl font-bold text-gold">{v}</div>
            <div className="text-xs text-muted mt-0.5">{k}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Alcool calculator ────────────────────────────────────────────────────────

function AlcoolCalc() {
  const [v, setV] = useState({ sticle: 0, mere: 0, pere: 0, prune: 0, drojdie: 0 });
  const result = Math.floor(Math.min(v.sticle / 1, v.mere / 1, v.pere / 1, v.prune / 4, v.drojdie / 3));

  const fields: Array<[keyof typeof v, string, number]> = [
    ["sticle",  "Sticle Goale", 1],
    ["mere",    "Mere",         1],
    ["pere",    "Pere",         1],
    ["prune",   "Prune",        4],
    ["drojdie", "Drojdie",      3],
  ];

  return (
    <div className="panel p-5 space-y-4">
      <div className="flex items-center gap-2">
        <FlaskConical className="h-4 w-4 text-gold" />
        <h3 className="font-gta text-sm font-bold uppercase tracking-widest text-gold">Alcool</h3>
      </div>
      <p className="text-xs text-muted bg-white/[.03] rounded px-3 py-2">
        1 Sticlă + 1 Măr + 1 Pară + 4 Prune + 3 Drojdie → 1 Sticlă Alcool
      </p>
      <div className="space-y-2">
        {fields.map(([key, label, per]) => (
          <div key={key} className="flex items-center justify-between gap-3">
            <span className="text-sm">{label} <span className="text-muted text-xs">×{per}</span></span>
            <NumInput value={v[key]} onChange={(n) => setV((s) => ({ ...s, [key]: n }))} />
          </div>
        ))}
      </div>
      <div className="border-t border-line pt-3 flex items-center justify-between">
        <span className="text-sm font-semibold">Sticle Alcool</span>
        <span className="font-gta text-2xl font-bold text-gold">{result}</span>
      </div>
    </div>
  );
}

// ─── Meta calculator ──────────────────────────────────────────────────────────

function MetaCalc() {
  const [v, setV] = useState({ albastru: 0, rosu: 0, mov: 0, verde: 0 });
  const seturi = Math.floor(Math.min(v.albastru, v.rosu, v.mov, v.verde));

  const fields: Array<[keyof typeof v, string, string]> = [
    ["albastru", "Sticlă Albastră", "text-blue-400"],
    ["rosu",     "Sticlă Roșie",    "text-rose-400"],
    ["mov",      "Sticlă Mov",      "text-violet-400"],
    ["verde",    "Sticlă Verde",    "text-emerald"],
  ];

  return (
    <div className="panel p-5 space-y-4">
      <div className="flex items-center gap-2">
        <FlaskConical className="h-4 w-4 text-gold" />
        <h3 className="font-gta text-sm font-bold uppercase tracking-widest text-gold">Metafetamină</h3>
      </div>
      <p className="text-xs text-muted bg-white/[.03] rounded px-3 py-2">
        1 Albastru + 1 Roșie + 1 Mov + 1 Verde → 4 Metafetamină
      </p>
      <div className="space-y-2">
        {fields.map(([key, label, color]) => (
          <div key={key} className="flex items-center justify-between gap-3">
            <span className={cn("text-sm", color)}>{label}</span>
            <NumInput value={v[key]} onChange={(n) => setV((s) => ({ ...s, [key]: n }))} />
          </div>
        ))}
      </div>
      <div className="border-t border-line pt-3 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">Metafetamină Rezultată</div>
          <div className="text-xs text-muted">{seturi} seturi complete</div>
        </div>
        <span className="font-gta text-2xl font-bold text-gold">{seturi * 4}</span>
      </div>
    </div>
  );
}

// ─── Spălare bani ─────────────────────────────────────────────────────────────

function SpalareCalc() {
  const [bm, setBm]     = useState(0);
  const [proc, setProc] = useState(70);
  const curati  = bm * (proc / 100);
  const pierduti = bm - curati;

  return (
    <div className="panel p-5 space-y-4">
      <div className="flex items-center gap-2">
        <ArrowRightLeft className="h-4 w-4 text-gold" />
        <h3 className="font-gta text-sm font-bold uppercase tracking-widest text-gold">Spălare Bani</h3>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm">Bani Murdari ($M)</span>
          <NumInput value={bm} onChange={setBm} wide />
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm">Rată Conversie %</span>
          <input
            type="number" min={0} max={100}
            value={proc === 0 ? "" : proc}
            onChange={(e) => setProc(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
            className="input w-32 text-center py-1.5 text-sm"
          />
        </div>
      </div>
      <div className="border-t border-line pt-3 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted">Bani Curați Primiți</span>
          <span className="font-gta font-bold text-emerald tracking-wide">{fmt(curati)} $</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted">Comision Spălare</span>
          <span className="font-gta text-rose-400 tracking-wide">−{fmt(pierduti)} $</span>
        </div>
      </div>
      <p className="text-xs text-muted">Ex: 100.000 $M la 70% → 70.000 $ curat.</p>
    </div>
  );
}

// ─── Black Market ─────────────────────────────────────────────────────────────

function BlackMarketCalc() {
  const [v, setV] = useState({ termita: 0, explozibil: 0, valiza: 0 });

  const items: Array<[keyof typeof v, string, number, string]> = [
    ["termita",    "Termită",          50000,  "Necesar la spargere ATM"],
    ["explozibil", "Explozibil Simplu", 50000,  "Necesar la spargere Bancomat"],
    ["valiza",     "Valiză Arme",       100000, "Utilizată la crafting armament"],
  ];

  const total = items.reduce((s, [key, , price]) => s + (v[key] || 0) * price, 0);

  return (
    <div className="panel p-5 space-y-4">
      <div className="flex items-center gap-2">
        <ShoppingBag className="h-4 w-4 text-gold" />
        <h3 className="font-gta text-sm font-bold uppercase tracking-widest text-gold">Black Market</h3>
      </div>
      <div className="space-y-3">
        {items.map(([key, label, price, note]) => (
          <div key={key} className="space-y-0.5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="text-sm">{label}</span>
                <span className="ml-2 text-xs text-muted">{fmt(price)} $M</span>
              </div>
              <NumInput value={v[key]} onChange={(n) => setV((s) => ({ ...s, [key]: n }))} />
            </div>
            <p className="text-xs text-muted pl-1">{note}</p>
          </div>
        ))}
      </div>
      <div className="border-t border-line pt-3 flex justify-between">
        <span className="text-sm font-semibold">Total Bani Murdari</span>
        <span className="font-gta font-bold text-rose-400 tracking-wide">{fmt(total)} $M</span>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

type TabId = "calculatoare" | "ghid" | "harti";

const TABS: Array<{ id: TabId; label: string; Icon: React.ElementType }> = [
  { id: "calculatoare", label: "Calculatoare", Icon: Calculator },
  { id: "ghid",         label: "Ghid",         Icon: BookOpen   },
  { id: "harti",        label: "Hărți",        Icon: MapIcon    },
];

export function GhidIlegalPage() {
  const [tab, setTab]     = useState<TabId>("calculatoare");
  const [bonus, setBonus] = useState(1);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="h-page">Ghid Ilegal</h1>
        <p className="mt-1 text-sm text-muted">
          Calculatoare zone, producție, finanțe și ghid complet pentru operațiunile ilegale.
        </p>
      </div>

      {/* Tab nav */}
      <div className="flex gap-0.5 border-b border-line">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
              tab === id
                ? "border-pink text-white"
                : "border-transparent text-muted hover:text-white hover:border-white/20",
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab: Calculatoare ─────────────────────────────────────────────── */}
      {tab === "calculatoare" && (
        <div className="space-y-6">
          {/* Bonus selector */}
          <div className="panel p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border border-gold/20">
            <div>
              <p className="font-gta text-sm font-bold uppercase tracking-widest text-gold">Interval Livrare</p>
              <p className="text-xs text-muted mt-0.5">
                Stocul se distribuie la <strong className="text-white/80">22:00</strong> — fii prezent din 21:40.
              </p>
            </div>
            <select
              value={bonus}
              onChange={(e) => setBonus(parseFloat(e.target.value))}
              className="input sm:w-72"
            >
              {BONUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Zone calculators */}
          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">Zone Livrare</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {ZONES.map((z) => <ZoneCalc key={z.id} zone={z} bonus={bonus} />)}
            </div>
          </section>

          {/* Production */}
          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">Producție</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <ComponenteCalc />
              <AlcoolCalc />
              <MetaCalc />
            </div>
          </section>

          {/* Finance */}
          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">Finanțe</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <SpalareCalc />
              <BlackMarketCalc />
            </div>
          </section>
        </div>
      )}

      {/* ── Tab: Ghid ─────────────────────────────────────────────────────── */}
      {tab === "ghid" && (
        <div className="grid gap-5 lg:grid-cols-2">

          {/* Cerințe ore — full left column */}
          <div className="panel p-5 space-y-3 lg:row-span-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gold" />
              <h2 className="font-gta text-sm font-bold uppercase tracking-widest text-gold">Cerințe Ore Joburi</h2>
            </div>
            <div className="text-xs text-muted bg-white/[.03] rounded px-3 py-2 space-y-1">
              <p><strong className="text-white/80">Dealer</strong> — mai puțini bani la livrare</p>
              <p><strong className="text-white/80">Traficant</strong> — 100% plată + poți produce</p>
            </div>
            <div className="space-y-0.5 max-h-[420px] overflow-y-auto pr-1">
              {JOBS.map((j) => (
                <div
                  key={j.name}
                  className="flex items-center justify-between py-1.5 border-b border-line last:border-0 group"
                >
                  <span className="text-sm group-hover:text-white transition-colors">{j.name}</span>
                  <span className="font-gta font-semibold text-gold tracking-wide text-sm shrink-0 ml-3">
                    {j.hours}h
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Kit mafie */}
          <div className="panel p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Swords className="h-4 w-4 text-gold" />
              <h2 className="font-gta text-sm font-bold uppercase tracking-widest text-gold">Kit Obligatoriu Mafie</h2>
            </div>
            <div className="space-y-2">
              {[
                "1× Tec-9",
                "200× Gloanțe",
                "2× Timbre LSD / Jointuri",
                "15–20× Pastile",
                "2× Truse Medicale",
                "3× Armuri (1 echipată + 2 în buzunar)",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className="mt-1 rounded px-3 py-2 bg-gold/10 border border-gold/30">
              <p className="text-xs text-gold font-semibold">
                OBLIGATORIU: Filmările sunt obligatorii la orice bătaie!
              </p>
            </div>
          </div>

          {/* Crafting armament */}
          <div className="panel p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Swords className="h-4 w-4 text-gold" />
              <h2 className="font-gta text-sm font-bold uppercase tracking-widest text-gold">Crafting Armament</h2>
            </div>
            <p className="text-xs text-muted">Job necesar: <strong className="text-white/80">Traficant de Arme</strong></p>
            <p className="text-xs text-muted">Regulă generală: <span className="text-white/80">450 Luni + 1 Insignă + 1 Valiză Arme</span></p>
            <div className="space-y-1">
              {WEAPONS.map(({ name, mat }) => (
                <div key={name} className="flex items-center justify-between py-1 border-b border-line last:border-0 text-xs">
                  <span className="font-semibold text-white/90">{name}</span>
                  <span className="text-muted">{mat}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted border-t border-line pt-2">
              <strong className="text-white/80">Gloanțe (50 buc):</strong> 4 Sulf + 4 Cupru — fără insignă
            </p>
          </div>

          {/* Mina & rețete */}
          <div className="panel p-5 space-y-4 lg:col-span-2">
            <div className="flex items-center gap-2">
              <Pickaxe className="h-4 w-4 text-gold" />
              <h2 className="font-gta text-sm font-bold uppercase tracking-widest text-gold">Mină & Rețete Speciale</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="bg-white/[.03] rounded p-3 space-y-1.5 text-sm">
                <p className="font-semibold text-white/90">Mină Ilegală</p>
                <p className="text-muted text-xs">Taxă acces: <span className="text-white/80">100.000 $</span></p>
                <p className="text-muted text-xs">Cerințe: Job Miner + Buletin</p>
                <p className="text-muted text-xs">Recompensă: 2 Materiale per piatră (Fier / Aluminiu)</p>
              </div>
              <div className="bg-white/[.03] rounded p-3 space-y-1.5 text-sm">
                <p className="font-semibold text-white/90">10 Jointuri</p>
                <p className="text-muted text-xs">20 Marihuana + 10 Filtre + 1 Foiță</p>
                <p className="text-muted text-xs">Job: Traficant de Marihuana</p>
                <div className="mt-1.5 inline-flex items-center gap-1.5 bg-emerald/10 text-emerald text-xs rounded px-2 py-0.5">
                  <ChevronRight className="h-3 w-3" /> Efect: −15% recoil
                </div>
              </div>
              <div className="bg-white/[.03] rounded p-3 space-y-1.5 text-sm">
                <p className="font-semibold text-white/90">Timbre LSD</p>
                <p className="text-muted text-xs">Job: Traficant LSD</p>
                <div className="mt-1.5 space-y-1">
                  <div className="inline-flex items-center gap-1.5 bg-violet-400/10 text-violet-400 text-xs rounded px-2 py-0.5">
                    <ChevronRight className="h-3 w-3" /> 5 min viteză
                  </div>
                  <div className="inline-flex items-center gap-1.5 bg-violet-400/10 text-violet-400 text-xs rounded px-2 py-0.5">
                    <ChevronRight className="h-3 w-3" /> −15% recoil redus
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Hărți ────────────────────────────────────────────────────── */}
      {tab === "harti" && (
        <div className="space-y-4">
          {/* Large map */}
          {MAPS.filter((m) => m.large).map((m) => (
            <a
              key={m.src} href={m.src} target="_blank" rel="noopener noreferrer"
              className="block panel p-3 group hover:border-gold/40 transition-colors"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={m.src} alt={m.label}
                className="w-full max-h-96 rounded object-cover group-hover:opacity-90 transition-opacity"
              />
              <p className="mt-2 text-center font-gta font-semibold uppercase tracking-widest text-sm text-gold">
                {m.label}
              </p>
            </a>
          ))}

          {/* Small maps grid */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {MAPS.filter((m) => !m.large).map((m) => (
              <a
                key={m.src} href={m.src} target="_blank" rel="noopener noreferrer"
                className="block panel p-2 group hover:border-gold/40 transition-colors"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={m.src} alt={m.label}
                  className="w-full h-36 rounded object-cover group-hover:opacity-90 transition-opacity"
                />
                <p className="mt-2 text-center font-gta text-xs font-semibold uppercase tracking-widest text-gold">
                  {m.label}
                </p>
              </a>
            ))}
          </div>

          {/* Notion link */}
          <div className="panel p-4 flex justify-center">
            <a
              href="https://fortune-eyelash-38b.notion.site/Zonele-de-pe-harta-1ddd620b0f6c80c8951fc1680bbe45ac?pvs=149"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-gold hover:text-gold/80 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              Ghid complet Zone Rău-Famate (Notion)
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
