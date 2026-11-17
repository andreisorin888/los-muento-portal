import { PrismaClient, MemberStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.member.count();
  if (existing > 0) {
    console.log("Seed skipped — members already exist.");
    return;
  }

  const dept = await prisma.department.create({
    data: { name: "Operațiuni" },
  });

  const boss = await prisma.member.create({
    data: {
      memberCode: "LM-0001",
      name: "Don Dante",
      discordName: "dante#0001",
      rankName: "Boss",
      rankLevel: 100,
      status: "ACTIV" as MemberStatus,
      deptId: dept.id,
    },
  });

  const underboss = await prisma.member.create({
    data: {
      memberCode: "LM-0002",
      name: "Marco Visconti",
      discordName: "marco#0002",
      rankName: "Underboss",
      rankLevel: 90,
      status: "ACTIV" as MemberStatus,
      deptId: dept.id,
    },
  });

  const capo = await prisma.member.create({
    data: {
      memberCode: "LM-0003",
      name: "Luca Ferraro",
      discordName: "luca#0003",
      rankName: "Capo",
      rankLevel: 60,
      status: "ACTIV" as MemberStatus,
      deptId: dept.id,
    },
  });

  const crew = await prisma.crew.create({
    data: {
      name: "Echipa Alpha",
      capoId: capo.id,
      deptId: dept.id,
    },
  });

  await prisma.member.updateMany({
    where: { id: { in: [capo.id, underboss.id] } },
    data: { crewId: crew.id },
  });

  console.log("Seed completed:");
  console.log(`  Boss: ${boss.memberCode} — ${boss.name}`);
  console.log(`  Underboss: ${underboss.memberCode} — ${underboss.name}`);
  console.log(`  Capo: ${capo.memberCode} — ${capo.name}`);
  console.log(`  Crew: ${crew.name}`);
  console.log(`  Department: ${dept.name}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
