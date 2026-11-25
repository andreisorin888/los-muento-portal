import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Badge, Card } from "@/components/ui";
import { canManageTerritories, canManageConfig } from "@/lib/permissions";
import type { MemberStatus, TerritoryStatus } from "@prisma/client";
import { TerritoryStatusBtn, AddTerritoryBtn, BulkImportBtn } from "./TerritoryActions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Teritorii" };

const STATUS_TONE: Record<TerritoryStatus, "emerald" | "gold" | "rose" | undefined> = {
  CONTROLAT: "emerald",
  CONTESTAT: "gold",
  NEUTRU: undefined,
  CU_ARME: "emerald",
  FARA_ARME: "rose",
};
const STATUS_LABEL: Record<TerritoryStatus, string> = {
  CONTROLAT: "Controlat",
  CONTESTAT: "Contestat",
  NEUTRU: "Neutru",
  CU_ARME: "Cu arme",
  FARA_ARME: "Fără arme",
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
      orderBy: [{ zone: "asc" }, { name: "asc" }],
    }),
    canManage
      ? db.member.findMany({
          where: { status: "ACTIV" },
          select: { id: true, name: true },
          orderBy: [{ rankLevel: "desc" }, { name: "asc" }],
        })
      : Promise.resolve([]),
  ]);

  // Group by zone — Oraș first, Cayo second, then anything else, then ungrouped
  const ZONE_ORDER = ["Oraș", "Cayo"];
  const groups = new Map<string, typeof territories>();
  for (const t of territories) {
    const key = t.zone ?? "";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(t);
  }
  const sortedZones = Array.from(groups.keys()).sort((a, b) => {
    const ia = ZONE_ORDER.indexOf(a);
    const ib = ZONE_ORDER.indexOf(b);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    if (!a) return 1;
    if (!b) return -1;
    return a.localeCompare(b, "ro");
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="h-page">Teritorii</h1>
          <p className="mt-1 text-sm text-muted">Harta de control a teritoriilor organizației.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canAdd && <BulkImportBtn />}
          {canAdd && <AddTerritoryBtn />}
        </div>
      </div>

{territories.length === 0 ? (
        <Card title="Teritorii">
          <p className="text-sm text-muted">Nu există teritorii definite. Adaugă primul cu butonul de mai sus.</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {sortedZones.map((zone) => (
            <section key={zone || "_ungrouped"}>
              {zone && (
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted">
                  {zone}
                </h2>
              )}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {groups.get(zone)!.map((t) => (
                  <div key={t.id} className="panel flex flex-col gap-3 p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold">{t.name}</p>
                        {t.description && <p className="mt-0.5 text-xs text-muted">{t.description}</p>}
                      </div>
                      <Badge tone={STATUS_TONE[t.status]}>{STATUS_LABEL[t.status]}</Badge>
                    </div>

                    {/* Faction / controller display */}
                    {t.controllerName && (
                      <p className="text-sm font-medium text-violet">
                        {t.controllerName}
                      </p>
                    )}
                    {t.controlledBy && (
                      <p className="text-xs text-muted">
                        Responsabil intern: <span className="text-white">{t.controlledBy.name}</span>
                      </p>
                    )}

                    <p className="text-xs text-muted">
                      Ultima modificare:{" "}
                      {new Date(t.history[0]?.createdAt ?? t.updatedAt).toLocaleDateString("ro-RO", { day: "2-digit", month: "2-digit", year: "numeric" })}
                      {t.history[0]?.note ? ` — ${t.history[0].note}` : ""}
                    </p>
                    {canManage && (
                      <div className="mt-auto pt-1">
                        <TerritoryStatusBtn
                          territoryId={t.id}
                          current={t.status}
                          currentControllerName={t.controllerName}
                          members={members}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
