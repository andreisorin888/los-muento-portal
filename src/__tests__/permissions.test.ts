import { describe, it, expect } from "vitest";
import {
  canViewMembers,
  canPromoteDemote,
  canIssueWarning,
  canArchiveMember,
  canManageConfig,
  canManageCrew,
  canApproveRecruit,
  type ActorInfo,
} from "@/lib/permissions";

function makeActor(rankLevel: number, status: "ACTIV" | "SUSPENDAT" = "ACTIV"): ActorInfo {
  return { id: "actor1", rankLevel, status };
}

describe("canViewMembers", () => {
  it("allows Associate (level 20)", () => {
    expect(canViewMembers(makeActor(20))).toBe(true);
  });
  it("denies suspended member", () => {
    expect(canViewMembers(makeActor(60, "SUSPENDAT"))).toBe(false);
  });
});

describe("canPromoteDemote", () => {
  it("Consigliere (80) can promote below their level", () => {
    expect(canPromoteDemote(makeActor(80), 30)).toBe(true);
  });
  it("Capo (60) cannot promote — below Consigliere threshold", () => {
    expect(canPromoteDemote(makeActor(60), 20)).toBe(false);
  });
  it("cannot promote equal level", () => {
    expect(canPromoteDemote(makeActor(80), 80)).toBe(false);
  });
  it("Boss can promote Underboss (level strictly below Boss)", () => {
    expect(canPromoteDemote(makeActor(100), 90)).toBe(true);
  });
  it("Boss can promote below own level", () => {
    expect(canPromoteDemote(makeActor(100), 80)).toBe(true);
  });
});

describe("canIssueWarning", () => {
  it("Capo (60) can issue warnings", () => {
    expect(canIssueWarning(makeActor(60))).toBe(true);
  });
  it("Soldier (30) cannot issue warnings", () => {
    expect(canIssueWarning(makeActor(30))).toBe(false);
  });
});

describe("canArchiveMember", () => {
  it("Underboss (90) can archive", () => {
    expect(canArchiveMember(makeActor(90))).toBe(true);
  });
  it("Consigliere (80) cannot archive", () => {
    expect(canArchiveMember(makeActor(80))).toBe(false);
  });
  it("suspended Underboss cannot archive", () => {
    expect(canArchiveMember(makeActor(90, "SUSPENDAT"))).toBe(false);
  });
});

describe("canManageConfig", () => {
  it("Boss (100) can manage config", () => {
    expect(canManageConfig(makeActor(100))).toBe(true);
  });
  it("Underboss (90) cannot manage config", () => {
    expect(canManageConfig(makeActor(90))).toBe(false);
  });
});

describe("canManageCrew", () => {
  it("Underboss can manage any crew", () => {
    expect(canManageCrew(makeActor(90), "other-capo")).toBe(true);
  });
  it("Capo can manage own crew", () => {
    const actor = { id: "capo1", rankLevel: 60, status: "ACTIV" as const };
    expect(canManageCrew(actor, "capo1")).toBe(true);
  });
  it("Capo cannot manage other's crew", () => {
    const actor = { id: "capo1", rankLevel: 60, status: "ACTIV" as const };
    expect(canManageCrew(actor, "capo2")).toBe(false);
  });
});

describe("canApproveRecruit", () => {
  it("Capo (60) can approve", () => {
    expect(canApproveRecruit(makeActor(60))).toBe(true);
  });
  it("Sottocapo (50) cannot approve", () => {
    expect(canApproveRecruit(makeActor(50))).toBe(false);
  });
});
