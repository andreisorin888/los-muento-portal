"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { canEditWiki, canManageWiki, requirePermission, type ActorInfo } from "@/lib/permissions";

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

function toSlug(title: string) {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function createWikiPage(data: {
  title: string;
  body: string;
  minLevel: number;
  slug?: string;
}): Promise<{ error?: string; slug?: string }> {
  try {
    const actor = await getActor();
    requirePermission(canEditWiki(actor));
    if (!data.title.trim()) return { error: "Titlul este obligatoriu." };
    if (!data.body.trim()) return { error: "Conținutul este obligatoriu." };

    const slug = data.slug?.trim() || toSlug(data.title);
    if (!slug) return { error: "Slug invalid." };

    const existing = await db.wikiPage.findUnique({ where: { slug } });
    if (existing) return { error: "Există deja o pagină cu acest slug." };

    await db.wikiPage.create({
      data: {
        slug,
        title: data.title.trim(),
        body: data.body.trim(),
        minLevel: data.minLevel,
        authorId: actor.id,
      },
    });

    revalidatePath("/wiki");
    return { slug };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Eroare necunoscută." };
  }
}

export async function updateWikiPage(
  pageId: string,
  data: { title: string; body: string; minLevel: number },
): Promise<{ error?: string }> {
  try {
    const actor = await getActor();
    requirePermission(canEditWiki(actor));

    const page = await db.wikiPage.findUnique({ where: { id: pageId } });
    if (!page) return { error: "Pagina nu a fost găsită." };

    await db.$transaction([
      db.wikiVersion.create({
        data: { pageId, body: page.body, editedById: actor.id },
      }),
      db.wikiPage.update({
        where: { id: pageId },
        data: { title: data.title.trim(), body: data.body.trim(), minLevel: data.minLevel },
      }),
    ]);

    revalidatePath("/wiki");
    revalidatePath(`/wiki/${page.slug}`);
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Eroare necunoscută." };
  }
}

export async function deleteWikiPage(pageId: string): Promise<{ error?: string }> {
  try {
    const actor = await getActor();
    requirePermission(canManageWiki(actor));

    const page = await db.wikiPage.findUnique({ where: { id: pageId } });
    if (!page) return { error: "Pagina nu a fost găsită." };

    await db.wikiPage.delete({ where: { id: pageId } });
    revalidatePath("/wiki");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Eroare necunoscută." };
  }
}
