import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/db", () => ({
  db: {
    member: { findUnique: vi.fn() },
    poll: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    pollVote: { findUnique: vi.fn(), create: vi.fn() },
  },
}));

import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { createPoll, votePoll, closePoll } from "@/app/actions/polls";

const mockSession = (getServerSession as ReturnType<typeof vi.fn>);
const mockMember = (db.member.findUnique as ReturnType<typeof vi.fn>);
const mockPoll = (db.poll.findUnique as ReturnType<typeof vi.fn>);
const mockVote = (db.pollVote.findUnique as ReturnType<typeof vi.fn>);

function setupCapo() {
  mockSession.mockResolvedValue({ user: { memberId: "capo1" } });
  mockMember.mockResolvedValue({ id: "capo1", rankLevel: 60, status: "ACTIV" });
}
function setupSoldier() {
  mockSession.mockResolvedValue({ user: { memberId: "soldier1" } });
  mockMember.mockResolvedValue({ id: "soldier1", rankLevel: 30, status: "ACTIV" });
}

const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
const pastDate = new Date(Date.now() - 1000).toISOString();

describe("createPoll", () => {
  beforeEach(() => vi.clearAllMocks());

  it("Capo can create a poll", async () => {
    setupCapo();
    (db.poll.create as ReturnType<typeof vi.fn>).mockResolvedValue({});
    const result = await createPoll({
      question: "Ce alegem?",
      endsAt: futureDate,
      minLevel: 20,
      options: ["Opțiunea A", "Opțiunea B"],
    });
    expect(result.error).toBeUndefined();
  });

  it("Soldier (level 30) cannot create a poll", async () => {
    setupSoldier();
    const result = await createPoll({
      question: "Ce alegem?",
      endsAt: futureDate,
      minLevel: 20,
      options: ["A", "B"],
    });
    expect(result.error).toBeDefined();
  });

  it("requires at least 2 options", async () => {
    setupCapo();
    const result = await createPoll({
      question: "Ce facem?",
      endsAt: futureDate,
      minLevel: 20,
      options: ["Singura opțiune"],
    });
    expect(result.error).toBe("Sunt necesare cel puțin 2 opțiuni.");
  });

  it("rejects expiry date in the past", async () => {
    setupCapo();
    const result = await createPoll({
      question: "Ce facem?",
      endsAt: pastDate,
      minLevel: 20,
      options: ["A", "B"],
    });
    expect(result.error).toBe("Data de expirare trebuie să fie în viitor.");
  });
});

describe("votePoll", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns error when poll not found", async () => {
    setupSoldier();
    mockPoll.mockResolvedValue(null);
    const result = await votePoll("poll1", "opt1");
    expect(result.error).toBe("Sondajul nu a fost găsit.");
  });

  it("returns error when poll has expired", async () => {
    setupSoldier();
    mockPoll.mockResolvedValue({ endsAt: new Date(Date.now() - 1000), minLevel: 20 });
    const result = await votePoll("poll1", "opt1");
    expect(result.error).toBe("Sondajul s-a încheiat.");
  });

  it("returns error when member rank is below poll minLevel", async () => {
    setupSoldier(); // level 30
    mockPoll.mockResolvedValue({ endsAt: new Date(Date.now() + 10000), minLevel: 60 });
    const result = await votePoll("poll1", "opt1");
    expect(result.error).toBe("Gradul tău nu permite participarea la acest sondaj.");
  });

  it("returns error when member already voted", async () => {
    setupSoldier(); // level 30
    mockPoll.mockResolvedValue({ endsAt: new Date(Date.now() + 10000), minLevel: 20 });
    mockVote.mockResolvedValue({ id: "existing-vote" });
    const result = await votePoll("poll1", "opt1");
    expect(result.error).toBe("Ai votat deja în acest sondaj.");
  });

  it("records vote when all checks pass", async () => {
    setupSoldier();
    mockPoll.mockResolvedValue({ endsAt: new Date(Date.now() + 10000), minLevel: 20 });
    mockVote.mockResolvedValue(null); // no existing vote
    (db.pollVote.create as ReturnType<typeof vi.fn>).mockResolvedValue({});
    const result = await votePoll("poll1", "opt1");
    expect(result.error).toBeUndefined();
    expect(db.pollVote.create).toHaveBeenCalled();
  });
});

describe("closePoll", () => {
  beforeEach(() => vi.clearAllMocks());

  it("Capo can close own poll", async () => {
    setupCapo();
    (db.poll.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "poll1", createdById: "capo1" });
    (db.poll.update as ReturnType<typeof vi.fn>).mockResolvedValue({});
    const result = await closePoll("poll1");
    expect(result.error).toBeUndefined();
  });

  it("Capo cannot close another Capo's poll", async () => {
    setupCapo();
    (db.poll.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "poll1", createdById: "other-capo" });
    const result = await closePoll("poll1");
    expect(result.error).toBe("Poți închide doar sondajele proprii.");
  });
});
