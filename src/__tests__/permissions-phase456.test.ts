import { describe, it, expect } from "vitest";
import {
  canManageRobberies,
  canManageTerritories,
  canManageTasks,
  canManageEvents,
  canManageArmory,
  canSubmitChestTx,
  canApproveChestTx,
  canSubmitFinanceRecord,
  canApproveFinanceRecord,
  canViewAuditLog,
  canCreateAnnouncement,
  canConfirmWinner,
  canViewManagement,
  canWriteManagementNote,
  canCreatePoll,
  canVote,
  canManageTraining,
  canEditWiki,
  canManageWiki,
  type ActorInfo,
} from "@/lib/permissions";

function a(rankLevel: number, status: "ACTIV" | "SUSPENDAT" = "ACTIV"): ActorInfo {
  return { id: "a1", rankLevel, status };
}

// ── Phase 4 ───────────────────────────────────────────────────────────────────

describe("canManageRobberies", () => {
  it("Capo (60) can manage", () => expect(canManageRobberies(a(60))).toBe(true));
  it("Sottocapo (50) cannot", () => expect(canManageRobberies(a(50))).toBe(false));
  it("suspended Capo cannot", () => expect(canManageRobberies(a(60, "SUSPENDAT"))).toBe(false));
});

describe("canManageTerritories", () => {
  it("Capo (60) can manage", () => expect(canManageTerritories(a(60))).toBe(true));
  it("Soldier (30) cannot", () => expect(canManageTerritories(a(30))).toBe(false));
});

describe("canManageTasks", () => {
  it("Capo (60) can manage tasks", () => expect(canManageTasks(a(60))).toBe(true));
  it("Sottocapo (50) cannot", () => expect(canManageTasks(a(50))).toBe(false));
});

describe("canManageEvents", () => {
  it("Capo (60) can manage events", () => expect(canManageEvents(a(60))).toBe(true));
  it("Soldier (30) cannot", () => expect(canManageEvents(a(30))).toBe(false));
});

describe("canManageArmory", () => {
  it("Sottocapo (50) can manage armory", () => expect(canManageArmory(a(50))).toBe(true));
  it("Soldier (30) cannot", () => expect(canManageArmory(a(30))).toBe(false));
});

describe("canSubmitChestTx", () => {
  it("Associate (20) can submit", () => expect(canSubmitChestTx(a(20))).toBe(true));
  it("suspended member cannot", () => expect(canSubmitChestTx(a(20, "SUSPENDAT"))).toBe(false));
});

describe("canApproveChestTx", () => {
  it("Capo (60) can approve", () => expect(canApproveChestTx(a(60))).toBe(true));
  it("Sottocapo (50) cannot", () => expect(canApproveChestTx(a(50))).toBe(false));
});

describe("canSubmitFinanceRecord", () => {
  it("Capo (60) can submit", () => expect(canSubmitFinanceRecord(a(60))).toBe(true));
  it("Sottocapo (50) cannot", () => expect(canSubmitFinanceRecord(a(50))).toBe(false));
});

describe("canApproveFinanceRecord", () => {
  it("Underboss (90) can approve", () => expect(canApproveFinanceRecord(a(90))).toBe(true));
  it("Consigliere (80) cannot", () => expect(canApproveFinanceRecord(a(80))).toBe(false));
});

describe("canViewAuditLog", () => {
  it("Underboss (90) can view", () => expect(canViewAuditLog(a(90))).toBe(true));
  it("Consigliere (80) cannot", () => expect(canViewAuditLog(a(80))).toBe(false));
});

// ── Phase 5 ───────────────────────────────────────────────────────────────────

describe("canCreateAnnouncement", () => {
  it("Capo (60) can create", () => expect(canCreateAnnouncement(a(60))).toBe(true));
  it("Soldier (30) cannot", () => expect(canCreateAnnouncement(a(30))).toBe(false));
});

describe("canConfirmWinner", () => {
  it("Underboss (90) can confirm", () => expect(canConfirmWinner(a(90))).toBe(true));
  it("Consigliere (80) cannot", () => expect(canConfirmWinner(a(80))).toBe(false));
});

describe("canViewManagement", () => {
  it("Underboss (90) can view management", () => expect(canViewManagement(a(90))).toBe(true));
  it("Consigliere (80) cannot", () => expect(canViewManagement(a(80))).toBe(false));
});

describe("canWriteManagementNote", () => {
  it("Underboss (90) can write notes", () => expect(canWriteManagementNote(a(90))).toBe(true));
  it("Capo (60) cannot", () => expect(canWriteManagementNote(a(60))).toBe(false));
});

// ── Phase 6 ───────────────────────────────────────────────────────────────────

describe("canCreatePoll", () => {
  it("Capo (60) can create polls", () => expect(canCreatePoll(a(60))).toBe(true));
  it("Sottocapo (50) cannot", () => expect(canCreatePoll(a(50))).toBe(false));
  it("suspended Capo cannot", () => expect(canCreatePoll(a(60, "SUSPENDAT"))).toBe(false));
});

describe("canVote", () => {
  it("active Associate (20) can vote", () => expect(canVote(a(20))).toBe(true));
  it("suspended member cannot vote", () => expect(canVote(a(20, "SUSPENDAT"))).toBe(false));
});

describe("canManageTraining", () => {
  it("Sottocapo (50) can manage training", () => expect(canManageTraining(a(50))).toBe(true));
  it("Soldier (30) cannot", () => expect(canManageTraining(a(30))).toBe(false));
});

describe("canEditWiki", () => {
  it("Capo (60) can edit wiki", () => expect(canEditWiki(a(60))).toBe(true));
  it("Soldier (30) cannot", () => expect(canEditWiki(a(30))).toBe(false));
});

describe("canManageWiki", () => {
  it("Underboss (90) can manage wiki", () => expect(canManageWiki(a(90))).toBe(true));
  it("Capo (60) cannot delete pages", () => expect(canManageWiki(a(60))).toBe(false));
});
