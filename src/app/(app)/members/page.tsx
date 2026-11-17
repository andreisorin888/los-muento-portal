import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMemberList } from "@/lib/members";
import { site } from "@/config/site";
import { members as demoMembers } from "@/lib/demo-data";
import { MemberDirectory } from "@/components/MemberDirectory";
import { MemberDirectoryDB } from "./MemberDirectoryDB";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Membri" };

export default async function MembersPage() {
  if (site.showDemo) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="h-page">Membri</h1>
          <p className="mt-1 text-sm text-muted">Toți membrii familiei, cu grad, echipă și situația curentă.</p>
        </div>
        <MemberDirectory />
      </div>
    );
  }

  const session = await getServerSession(authOptions);
  const { members, total } = await getMemberList();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="h-page">Membri</h1>
        <p className="mt-1 text-sm text-muted">
          {total} {total === 1 ? "membru" : "membri"} activi în organizație.
        </p>
      </div>
      <MemberDirectoryDB members={members} total={total} actorLevel={session?.user?.rankLevel ?? 20} />
    </div>
  );
}
