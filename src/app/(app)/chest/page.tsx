import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Badge, Card } from "@/components/ui";
import { canSubmitChestTx, canApproveChestTx } from "@/lib/permissions";
import type { ApprovalStatus, ChestTxType, MemberStatus } from "@prisma/client";
import { SubmitTxBtn, ApproveTxBtn, InitChestBtn } from "./ChestActions";
import { SubmitItemTxBtn, ApproveItemTxBtn } from "./ChestItemActions";
import { getChestItemStock, getPendingItemTxs, getItemTxHistory, getChestItemTypes } from "@/app/actions/chestItems";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Seif și inventar" };

const TX_LABEL: Record<ChestTxType, string> = {
  DEPUNERE: "Depunere",
  RETRAGERE: "Retragere",
  TRANSFER: "Transfer",
  CORECTIE: "Corecție",
};
const APPROVAL_TONE: Record<ApprovalStatus, "emerald" | "gold" | undefined> = {
  ASTEPTARE: "gold",
  APROBAT: "emerald",
  RESPINS: undefined,
};
const APPROVAL_LABEL: Record<ApprovalStatus, string> = {
  ASTEPTARE: "Așteptare",
  APROBAT: "Aprobat",
  RESPINS: "Respins",
};

function fmt(cents: number) {
  return new Intl.NumberFormat("ro-RO", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(cents / 100);
}

export default async function ChestPage() {
  const session = await getServerSession(authOptions);
  const actorId = session?.user?.memberId ?? "";
  const actorLevel = session?.user?.rankLevel ?? 0;
  const actor = { id: actorId, rankLevel: actorLevel, status: "ACTIV" as MemberStatus };
  const canSubmit = canSubmitChestTx(actor);
  const canApprove = canApproveChestTx(actor);

  const [chest, members, activeItemTypes] = await Promise.all([
    db.chest.findFirst({
      include: {
        transactions: {
          include: {
            submittedBy: { select: { name: true } },
            approvedBy: { select: { name: true } },
            targetMember: { select: { name: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 50,
        },
      },
    }),
    canSubmit
      ? db.member.findMany({
          where: { status: "ACTIV" },
          select: { id: true, name: true },
          orderBy: [{ rankLevel: "desc" }, { name: "asc" }],
        })
      : Promise.resolve([]),
    db.chestItemType.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
  ]);

  if (!chest) {
    return (
      <div className="space-y-5">
        <h1 className="h-page">Seif și inventar</h1>
        <Card title="Seif neinitialized">
          <p className="mb-4 text-sm text-muted">Seiful organizației nu a fost inițializat.</p>
          {canApprove && <InitChestBtn />}
        </Card>
      </div>
    );
  }

  const [itemStock, pendingItemTxs, itemTxHistory] = await Promise.all([
    getChestItemStock(chest.id),
    getPendingItemTxs(chest.id),
    getItemTxHistory(chest.id),
  ]);

  const pending = chest.transactions.filter((t) => t.approvalStatus === "ASTEPTARE");
  const history = chest.transactions.filter((t) => t.approvalStatus !== "ASTEPTARE");

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="h-page">Seif și inventar</h1>
          <p className="mt-1 text-sm text-muted">Tranzacțiile, soldul și inventarul seifului organizației.</p>
        </div>
        {canSubmit && (
          <div className="flex flex-wrap gap-2">
            <SubmitTxBtn canTransfer={canApprove} members={members} />
            {activeItemTypes.length > 0 && <SubmitItemTxBtn itemTypes={activeItemTypes} />}
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="panel p-6">
          <p className="text-sm text-muted">Sold curent</p>
          <p className={`font-display text-5xl font-extrabold ${chest.balance < 0 ? "text-rose-400" : "text-emerald-400"}`}>
            {fmt(chest.balance)}
          </p>
        </div>
        <Card title="Inventar articole" pad={false}>
          {activeItemTypes.length === 0 ? (
            <p className="p-4 text-sm text-muted">Nicio categorie de articole configurată. Adaugă din <a href="/configuration" className="text-pink-soft hover:underline">Configurare</a>.</p>
          ) : (
            <div className="divide-y divide-line">
              {activeItemTypes.map((item) => {
                const stock = itemStock.find((s) => s.itemTypeId === item.id);
                const qty = stock?.quantity ?? 0;
                return (
                  <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                    <span className="text-xl w-7">{item.emoji}</span>
                    <span className="flex-1 text-sm font-medium">{item.label}</span>
                    <span className={`font-display text-lg font-bold ${qty === 0 ? "text-muted" : "text-gold"}`}>{qty.toLocaleString("ro-RO")}</span>
                    <span className="text-xs text-muted">{item.unit}</span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {pending.length > 0 && (
        <Card title={`În așteptare (${pending.length})`}>
          <div className="space-y-3">
            {pending.map((t) => (
              <div key={t.id} className="flex flex-col gap-2 rounded-xl border border-gold/30 bg-gold/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <span>{TX_LABEL[t.type]}</span>
                    <span className="text-gold">{fmt(t.amount)}</span>
                    {t.targetMember && <span className="text-muted">→ {t.targetMember.name}</span>}
                  </div>
                  <p className="text-xs text-muted">{t.note} · {t.submittedBy.name} · {new Date(t.createdAt).toLocaleDateString("ro-RO")}</p>
                </div>
                {canApprove && <ApproveTxBtn txId={t.id} />}
              </div>
            ))}
          </div>
        </Card>
      )}

      {pendingItemTxs.length > 0 && (
        <Card title={`Articole în așteptare (${pendingItemTxs.length})`}>
          <div className="space-y-3">
            {pendingItemTxs.map((tx) => (
              <div key={tx.id} className="flex flex-col gap-2 rounded-xl border border-gold/30 bg-gold/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <span>{tx.type === "DEPUNERE" ? "Depunere" : tx.type === "RETRAGERE" ? "Retragere" : "Corecție"}</span>
                    <span className="text-muted">·</span>
                    <span className="text-muted text-xs">{tx.note}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tx.lines.map((l) => (
                      <span key={l.id} className="inline-flex items-center gap-1 rounded-full bg-white/[.06] px-2.5 py-0.5 text-xs">
                        {l.itemType.emoji} {l.quantity} {l.itemType.unit} {l.itemType.label}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-muted">{tx.submittedBy.name} · {new Date(tx.createdAt).toLocaleDateString("ro-RO")}</p>
                </div>
                {canApprove && <ApproveItemTxBtn txId={tx.id} />}
              </div>
            ))}
          </div>
        </Card>
      )}

      {itemTxHistory.length > 0 && (
        <Card title="Istoric articole">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="th">Tip</th>
                  <th className="th">Articole</th>
                  <th className="th">Notă</th>
                  <th className="th">Trimis de</th>
                  <th className="th">Status</th>
                  <th className="th">Data</th>
                </tr>
              </thead>
              <tbody>
                {itemTxHistory.map((tx) => (
                  <tr key={tx.id}>
                    <td className="td">{tx.type === "DEPUNERE" ? "Depunere" : tx.type === "RETRAGERE" ? "Retragere" : "Corecție"}</td>
                    <td className="td">
                      <div className="flex flex-wrap gap-1">
                        {tx.lines.map((l) => (
                          <span key={l.id} className="text-xs text-muted">{l.itemType.emoji} {l.quantity} {l.itemType.label}</span>
                        ))}
                      </div>
                    </td>
                    <td className="td max-w-xs truncate text-muted">{tx.note}</td>
                    <td className="td">{tx.submittedBy.name}</td>
                    <td className="td"><Badge tone={APPROVAL_TONE[tx.approvalStatus]}>{APPROVAL_LABEL[tx.approvalStatus]}</Badge></td>
                    <td className="td text-muted">{new Date(tx.createdAt).toLocaleDateString("ro-RO")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {history.length > 0 && (
        <Card title="Istoric tranzacții">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="th">Tip</th>
                  <th className="th">Sumă</th>
                  <th className="th">Notă</th>
                  <th className="th">Trimis de</th>
                  <th className="th">Status</th>
                  <th className="th">Data</th>
                </tr>
              </thead>
              <tbody>
                {history.map((t) => (
                  <tr key={t.id}>
                    <td className="td">{TX_LABEL[t.type]}</td>
                    <td className="td font-mono">{fmt(t.amount)}</td>
                    <td className="td max-w-xs truncate text-muted">{t.note}</td>
                    <td className="td">{t.submittedBy.name}</td>
                    <td className="td"><Badge tone={APPROVAL_TONE[t.approvalStatus]}>{APPROVAL_LABEL[t.approvalStatus]}</Badge></td>
                    <td className="td text-muted">{new Date(t.createdAt).toLocaleDateString("ro-RO")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
