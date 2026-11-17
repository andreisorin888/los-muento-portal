import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    recruit: {
      count: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

import { getRecruitStats } from "@/lib/recruitment";
import { db } from "@/lib/db";

const mockDb = db as {
  recruit: {
    count: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
  };
};

describe("getRecruitStats", () => {
  beforeEach(() => {
    mockDb.recruit.count.mockResolvedValue(0);
  });

  it("returns all five stat counts", async () => {
    mockDb.recruit.count
      .mockResolvedValueOnce(10) // total
      .mockResolvedValueOnce(3)  // inProbation
      .mockResolvedValueOnce(5)  // approved
      .mockResolvedValueOnce(2)  // rejected
      .mockResolvedValueOnce(0); // pending

    const stats = await getRecruitStats();
    expect(stats.total).toBe(10);
    expect(stats.inProbation).toBe(3);
    expect(stats.approved).toBe(5);
    expect(stats.rejected).toBe(2);
    expect(stats.pending).toBe(0);
  });
});
