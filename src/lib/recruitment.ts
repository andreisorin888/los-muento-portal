import type { RecruitStatus, Prisma } from "@prisma/client";
import { db } from "./db";

export async function getRecruitList(opts: {
  status?: RecruitStatus;
  recruitedById?: string;
  skip?: number;
  take?: number;
} = {}) {
  const where: Prisma.RecruitWhereInput = {};
  if (opts.status) where.status = opts.status;
  if (opts.recruitedById) where.recruitedById = opts.recruitedById;

  const [recruits, total] = await Promise.all([
    db.recruit.findMany({
      where,
      include: {
        recruitedBy: { select: { id: true, name: true, memberCode: true } },
        approvedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: opts.skip ?? 0,
      take: opts.take ?? 50,
    }),
    db.recruit.count({ where }),
  ]);

  return { recruits, total };
}

export async function getRecruitById(id: string) {
  return db.recruit.findUnique({
    where: { id },
    include: {
      recruitedBy: { select: { id: true, name: true, memberCode: true } },
      approvedBy: { select: { id: true, name: true } },
    },
  });
}

export async function getRecruitStats() {
  const [total, inProbation, approved, rejected, pending] = await Promise.all([
    db.recruit.count(),
    db.recruit.count({ where: { status: "PROBATIE" } }),
    db.recruit.count({ where: { status: "APROBAT" } }),
    db.recruit.count({ where: { status: "RESPINS" } }),
    db.recruit.count({ where: { status: "CANDIDAT" } }),
  ]);
  return { total, inProbation, approved, rejected, pending };
}
