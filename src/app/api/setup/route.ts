import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { memberCount } from "@/lib/members";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const count = await memberCount();
    if (count > 0) {
      return NextResponse.json({ error: "Portalul este deja configurat." }, { status: 403 });
    }

    const { userId, name, discordName } = await req.json() as {
      userId: string;
      name: string;
      discordName: string;
    };

    if (!userId || !name?.trim()) {
      return NextResponse.json({ error: "Date lipsă." }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "Utilizatorul nu a fost găsit." }, { status: 404 });
    }

    const account = await db.account.findFirst({
      where: { userId, provider: "discord" },
    });

    await db.member.create({
      data: {
        memberCode: "LM-0001",
        userId,
        discordId: account?.providerAccountId ?? `discord_setup_${userId}`,
        discordName: discordName?.trim() || user.name || "Boss",
        name: name.trim(),
        rankName: "Boss",
        rankLevel: 100,
        status: "ACTIV",
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Eroare la configurare." },
      { status: 500 },
    );
  }
}
