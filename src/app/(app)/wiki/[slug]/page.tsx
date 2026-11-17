import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { canEditWiki, canManageWiki } from "@/lib/permissions";
import type { MemberStatus } from "@prisma/client";
import { notFound } from "next/navigation";
import { Library, Clock } from "lucide-react";
import Link from "next/link";
import { EditPageBtn, DeletePageBtn } from "../WikiActions";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const page = await db.wikiPage.findUnique({ where: { slug: params.slug }, select: { title: true } });
  return { title: page?.title ?? "Wiki" };
}

export default async function WikiSlugPage({ params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  const actorId = session?.user?.memberId ?? "";
  const actorLevel = session?.user?.rankLevel ?? 0;
  const actor = { id: actorId, rankLevel: actorLevel, status: "ACTIV" as MemberStatus };
  const canEdit = canEditWiki(actor);
  const canDelete = canManageWiki(actor);

  const page = await db.wikiPage.findUnique({
    where: { slug: params.slug },
    include: {
      author: { select: { name: true, rankName: true } },
      versions: {
        include: { editedBy: { select: { name: true } } },
        orderBy: { editedAt: "desc" },
        take: 5,
      },
    },
  });

  if (!page || page.minLevel > actorLevel) notFound();

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <Link href="/wiki" className="text-xs text-muted hover:text-white transition-colors flex items-center gap-1 mb-2">
            <Library className="h-3 w-3" /> Wiki intern
          </Link>
          <h1 className="h-page">{page.title}</h1>
          <p className="text-xs text-muted">
            {page.author.name} · {page.author.rankName} ·{" "}
            {new Date(page.updatedAt).toLocaleDateString("ro-RO", { dateStyle: "long" })}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {canEdit && (
            <EditPageBtn
              pageId={page.id}
              initialTitle={page.title}
              initialBody={page.body}
              initialMinLevel={page.minLevel}
            />
          )}
          {canDelete && <DeletePageBtn pageId={page.id} />}
        </div>
      </div>

      <div className="panel p-6">
        <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap leading-relaxed text-white/90">
          {page.body}
        </div>
      </div>

      {page.versions.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted">Istoric versiuni</h3>
          {page.versions.map((v) => (
            <div key={v.id} className="flex items-center gap-2 text-xs text-muted">
              <Clock className="h-3 w-3" />
              <span>{v.editedBy.name}</span>
              <span>·</span>
              <span>{new Date(v.editedAt).toLocaleString("ro-RO", { dateStyle: "short", timeStyle: "short" })}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
