import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/audit", () => ({ auditLogTx: vi.fn() }));
vi.mock("@/lib/db", () => ({
  db: {
    member: { findUnique: vi.fn() },
    chest: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
    chestTransaction: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
    $transaction: vi.fn(),
  },
}));

import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { submitChestTx, approveChestTx } from "@/app/actions/chest";

const mockSession = (getServerSession as ReturnType<typeof vi.fn>);
const mockMember = (db.member.findUnique as ReturnType<typeof vi.fn>);
const mockTx = (db.$transaction as ReturnType<typeof vi.fn>);

function setupCapo() {
  mockSession.mockResolvedValue({ user: { memberId: "capo1" } });
  mockMember.mockResolvedValue({ id: "capo1", rankLevel: 60, status: "ACTIV" });
  mockTx.mockImplementation(async (fn: (tx: typeof db) => Promise<unknown>) => fn(db));
}
function setupAssociate() {
  mockSession.mockResolvedValue({ user: { memberId: "assoc1" } });
  mockMember.mockResolvedValue({ id: "assoc1", rankLevel: 20, status: "ACTIV" });
  mockTx.mockImplementation(async (fn: (tx: typeof db) => Promise<unknown>) => fn(db));
}

describe("submitChestTx – validation", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns error when amount is zero", async () => {
    setupAssociate();
    (db.chest.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "c1" });
    const result = await submitChestTx({ type: "DEPUNERE", amount: 0, note: "test" });
    expect(result.error).toBe("Suma trebuie să fie pozitivă.");
  });

  it("returns error when amount is negative", async () => {
    setupAssociate();
    (db.chest.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "c1" });
    const result = await submitChestTx({ type: "DEPUNERE", amount: -100, note: "test" });
    expect(result.error).toBe("Suma trebuie să fie pozitivă.");
  });

  it("returns error when note is empty", async () => {
    setupAssociate();
    (db.chest.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "c1" });
    const result = await submitChestTx({ type: "DEPUNERE", amount: 1000, note: "   " });
    expect(result.error).toBe("Nota este obligatorie.");
  });

  it("returns error when chest does not exist", async () => {
    setupAssociate();
    (db.chest.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const result = await submitChestTx({ type: "DEPUNERE", amount: 1000, note: "Depunere" });
    expect(result.error).toContain("Seiful nu există");
  });

  it("succeeds for a valid submission", async () => {
    setupAssociate();
    (db.chest.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "c1" });
    (db.chestTransaction.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "tx1" });
    (db.member as { findUnique: ReturnType<typeof vi.fn>; update?: ReturnType<typeof vi.fn> }).update = vi.fn().mockResolvedValue({});
    const result = await submitChestTx({ type: "DEPUNERE", amount: 5000, note: "Contribuție" });
    expect(result.error).toBeUndefined();
  });
});

describe("approveChestTx – validation", () => {
  beforeEach(() => vi.clearAllMocks());

  it("Soldierul (30) nu poate aproba tranzacțiile (sub Capo)", async () => {
    mockSession.mockResolvedValue({ user: { memberId: "s1" } });
    mockMember.mockResolvedValue({ id: "s1", rankLevel: 30, status: "ACTIV" });
    const result = await approveChestTx("tx1", "APROBAT");
    expect(result.error).toBeDefined();
  });

  it("returns error for ASTEPTARE status", async () => {
    setupCapo();
    const result = await approveChestTx("tx1", "ASTEPTARE");
    expect(result.error).toBe("Status invalid.");
  });

  it("returns error when transaction not found", async () => {
    setupCapo();
    (db.chestTransaction.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const result = await approveChestTx("tx1", "APROBAT");
    expect(result.error).toBe("Tranzacția nu a fost găsită.");
  });

  it("returns error when transaction already processed", async () => {
    setupCapo();
    (db.chestTransaction.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "tx1",
      approvalStatus: "APROBAT",
      type: "DEPUNERE",
      amount: 1000,
      chestId: "c1",
      chest: { id: "c1" },
    });
    const result = await approveChestTx("tx1", "APROBAT");
    expect(result.error).toBe("Tranzacția a fost deja procesată.");
  });

  it("approves DEPUNERE and increments chest balance", async () => {
    setupCapo();
    (db.chestTransaction.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "tx1",
      approvalStatus: "ASTEPTARE",
      type: "DEPUNERE",
      amount: 10000,
      chestId: "c1",
      chest: { id: "c1" },
    });
    (db.chestTransaction.update as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (db.chest.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

    const result = await approveChestTx("tx1", "APROBAT");
    expect(result.error).toBeUndefined();

    const chestUpdate = (db.chest.update as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
    expect(chestUpdate?.data?.balance?.increment).toBe(10000);
  });

  it("approves RETRAGERE and decrements chest balance", async () => {
    setupCapo();
    (db.chestTransaction.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "tx2",
      approvalStatus: "ASTEPTARE",
      type: "RETRAGERE",
      amount: 3000,
      chestId: "c1",
      chest: { id: "c1" },
    });
    (db.chestTransaction.update as ReturnType<typeof vi.fn>).mockResolvedValue({});
    (db.chest.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

    await approveChestTx("tx2", "APROBAT");

    const chestUpdate = (db.chest.update as ReturnType<typeof vi.fn>).mock.calls[0]?.[0];
    expect(chestUpdate?.data?.balance?.increment).toBe(-3000);
  });
});
