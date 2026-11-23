import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, Badge } from "@/components/ui";
import { getCrewTasksForActor } from "@/app/actions/crewTasks";
import { CreateCrewTaskForm } from "./CreateCrewTaskForm";
import { SubmitCrewTaskForm } from "./SubmitCrewTaskForm";
import { CrewTaskActions } from "./CrewTaskActions";
import { Users, CalendarDays, CheckCircle2, Clock } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Taskuri echipă" };

function statusLabel(s: string) {
  if (s === "ACTIV") return "Activ";
  if (s === "FINALIZAT") return "Finalizat";
  return s;
}
function statusTone(s: string): "emerald" | "gold" | undefined {
  if (s === "FINALIZAT") return "emerald";
  if (s === "ACTIV") return "gold";
  return undefined;
}

export default async function CrewTasksPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.memberId) redirect("/login");

  const memberId = session.user.memberId;
  const { tasks, myCrewId, isCapo } = await getCrewTasksForActor();

  // For the create form: Boss/Underboss sees all crews, Capo sees only their own
  const actorLevel = session.user.rankLevel ?? 0;
  let availableCrews: { id: string; name: string }[] = [];
  if (isCapo) {
    if (actorLevel >= 90) {
      availableCrews = await db.crew.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } });
    } else {
      const actor = await db.member.findUnique({
        where: { id: memberId },
        select: { captainOfCrew: { select: { id: true, name: true } } },
      });
      if (actor?.captainOfCrew) availableCrews = [actor.captainOfCrew];
    }
  }

  const activeTasks = tasks.filter((t) => t.status === "ACTIV");
  const finishedTasks = tasks.filter((t) => t.status === "FINALIZAT");

  // Group active tasks by crew
  const tasksByCrew = new Map<string, typeof tasks>();
  for (const t of activeTasks) {
    const arr = tasksByCrew.get(t.crewId) ?? [];
    arr.push(t);
    tasksByCrew.set(t.crewId, arr);
  }

  if (tasks.length === 0 && !isCapo) {
    return (
      <div className="space-y-5">
        <h1 className="h-page">Taskuri echipă</h1>
        <Card title="Niciun task activ">
          <p className="text-sm text-muted">
            {myCrewId
              ? "Nu există taskuri active pentru echipa ta momentan."
              : "Nu ești asignat la o echipă. Contactează un Capo pentru a fi adăugat."}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="h-page">Taskuri echipă</h1>
          <p className="mt-1 text-sm text-muted">
            {isCapo
              ? "Setează ce trebuie să aducă fiecare echipă și urmărește predările."
              : "Taskurile active ale echipei tale. Confirmă predarea când ești gata."}
          </p>
        </div>
        {isCapo && availableCrews.length > 0 && <CreateCrewTaskForm crews={availableCrews} />}
      </div>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="panel p-4 flex items-center gap-3">
          <Clock className="h-5 w-5 text-gold shrink-0" />
          <div>
            <p className="font-display text-2xl font-extrabold text-gold">{activeTasks.length}</p>
            <p className="text-xs text-muted">Taskuri active</p>
          </div>
        </div>
        <div className="panel p-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald shrink-0" />
          <div>
            <p className="font-display text-2xl font-extrabold text-emerald">{finishedTasks.length}</p>
            <p className="text-xs text-muted">Finalizate</p>
          </div>
        </div>
        <div className="panel p-4 flex items-center gap-3">
          <Users className="h-5 w-5 text-violet shrink-0" />
          <div>
            <p className="font-display text-2xl font-extrabold">
              {activeTasks.reduce((s, t) => s + t.submissions.length, 0)}
            </p>
            <p className="text-xs text-muted">Predări totale (active)</p>
          </div>
        </div>
      </div>

      {/* Active tasks grouped by crew */}
      {activeTasks.length === 0 && (
        <Card title="Niciun task activ">
          <p className="text-sm text-muted">Toate taskurile au fost finalizate sau anulate.</p>
        </Card>
      )}

      {Array.from(tasksByCrew.entries()).map(([crewId, crewTasks]) => {
        const crew = crewTasks[0]?.crew;
        if (!crew) return null;
        return (
          <section key={crewId} className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-pink" />
              <h2 className="font-gta text-lg font-bold uppercase tracking-widest">{crew.name}</h2>
            </div>

            {crewTasks.map((task) => {
              const submittedIds = new Set(task.submissions.map((s) => s.memberId));
              const mySubmission = task.submissions.find((s) => s.memberId === memberId);
              const submittedCount = task.submissions.length;
              const memberCount = crew.members.length;

              return (
                <div key={task.id} className="panel p-5 space-y-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold truncate">{task.title}</h3>
                        <Badge tone={statusTone(task.status)}>{statusLabel(task.status)}</Badge>
                      </div>
                      {task.description && (
                        <p className="mt-1 text-sm text-muted">{task.description}</p>
                      )}
                      {task.dueDate && (
                        <p className="mt-1 text-xs text-muted flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          Termen: {new Date(task.dueDate).toLocaleDateString("ro-RO")}
                        </p>
                      )}
                    </div>
                    {isCapo && <CrewTaskActions taskId={task.id} />}
                  </div>

                  {/* Progress bar */}
                  <div>
                    <div className="flex items-center justify-between mb-1 text-xs text-muted">
                      <span>{submittedCount} / {memberCount} predați</span>
                      <span>{memberCount > 0 ? Math.round((submittedCount / memberCount) * 100) : 0}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/[.06] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald transition-all"
                        style={{ width: memberCount > 0 ? `${(submittedCount / memberCount) * 100}%` : "0%" }}
                      />
                    </div>
                  </div>

                  {/* Member submission grid */}
                  {isCapo ? (
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {crew.members.map((m) => {
                        const sub = task.submissions.find((s) => s.memberId === m.id);
                        return (
                          <div
                            key={m.id}
                            className={`flex items-center gap-2.5 rounded-xl p-3 ${
                              sub ? "bg-emerald/8 border border-emerald/20" : "bg-white/[.03] border border-panel/40"
                            }`}
                          >
                            <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${sub ? "bg-emerald" : "bg-muted/40"}`} />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold truncate font-gta uppercase tracking-wide">{m.name}</p>
                              <p className="text-xs text-muted truncate">{m.rankName}</p>
                              {sub?.note && <p className="text-xs text-muted mt-0.5 truncate">„{sub.note}"</p>}
                            </div>
                            {sub ? (
                              <span className="text-xs text-emerald font-semibold shrink-0">✓</span>
                            ) : (
                              <span className="text-xs text-muted shrink-0">—</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    // Member view: just show their own status + submit form
                    <div>
                      {myCrewId === crewId && (
                        <SubmitCrewTaskForm taskId={task.id} alreadySubmitted={!!mySubmission} />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </section>
        );
      })}

      {/* Finished tasks archive */}
      {finishedTasks.length > 0 && (
        <Card title="Taskuri finalizate" pad={false}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead className="bg-white/[.03]">
                <tr>
                  <th className="th">Task</th>
                  <th className="th">Echipă</th>
                  <th className="th">Predați</th>
                  <th className="th">Creat la</th>
                </tr>
              </thead>
              <tbody>
                {finishedTasks.map((t) => (
                  <tr key={t.id} className="border-t border-line">
                    <td className="td font-medium">{t.title}</td>
                    <td className="td text-muted">{t.crew.name}</td>
                    <td className="td">
                      <span className="text-emerald font-semibold">{t.submissions.length}</span>
                      <span className="text-muted"> / {t.crew.members.length}</span>
                    </td>
                    <td className="td text-sm text-muted">{new Date(t.createdAt).toLocaleDateString("ro-RO")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
