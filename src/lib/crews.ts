import { db } from "./db";

export async function getCrewList() {
  return db.crew.findMany({
    include: {
      capo: { select: { id: true, name: true, memberCode: true } },
      dept: { select: { id: true, name: true } },
      _count: { select: { members: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function getCrewById(id: string) {
  return db.crew.findUnique({
    where: { id },
    include: {
      capo: { select: { id: true, name: true, memberCode: true } },
      dept: true,
      members: {
        select: { id: true, name: true, memberCode: true, rankName: true, rankLevel: true },
        orderBy: { rankLevel: "desc" },
      },
    },
  });
}

export async function getCaposWithoutCrew() {
  return db.member.findMany({
    where: {
      rankLevel: { gte: 60 },
      status: "ACTIV",
      captainOfCrew: null,
    },
    select: { id: true, name: true, memberCode: true, rankName: true },
    orderBy: { name: "asc" },
  });
}
