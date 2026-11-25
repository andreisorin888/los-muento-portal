import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Badge, Card } from "@/components/ui";
import { canManageTasks } from "@/lib/permissions";
import type { AssigneeType, MemberRole, MemberStatus, TaskPriority, TaskStatus } from "@prisma/client";
import { TaskForm } from "./TaskForm";
import { CompleteBtn } from "./CompleteBtn";
import { ArchiveTaskBtn } from "./ArchiveTaskBtn";
import { WeeklyTaskCreateForm, WeeklyTaskBossPanel } from "./WeeklyTaskBoss";
import { WeeklyTaskMemberCard } from "./WeeklyTaskMember";
import { Clock, AlertTriangle, CheckCircle2, XCircle, MinusCircle, CalendarDays } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Taskuri" };

const PRIORITY_TONE: Record<TaskPriority, "emerald" | "gold" | undefined> = {
  SCAZUTA: undefined, NORMAL: undefined, RIDICATA: "gold", URGENTA: undefined,
};
const PRIORITY_LABEL: Record<TaskPriority, string> = {
  SCAZUTA: "Scăzută", NORMAL: "Normal", RIDICATA: "Ridicată", URGENTA: "Urgentă",
};
const STATUS_LABEL: Record<TaskStatus, string> = {
  ACTIV: "Activ", FINALIZAT: "Finalizat", ANULAT: "Anulat",
};
const ASSIGNEE_LABEL: Record<AssigneeType, string> = {
  TOTI: "Toți membrii", GRAD: "Grad", DEPARTAMENT: "Departament", MEMBRU: "Membru specific",
};

type WeeklyTarget = { rankMin: number; rankMax: number; crewIds: string[]; roles: string[] };

