"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { canManageCrew, requirePermission, type ActorInfo } from "@/lib/permissions";
import { auditLogTx } from "@/lib/audit";

async function getActor(): Promise<ActorInfo> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.memberId) throw new Error("Neautentificat.");
  const m = await db.member.findUnique({
    where: { id: session.user.memberId },
    select: { id: true, rankLevel: true, status: true },
  });
  if (!m) throw new Error("Profil de membru negăsit.");
  return m;
}

export async function createCrew(
  name: string,
  capoId: string,
  deptId?: string,
): Promise<{ error?: string }> {
  try {
    const actor = await getActor();
    requirePermission(canManageCrew(actor));
    if (!name.trim()) return { error: "Numele echipei este obligatoriu." };

    const capo = await db.member.findUnique({
      where: { id: capoId },
      select: { rankLevel: true, captainOfCrew: true },
    });
    if (!capo) return { error: "Capoul nu a fost găsit." };
    if (capo.rankLevel < 60) return { error: "Capoul trebuie să aibă gradul Capo sau mai mare." };
    if (capo.captainOfCrew) return { error: "Capoul conduce deja o echipă." };

    await db.$transaction(async (tx) => {
      const crew = await tx.crew.create({
        data: { name: name.trim(), capoId, deptId: deptId || null },
      });
      await auditLogTx(tx, actor.id, "CREW_CREATED", "Crew", crew.id, {
        after: { name, capoId, deptId },
      });
    });

    revalidatePath("/configuration");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Eroare necunoscută." };
  }
}

export async function updateCrew(
  id: string,
  data: { name?: string; deptId?: string | null },
): Promise<{ error?: string }> {
  try {
    const actor = await getActor();
    const crew = await db.crew.findUnique({ where: { id }, select: { capoId: true, name: true } });
    if (!crew) return { error: "Echipa nu a fost găsită." };
    requirePermission(canManageCrew(actor, crew.capoId));

    await db.$transaction(async (tx) => {
      await tx.crew.update({ where: { id }, data });
      await auditLogTx(tx, actor.id, "CREW_UPDATED", "Crew", id, { after: data });
    });

    revalidatePath("/configuration");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Eroare necunoscută." };
  }
}

export async function disbandCrew(id: string): Promise<{ error?: string }> {
  try {
    const actor = await getActor();
    const crew = await db.crew.findUnique({
      where: { id },
      include: { _count: { select: { members: true } } },
    });
    if (!crew) return { error: "Echipa nu a fost găsită." };
    requirePermission(canManageCrew(actor, crew.capoId));

    await db.$transaction(async (tx) => {
      if (crew._count.members > 0) {
        await tx.member.updateMany({ where: { crewId: id }, data: { crewId: null } });
      }
      await tx.crew.delete({ where: { id } });
      await auditLogTx(tx, actor.id, "CREW_DISBANDED", "Crew", id, {
        before: { name: crew.name },
      });
    });

    revalidatePath("/configuration");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Eroare necunoscută." };
  }
}
