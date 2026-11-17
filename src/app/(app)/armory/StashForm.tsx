"use client";
import { useState, useTransition } from "react";
import { Pencil, Check, X } from "lucide-react";
import { upsertStashListing, removeStashListing } from "@/app/actions/stash";
import { STASH_ITEMS } from "@/lib/stash-items";
import type { StashItem } from "@prisma/client";

type Listing = { item: StashItem; quantity: number; price: number };

export function StashForm({ myListings }: { myListings: Listing[] }) {
  const [editing, setEditing] = useState<StashItem | null>(null);
  const [qty, setQty] = useState(0);
  const [price, setPrice] = useState(0);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function startEdit(item: StashItem) {
    const l = myListings.find((x) => x.item === item);
    setQty(l?.quantity ?? 0);
    setPrice(l?.price ?? 0);
    setError("");
    setEditing(item);
  }

  function cancel() { setEditing(null); setError(""); }

  function save(item: StashItem) {
    setError("");
    startTransition(async () => {
      if (qty === 0) {
        const r = await removeStashListing(item);
        if (r.error) { setError(r.error); return; }
      } else {
        const r = await upsertStashListing({ item, quantity: qty, price });
        if (r.error) { setError(r.error); return; }
      }
      setEditing(null);
    });
  }

  return (
    <div className="space-y-1">
      {STASH_ITEMS.map(({ item, label, emoji }) => {
        const listing = myListings.find((l) => l.item === item);
        const isEditing = editing === item;
        return (
          <div key={item} className="flex items-center gap-3 rounded-xl border border-line px-4 py-3">
            <span className="w-5 text-base">{emoji}</span>
            <span className="flex-1 font-medium text-sm">{label}</span>

            {isEditing ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <input
                    type="number" min={0} max={9999}
                    value={qty}
                    onChange={(e) => setQty(Number(e.target.value))}
                    className="input w-20 py-1 text-sm text-center"
                    placeholder="Cant."
                    autoFocus
                  />
                  <span className="text-muted text-xs">buc. ×</span>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted">$</span>
                    <input
                      type="number" min={0} max={9999999}
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      className="input w-28 py-1 pl-6 text-sm"
                      placeholder="Preț"
                    />
                  </div>
                </div>
                <button onClick={() => save(item)} disabled={pending} className="rounded-lg bg-emerald/20 p-1.5 text-emerald-soft hover:bg-emerald/30" title="Salvează">
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button onClick={cancel} disabled={pending} className="rounded-lg p-1.5 text-muted hover:bg-white/10" title="Anulează">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                {listing ? (
                  <>
                    <span className="font-display font-bold text-gold text-sm">{listing.quantity} buc.</span>
                    <span className="text-emerald-soft text-sm">
                      {listing.price === 0 ? "Negociabil" : `$${listing.price.toLocaleString("ro-RO")}/buc.`}
                    </span>
                  </>
                ) : (
                  <span className="text-muted text-sm">Nestocate</span>
                )}
                <button onClick={() => startEdit(item)} className="rounded-lg p-1.5 text-muted hover:bg-white/10 hover:text-white" title="Editează">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        );
      })}
      {error && <p className="pt-1 text-xs text-rose-400">{error}</p>}
    </div>
  );
}
