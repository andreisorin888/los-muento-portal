"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { canSubmitFinanceRecord, canApproveFinanceRecord, requirePermission, type ActorInfo } from "@/lib/permissions";
import { auditLogTx } from "@/lib/audit";
import type { ApprovalStatus, FinanceTxType } from "@prisma/client";

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

export async function createCategory(data: {
  name: string;
  type: "VENIT" | "CHELTUIALA";
}): Promise<{ error?: string }> {
  try {
    const actor = await getActor();
    requirePermission(canApproveFinanceRecord(actor));
    if (!data.name.trim()) return { error: "Numele categoriei este obligatoriu." };
    await db.financeCategory.create({
      data: { name: data.name.trim(), type: data.type },
    });
    revalidatePath("/finances");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Eroare necunoscută." };
  }
}

export async function submitFinanceRecord(data: {
  categoryId: string;
  type: FinanceTxType;
  amount: number;
  note: string;
  date?: string;
}): Promise<{ error?: string }> {
  try {
    const actor = await getActor();
    requirePermission(canSubmitFinanceRecord(actor));
    if (data.amount <= 0) return { error: "Suma trebuie să fie pozitivă." };
    if (!data.note.trim()) return { error: "Nota este obligatorie." };

    const date = data.date ? new Date(data.date) : new Date();
    if (isNaN(date.getTime())) return { error: "Data nu este validă." };

    await db.$transaction(async (tx) => {
      const record = await tx.financeRecord.create({
        data: {
          categoryId: data.categoryId,
          type: data.type,
          amount: data.amount,
          note: data.note.trim(),
          date,
          submittedById: actor.id,
        },
      });
      await auditLogTx(tx, actor.id, "FINANCE_RECORD_SUBMITTED", "FinanceRecord", record.id, {
        after: { type: data.type, amount: data.amount, categoryId: data.categoryId },
      });
    });

    revalidatePath("/finances");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Eroare necunoscută." };
  }
}

export async function approveFinanceRecord(
  recordId: string,
  status: ApprovalStatus,
  rejectionNote?: string,
): Promise<{ error?: string }> {
  try {
    const actor = await getActor();
    requirePermission(canApproveFinanceRecord(actor));
    if (status === "ASTEPTARE") return { error: "Status invalid." };

    const record = await db.financeRecord.findUnique({ where: { id: recordId } });
    if (!record) return { error: "Înregistrarea nu a fost găsită." };
    if (record.approvalStatus !== "ASTEPTARE") return { error: "Înregistrarea a fost deja procesată." };

    await db.$transaction(async (tx) => {
      await tx.financeRecord.update({
        where: { id: recordId },
        data: {
          approvalStatus: status,
          approvedById: actor.id,
          rejectionNote: status === "RESPINS" ? (rejectionNote || null) : null,
        },
      });
      await auditLogTx(tx, actor.id, "FINANCE_RECORD_REVIEWED", "FinanceRecord", recordId, {
        after: { status },
      });
    });

    revalidatePath("/finances");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Eroare necunoscută." };
  }
}
