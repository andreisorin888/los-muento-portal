import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Card } from "@/components/ui";
import type { MemberStatus } from "@prisma/client";
import { StashForm } from "./StashForm";
import { getStashListings, getMyListings } from "@/app/actions/stash";
import { STASH_ITEMS } from "@/lib/stash-items";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Stash" };

export default async function ArmoryPage() {
  const session = await getServerSession(authOptions);
  const actorId = session?.user?.memberId ?? "";

  const [allListings, myListings] = await Promise.all([
    getStashListings(),
    actorId ? getMyListings(actorId) : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="h-page">Stash</h1>
        <p className="mt-1 text-sm text-muted">
          Stocul tău reprezintă ce ai disponibil spre vânzare. Setează cantitatea și prețul — ceilalți membri văd imediat.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Stocul meu ── */}
        <Card title="Stocul meu">
          <StashForm myListings={myListings} />
        </Card>

        {/* ── Piața ── */}
        <Card title="Piața" pad={false}>
          {STASH_ITEMS.map(({ item, label, emoji }) => {
            const rows = allListings.filter((l) => l.item === item);
            if (rows.length === 0) return null;
            return (
              <div key={item}>
                <div className="border-t border-line px-5 py-2.5 first:border-t-0">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted">
                    {emoji} {label}
                  </p>
                </div>
                {rows.map((l) => (
                  <div key={l.id} className="flex items-center justify-between gap-4 border-t border-line/50 px-5 py-2.5">
                    <div>
                      <p className="text-sm font-medium">{l.member.name}</p>
                      <p className="text-xs text-muted">{l.member.rankName}</p>
                    </div>
                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <p className="font-display font-bold text-gold text-lg leading-none">{l.quantity}</p>
                        <p className="text-xs text-muted">buc.</p>
                      </div>
                      <div>
                        <p className="text-sm text-emerald-soft font-medium">
                          {l.price === 0 ? "Negociabil" : `$${l.price.toLocaleString("ro-RO")}`}
                        </p>
                        {l.price > 0 && <p className="text-xs text-muted">per buc.</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
          {allListings.length === 0 && (
            <p className="p-5 text-sm text-muted">Niciun membru nu are articole stocate momentan.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
