import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card } from "@/components/ui";
import { canCreatePoll } from "@/lib/permissions";
import type { MemberStatus } from "@prisma/client";
import { Vote, Clock } from "lucide-react";
import { CreatePollBtn, VoteBtn, ClosePollBtn } from "./PollActions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Sondaje" };

export default async function PollsPage() {
  const session = await getServerSession(authOptions);
  const actorId = session?.user?.memberId ?? "";
  const actorLevel = session?.user?.rankLevel ?? 0;
  const actor = { id: actorId, rankLevel: actorLevel, status: "ACTIV" as MemberStatus };
  const canCreate = canCreatePoll(actor);
  const now = new Date();

  const polls = await db.poll.findMany({
    where: { minLevel: { lte: actorLevel } },
    include: {
      options: { include: { votes: { select: { memberId: true } } } },
      votes: { where: { memberId: actorId }, select: { optionId: true } },
      createdBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const open = polls.filter((p) => p.endsAt > now);
  const closed = polls.filter((p) => p.endsAt <= now);

  function PollCard({ poll }: { poll: (typeof polls)[0] }) {
    const myVote = poll.votes[0]?.optionId ?? null;
    const totalVotes = poll.options.reduce((s, o) => s + o.votes.length, 0);
    const hasVoted = !!myVote;
    const isOpen = poll.endsAt > now;

    return (
      <div className="panel p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h3 className="font-semibold leading-snug">{poll.question}</h3>
            {poll.description && <p className="text-sm text-muted">{poll.description}</p>}
            <p className="text-xs text-muted">
              {poll.createdBy.name} ·{" "}
              {isOpen ? (
                <span className="text-gold">
                  <Clock className="inline h-3 w-3 mr-0.5" />
                  Expiră {new Date(poll.endsAt).toLocaleString("ro-RO", { dateStyle: "short", timeStyle: "short" })}
                </span>
              ) : (
                <span>Închis · {totalVotes} voturi</span>
              )}
            </p>
          </div>
          {isOpen && canCreate && (
            <ClosePollBtn pollId={poll.id} />
          )}
        </div>

        <div className="space-y-2">
          {poll.options.map((opt) => {
            const count = opt.votes.length;
            const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
            const isMyChoice = myVote === opt.id;

            return (
              <div key={opt.id} className="space-y-1">
                <div className="flex items-center justify-between gap-3">
                  <span className={`text-sm ${isMyChoice ? "text-pink-soft font-medium" : ""}`}>{opt.text}</span>
                  {(hasVoted || !isOpen) && (
                    <span className="text-xs text-muted whitespace-nowrap">{count} ({pct}%)</span>
                  )}
                </div>
                {(hasVoted || !isOpen) ? (
                  <div className="h-1.5 w-full rounded-full bg-white/10">
                    <div
                      className={`h-full rounded-full transition-all ${isMyChoice ? "bg-pink" : "bg-violet/60"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                ) : (
                  <VoteBtn pollId={poll.id} optionId={opt.id} voted={false} />
                )}
              </div>
            );
          })}
        </div>

        {!hasVoted && isOpen && (
          <p className="text-xs text-muted">Votează o opțiune de mai sus.</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-violet/15 text-violet">
            <Vote className="h-6 w-6" />
          </div>
          <div>
            <h1 className="h-page">Sondaje</h1>
            <p className="mt-0.5 text-sm text-muted">Votează pe decizii ale organizației.</p>
          </div>
        </div>
        {canCreate && <CreatePollBtn />}
      </div>

      {open.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">Active</h2>
          {open.map((p) => <PollCard key={p.id} poll={p} />)}
        </div>
      )}

      {closed.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">Închise</h2>
          {closed.map((p) => (
            <div key={p.id} className="opacity-60">
              <PollCard poll={p} />
            </div>
          ))}
        </div>
      )}

      {polls.length === 0 && (
        <Card title="Sondaje">
          <p className="text-sm text-muted">Nu există sondaje momentan.</p>
        </Card>
      )}
    </div>
  );
}
