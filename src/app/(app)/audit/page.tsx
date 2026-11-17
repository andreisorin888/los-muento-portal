import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card } from "@/components/ui";
import { canViewAuditLog } from "@/lib/permissions";
import type { MemberStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import { AuditFilters } from "./AuditFilters";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Jurnal de audit" };

export default async function AuditPage({
  searchParams,
}: {
  searchParams: { action?: string; entity?: string; actorId?: string; page?: string };
}) {
  const session = await getServerSession(authOptions);
  const actorId = session?.user?.memberId ?? "";
  const actorLevel = session?.user?.rankLevel ?? 0;
  const actor = { id: actorId, rankLevel: actorLevel, status: "ACTIV" as MemberStatus };

  if (!canViewAuditLog(actor)) redirect("/dashboard");

  const page = Math.max(1, Number(searchParams.page ?? 1));
  const take = 50;
  const skip = (page - 1) * take;

  const where = {
    ...(searchParams.action ? { action: { contains: searchParams.action, mode: "insensitive" as const } } : {}),
    ...(searchParams.entity ? { entity: { contains: searchParams.entity, mode: "insensitive" as const } } : {}),
    ...(searchParams.actorId ? { actorId: searchParams.actorId } : {}),
  };

  const [logs, total, members] = await Promise.all([
    db.auditLog.findMany({
      where,
      include: { actor: { select: { name: true, rankName: true } } },
      orderBy: { createdAt: "desc" },
      take,
      skip,
    }),
    db.auditLog.count({ where }),
    db.member.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const totalPages = Math.ceil(total / take);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="h-page">Jurnal de audit</h1>
        <p className="mt-1 text-sm text-muted">Registru rezistent la modificări al acțiunilor importante.</p>
      </div>

      <AuditFilters
        members={members}
        currentAction={searchParams.action ?? ""}
        currentEntity={searchParams.entity ?? ""}
        currentActorId={searchParams.actorId ?? ""}
      />

      <Card title={`Înregistrări (${total})`} pad={false}>
        {logs.length === 0 ? (
          <p className="p-5 text-sm text-muted">Nu există înregistrări pentru filtrele aplicate.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="th">Data</th>
                  <th className="th">Actor</th>
                  <th className="th">Acțiune</th>
                  <th className="th">Entitate</th>
                  <th className="th">Notă</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="td whitespace-nowrap text-xs text-muted">
                      {new Date(log.createdAt).toLocaleString("ro-RO", { dateStyle: "short", timeStyle: "short" })}
                    </td>
                    <td className="td">
                      <span className="font-medium">{log.actor?.name ?? "—"}</span>
                      {log.actor?.rankName && <span className="ml-1 text-xs text-muted">{log.actor.rankName}</span>}
                    </td>
                    <td className="td font-mono text-xs text-pink-soft">{log.action}</td>
                    <td className="td font-mono text-xs text-muted">{log.entity}/{log.entityId.slice(0, 8)}</td>
                    <td className="td max-w-xs truncate text-xs text-muted">{log.note ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">Pagina {page} din {totalPages}</span>
          <div className="flex gap-2">
            {page > 1 && (
              <a href={`?${new URLSearchParams({ ...searchParams, page: String(page - 1) })}`} className="btn-ghost text-xs">
                ← Anterioară
              </a>
            )}
            {page < totalPages && (
              <a href={`?${new URLSearchParams({ ...searchParams, page: String(page + 1) })}`} className="btn-ghost text-xs">
                Următoarea →
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
