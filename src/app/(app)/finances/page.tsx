import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Badge, Card } from "@/components/ui";
import { canSubmitFinanceRecord, canApproveFinanceRecord } from "@/lib/permissions";
import type { ApprovalStatus, FinanceTxType, MemberStatus } from "@prisma/client";
import { AddRecordBtn, ApproveRecordBtn, AddCategoryBtn } from "./FinanceActions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Cash" };

const TX_LABEL: Record<FinanceTxType, string> = {
  VENIT: "Venit",
  CHELTUIALA: "Cheltuială",
  TRANSFER: "Transfer",
  AJUSTARE: "Ajustare",
};
const TX_SIGN: Record<FinanceTxType, 1 | -1 | 0> = {
  VENIT: 1,
  CHELTUIALA: -1,
  TRANSFER: 0,
  AJUSTARE: 0,
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

function fmt(cents: number, sign = 0) {
  const abs = new Intl.NumberFormat("ro-RO", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(Math.abs(cents) / 100);
  if (sign > 0) return `+${abs}`;
  if (sign < 0) return `-${abs}`;
  return abs;
}

export default async function FinancesPage() {
  const session = await getServerSession(authOptions);
  const actorId = session?.user?.memberId ?? "";
  const actorLevel = session?.user?.rankLevel ?? 0;
  const actor = { id: actorId, rankLevel: actorLevel, status: "ACTIV" as MemberStatus };
  const canSubmit = canSubmitFinanceRecord(actor);
  const canApprove = canApproveFinanceRecord(actor);

  const [categories, records] = await Promise.all([
    db.financeCategory.findMany({ orderBy: [{ type: "asc" }, { name: "asc" }] }),
    db.financeRecord.findMany({
      include: {
        category: { select: { name: true, type: true } },
        submittedBy: { select: { name: true } },
        approvedBy: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  const approved = records.filter((r) => r.approvalStatus === "APROBAT");
  const pending = records.filter((r) => r.approvalStatus === "ASTEPTARE");
  const history = records.filter((r) => r.approvalStatus !== "ASTEPTARE");

  const totalVenit = approved.filter((r) => r.type === "VENIT").reduce((s, r) => s + r.amount, 0);
  const totalCheltuiala = approved.filter((r) => r.type === "CHELTUIALA").reduce((s, r) => s + r.amount, 0);
  const sold = totalVenit - totalCheltuiala;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="h-page">Cash</h1>
          <p className="mt-1 text-sm text-muted">Înregistrările financiare ale organizației.</p>
        </div>
        <div className="flex gap-2">
          {canApprove && <AddCategoryBtn />}
          {canSubmit && <AddRecordBtn categories={categories} />}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="panel p-5">
          <p className="text-sm text-muted">Venituri (aprobate)</p>
          <p className="font-display text-4xl font-extrabold text-emerald-400">{fmt(totalVenit, 1)}</p>
        </div>
        <div className="panel p-5">
          <p className="text-sm text-muted">Cheltuieli (aprobate)</p>
          <p className="font-display text-4xl font-extrabold text-rose-400">{fmt(totalCheltuiala, -1)}</p>
        </div>
        <div className="panel p-5">
          <p className="text-sm text-muted">Sold net</p>
          <p className={`font-display text-4xl font-extrabold ${sold >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {fmt(sold, sold >= 0 ? 1 : -1)}
          </p>
        </div>
      </div>

      {pending.length > 0 && (
        <Card title={`În așteptare (${pending.length})`}>
          <div className="space-y-3">
            {pending.map((r) => (
              <div key={r.id} className="flex flex-col gap-2 rounded-xl border border-gold/30 bg-gold/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <span>{TX_LABEL[r.type]}</span>
                    <span className={r.type === "VENIT" ? "text-emerald-400" : "text-rose-400"}>
                      {fmt(r.amount, TX_SIGN[r.type])}
                    </span>
                    <span className="text-muted text-xs">{r.category?.name ?? "—"}</span>
                  </div>
                  <p className="text-xs text-muted">{r.note} · {r.submittedBy.name} · {new Date(r.date).toLocaleDateString("ro-RO")}</p>
                </div>
                {canApprove && <ApproveRecordBtn recordId={r.id} />}
              </div>
            ))}
          </div>
        </Card>
      )}

      {history.length > 0 && (
        <Card title="Istoric înregistrări">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="th">Tip</th>
                  <th className="th">Sumă</th>
                  <th className="th">Categorie</th>
                  <th className="th">Notă</th>
                  <th className="th">Trimis de</th>
                  <th className="th">Status</th>
                  <th className="th">Data</th>
                </tr>
              </thead>
              <tbody>
                {history.map((r) => (
                  <tr key={r.id}>
                    <td className="td">{TX_LABEL[r.type]}</td>
                    <td className={`td font-mono ${r.type === "VENIT" ? "text-emerald-400" : r.type === "CHELTUIALA" ? "text-rose-400" : ""}`}>
                      {fmt(r.amount, TX_SIGN[r.type])}
                    </td>
                    <td className="td">{r.category?.name ?? "—"}</td>
                    <td className="td max-w-xs truncate text-muted">{r.note}</td>
                    <td className="td">{r.submittedBy.name}</td>
                    <td className="td"><Badge tone={APPROVAL_TONE[r.approvalStatus]}>{APPROVAL_LABEL[r.approvalStatus]}</Badge></td>
                    <td className="td text-muted">{new Date(r.date).toLocaleDateString("ro-RO")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {history.length === 0 && pending.length === 0 && (
        <Card title="Cash">
          <p className="text-sm text-muted">Nu există înregistrări financiare.</p>
        </Card>
      )}
    </div>
  );
}
