import type { NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { db } from "./db";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID ?? "",
      clientSecret: process.env.DISCORD_CLIENT_SECRET ?? "",
      issuer: "https://discord.com",
      profile(profile) {
        return {
          id: profile.id,
          name: profile.global_name ?? profile.username,
          email: profile.email ?? null,
          image: profile.avatar
            ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
            : null,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    jwt: async ({ token, user, trigger }) => {
      const userId = (user?.id ?? token.userId) as string | undefined;
      if (!userId) return token;

      token.userId = userId;

      if (user || trigger === "update") {
        const member = await db.member.findUnique({
          where: { userId },
          select: { id: true, memberCode: true, rankLevel: true, rankName: true, status: true },
        });
        token.memberId = member?.id ?? null;
        token.memberCode = member?.memberCode ?? null;
        token.rankLevel = member?.rankLevel ?? 0;
        token.rankName = member?.rankName ?? null;
        token.memberStatus = member?.status ?? null;
      }

      return token;
    },
    session: ({ session, token }) => ({
      ...session,
      user: {
        ...session.user,
        id: (token.userId ?? token.sub) as string,
        memberId: token.memberId ?? null,
        memberCode: token.memberCode ?? null,
        rankLevel: token.rankLevel ?? 0,
        rankName: token.rankName ?? null,
        memberStatus: token.memberStatus ?? null,
      },
    }),
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
};
