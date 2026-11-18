import "next-auth";
import type { MemberRole, MemberStatus } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      memberId?: string | null;
      memberCode?: string | null;
      rankLevel?: number;
      rankName?: string | null;
      memberStatus?: MemberStatus | null;
      memberRole?: MemberRole | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    memberId?: string | null;
    memberCode?: string | null;
    rankLevel?: number;
    rankName?: string | null;
    memberStatus?: MemberStatus | null;
    memberRole?: MemberRole | null;
  }
}
