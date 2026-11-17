import type { MemberStatus } from "@prisma/client";

export type ActorInfo = {
  id: string;
  rankLevel: number;
  status: MemberStatus;
};

const L = {
  ASSOCIATE: 20,
  SOLDIER: 30,
  SOTTOCAPO: 50,
  CAPO: 60,
  CONSIGLIERE: 80,
  UNDERBOSS: 90,
  BOSS: 100,
} as const;

function active(a: ActorInfo) {
  return a.status === "ACTIV";
}

export function canViewMembers(a: ActorInfo) {
  return active(a) && a.rankLevel >= L.ASSOCIATE;
}

export function canEditMemberProfile(a: ActorInfo, targetId: string) {
  return active(a) && (a.id === targetId || a.rankLevel >= L.CAPO);
}

export function canPromoteDemote(a: ActorInfo, targetLevel: number) {
  return active(a) && a.rankLevel >= L.CONSIGLIERE && a.rankLevel > targetLevel;
}

export function canIssueWarning(a: ActorInfo) {
  return active(a) && a.rankLevel >= L.CAPO;
}

export function canResolveWarning(a: ActorInfo) {
  return active(a) && a.rankLevel >= L.CAPO;
}

export function canChangeStatus(a: ActorInfo) {
  return active(a) && a.rankLevel >= L.CAPO;
}

export function canArchiveMember(a: ActorInfo) {
  return active(a) && a.rankLevel >= L.UNDERBOSS;
}

export function canManageDept(a: ActorInfo) {
  return active(a) && a.rankLevel >= L.UNDERBOSS;
}

export function canManageCrew(a: ActorInfo, crewCapoId?: string) {
  if (!active(a)) return false;
  if (a.rankLevel >= L.UNDERBOSS) return true;
  return a.rankLevel >= L.CAPO && a.id === crewCapoId;
}

export function canApproveRecruit(a: ActorInfo) {
  return active(a) && a.rankLevel >= L.CAPO;
}

export function canManageRecruit(a: ActorInfo, recruiterId?: string) {
  if (!active(a)) return false;
  if (a.rankLevel >= L.CAPO) return true;
  return a.id === recruiterId;
}

export function canEditCoreProfile(a: ActorInfo) {
  return active(a) && a.rankLevel >= L.BOSS;
}

// Phase 4
export function canManageRobberies(a: ActorInfo) {
  return active(a) && a.rankLevel >= L.CAPO;
}

export function canManageTerritories(a: ActorInfo) {
  return active(a) && a.rankLevel >= L.CAPO;
}

export function canManageTasks(a: ActorInfo) {
  return active(a) && a.rankLevel >= L.CAPO;
}

export function canManageEvents(a: ActorInfo) {
  return active(a) && a.rankLevel >= L.CAPO;
}

export function canManageArmory(a: ActorInfo) {
  return active(a) && a.rankLevel >= L.SOTTOCAPO;
}

export function canSubmitChestTx(a: ActorInfo) {
  return active(a) && a.rankLevel >= L.ASSOCIATE;
}

export function canApproveChestTx(a: ActorInfo) {
  return active(a) && a.rankLevel >= L.CAPO;
}

export function canSubmitFinanceRecord(a: ActorInfo) {
  return active(a) && a.rankLevel >= L.CAPO;
}

export function canApproveFinanceRecord(a: ActorInfo) {
  return active(a) && a.rankLevel >= L.UNDERBOSS;
}

export function canManageConfig(a: ActorInfo) {
  return active(a) && a.rankLevel >= L.BOSS;
}

export function canViewAuditLog(a: ActorInfo) {
  return active(a) && a.rankLevel >= L.UNDERBOSS;
}

// Phase 5
export function canCreateAnnouncement(a: ActorInfo) {
  return active(a) && a.rankLevel >= L.CAPO;
}

export function canConfirmWinner(a: ActorInfo) {
  return active(a) && a.rankLevel >= L.UNDERBOSS;
}

export function canViewManagement(a: ActorInfo) {
  return active(a) && a.rankLevel >= L.UNDERBOSS;
}

export function canWriteManagementNote(a: ActorInfo) {
  return active(a) && a.rankLevel >= L.UNDERBOSS;
}

// Phase 6
export function canCreatePoll(a: ActorInfo) {
  return active(a) && a.rankLevel >= L.CAPO;
}

export function canVote(a: ActorInfo) {
  return active(a);
}

export function canManageTraining(a: ActorInfo) {
  return active(a) && a.rankLevel >= L.SOTTOCAPO;
}

export function canEditWiki(a: ActorInfo) {
  return active(a) && a.rankLevel >= L.CAPO;
}

export function canManageWiki(a: ActorInfo) {
  return active(a) && a.rankLevel >= L.UNDERBOSS;
}

export function requirePermission(condition: boolean, message = "Permisiune refuzată."): void {
  if (!condition) throw new Error(message);
}