export default async function TasksPage() {
  const session = await getServerSession(authOptions);
  const actorId = session?.user?.memberId ?? "";
  const actorLevel = session?.user?.rankLevel ?? 0;
  const memberRole: MemberRole = (session?.user?.memberRole as MemberRole) ?? "ILEGAL";
  const actor = { id: actorId, rankLevel: actorLevel, status: "ACTIV" as MemberStatus };
  const canCreate = canManageTasks(actor);
  const isBoss = actorLevel >= 100;

  const roleFilter = memberRole === "LEGAL" ? { role: "LEGAL" as MemberRole } : {};

  const [tasks, members, depts, completions, crews, activeWeeklyTask, myWeeklySubmission] = await Promise.all([
    db.task.findMany({
      where: { ...roleFilter, status: { not: "ANULAT" } },
      include: {
        createdBy: { select: { name: true } },
        completions: { select: { memberId: true, createdAt: true } },
      },
      orderBy: [{ status: "asc" }, { priority: "desc" }, { createdAt: "desc" }],
    }),
    canCreate
      ? db.member.findMany({ where: { status: "ACTIV" }, select: { id: true, name: true, memberCode: true }, orderBy: [{ rankLevel: "desc" }, { name: "asc" }] })
      : Promise.resolve([]),
    canCreate ? db.department.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }) : Promise.resolve([]),
    canCreate
      ? db.taskCompletion.findMany({
          where: { task: roleFilter },
          select: { id: true, createdAt: true, note: true, member: { select: { id: true, name: true, memberCode: true } }, task: { select: { id: true, title: true, dueDate: true } } },
          orderBy: { createdAt: "desc" },
          take: 150,
        })
      : Promise.resolve([]),
    db.crew.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.weeklyTask.findFirst({
      where: { status: "ACTIV" },
      include: {
        submissions: {
          include: { member: { select: { name: true, memberCode: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    actorId
      ? db.weeklyTaskSubmission.findFirst({
          where: { memberId: actorId, task: { status: "ACTIV" } },
          select: { status: true, note: true },
        })
      : Promise.resolve(null),
  ]);

  const ranks = [
    { rankLevel: 100, rankName: "Boss" }, { rankLevel: 90, rankName: "Underboss" },
    { rankLevel: 80, rankName: "Consigliere" }, { rankLevel: 60, rankName: "Capo" },
    { rankLevel: 50, rankName: "Sottocapo" }, { rankLevel: 30, rankName: "Soldier" },
    { rankLevel: 20, rankName: "Associate" },
  ];

  const activeTasks = tasks.filter((t) => t.status === "ACTIV");
  const doneTasks = tasks.filter((t) => t.status === "FINALIZAT");
  const now = new Date();

  // Check if member is in weekly task target
  const actorCrew = actorId ? await db.member.findUnique({ where: { id: actorId }, select: { crewId: true } }) : null;
  let canSubmitWeekly = false;
  if (activeWeeklyTask && actorId) {
    const target = activeWeeklyTask.targetJson as WeeklyTarget;
    const inRank = actorLevel >= target.rankMin && actorLevel <= target.rankMax;
    const inRole = target.roles.length === 0 || target.roles.includes(memberRole);
    const inCrew = target.crewIds.length === 0 || (actorCrew?.crewId && target.crewIds.includes(actorCrew.crewId));
    canSubmitWeekly = inRank && inRole && !!inCrew;
  }

  return (
    <div className="space-y-8">
      {/* ── Task Săptămânal ──────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-pink" />
          <h2 className="text-lg font-bold">Task Săptămânal</h2>
        </div>

        {isBoss && <WeeklyTaskCreateForm crews={crews} />}

        {activeWeeklyTask ? (
          <div className="panel p-5 space-y-4">
            {/* Task header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-semibold">{activeWeeklyTask.title}</p>
                {activeWeeklyTask.description && <p className="mt-1 text-sm text-muted">{activeWeeklyTask.description}</p>}
              </div>
              <Badge tone="emerald">Activ</Badge>
            </div>

            {/* Boss view: submissions table */}
            {canCreate && (
              <WeeklyTaskBossPanel task={{
                id: activeWeeklyTask.id,
                title: activeWeeklyTask.title,
                description: activeWeeklyTask.description,
                targetJson: activeWeeklyTask.targetJson,
                status: activeWeeklyTask.status,
                submissions: activeWeeklyTask.submissions.map((s) => ({
                  id: s.id,
                  status: s.status,
                  note: s.note,
                  proofUrl: s.proofUrl,
                  createdAt: s.createdAt,
                  rejectReason: s.rejectReason,
                  member: s.member,
                })),
              }} />
            )}

            {/* Member submission area */}
            {!canCreate && canSubmitWeekly && (
              <div className="border-t border-line pt-4">
                <WeeklyTaskMemberCard
                  taskId={activeWeeklyTask.id}
                  taskTitle={activeWeeklyTask.title}
                  taskDescription={activeWeeklyTask.description}
                  mySubmission={myWeeklySubmission}
                />
              </div>
            )}

            {!canCreate && !canSubmitWeekly && (
              <p className="text-sm text-muted">Nu ești în grupul țintă al acestui task.</p>
            )}
          </div>
        ) : (
          <Card title="Task săptămânal">
            <p className="text-sm text-muted">{isBoss ? "Niciun task activ. Publică unul mai sus." : "Niciun task săptămânal activ momentan."}</p>
          </Card>
        )}
      </section>

      {/* ── Taskuri Generale ──────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-bold">Taskuri Generale</h2>
          {canCreate && <TaskForm members={members} depts={depts} ranks={ranks} />}
        </div>

        {tasks.length === 0 && (
          <Card title="Taskuri"><p className="text-sm text-muted">Nu există taskuri.</p></Card>
        )}

        {activeTasks.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted">Active ({activeTasks.length})</h3>
            {activeTasks.map((task) => {
              const isOverdue = task.dueDate && task.dueDate < now;
              const myCompletion = task.completions.find((c) => c.memberId === actorId);
              return (
                <div key={task.id} className={`panel p-5 ${isOverdue ? "border-rose-500/30" : ""}`}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        {task.priority === "URGENTA" && <AlertTriangle className="h-4 w-4 text-rose-400" />}
                        <span className="font-semibold">{task.title}</span>
                        <Badge tone={PRIORITY_TONE[task.priority]}>{PRIORITY_LABEL[task.priority]}</Badge>
                      </div>
                      {task.description && <p className="text-sm text-muted">{task.description}</p>}
                      <div className="flex flex-wrap gap-3 text-xs text-muted">
                        <span>{ASSIGNEE_LABEL[task.assigneeType]}</span>
                        {task.dueDate && (
                          <span className={`flex items-center gap-1 ${isOverdue ? "text-rose-400" : ""}`}>
                            <Clock className="h-3 w-3" />
                            Termen: {new Date(task.dueDate).toLocaleDateString("ro-RO")}
                            {isOverdue ? " (expirat)" : ""}
                          </span>
                        )}
                        <span>{task.completions.length} finalizări</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!myCompletion ? (
                        <CompleteBtn taskId={task.id} />
                      ) : (
                        <span className="text-xs text-emerald-400">✓ Finalizat de tine</span>
                      )}
                      {canCreate && <ArchiveTaskBtn taskId={task.id} />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {doneTasks.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted">Istorice</h3>
            {doneTasks.map((task) => (
              <div key={task.id} className="panel p-4 opacity-60">
                <div className="flex items-center gap-2 text-sm">
                  <span>{task.title}</span>
                  <Badge>{STATUS_LABEL[task.status]}</Badge>
                  <span className="ml-auto text-xs text-muted">{task.completions.length} finalizări</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {canCreate && (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted">Predări ({completions.length})</h3>
            {completions.length === 0 ? (
              <Card title="Predări"><p className="text-sm text-muted">Nicio predare înregistrată încă.</p></Card>
            ) : (
              <Card pad={false}>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead className="bg-white/[.03]">
                      <tr>
                        <th className="th">Membru</th><th className="th">Task</th>
                        <th className="th">Predat la</th><th className="th">Termen</th><th className="th">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {completions.map((c) => {
                        const dueDate = c.task.dueDate;
                        const late = dueDate && c.createdAt > dueDate;
                        const noDeadline = !dueDate;
                        return (
                          <tr key={c.id} className="border-t border-line hover:bg-white/[.02]">
                            <td className="td">
                              <span className="font-gta font-semibold uppercase tracking-wider">{c.member.name}</span>
                              <span className="ml-2 text-xs text-muted">{c.member.memberCode}</span>
                            </td>
                            <td className="td font-medium">{c.task.title}</td>
                            <td className="td text-muted">
                              {c.createdAt.toLocaleDateString("ro-RO")}{" "}
                              <span className="text-xs">{c.createdAt.toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" })}</span>
                            </td>
                            <td className="td text-muted">
                              {dueDate ? new Date(dueDate).toLocaleDateString("ro-RO") : <span className="text-muted/50">—</span>}
                            </td>
                            <td className="td">
                              {noDeadline ? (
                                <span className="inline-flex items-center gap-1.5 text-xs text-muted"><MinusCircle className="h-3.5 w-3.5" /> Fără termen</span>
                              ) : late ? (
                                <span className="inline-flex items-center gap-1.5 text-xs text-rose-400"><XCircle className="h-3.5 w-3.5" /> Întârziat</span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 text-xs text-emerald"><CheckCircle2 className="h-3.5 w-3.5" /> La timp</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {completions.length === 150 && (
                  <p className="border-t border-line px-4 py-3 text-xs text-muted">Se afișează ultimele 150 de predări.</p>
                )}
              </Card>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
