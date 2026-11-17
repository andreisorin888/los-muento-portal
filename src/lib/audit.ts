import type { Prisma } from "@prisma/client";
import { db } from "./db";

type AuditOpts = { before?: object; after?: object; note?: string };

export async function auditLog(
  actorId: string,
  action: string,
  entity: string,
  entityId: string,
  opts: AuditOpts = {},
) {
  await db.auditLog.create({
    data: {
      actorId,
      action,
      entity,
      entityId,
      before: opts.before as Prisma.InputJsonValue | undefined,
      after: opts.after as Prisma.InputJsonValue | undefined,
      note: opts.note,
    },
  });
}

export async function auditLogTx(
  tx: Prisma.TransactionClient,
  actorId: string,
  action: string,
  entity: string,
  entityId: string,
  opts: AuditOpts = {},
) {
  await tx.auditLog.create({
    data: {
      actorId,
      action,
      entity,
      entityId,
      before: opts.before as Prisma.InputJsonValue | undefined,
      after: opts.after as Prisma.InputJsonValue | undefined,
      note: opts.note,
    },
  });
}
