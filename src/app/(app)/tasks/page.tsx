import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Badge, Card } from "@/components/ui";
import { canManageTasks } from "@/lib/permissions";
import type { AssigneeType, MemberRole, MemberStatus, TaskPriority, TaskStatus } from "@prisma/client";
import { TaskForm } from "./TaskForm";
import { CompleteBtn } from "./CompleteBtn";
import { Clock, AlertTriangle, CheckCircle2, XCircle, MinusCircle } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Taskuri" };

const PRIORITY_TONE: Record<TaskPriority, "emerald" | "gold" | undefined> = {
  SCAZUTA: undefined,
  NORMAL: undefined,
  RIDICATA: "gold",
  URGENTA: undefined,
};
const PRIORITY_LABEL: Record<TaskPriority, string> = {
  SCAZUTA: "Scăzută",
  NORMAL: "Normal",
  RIDICATA: "Ridicată",
  URGENTA: "Urgentă",
};
const STATUS_LABEL: Record<TaskStatus, string> = {
  ACTIV: "Activ",
  FINALIZAT: "Finalizat",
  ANULAT: "Anulat",
};
const ASSIGNEE_LABEL: Record<AssigneeType, string> = {
  TOTI: "Toți membrii",
  GRAD: "Grad",
  DEPARTAMENT: "Departament",
  MEMBRU: "Membru specific",
};

export default async function TasksPage() {
  const session = await getServerSession(authOptions);
  const actorId = session?.user?.memberId ?? "";
  const actorLevel = session?.user?.rankLevel ?? 0;
  const memberRole: MemberRole = (session?.user?.memberRole as MemberRole) ?? "ILEGAL";
  const actor = { id: actorId, rankLevel: actorLevel, status: "ACTIV" as MemberStatus };
  const canCreate = canManageTasks(actor);

  const roleFilter = memberRole === "LEGAL" ? { role: "LEGAL" as MemberRole } : {};

  const [tasks, members, depts, completions] = await Promise.all([
    db.task.findMany({
      where: roleFilter,
      include: {
        createdBy: { select: { name: true } },
        completions: { select: { memberId: true, createdAt: true } },
      },
      orderBy: [{ status: "asc" }, { priority: "desc" }, { createdAt: "desc" }],
    }),
    canCreate
      ? db.member.findMany({
          where: { status: "ACTIV" },
          select: { id: true, name: true, memberCode: true },
          orderBy: [{ rankLevel: "desc" }, { name: "asc" }],
        })
      : Promise.resolve([]),
    canCreate
      ? db.department.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } })
      : Promise.resolve([]),
    canCreate
      ? db.taskCompletion.findMany({
          where: { task: roleFilter },
          select: {
            id: true,
            createdAt: true,
            note: true,
            member: { select: { id: true, name: true, memberCode: true } },
            task: { select: { id: true, title: true, dueDate: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 150,
        })
      : Promise.resolve([]),
  ]);

  const ranks = [
    { rankLevel: 100, rankName: "Boss" },
    { rankLevel: 90, rankName: "Underboss" },
    { rankLevel: 80, rankName: "Consigliere" },
    { rankLevel: 60, rankName: "Capo" },
    { rankLevel: 50, rankName: "Sottocapo" },
    { rankLevel: 30, rankName: "Soldier" },
    { rankLevel: 20, rankName: "Associate" },
  ];

  const activeTasks = tasks.filter((t) => t.status === "ACTIV");
  const doneTasks = tasks.filter((t) => t.status !== "ACTIV");
  const now = new Date();

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="h-page">Taskuri</h1>
          <p className="mt-1 text-sm text-muted">Taskurile active ale organizației.</p>
        </div>
        {canCreate && <TaskForm members={members} depts={depts} ranks={ranks} />}
      </div>

      {tasks.length === 0 && (
        <Card title="Taskuri">
          <p className="text-sm text-muted">Nu există taskuri. Creează primul cu butonul de mai sus.</p>
        </Card>
      )}

      {activeTasks.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted">Active ({activeTasks.length})</h2>
          <div className="space-y-3">
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
                    {!myCompletion ? (
                      <CompleteBtn taskId={task.id} />
                    ) : (
                      <span className="text-xs text-emerald-400">✓ Finalizat de tine</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {doneTasks.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted">Istorice</h2>
          {doneTasks.map((task) => (
            <div key={task.id} className="panel p-4 opacity-60">
              <div className="flex items-center gap-2 text-sm">
                <span>{task.title}</span>
                <Badge>{STATUS_LABEL[task.status]}</Badge>
                <span className="ml-auto text-xs text-muted">{task.completions.length} finalizări</span>
              </div>
            </div>
          ))}
        </section>
      )}

      {canCreate && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted">
              Predări ({completions.length})
            </h2>
          </div>
          {completions.length === 0 ? (
            <Card title="Predări">
              <p className="text-sm text-muted">Nicio predare înregistrată încă.</p>
            </Card>
          ) : (
            <Card pad={false}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead className="bg-white/[.03]">
                    <tr>
                      <th className="th">Membru</th>
                      <th className="th">Task</th>
                      <th className="th">Predat la</th>
                      <th className="th">Termen</th>
                      <th className="th">Status</th>
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
                              <span className="inline-flex items-center gap-1.5 text-xs text-muted">
                                <MinusCircle className="h-3.5 w-3.5" /> Fără termen
                              </span>
                            ) : late ? (
                              <span className="inline-flex items-center gap-1.5 text-xs text-rose-400">
                                <XCircle className="h-3.5 w-3.5" /> Întârziat
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-xs text-emerald">
                                <CheckCircle2 className="h-3.5 w-3.5" /> La timp
                              </span>
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
        </section>
      )}
    </div>
  );
}
