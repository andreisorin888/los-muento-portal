import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { canEditWiki } from "@/lib/permissions";
import type { MemberStatus } from "@prisma/client";
import { Library, ChevronRight } from "lucide-react";
import Link from "next/link";
import { CreatePageBtn } from "./WikiActions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Wiki intern" };

export default async function WikiPage() {
  const session = await getServerSession(authOptions);
  const actorId = session?.user?.memberId ?? "";
  const actorLevel = session?.user?.rankLevel ?? 0;
  const actor = { id: actorId, rankLevel: actorLevel, status: "ACTIV" as MemberStatus };
  const canEdit = canEditWiki(actor);

  const pages = await db.wikiPage.findMany({
    where: { minLevel: { lte: actorLevel } },
    include: { author: { select: { name: true } } },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-emerald/15 text-emerald-400">
            <Library className="h-6 w-6" />
          </div>
          <div>
            <h1 className="h-page">Wiki intern</h1>
            <p className="mt-0.5 text-sm text-muted">Reguli, lore și ghiduri ale organizației.</p>
          </div>
        </div>
        {canEdit && <CreatePageBtn />}
      </div>

      {pages.length === 0 ? (
        <div className="panel p-8 text-center">
          <Library className="mx-auto h-10 w-10 text-muted mb-3" />
          <p className="text-sm text-muted">
            Wiki-ul este gol. {canEdit ? "Creează prima pagină." : "Revin curând."}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-line rounded-xl border border-line overflow-hidden">
          {pages.map((page) => (
            <Link
              key={page.id}
              href={`/wiki/${page.slug}`}
              className="flex items-center gap-3 px-5 py-4 hover:bg-white/5 transition-colors group"
            >
              <Library className="h-4 w-4 shrink-0 text-muted group-hover:text-emerald-400 transition-colors" />
              <div className="flex-1 min-w-0">
                <p className="font-medium group-hover:text-white transition-colors truncate">{page.title}</p>
                <p className="text-xs text-muted">
                  {page.author.name} · {new Date(page.updatedAt).toLocaleDateString("ro-RO", { dateStyle: "medium" })}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted group-hover:text-white transition-colors" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
