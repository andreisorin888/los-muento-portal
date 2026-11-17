import { db } from "./db";

export async function getDepartmentList() {
  return db.department.findMany({
    include: {
      _count: { select: { members: true, crews: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function getDepartmentById(id: string) {
  return db.department.findUnique({
    where: { id },
    include: {
      members: {
        select: { id: true, name: true, memberCode: true, rankName: true, rankLevel: true },
        orderBy: { rankLevel: "desc" },
      },
      crews: {
        include: { capo: { select: { id: true, name: true } } },
      },
    },
  });
}
