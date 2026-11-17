"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { canManageConfig, requirePermission, type ActorInfo } from "@/lib/permissions";
import type { MemberStatus } from "@prisma/client";

const DEFAULT_CATEGORIES = [
  { slug: "MISIUNE",      label: "Misiune",       points: 3, sortOrder: 0 },
  { slug: "ANTRENAMENT",  label: "Antrenament",   points: 2, sortOrder: 1 },
  { slug: "EVENIMENT",    label: "Eveniment",     points: 2, sortOrder: 2 },
  { slug: "ALTELE",       label: "Altele",        points: 1, sortOrder: 3 },
];

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

export async function ensureDefaultCategories() {
  const count = await db.activityCategory.count();
  if (count > 0) return;
  for (const c of DEFAULT_CATEGORIES) {
    await db.activityCategory.upsert({
      where: { slug: c.slug },
      create: c,
      update: {},
    });
  }
}

export async function getActivityCategories(onlyActive = false) {
  await ensureDefaultCategories();
  return db.activityCategory.findMany({
    where: onlyActive ? { isActive: true } : {},
    orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
    include: { _count: { select: { activities: true } } },
  });
}

export async function createActivityCategory(data: {
  label: string;
  points: number;
}): Promise<{ error?: string }> {
  try {
    const actor = await getActor();
    requirePermission(canManageConfig(actor as ActorInfo & { status: MemberStatus }));
    if (!data.label.trim()) return { error: "Eticheta este obligatorie." };
    if (data.points < 0) return { error: "Punctele nu pot fi negative." };

    const slug = data.label.trim().toUpperCase()
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^A-Z0-9]+/g, "_").replace(/(^_|_$)/g, "");
    if (!slug) return { error: "Slug invalid." };

    const existing = await db.activityCategory.findUnique({ where: { slug } });
    if (existing) return { error: "Există deja un tip cu același slug." };

    const maxOrder = await db.activityCategory.aggregate({ _max: { sortOrder: true } });
    await db.activityCategory.create({
      data: {
        slug,
        label: data.label.trim(),
        points: data.points,
        sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
      },
    });

    revalidatePath("/configuration");
    revalidatePath("/activitati");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Eroare necunoscută." };
  }
}

export async function updateActivityCategory(
  id: string,
  data: { label: string; points: number; isActive: boolean },
): Promise<{ error?: string }> {
  try {
    const actor = await getActor();
    requirePermission(canManageConfig(actor as ActorInfo & { status: MemberStatus }));
    if (!data.label.trim()) return { error: "Eticheta este obligatorie." };
    if (data.points < 0) return { error: "Punctele nu pot fi negative." };

    await db.activityCategory.update({
      where: { id },
      data: { label: data.label.trim(), points: data.points, isActive: data.isActive },
    });

    revalidatePath("/configuration");
    revalidatePath("/activitati");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Eroare necunoscută." };
  }
}

export async function deleteActivityCategory(id: string): Promise<{ error?: string }> {
  try {
    const actor = await getActor();
    requirePermission(canManageConfig(actor as ActorInfo & { status: MemberStatus }));

    const cat = await db.activityCategory.findUnique({
      where: { id },
      include: { _count: { select: { activities: true } } },
    });
    if (!cat) return { error: "Categoria nu a fost găsită." };
    if (cat._count.activities > 0)
      return { error: `Nu poți șterge o categorie care are ${cat._count.activities} activitate(i) înregistrate.` };

    await db.activityCategory.delete({ where: { id } });
    revalidatePath("/configuration");
    revalidatePath("/activitati");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Eroare necunoscută." };
  }
}

export async function reorderActivityCategory(
  id: string,
  direction: "up" | "down",
): Promise<{ error?: string }> {
  try {
    const actor = await getActor();
    requirePermission(canManageConfig(actor as ActorInfo & { status: MemberStatus }));

    const all = await db.activityCategory.findMany({ orderBy: { sortOrder: "asc" } });
    const idx = all.findIndex((c) => c.id === id);
    if (idx === -1) return { error: "Categoria nu a fost găsită." };

    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= all.length) return {};

    const a = all[idx]!;
    const b = all[swapIdx]!;

    await db.$transaction([
      db.activityCategory.update({ where: { id: a.id }, data: { sortOrder: b.sortOrder } }),
      db.activityCategory.update({ where: { id: b.id }, data: { sortOrder: a.sortOrder } }),
    ]);

    revalidatePath("/configuration");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Eroare necunoscută." };
  }
}
