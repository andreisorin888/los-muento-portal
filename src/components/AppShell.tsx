"use client";
import { useState } from "react";
import { DemoSessionProvider } from "./DemoSession";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

type Props = {
  children: React.ReactNode;
  logoUrl: string | null;
  textureUrl: string | null;
  showDemo: boolean;
  userLevel: number;
  userRole: "LEGAL" | "ILEGAL";
  userName: string;
  userRank: string;
  userImage: string | null;
  memberId: string | null;
};

export function AppShell({
  children,
  logoUrl,
  textureUrl,
  showDemo,
  userLevel,
  userRole,
  userName,
  userRank,
  userImage,
  memberId,
}: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <DemoSessionProvider>
      <div className="flex min-h-screen">
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed((c) => !c)}
          mobileOpen={mobileOpen}
          onClose={() => setMobileOpen(false)}
          logoUrl={logoUrl}
          textureUrl={textureUrl}
          showDemo={showDemo}
          userLevel={userLevel}
          userRole={userRole}
          userName={userName}
          userRank={userRank}
          userImage={userImage}
          memberId={memberId}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header onMenu={() => setMobileOpen(true)} showDemo={showDemo} />
          <main className="mx-auto w-full max-w-[1500px] flex-1 px-4 py-6 sm:px-6 lg:py-8">
            {children}
          </main>
        </div>
      </div>
    </DemoSessionProvider>
  );
}
