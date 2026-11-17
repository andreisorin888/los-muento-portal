import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/db", () => ({
  db: {
    member: { findUnique: vi.fn() },
    activity: { create: vi.fn() },
    activityCategory: { findUnique: vi.fn() },
    $transaction: vi.fn(),
  },
}));

import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { submitActivity } from "@/app/actions/activity";

const mockSession = (getServerSession as ReturnType<typeof vi.fn>);
const mockMember = (db.member.findUnique as ReturnType<typeof vi.fn>);
const mockCategory = (db.activityCategory.findUnique as ReturnType<typeof vi.fn>);
const mockTx = (db.$transaction as ReturnType<typeof vi.fn>);

function setupActiveMember(rankLevel = 20) {
  mockSession.mockResolvedValue({ user: { memberId: "m1" } });
  mockMember.mockResolvedValue({ id: "m1", rankLevel, status: "ACTIV" });
  mockTx.mockImplementation(async (fn: (tx: typeof db) => Promise<unknown>) => fn(db));
  (db.activity.create as ReturnType<typeof vi.fn>).mockResolvedValue({});
  (db.member as { findUnique: ReturnType<typeof vi.fn>; update?: ReturnType<typeof vi.fn> }).update = vi.fn().mockResolvedValue({});
}

describe("submitActivity", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns error when not authenticated", async () => {
    mockSession.mockResolvedValue(null);
    const result = await submitActivity({ title: "test", type: "MISIUNE" });
    expect(result.error).toBeDefined();
  });

  it("returns error when title is empty", async () => {
    setupActiveMember();
    mockCategory.mockResolvedValue({ slug: "MISIUNE", points: 3 });
    const result = await submitActivity({ title: "   ", type: "MISIUNE" });
    expect(result.error).toBe("Titlul este obligatoriu.");
  });

  it("returns error when proofUrl is not a valid URL", async () => {
    setupActiveMember();
    mockCategory.mockResolvedValue({ slug: "MISIUNE", points: 3 });
    const result = await submitActivity({
      title: "Misiune GTA",
      type: "MISIUNE",
      proofUrl: "not-a-url",
    });
    expect(result.error).toBe("Link-ul dovezii nu este valid.");
  });

  it("returns error when activity type does not exist", async () => {
    setupActiveMember();
    mockCategory.mockResolvedValue(null);
    const result = await submitActivity({ title: "Op", type: "INEXISTENT" });
    expect(result.error).toBe("Tip de activitate invalid.");
  });

  it("accepts a valid https proofUrl", async () => {
    setupActiveMember();
    mockCategory.mockResolvedValue({ slug: "MISIUNE", points: 3 });
    const result = await submitActivity({
      title: "Misiune GTA",
      type: "MISIUNE",
      proofUrl: "https://youtu.be/abc123",
    });
    expect(result.error).toBeUndefined();
  });

  it("uses points from the category (3 for MISIUNE)", async () => {
    setupActiveMember();
    mockCategory.mockResolvedValue({ slug: "MISIUNE", points: 3 });
    const capturedData: { points?: number }[] = [];
    (db.activity.create as ReturnType<typeof vi.fn>).mockImplementation(
      async (args: { data: { points: number } }) => {
        capturedData.push(args.data);
        return {};
      }
    );
    await submitActivity({ title: "Op", type: "MISIUNE" });
    expect(capturedData[0]?.points).toBe(3);
  });

  it("uses points from the category (1 for ALTELE)", async () => {
    setupActiveMember();
    mockCategory.mockResolvedValue({ slug: "ALTELE", points: 1 });
    const capturedData: { points?: number }[] = [];
    (db.activity.create as ReturnType<typeof vi.fn>).mockImplementation(
      async (args: { data: { points: number } }) => {
        capturedData.push(args.data);
        return {};
      }
    );
    await submitActivity({ title: "Altele", type: "ALTELE" });
    expect(capturedData[0]?.points).toBe(1);
  });

  it("uses custom points from a user-defined category", async () => {
    setupActiveMember();
    mockCategory.mockResolvedValue({ slug: "PATRULARE", points: 5 });
    const capturedData: { points?: number }[] = [];
    (db.activity.create as ReturnType<typeof vi.fn>).mockImplementation(
      async (args: { data: { points: number } }) => {
        capturedData.push(args.data);
        return {};
      }
    );
    await submitActivity({ title: "Patrulare noapte", type: "PATRULARE" });
    expect(capturedData[0]?.points).toBe(5);
  });
});
