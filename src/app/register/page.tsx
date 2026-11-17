import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import RegisterForm from "./RegisterForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Înregistrare — LOS MUENTO" };

export default async function RegisterPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) redirect("/login");
  if (session.user.memberId) redirect("/dashboard");

  const members = await db.member.findMany({
    where: { status: "ACTIV" },
    select: { id: true, name: true, rankName: true },
    orderBy: [{ rankLevel: "desc" }, { name: "asc" }],
  });

  return (
    <main className="flex min-h-screen items-center justify-center bg-ink px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="font-display text-xs font-bold tracking-widest text-gold/60 uppercase mb-1">
            Los Santos
          </p>
          <h1 className="font-display text-4xl font-extrabold text-gold leading-none">
            LOS MUENTO
          </h1>
          <p className="mt-3 text-sm text-muted">
            Cont Discord conectat. Completează detaliile pentru a te alătura familiei.
          </p>
        </div>
        <RegisterForm members={members} />
      </div>
    </main>
  );
}
