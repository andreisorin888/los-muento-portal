import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Badge, Card } from "@/components/ui";
import { canManageRobberies } from "@/lib/permissions";
import type { MemberStatus, RobberyStatus } from "@prisma/client";
import { RobberyForm } from "./RobberyForm";
import { StatusButton } from "./StatusButton";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Jafuri" };

const STATUS_TONE: Record<RobberyStatus, "emerald" | "rose" | "gold" | undefined> = {
  PLANIFICAT: "gold",
  REUSIT: "emerald",
  ESUAT: "rose",
  ANULAT: undefined,
};
const STATUS_LABEL: Record<RobberyStatus, string> = {
  PLANIFICAT: "Planificat",
  REUSIT: "Reușit",
  ESUAT: "Eșuat",
  ANULAT: "Anulat",
};

export default async function RobberiesPage() {
  const session = await getServerSession(authOptions);
  const actorId = session?.user?.memberId ?? "";
  const actorLevel = session?.user?.rankLevel ?? 0;
  const actor = { id: actorId, rankLevel: actorLevel, status: "ACTIV" as MemberStatus };
  const canManage = canManageRobberies(actor);

  const [robberies, members] = await Promise.all([
    db.robbery.findMany({
      include: {
        leader: { select: { name: true, memberCode: true } },
        participants: { include: { member: { select: { name: true, memberCode: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    canManage
      ? db.member.findMany({
          where: { status: "ACTIV" },
          select: { id: true, name: true, memberCode: true },
          orderBy: [{ rankLevel: "desc" }, { name: "asc" }],
        })
      : Promise.resolve([]),
  ]);

  const stats = {
    total: robberies.length,
    reusit: robberies.filter((r) => r.status === "REUSIT").length,
    esuat: robberies.filter((r) => r.status === "ESUAT").length,
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="h-page">Jafuri</h1>
          <p className="mt-1 text-sm text-muted">Rapoarte de jafuri cu participanți și distribuirea recompensei.</p>
        </div>
        {canManage && <RobberyForm members={members} />}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ["Total rapoarte", stats.total],
          ["Reușite", stats.reusit],
          ["Eșuate", stats.esuat],
        ].map(([k, v]) => (
          <div key={k as string} className="panel p-5">
            <p className="font-display text-4xl font-extrabold">{v}</p>
            <p className="mt-1 text-sm text-muted">{k as string}</p>
          </div>
        ))}
      </div>

      <Card title="Rapoarte jafuri" pad={false}>
        {robberies.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-muted">Nu există rapoarte încă.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead className="bg-white/[.03]">
                <tr>
                  {["Ref.", "Tip", "Lider", "Participanți", "Recompensă", "Stare", ""].map((h) => (
                    <th key={h} className="th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {robberies.map((r) => (
                  <tr key={r.id} className="border-t border-line">
                    <td className="td font-mono text-xs">{r.ref}</td>
                    <td className="td font-medium">{r.type}</td>
                    <td className="td text-sm">{r.leader.name}</td>
                    <td className="td text-sm">
                      {r.participants.length === 0 ? (
                        <span className="text-muted">—</span>
                      ) : (
                        <div className="space-y-0.5">
                          {r.participants.map((p) => (
                            <div key={p.id} className="flex items-center justify-between gap-3 text-xs">
                              <span>{p.member.name}</span>
                              {p.share > 0 && (
                                <span className="font-mono text-gold">${p.share.toLocaleString("ro-RO")}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="td font-display font-bold text-gold">${r.reward.toLocaleString("ro-RO")}</td>
                    <td className="td">
                      <Badge tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</Badge>
                    </td>
                    <td className="td">
                      {canManage && <StatusButton robberyId={r.id} current={r.status} />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
