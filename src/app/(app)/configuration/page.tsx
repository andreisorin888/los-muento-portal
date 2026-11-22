import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { site } from "@/config/site";
import { Settings, Users, Shield, Flame } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { canManageConfig } from "@/lib/permissions";
import type { MemberStatus } from "@prisma/client";
import { getDepartmentList } from "@/lib/departments";
import { getCrewList, getCaposWithoutCrew } from "@/lib/crews";
import { getActivityCategories } from "@/app/actions/activityCategories";
import { getChestItemTypes } from "@/app/actions/chestItems";
import { RANKS } from "@/config/nav";
import { Card } from "@/components/ui";
import { DeptManager } from "./DeptManager";
import { CrewManager } from "./CrewManager";
import { ActivityCategoryManager } from "./ActivityCategoryManager";
import { ChestItemTypeManager } from "./ChestItemTypeManager";
import { ProofCleanupManager } from "./ProofCleanupManager";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Configurare" };

export default async function ConfigurationPage() {
  if (site.showDemo) {
    return (
      <div className="space-y-5">
        <h1 className="h-page">Configurare</h1>
        <Card title="Date demo">
          <p className="text-sm text-muted">Departamentele, echipele și setările se administrează pe date reale. Configurează baza de date pentru a activa acest modul.</p>
        </Card>
      </div>
    );
  }

  const session = await getServerSession(authOptions);
  const actorId = session?.user?.memberId ?? "";
  const actorLevel = session?.user?.rankLevel ?? 0;
  const actor = { id: actorId, rankLevel: actorLevel, status: "ACTIV" as MemberStatus };

  if (!canManageConfig(actor)) redirect("/dashboard");

  const [depts, crews, freeCapos, activityCategories, chestItemTypes] = await Promise.all([
    getDepartmentList(),
    getCrewList(),
    getCaposWithoutCrew(),
    getActivityCategories(),
    getChestItemTypes(),
  ]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="h-page">Configurare</h1>
        <p className="mt-1 text-sm text-muted">
          Grade, departamente, echipe și setări organizaționale. Accesibil doar Boss-ului.
        </p>
      </div>

      {/* Rank definitions */}
      <Card title="Grade și niveluri">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[400px]">
            <thead className="bg-white/[.03]">
              <tr>
                {["Grad", "Nivel acces", "Permisiuni cheie"].map((h) => (
                  <th key={h} className="th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...RANKS].reverse().map((r) => (
                <tr key={r.name} className="border-t border-line">
                  <td className="td font-semibold">{r.name}</td>
                  <td className="td font-display text-lg font-extrabold text-pink">{r.level}</td>
                  <td className="td text-sm text-muted">
                    {r.level >= 100 && "Configurare completă · "}
                    {r.level >= 90 && "Arhivare membri · "}
                    {r.level >= 80 && "Promovare/retrogradare · "}
                    {r.level >= 60 && "Recrutare · Avertismente"}
                    {r.level < 60 && "Vizualizare date proprii"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted">Nivelurile de acces sunt definite în cod și configurabile în faza viitoare.</p>
      </Card>

      {/* Activity categories */}
      <ActivityCategoryManager categories={activityCategories} />

      {/* Chest item types */}
      <ChestItemTypeManager items={chestItemTypes} />

      {/* Departments */}
      <DeptManager depts={depts} />

      {/* Crews */}
      <CrewManager crews={crews} freeCapos={freeCapos} depts={depts} />

      {/* Proof image cleanup */}
      <Card title="Curățare poze dovezi">
        <ProofCleanupManager />
      </Card>
    </div>
  );
}
