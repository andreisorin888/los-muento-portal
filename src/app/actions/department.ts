"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { canManageDept, requirePermission, type ActorInfo } from "@/lib/permissions";
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

export async function createDepartment(name: string): Promise<{ error?: string }> {
  try {
    const actor = await getActor();
    requirePermission(canManageDept(actor));
    if (!name.trim()) return { error: "Numele departamentului este obligatoriu." };

    await db.$transaction(async (tx) => {
      const dept = await tx.department.create({ data: { name: name.trim() } });
      await auditLogTx(tx, actor.id, "DEPT_CREATED", "Department", dept.id, {
        after: { name },
      });
    });

    revalidatePath("/configuration");
    return {};
  } catch (e) {
    if (e instanceof Error && e.message.includes("Unique")) {
      return { error: "Există deja un departament cu acest nume." };
    }
    return { error: e instanceof Error ? e.message : "Eroare necunoscută." };
  }
}

export async function updateDepartment(
  id: string,
  name: string,
): Promise<{ error?: string }> {
  try {
    const actor = await getActor();
    requirePermission(canManageDept(actor));
    if (!name.trim()) return { error: "Numele departamentului este obligatoriu." };

    await db.$transaction(async (tx) => {
      const before = await tx.department.findUnique({ where: { id }, select: { name: true } });
      await tx.department.update({ where: { id }, data: { name: name.trim() } });
      await auditLogTx(tx, actor.id, "DEPT_UPDATED", "Department", id, {
        before: before ?? undefined,
        after: { name },
      });
    });

    revalidatePath("/configuration");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Eroare necunoscută." };
  }
}

export async function deleteDepartment(id: string): Promise<{ error?: string }> {
  try {
    const actor = await getActor();
    requirePermission(canManageDept(actor));

    const dept = await db.department.findUnique({
      where: { id },
      include: { _count: { select: { members: true } } },
    });
    if (!dept) return { error: "Departamentul nu a fost găsit." };
    if (dept._count.members > 0) {
      return { error: "Mută toți membrii din acest departament înainte de ștergere." };
    }

    await db.$transaction(async (tx) => {
      await tx.department.delete({ where: { id } });
      await auditLogTx(tx, actor.id, "DEPT_DELETED", "Department", id, {
        before: { name: dept.name },
      });
    });

    revalidatePath("/configuration");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Eroare necunoscută." };
  }
}
