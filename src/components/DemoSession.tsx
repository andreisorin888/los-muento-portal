"use client";
import { createContext, useContext, useState } from "react";
import { members, type DemoMember } from "@/lib/demo-data";

type Ctx = { member: DemoMember; setMemberId: (id: string) => void };
const C = createContext<Ctx>({ member: members[0], setMemberId: () => {} });
export const useDemo = () => useContext(C);

/** Phase 1 only: lets you preview the app as each demo rank. Replaced by real sessions in Phase 2. */
export function DemoSessionProvider({ children }: { children: React.ReactNode }) {
  const [id, setMemberId] = useState(members[0].id);
  const member = members.find((m) => m.id === id) ?? members[0];
  return <C.Provider value={{ member, setMemberId }}>{children}</C.Provider>;
}
