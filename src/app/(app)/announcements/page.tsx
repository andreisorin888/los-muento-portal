import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card } from "@/components/ui";
import { canCreateAnnouncement } from "@/lib/permissions";
import type { MemberStatus } from "@prisma/client";
import { NewAnnouncementBtn, DeleteAnnouncementBtn, MarkReadBtn } from "./AnnouncementActions";
import { Megaphone } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Anunțuri" };

export default async function AnnouncementsPage() {
  const session = await getServerSession(authOptions);
  const actorId = session?.user?.memberId ?? "";
  const actorLevel = session?.user?.rankLevel ?? 0;
  const actor = { id: actorId, rankLevel: actorLevel, status: "ACTIV" as MemberStatus };
  const canCreate = canCreateAnnouncement(actor);

  const announcements = await db.announcement.findMany({
    where: { minLevel: { lte: actorLevel } },
    include: {
      author: { select: { name: true, rankName: true } },
      reads: { where: { memberId: actorId }, select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const unread = announcements.filter((a) => a.reads.length === 0);
  const read = announcements.filter((a) => a.reads.length > 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="h-page">Anunțuri</h1>
          <p className="mt-1 text-sm text-muted">Comunicările conducerii.</p>
        </div>
        {canCreate && <NewAnnouncementBtn />}
      </div>

      {announcements.length === 0 && (
        <Card title="Anunțuri">
          <p className="text-sm text-muted">Nu există anunțuri.</p>
        </Card>
      )}

      {unread.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted">Necitite ({unread.length})</h2>
          <div className="space-y-3">
            {unread.map((a) => (
              <div key={a.id} className="panel border-l-2 border-pink p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <Megaphone className="mt-0.5 h-5 w-5 shrink-0 text-pink" />
                    <div className="space-y-1">
                      <p className="font-semibold">{a.title}</p>
                      <p className="whitespace-pre-wrap text-sm text-white/80">{a.body}</p>
                      <p className="text-xs text-muted">
                        {a.author.name} · {a.author.rankName} · {new Date(a.createdAt).toLocaleDateString("ro-RO", { dateStyle: "medium" })}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <MarkReadBtn id={a.id} />
                    {(canCreate) && <DeleteAnnouncementBtn id={a.id} />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {read.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted">Citite</h2>
          <div className="space-y-2">
            {read.map((a) => (
              <div key={a.id} className="panel p-4 opacity-60">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{a.title}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {a.author.name} · {new Date(a.createdAt).toLocaleDateString("ro-RO", { dateStyle: "medium" })}
                    </p>
                  </div>
                  {canCreate && <DeleteAnnouncementBtn id={a.id} />}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
