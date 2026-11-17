"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown, ChevronsLeft, ChevronsRight, LogOut, Palette, X } from "lucide-react";
import { GROUPS, MODULES } from "@/config/nav";
import { SkullEmblem } from "./SkullEmblem";
import { useDemo } from "./DemoSession";
import { members } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

type Props = {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onClose: () => void;
  logoUrl: string | null;
  textureUrl: string | null;
  showDemo: boolean;
  userLevel: number;
  userName: string;
  userRank: string;
  userImage: string | null;
  memberId: string | null;
};

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";
}

const HUE_PALETTE = ["#d9a93c", "#12b886", "#ff2e93", "#ae3ec9", "#f76707"];
function hueFor(id: string) {
  const h = id.split("").reduce((a, c) => ((a << 5) - a) + c.charCodeAt(0), 0);
  return HUE_PALETTE[Math.abs(h) % HUE_PALETTE.length];
}

export function Sidebar({
  collapsed,
  onToggle,
  mobileOpen,
  onClose,
  logoUrl,
  textureUrl,
  showDemo,
  userLevel,
  userName,
  userRank,
  userImage,
  memberId,
}: Props) {
  const pathname = usePathname();
  const { member: demoMember, setMemberId: setDemoId } = useDemo();
  const [closed, setClosed] = useState<Record<string, boolean>>({});

  const level = showDemo ? demoMember.level : userLevel;
  const displayName = showDemo ? demoMember.name : userName;
  const displayRank = showDemo ? demoMember.rank : userRank;
  const displayInitials = showDemo ? demoMember.initials : initials(userName);
  const displayHue = showDemo ? demoMember.hue : hueFor(memberId ?? "default");

  return (
    <>
      {mobileOpen && (
        <button
          aria-label="Închide meniul"
          className="fixed inset-0 z-40 bg-ink/80 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        data-collapsed={collapsed}
        className={cn(
          "group fixed inset-y-0 left-0 z-50 flex w-[272px] flex-col border-r border-line bg-charcoal transition-transform duration-200",
          "lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:transition-[width]",
          collapsed ? "lg:w-[78px]" : "lg:w-[272px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {textureUrl && (
          <div
            className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-[.12]"
            style={{ backgroundImage: `url(${textureUrl})` }}
          />
        )}
        <div className="relative flex h-[72px] shrink-0 items-center gap-3 border-b border-line px-5">
          <SkullEmblem src={logoUrl} className="h-10 w-10 shrink-0" />
          <div className="min-w-0 lg:group-data-[collapsed=true]:hidden">
            <p className="font-display text-2xl font-extrabold leading-none tracking-wider">LOS MUENTO</p>
            <p className="text-[11px] text-gold">Una familia. Un legado.</p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto rounded-lg p-1.5 text-muted hover:bg-white/10 lg:hidden"
            aria-label="Închide meniul"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="relative flex-1 overflow-y-auto px-3 py-4" aria-label="Navigare principală">
          {GROUPS.map((g) => {
            const items = MODULES.filter((m) => m.group === g && level >= m.minLevel);
            if (!items.length) return null;
            const isClosed = closed[g];
            return (
              <div key={g} className="mb-3">
                <button
                  onClick={() => setClosed((s) => ({ ...s, [g]: !s[g] }))}
                  aria-expanded={!isClosed}
                  className="flex w-full items-center justify-between rounded-md px-3 py-1.5 text-xs font-semibold text-muted hover:text-white lg:group-data-[collapsed=true]:hidden"
                >
                  {g}
                  <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", isClosed && "-rotate-90")} />
                </button>
                <div className="hidden h-px bg-line lg:group-data-[collapsed=true]:block" />
                {!isClosed && (
                  <ul className="mt-1 space-y-0.5">
                    {items.map((m) => {
                      const href = `/${m.slug}`;
                      const active = pathname === href || pathname.startsWith(href + "/");
                      return (
                        <li key={m.slug}>
                          <Link
                            href={href}
                            title={m.label}
                            onClick={onClose}
                            aria-current={active ? "page" : undefined}
                            className={cn(
                              "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors lg:group-data-[collapsed=true]:justify-center",
                              active ? "bg-pink/12 text-white" : "text-white/70 hover:bg-white/5 hover:text-white",
                            )}
                          >
                            {active && (
                              <span className="absolute left-0 top-2 h-[calc(100%-16px)] w-[3px] rounded-r bg-pink shadow-[0_0_10px_#ff2e93]" />
                            )}
                            <m.icon
                              className={cn("h-[18px] w-[18px] shrink-0", active ? "text-pink" : "text-muted")}
                            />
                            <span className="truncate lg:group-data-[collapsed=true]:hidden">{m.label}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
          {level >= 100 && (
            <Link
              href="/design-system"
              onClick={onClose}
              title="Sistem de design"
              className="mt-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted hover:bg-white/5 hover:text-white lg:group-data-[collapsed=true]:justify-center"
            >
              <Palette className="h-[18px] w-[18px]" />
              <span className="lg:group-data-[collapsed=true]:hidden">Sistem de design</span>
            </Link>
          )}
        </nav>

        <div className="relative shrink-0 border-t border-line p-3">
          <div className="flex items-center gap-3 rounded-xl bg-white/[.04] p-2.5 lg:group-data-[collapsed=true]:justify-center">
            {userImage && !showDemo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={userImage}
                alt={displayName}
                className="h-10 w-10 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full font-display text-lg font-extrabold text-ink"
                style={{ background: displayHue }}
              >
                {displayInitials}
              </div>
            )}
            <div className="min-w-0 flex-1 lg:group-data-[collapsed=true]:hidden">
              <p className="truncate text-sm font-semibold">{displayName || "—"}</p>
              <p className="text-xs text-muted">{displayRank}</p>
            </div>
            <Link
              href="/api/auth/signout"
              title="Deconectare"
              className="rounded-lg p-2 text-muted hover:bg-white/10 hover:text-white lg:group-data-[collapsed=true]:hidden"
            >
              <LogOut className="h-4 w-4" />
            </Link>
          </div>
          {showDemo && (
            <label className="mt-2 block lg:group-data-[collapsed=true]:hidden">
              <span className="mb-1 block px-1 text-[11px] text-muted">Previzualizare ca (doar demo)</span>
              <select
                value={demoMember.id}
                onChange={(e) => setDemoId(e.target.value)}
                className="input py-1.5 text-xs"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.rank}: {m.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <button
            onClick={onToggle}
            className="mt-2 hidden w-full items-center justify-center gap-2 rounded-lg py-2 text-xs text-muted hover:bg-white/5 hover:text-white lg:flex"
            aria-label={collapsed ? "Extinde bara laterală" : "Restrânge bara laterală"}
          >
            {collapsed ? (
              <ChevronsRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronsLeft className="h-4 w-4" />Restrânge
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
