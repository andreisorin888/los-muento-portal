import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card } from "@/components/ui";
import { canManageTraining } from "@/lib/permissions";
import type { MemberStatus } from "@prisma/client";
import { GraduationCap, CheckCircle2, Circle } from "lucide-react";
import { CreatePlanBtn, CompleteStepBtn, DeletePlanBtn } from "./TrainingActions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Antrenamente" };

export default async function TrainingPage() {
  const session = await getServerSession(authOptions);
  const actorId = session?.user?.memberId ?? "";
  const actorLevel = session?.user?.rankLevel ?? 0;
  const actor = { id: actorId, rankLevel: actorLevel, status: "ACTIV" as MemberStatus };
  const canManage = canManageTraining(actor);

  const plans = await db.trainingPlan.findMany({
    include: {
      steps: {
        orderBy: { order: "asc" },
        include: {
          progress: {
            where: { memberId: actorId },
            select: { completedAt: true, note: true, proofUrl: true },
          },
        },
      },
      createdBy: { select: { name: true, rankName: true } },
      _count: { select: { progress: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-gold/15 text-gold">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <h1 className="h-page">Antrenamente</h1>
            <p className="mt-0.5 text-sm text-muted">Planuri de antrenament structurate.</p>
          </div>
        </div>
        {canManage && <CreatePlanBtn />}
      </div>

      {plans.length === 0 ? (
        <Card title="Planuri de antrenament">
          <p className="text-sm text-muted">Nu există planuri de antrenament. {canManage && "Creează primul plan."}</p>
        </Card>
      ) : (
        <div className="space-y-5">
          {plans.map((plan) => {
            const completedCount = plan.steps.filter((s) => s.progress.length > 0).length;
            const total = plan.steps.length;
            const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;

            return (
              <div key={plan.id} className="panel p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h3 className="font-semibold">{plan.title}</h3>
                    {plan.description && <p className="text-sm text-muted">{plan.description}</p>}
                    <p className="text-xs text-muted">
                      Creat de {plan.createdBy.name} · {plan.createdBy.rankName}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gold font-semibold">{pct}%</span>
                    {canManage && <DeletePlanBtn planId={plan.id} />}
                  </div>
                </div>

                <div className="h-1.5 w-full rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gold transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="space-y-2">
                  {plan.steps.map((step) => {
                    const done = step.progress.length > 0;
                    return (
                      <div
                        key={step.id}
                        className={`flex items-start gap-3 rounded-lg border p-3 ${
                          done ? "border-emerald-500/20 bg-emerald-500/5" : "border-line"
                        }`}
                      >
                        {done ? (
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                        ) : (
                          <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
                        )}
                        <div className="flex-1 space-y-0.5">
                          <p className={`text-sm font-medium ${done ? "text-emerald-300" : ""}`}>
                            {step.order}. {step.title}
                          </p>
                          {step.description && (
                            <p className="text-xs text-muted">{step.description}</p>
                          )}
                          {done && step.progress[0]?.note && (
                            <p className="text-xs text-muted italic">{step.progress[0].note}</p>
                          )}
                          {done && step.progress[0]?.proofUrl && (
                            <a
                              href={step.progress[0].proofUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-pink-soft underline"
                            >
                              Dovadă ↗
                            </a>
                          )}
                        </div>
                        <CompleteStepBtn planId={plan.id} stepId={step.id} completed={done} />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
