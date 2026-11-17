import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Badge, Card } from "@/components/ui";
import { canManageTerritories, canManageConfig } from "@/lib/permissions";
import type { MemberStatus, TerritoryStatus } from "@prisma/client";
import { TerritoryStatusBtn, AddTerritoryBtn } from "./TerritoryActions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Teritorii" };

const STATUS_TONE: Record<TerritoryStatus, "emerald" | "gold" | undefined> = {
  CONTROLAT: "emerald",
  CONTESTAT: "gold",
  NEUTRU: undefined,
};
const STATUS_LABEL: Record<TerritoryStatus, string> = {
  CONTROLAT: "Controlat",
  CONTESTAT: "Contestat",
  NEUTRU: "Neutru",
};

export default async function TerritoriesPage() {
  const session = await getServerSession(authOptions);
  const actorLevel = session?.user?.rankLevel ?? 0;
  const actorId = session?.user?.memberId ?? "";
  const actor = { id: actorId, rankLevel: actorLevel, status: "ACTIV" as MemberStatus };
  const canManage = canManageTerritories(actor);
  const canAdd = canManageConfig(actor);

  const [territories, members] = await Promise.all([
    db.territory.findMany({
      include: {
        controlledBy: { select: { name: true } },
        history: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { name: "asc" },
    }),
    canManage
      ? db.member.findMany({
          where: { status: "ACTIV" },
          select: { id: true, name: true },
          orderBy: [{ rankLevel: "desc" }, { name: "asc" }],
        })
      : Promise.resolve([]),
  ]);

  const counts = {
    controlat: territories.filter((t) => t.status === "CONTROLAT").length,
    contestat: territories.filter((t) => t.status === "CONTESTAT").length,
    neutru: territories.filter((t) => t.status === "NEUTRU").length,
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="h-page">Teritorii</h1>
          <p className="mt-1 text-sm text-muted">Harta de control a teritoriilor organizației.</p>
        </div>
        {canAdd && <AddTerritoryBtn />}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {([["Controlate", counts.controlat, "emerald"], ["Contestate", counts.contestat, "gold"], ["Neutre", counts.neutru, ""]] as const).map(([k, v]) => (
          <div key={k} className="panel p-5">
            <p className="font-display text-4xl font-extrabold">{v}</p>
            <p className="mt-1 text-sm text-muted">{k}</p>
          </div>
        ))}
      </div>

      {territories.length === 0 ? (
        <Card title="Teritorii">
          <p className="text-sm text-muted">Nu există teritorii definite. Adaugă primul cu butonul de mai sus.</p>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {territories.map((t) => (
            <div key={t.id} className="panel flex flex-col gap-3 p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{t.name}</p>
                  {t.description && <p className="mt-0.5 text-xs text-muted">{t.description}</p>}
                </div>
                <Badge tone={STATUS_TONE[t.status]}>{STATUS_LABEL[t.status]}</Badge>
              </div>
              {t.status === "CONTROLAT" && t.controlledBy && (
                <p className="text-xs text-muted">Controlat de: <span className="text-white">{t.controlledBy.name}</span></p>
              )}
              {t.history[0] && (
                <p className="text-xs text-muted">
                  Ultima modificare: {new Date(t.history[0].createdAt).toLocaleDateString("ro-RO")}
                  {t.history[0].note ? ` — ${t.history[0].note}` : ""}
                </p>
              )}
              {canManage && (
                <div className="mt-auto pt-1">
                  <TerritoryStatusBtn territoryId={t.id} current={t.status} members={members} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
