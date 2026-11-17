import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card } from "@/components/ui";
import { canViewManagement, canWriteManagementNote } from "@/lib/permissions";
import type { MemberStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import { NewNoteBtn, DeleteNoteBtn } from "./ManagementActions";
import { ShieldCheck, FileText } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Conducere" };

export default async function ManagementPage() {
  const session = await getServerSession(authOptions);
  const actorId = session?.user?.memberId ?? "";
  const actorLevel = session?.user?.rankLevel ?? 0;
  const actor = { id: actorId, rankLevel: actorLevel, status: "ACTIV" as MemberStatus };

  if (!canViewManagement(actor)) redirect("/dashboard");

  const canWrite = canWriteManagementNote(actor);

  const [notes, memberStats] = await Promise.all([
    db.managementNote.findMany({
      include: { author: { select: { name: true, rankName: true } } },
      orderBy: { createdAt: "desc" },
    }),
    db.member.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
  ]);

  const counts = {
    activ: memberStats.find((s) => s.status === "ACTIV")?._count.id ?? 0,
    inactiv: memberStats.find((s) => s.status === "INACTIV")?._count.id ?? 0,
    suspendat: memberStats.find((s) => s.status === "SUSPENDAT")?._count.id ?? 0,
    probatorie: memberStats.find((s) => s.status === "PROBATORIE")?._count.id ?? 0,
    arhivat: memberStats.find((s) => s.status === "ARHIVAT")?._count.id ?? 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-violet/15 text-violet">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="h-page">Conducere</h1>
            <p className="mt-0.5 text-sm text-muted">Zonă restricționată — Underboss+</p>
          </div>
        </div>
        {canWrite && <NewNoteBtn />}
      </div>

      <div className="grid gap-4 sm:grid-cols-5">
        {[
          ["Activi", counts.activ, "text-emerald-400"],
          ["Inactivi", counts.inactiv, ""],
          ["Probatorie", counts.probatorie, "text-gold"],
          ["Suspendați", counts.suspendat, "text-rose-400"],
          ["Arhivați", counts.arhivat, "text-muted"],
        ].map(([k, v, cls]) => (
          <div key={k as string} className="panel p-4">
            <p className={`font-display text-3xl font-extrabold ${cls}`}>{v}</p>
            <p className="mt-1 text-xs text-muted">{k}</p>
          </div>
        ))}
      </div>

      <Card title="Note interne">
        {notes.length === 0 ? (
          <p className="text-sm text-muted">Nu există note. Adaugă prima cu butonul de mai sus.</p>
        ) : (
          <div className="space-y-3">
            {notes.map((n) => (
              <div key={n.id} className="rounded-xl border border-line p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <FileText className="mt-0.5 h-4 w-4 shrink-0 text-violet" />
                    <div className="space-y-1">
                      <p className="font-semibold">{n.title}</p>
                      <p className="whitespace-pre-wrap text-sm text-white/80">{n.body}</p>
                      <p className="text-xs text-muted">
                        {n.author.name} · {n.author.rankName} · {new Date(n.createdAt).toLocaleDateString("ro-RO", { dateStyle: "medium" })}
                      </p>
                    </div>
                  </div>
                  {canWrite && <DeleteNoteBtn noteId={n.id} />}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
