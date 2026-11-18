import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMemberList } from "@/lib/members";
import { db } from "@/lib/db";
import { site } from "@/config/site";
import { MemberDirectory } from "@/components/MemberDirectory";
import { MemberDirectoryDB } from "./MemberDirectoryDB";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Membri" };

export type TaskWeeklyStatus = {
  completedLatest: boolean;
  missedCount: number;
  latestTaskTitle: string | null;
};

export default async function MembersPage() {
  if (site.showDemo) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="h-page">Membri</h1>
          <p className="mt-1 text-sm text-muted">Toți membrii familiei, cu grad, echipă și situația curentă.</p>
        </div>
        <MemberDirectory />
      </div>
    );
  }

  const session = await getServerSession(authOptions);
  const actorLevel = session?.user?.rankLevel ?? 0;
  const canManage = actorLevel >= 60;
  const [{ members, total }, weeklyTasks] = await Promise.all([
    getMemberList(),
    db.task.findMany({
      where: { assigneeType: "TOTI" },
      select: {
        id: true,
        title: true,
        createdAt: true,
        completions: { select: { memberId: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  const taskStatusMap: Record<string, TaskWeeklyStatus> = {};
  const latestTask = weeklyTasks[0] ?? null;

  for (const m of members) {
    const completedLatest = latestTask
      ? latestTask.completions.some((c) => c.memberId === m.id)
      : true;
    let missedCount = 0;
    for (const t of weeklyTasks) {
      if (!t.completions.some((c) => c.memberId === m.id)) missedCount++;
      else break;
    }
    taskStatusMap[m.id] = {
      completedLatest,
      missedCount,
      latestTaskTitle: latestTask?.title ?? null,
    };
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="h-page">Membri</h1>
        <p className="mt-1 text-sm text-muted">
          {total} {total === 1 ? "membru" : "membri"} activi în organizație.
        </p>
      </div>
      <MemberDirectoryDB
        members={members}
        total={total}
        actorLevel={actorLevel}
        taskStatusMap={taskStatusMap}
        latestTaskId={weeklyTasks[0]?.id ?? null}
        canManageTasks={canManage}
      />
    </div>
  );
}
