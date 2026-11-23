import type { MemberRole, MemberStatus, Prisma } from "@prisma/client";
import { db } from "./db";

const memberWithDetailsArgs = {
  include: {
    dept: true,
    crew: { include: { capo: { select: { id: true, name: true } } } },
    recruitedBy: { select: { id: true, name: true, memberCode: true } },
    rankHistory: { orderBy: { createdAt: "desc" as const } },
    warnings: { orderBy: { createdAt: "desc" as const } },
    recruits: {
      where: { status: { not: "ARHIVAT" as const } },
      orderBy: { createdAt: "desc" as const },
      take: 10,
    },
    _count: { select: { recruits: true, warnings: true, rankHistory: true } },
  },
} as const;

export type MemberWithDetails = Prisma.MemberGetPayload<typeof memberWithDetailsArgs>;

export type MemberRow = {
  id: string;
  memberCode: string;
  name: string;
  discordName: string;
  rankName: string;
  rankLevel: number;
  status: MemberStatus;
  role: MemberRole;
  points: number;
  gameMonths: number;
  dept: { id: string; name: string } | null;
  crew: { id: string; name: string } | null;
  joinedAt: Date;
};

export async function getMemberList(opts: {
  search?: string;
  rankLevel?: number;
  status?: MemberStatus;
  deptId?: string;
  skip?: number;
  take?: number;
} = {}): Promise<{ members: MemberRow[]; total: number }> {
  const where: Prisma.MemberWhereInput = { status: { not: "ARHIVAT" } };
  if (opts.status) where.status = opts.status;
  if (opts.rankLevel !== undefined) where.rankLevel = opts.rankLevel;
  if (opts.deptId) where.deptId = opts.deptId;
  if (opts.search) {
    where.OR = [
      { name: { contains: opts.search } },
      { discordName: { contains: opts.search } },
      { memberCode: { contains: opts.search } },
    ];
  }

  const [members, total] = await Promise.all([
    db.member.findMany({
      where,
      select: {
        id: true,
        memberCode: true,
        name: true,
        discordName: true,
        rankName: true,
        rankLevel: true,
        status: true,
        role: true,
        points: true,
        gameMonths: true,
        dept: { select: { id: true, name: true } },
        crew: { select: { id: true, name: true } },
        joinedAt: true,
      },
      orderBy: [{ rankLevel: "desc" }, { name: "asc" }],
      skip: opts.skip ?? 0,
      take: opts.take ?? 100,
    }),
    db.member.count({ where }),
  ]);

  return { members, total };
}

export async function getMemberById(id: string): Promise<MemberWithDetails | null> {
  return db.member.findUnique({ where: { id }, ...memberWithDetailsArgs }) as Promise<MemberWithDetails | null>;
}

export async function getMemberByUserId(userId: string) {
  return db.member.findUnique({
    where: { userId },
    select: { id: true, rankLevel: true, status: true, memberCode: true, rankName: true },
  });
}

export async function memberCount(): Promise<number> {
  return db.member.count();
}

export async function generateNextMemberCode(): Promise<string> {
  const count = await db.member.count();
  return `LM-${String(count + 1).padStart(4, "0")}`;
}
