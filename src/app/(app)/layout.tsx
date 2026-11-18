import { getServerSession } from "next-auth";
import { AppShell } from "@/components/AppShell";
import { getAssetUrl } from "@/config/assets";
import { site } from "@/config/site";
import { authOptions } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  return (
    <AppShell
      logoUrl={getAssetUrl("logoEmblem")}
      textureUrl={getAssetUrl("sidebarTexture")}
      showDemo={site.showDemo}
      userLevel={user?.rankLevel ?? 20}
      userRole={user?.memberRole ?? "ILEGAL"}
      userName={user?.name ?? ""}
      userRank={user?.rankName ?? "Associate"}
      userImage={user?.image ?? null}
      memberId={user?.memberId ?? null}
    >
      {children}
    </AppShell>
  );
}
