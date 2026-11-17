"use client";
import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2 } from "lucide-react";

const Ctx = createContext<(msg: string) => void>(() => {});
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<{ id: number; msg: string }[]>([]);
  const push = useCallback((msg: string) => {
    const id = Date.now() + Math.random();
    setItems((s) => [...s, { id, msg }]);
    setTimeout(() => setItems((s) => s.filter((i) => i.id !== id)), 4200);
  }, []);
  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[min(92vw,380px)] flex-col gap-2" aria-live="polite">
        {items.map((i) => (
          <div key={i.id} className="pointer-events-auto flex items-start gap-3 rounded-xl border border-emerald/40 bg-charcoal/95 px-4 py-3 text-sm shadow-2xl">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald" aria-hidden />
            <span>{i.msg}</span>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
