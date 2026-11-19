"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ShoppingCart, Clock, CheckCircle2, AlertCircle, Archive,
  Plus, Package,
} from "lucide-react";
import { OrderStatus, StashItem } from "@prisma/client";
import { STASH_ITEMS } from "@/lib/stash-items";
import { createOrder, updateOrderStatus } from "@/app/actions/orders";

type Member = { id: string; name: string; rankName: string };

type Order = {
  id: string;
  item: StashItem;
  quantity: number;
  status: OrderStatus;
  notes: string | null;
  createdAt: Date;
  buyer: Member;
};

type Props = {
  actorId: string;
  isManager: boolean;
  myOrders: Order[];
  allOrders: Order[];
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  DEPUSA: "Depusă",
  IN_PROGRES: "În progres",
  FINALIZATA: "Finalizată",
  ARHIVATA: "Arhivată",
};

const STATUS_COLOR: Record<OrderStatus, string> = {
  DEPUSA: "text-gold border-gold/40 bg-gold/10",
  IN_PROGRES: "text-violet-400 border-violet-400/40 bg-violet-400/10",
  FINALIZATA: "text-emerald border-emerald/40 bg-emerald/10",
  ARHIVATA: "text-muted border-muted/30 bg-muted/5",
};

const STATUS_ICON: Record<OrderStatus, React.ReactNode> = {
  DEPUSA: <Clock className="h-3.5 w-3.5" />,
  IN_PROGRES: <AlertCircle className="h-3.5 w-3.5" />,
  FINALIZATA: <CheckCircle2 className="h-3.5 w-3.5" />,
  ARHIVATA: <Archive className="h-3.5 w-3.5" />,
};

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  DEPUSA: "IN_PROGRES",
  IN_PROGRES: "FINALIZATA",
  FINALIZATA: "ARHIVATA",
};

const NEXT_LABEL: Partial<Record<OrderStatus, string>> = {
  DEPUSA: "Preia",
  IN_PROGRES: "Finalizează",
  FINALIZATA: "Arhivează",
};

function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-xs font-medium ${STATUS_COLOR[status]}`}>
      {STATUS_ICON[status]}
      {STATUS_LABEL[status]}
    </span>
  );
}

function itemLabel(item: StashItem) {
  return STASH_ITEMS.find((s) => s.item === item)?.label ?? item;
}

function itemEmoji(item: StashItem) {
  return STASH_ITEMS.find((s) => s.item === item)?.emoji ?? "📦";
}

function PlaceOrderForm({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [item, setItem] = useState<StashItem | "">("");
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!item || quantity < 1) { setError("Completează toate câmpurile"); return; }
    setError("");
    startTransition(async () => {
      try {
        await createOrder({ item: item as StashItem, quantity, notes: notes || undefined });
        router.refresh();
        onDone();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Eroare necunoscută");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Produs</label>
        <select
          className="input w-full"
          value={item}
          onChange={(e) => setItem(e.target.value as StashItem)}
          required
        >
          <option value="">— alege produsul —</option>
          {STASH_ITEMS.map((s) => (
            <option key={s.item} value={s.item}>
              {s.emoji} {s.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">Cantitate</label>
        <input
          type="number"
          className="input w-full"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          required
        />
      </div>

      <div>
        <label className="label">Note (opțional)</label>
        <textarea
          className="input w-full resize-none"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Detalii suplimentare..."
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex gap-3 justify-end pt-1">
        <button type="button" className="btn-ghost" onClick={onDone}>Anulează</button>
        <button type="submit" className="btn-primary" disabled={pending || !item}>
          {pending ? "Se trimite…" : "Plasează comanda"}
        </button>
      </div>
    </form>
  );
}

function OrderRow({ order, isManager }: { order: Order; isManager: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const next = NEXT_STATUS[order.status];
  const nextLabel = NEXT_LABEL[order.status];

  function advance() {
    if (!next) return;
    startTransition(async () => {
      await updateOrderStatus(order.id, next);
      router.refresh();
    });
  }

  return (
    <tr>
      <td className="td">
        <span className="font-medium">{itemEmoji(order.item)} {itemLabel(order.item)}</span>
      </td>
      <td className="td text-center font-mono">{order.quantity}</td>
      {isManager && (
        <td className="td">
          <span className="text-sm">{order.buyer.name}</span>
          <span className="text-xs text-muted ml-1">({order.buyer.rankName})</span>
        </td>
      )}
      <td className="td">
        <StatusBadge status={order.status} />
      </td>
      <td className="td text-muted text-xs">
        {new Date(order.createdAt).toLocaleDateString("ro-RO")}
      </td>
      {isManager && (
        <td className="td">
          {next && (
            <button
              onClick={advance}
              disabled={pending}
              className={`text-xs px-2 py-1 rounded border transition-colors ${
                next === "FINALIZATA"
                  ? "border-emerald/50 text-emerald hover:bg-emerald/10"
                  : next === "ARHIVATA"
                  ? "border-muted/40 text-muted hover:bg-muted/10"
                  : "border-violet-400/50 text-violet-400 hover:bg-violet-400/10"
              } disabled:opacity-50`}
            >
              {pending ? "…" : nextLabel}
            </button>
          )}
        </td>
      )}
    </tr>
  );
}

export function ComenziPage({ actorId, isManager, myOrders, allOrders }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [tab, setTab] = useState<"my" | "all">(isManager ? "all" : "my");

  const ordersToShow = tab === "all" ? allOrders : myOrders;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="h-page flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-gold" />
            Comenzi
          </h1>
          <p className="mt-1 text-sm text-muted">
            Cere iteme care vor fi craftate. La finalizare, stash-ul tău se actualizează automat.
          </p>
        </div>
        {!showForm && (
          <button className="btn-primary flex items-center gap-2" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" />
            Comandă nouă
          </button>
        )}
      </div>

      {showForm && (
        <div className="panel p-5">
          <h2 className="font-gta text-gold text-sm tracking-widest uppercase mb-4">
            Plasează o comandă
          </h2>
          <PlaceOrderForm onDone={() => setShowForm(false)} />
        </div>
      )}

      {isManager && (
        <div className="flex gap-1 border-b border-panel">
          {(["all", "my"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                tab === t
                  ? "text-gold border-b-2 border-gold -mb-px"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {t === "all" ? "Toate comenzile" : "Comenzile mele"}
            </button>
          ))}
        </div>
      )}

      <div className="panel">
        {ordersToShow.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-muted">
            <Package className="h-10 w-10 opacity-30" />
            <p className="text-sm">Nicio comandă activă</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="th">Produs</th>
                  <th className="th text-center">Cant.</th>
                  {isManager && <th className="th">Comandat de</th>}
                  <th className="th">Status</th>
                  <th className="th">Data</th>
                  {isManager && <th className="th">Acțiune</th>}
                </tr>
              </thead>
              <tbody>
                {ordersToShow.map((o) => (
                  <OrderRow key={o.id} order={o} isManager={isManager} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
