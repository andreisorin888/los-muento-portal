import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Badge, Card } from "@/components/ui";
import { canManageEvents } from "@/lib/permissions";
import type { AttendanceStatus, EventType, MemberStatus } from "@prisma/client";
import { EventForm } from "./EventForm";
import { AttendanceBtn } from "./AttendanceBtn";
import { Calendar, Users } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Calendar Evenimente" };

const TYPE_LABEL: Record<EventType, string> = {
  SEDINTA: "Ședință",
  OPERATIUNE: "Operațiune",
  INSTRUIRE: "Instruire",
  ALTELE: "Altele",
};

const ATTENDANCE_LABEL: Record<AttendanceStatus, string> = {
  INVITAT: "Invitat",
  CONFIRMAT: "Confirmat",
  PREZENT: "Prezent",
  ABSENT: "Absent",
};

const ATTENDANCE_TONE: Record<AttendanceStatus, "emerald" | "gold" | undefined> = {
  INVITAT: undefined,
  CONFIRMAT: "gold",
  PREZENT: "emerald",
  ABSENT: undefined,
};

export default async function EventsPage() {
  const session = await getServerSession(authOptions);
  const actorId = session?.user?.memberId ?? "";
  const actorLevel = session?.user?.rankLevel ?? 0;
  const actor = { id: actorId, rankLevel: actorLevel, status: "ACTIV" as MemberStatus };
  const canCreate = canManageEvents(actor);

  const now = new Date();

  const [events, members] = await Promise.all([
    db.orgEvent.findMany({
      include: {
        createdBy: { select: { name: true } },
        attendance: {
          select: { memberId: true, status: true },
        },
      },
      orderBy: { scheduledAt: "asc" },
    }),
    canCreate
      ? db.member.findMany({
          where: { status: "ACTIV" },
          select: { id: true, name: true, memberCode: true },
          orderBy: [{ rankLevel: "desc" }, { name: "asc" }],
        })
      : Promise.resolve([]),
  ]);

  const upcoming = events.filter((e) => e.scheduledAt >= now);
  const past = events.filter((e) => e.scheduledAt < now);

  function myAttendance(event: (typeof events)[0]) {
    return event.attendance.find((a) => a.memberId === actorId);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="h-page">Calendar Evenimente</h1>
          <p className="mt-1 text-sm text-muted">Evenimente planificate ale organizației.</p>
        </div>
        {canCreate && <EventForm members={members} />}
      </div>

      {upcoming.length === 0 && past.length === 0 && (
        <Card title="Evenimente">
          <p className="text-sm text-muted">Nu există evenimente. Creează primul cu butonul de mai sus.</p>
        </Card>
      )}

      {upcoming.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted">Viitoare</h2>
          <div className="space-y-3">
            {upcoming.map((ev) => {
              const att = myAttendance(ev);
              const confirmed = ev.attendance.filter((a) => a.status === "CONFIRMAT" || a.status === "PREZENT").length;
              return (
                <div key={ev.id} className="panel p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">{ev.title}</span>
                        <Badge>{TYPE_LABEL[ev.type]}</Badge>
                        {att && <Badge tone={ATTENDANCE_TONE[att.status]}>{ATTENDANCE_LABEL[att.status]}</Badge>}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(ev.scheduledAt).toLocaleString("ro-RO", { dateStyle: "medium", timeStyle: "short" })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {confirmed}/{ev.attendance.length} confirmați
                        </span>
                      </div>
                      {ev.description && <p className="text-sm text-muted">{ev.description}</p>}
                    </div>
                    {att && (
                      <div className="shrink-0">
                        <AttendanceBtn eventId={ev.id} current={att.status} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted">Trecute</h2>
          <div className="space-y-2">
            {past.slice().reverse().map((ev) => {
              const att = myAttendance(ev);
              const present = ev.attendance.filter((a) => a.status === "PREZENT").length;
              return (
                <div key={ev.id} className="panel p-4 opacity-70">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{ev.title}</span>
                    <Badge>{TYPE_LABEL[ev.type]}</Badge>
                    {att && <Badge tone={ATTENDANCE_TONE[att.status]}>{ATTENDANCE_LABEL[att.status]}</Badge>}
                    <span className="ml-auto text-xs text-muted">
                      {new Date(ev.scheduledAt).toLocaleDateString("ro-RO", { dateStyle: "medium" })} · {present} prezenți
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
