import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Badge, Card } from "@/components/ui";
import { canManageTasks } from "@/lib/permissions";
import type { AssigneeType, MemberStatus, TaskPriority, TaskStatus } from "@prisma/client";
import { TaskForm } from "./TaskForm";
import { CompleteBtn } from "./CompleteBtn";
import { Clock, AlertTriangle } from "lucide-react";

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
  const actor = { id: actorId, rankLevel: actorLevel, status: "ACTIV" as MemberStatus };
  const canCreate = canManageTasks(actor);

  const [tasks, members, depts] = await Promise.all([
    db.task.findMany({
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
    </div>
  );
}
