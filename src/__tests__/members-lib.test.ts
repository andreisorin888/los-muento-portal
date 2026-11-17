import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    member: {
      count: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

import { generateNextMemberCode, getMemberList } from "@/lib/members";
import { db } from "@/lib/db";

const mockDb = db as {
  member: {
    count: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
  };
};

describe("generateNextMemberCode", () => {
  it("generates LM-0001 when no members exist", async () => {
    mockDb.member.count.mockResolvedValue(0);
    const code = await generateNextMemberCode();
    expect(code).toBe("LM-0001");
  });

  it("generates LM-0010 when 9 members exist", async () => {
    mockDb.member.count.mockResolvedValue(9);
    const code = await generateNextMemberCode();
    expect(code).toBe("LM-0010");
  });

  it("generates LM-0100 when 99 members exist", async () => {
    mockDb.member.count.mockResolvedValue(99);
    const code = await generateNextMemberCode();
    expect(code).toBe("LM-0100");
  });
});

describe("getMemberList", () => {
  beforeEach(() => {
    mockDb.member.findMany.mockResolvedValue([]);
    mockDb.member.count.mockResolvedValue(0);
  });

  it("excludes archived members by default", async () => {
    await getMemberList();
    const callArgs = mockDb.member.findMany.mock.calls[0]?.[0];
    expect(callArgs?.where?.status).toEqual({ not: "ARHIVAT" });
  });

  it("applies search filter to name and discord fields", async () => {
    await getMemberList({ search: "dante" });
    const callArgs = mockDb.member.findMany.mock.calls.at(-1)?.[0];
    expect(callArgs?.where?.OR).toBeDefined();
    expect(callArgs?.where?.OR?.length).toBeGreaterThan(0);
  });

  it("returns total count alongside members", async () => {
    mockDb.member.count.mockResolvedValue(42);
    const result = await getMemberList();
    expect(result.total).toBe(42);
  });
});
