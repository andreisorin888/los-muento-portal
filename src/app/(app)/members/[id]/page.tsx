import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { ArrowLeft, ShieldAlert, Archive } from "lucide-react";
import { Badge, Card } from "@/components/ui";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getMemberById } from "@/lib/members";
import {
  canPromoteDemote,
  canIssueWarning,
  canChangeStatus,
  canArchiveMember,
  canEditMemberProfile,
  canEditCoreProfile,
} from "@/lib/permissions";
import type { MemberRole, MemberStatus } from "@prisma/client";
import { site } from "@/config/site";
import { members as demoMembers } from "@/lib/demo-data";
import { MemberActions } from "./_components/MemberActions";
import { RankHistorySection } from "./_components/RankHistorySection";
import { WarningsSection } from "./_components/WarningsSection";

export const dynamic = "force-dynamic";
export const dynamicParams = true;

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  if (site.showDemo) {
    const m = demoMembers.find((x) => x.id === params.id);
    return { title: m?.name ?? "Membru" };
  }
  const m = await getMemberById(params.id);
  return { title: m?.name ?? "Membru" };
}

const STATUS_LABELS: Record<MemberStatus, string> = {
  ACTIV: "Activ",
  INACTIV: "Inactiv",
  SUSPENDAT: "Suspendat",
  PROBATORIE: "Perioadă de probă",
  ARHIVAT: "Arhivat",
};

const ROLE_LABELS: Record<MemberRole, string> = { LEGAL: "Legal", ILEGAL: "Ilegal" };
const ROLE_TONE: Record<MemberRole, "emerald" | "rose"> = { LEGAL: "emerald", ILEGAL: "rose" };

export default async function MemberPage({ params }: { params: { id: string } }) {
  if (site.showDemo) {
    const m = demoMembers.find((x) => x.id === params.id);
    if (!m) notFound();
    return (
      <div className="space-y-5">
        <Link href="/members" className="inline-flex items-center gap-2 text-sm text-muted hover:text-white">
          <ArrowLeft className="h-4 w-4" />Toți membrii
        </Link>
        <section className="panel flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
          <div
            className="grid h-24 w-24 shrink-0 place-items-center rounded-2xl font-display text-5xl font-extrabold text-ink"
            style={{ background: m.hue }}
          >
            {m.initials}
          </div>
          <div className="flex-1">
            <h1 className="h-page">{m.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge tone="gold">{m.rank}</Badge>
              <Badge>{m.status}</Badge>
            </div>
          </div>
        </section>
        <Card title="Istoric">
          <p className="text-sm text-muted">Istoricul de grad, avertismentele și schimbările de stare apar în modul producție.</p>
        </Card>
      </div>
    );
  }

  const [member, session, depts, crews] = await Promise.all([
    getMemberById(params.id),
    getServerSession(authOptions),
    db.department.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.crew.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  if (!member) notFound();

  const actorId = session?.user?.memberId ?? "";
  const actorLevel = session?.user?.rankLevel ?? 0;
  const actor = { id: actorId, rankLevel: actorLevel, status: "ACTIV" as MemberStatus };

  const perms = {
    canEdit: canEditMemberProfile(actor, member.id),
    canEditCore: canEditCoreProfile(actor),
    canPromote: canPromoteDemote(actor, member.rankLevel),
    canWarn: canIssueWarning(actor),
    canStatus: canChangeStatus(actor),
    canArchive: canArchiveMember(actor) && member.status !== "ARHIVAT" && member.id !== actorId,
  };

  const facts: [string, string][] = [
    ["Cod membru", member.memberCode],
    ["Discord", member.discordName],
    ["Departament", member.dept?.name ?? "—"],
    ["Echipă", member.crew?.name ?? "—"],
    ["Capul echipei", member.crew?.capo?.name ?? "—"],
    ["Înscris la", new Date(member.joinedAt).toLocaleDateString("ro-RO")],
    ["Recrutat de", member.recruitedBy ? `${member.recruitedBy.name} (${member.recruitedBy.memberCode})` : "—"],
  ];

  if (member.status === "ARHIVAT" && member.archivedAt) {
    facts.push(["Arhivat la", new Date(member.archivedAt).toLocaleDateString("ro-RO")]);
  }

  return (
    <div className="space-y-5">
      <Link href="/members" className="inline-flex items-center gap-2 text-sm text-muted hover:text-white">
        <ArrowLeft className="h-4 w-4" />Toți membrii
      </Link>

      <section className="panel flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
        <div className="flex-1">
          <h1 className="h-page">{member.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge tone="gold">{member.rankName}</Badge>
            <Badge tone={ROLE_TONE[member.role]}>{ROLE_LABELS[member.role]}</Badge>
            <Badge>{STATUS_LABELS[member.status]}</Badge>
          </div>
        </div>
        {member.status === "ARHIVAT" && (
          <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            <Archive className="h-4 w-4 shrink-0" />
            <span>Arhivat{member.archivedNote ? ` — ${member.archivedNote}` : ""}</span>
          </div>
        )}
      </section>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card title="Identitate și organizație">
          <dl className="space-y-3 text-sm">
            {facts.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4">
                <dt className="text-muted">{k}</dt>
                <dd className="text-right font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card title="Statistici recruți" className="lg:col-span-2">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              ["Total recruți", member._count.recruits],
              ["Avertismente", member._count.warnings],
              ["Schimbări de grad", member._count.rankHistory],
              ["Puncte activitate", member.points],
            ].map(([k, v]) => (
              <div key={k as string} className="rounded-xl bg-white/[.04] p-4">
                <p className="font-display text-3xl font-extrabold">{v}</p>
                <p className="text-xs text-muted">{k as string}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {(perms.canEdit || perms.canEditCore || perms.canPromote || perms.canWarn || perms.canStatus || perms.canArchive) && (
        <MemberActions
          memberId={member.id}
          currentRank={member.rankName}
          currentStatus={member.status}
          currentRole={member.role}
          currentName={member.name}
          currentDiscordName={member.discordName}
          currentDeptId={member.deptId ?? null}
          currentCrewId={member.crewId ?? null}
          depts={depts}
          crews={crews}
          actorLevel={actorLevel}
          perms={perms}
        />
      )}

      <RankHistorySection history={member.rankHistory} />
      <WarningsSection warnings={member.warnings} actorId={actorId} canWarn={perms.canWarn} memberId={member.id} />
    </div>
  );
}
