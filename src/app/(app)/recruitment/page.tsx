import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { UserPlus } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { getRecruitList, getRecruitStats } from "@/lib/recruitment";
import { canApproveRecruit, canManageRecruit } from "@/lib/permissions";
import type { MemberStatus } from "@prisma/client";
import { Badge, StatCard, Card } from "@/components/ui";
import { RecruitActions } from "./RecruitActions";
import { AddRecruitForm } from "./AddRecruitForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Recrutare" };

const STATUS_LABELS: Record<string, string> = {
  CANDIDAT: "Candidat",
  PROBATIE: "Perioadă de probă",
  APROBAT: "Aprobat",
  RESPINS: "Respins",
};

import { site } from "@/config/site";
import { Card as UiCard } from "@/components/ui";

export default async function RecruitmentPage() {
  if (site.showDemo) {
    return (
      <div className="space-y-5">
        <h1 className="h-page">Recrutare</h1>
        <UiCard title="Date demo">
          <p className="text-sm text-muted">Modulul de recrutare funcționează pe date reale. Configurează baza de date și autentificarea Discord pentru a-l activa.</p>
        </UiCard>
      </div>
    );
  }
  const session = await getServerSession(authOptions);
  const actorId = session?.user?.memberId ?? "";
  const actorLevel = session?.user?.rankLevel ?? 0;
  const actor = { id: actorId, rankLevel: actorLevel, status: "ACTIV" as MemberStatus };

  const canApprove = canApproveRecruit(actor);
  const canManage = canManageRecruit(actor);

  const [{ recruits, total }, stats] = await Promise.all([
    getRecruitList({ status: undefined }),
    getRecruitStats(),
  ]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="h-page">Recrutare</h1>
          <p className="mt-1 text-sm text-muted">
            Recruți, perioadă de probă și performanța recrutorilor.
          </p>
        </div>
        {canManage && <AddRecruitForm actorId={actorId} />}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total recruți" value={stats.total} icon={UserPlus} accent="violet" />
        <StatCard label="În probă" value={stats.inProbation} icon={UserPlus} accent="gold" />
        <StatCard label="Aprobați" value={stats.approved} icon={UserPlus} accent="emerald" />
        <StatCard label="Respinși" value={stats.rejected} icon={UserPlus} accent="pink" />
      </div>

      <Card pad={false}>
        <div className="border-b border-line px-5 py-4">
          <h2 className="h-card">Toți recruții</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="bg-white/[.03]">
              <tr>
                {["Discord", "Recrutor", "Stare", "Înscris la", "Acțiuni"].map((h) => (
                  <th key={h} className="th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recruits.map((r) => (
                <tr key={r.id} className="border-t border-line hover:bg-white/[.03]">
                  <td className="td font-medium">{r.discordName}</td>
                  <td className="td text-sm text-muted">
                    {r.recruitedBy.name} ({r.recruitedBy.memberCode})
                  </td>
                  <td className="td">
                    <Badge>{STATUS_LABELS[r.status] ?? r.status}</Badge>
                  </td>
                  <td className="td text-sm text-muted">
                    {new Date(r.createdAt).toLocaleDateString("ro-RO")}
                  </td>
                  <td className="td">
                    {r.status !== "APROBAT" && r.status !== "RESPINS" && (
                      <RecruitActions
                        recruitId={r.id}
                        status={r.status}
                        recruiterId={r.recruitedById}
                        canApprove={canApprove}
                        actorId={actorId}
                        actorLevel={actorLevel}
                      />
                    )}
                  </td>
                </tr>
              ))}
              {!recruits.length && (
                <tr>
                  <td colSpan={5} className="td py-10 text-center text-muted">
                    Niciun recrut înregistrat.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="border-t border-line px-4 py-3 text-xs text-muted">{total} total</p>
      </Card>
    </div>
  );
}
