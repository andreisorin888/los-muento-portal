"use client";
import { useEffect, useRef } from "react";
import { X } from "lucide-react";

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCloseRef.current();
    document.addEventListener("keydown", onKey);
    ref.current?.querySelector<HTMLElement>("input,select,textarea")?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[9999] grid place-items-end sm:place-items-center">
      <button aria-label="Close dialog" className="absolute inset-0 bg-ink/80 backdrop-blur-sm" onClick={onClose} />
      <div ref={ref} role="dialog" aria-modal="true" aria-label={title} className="relative max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-line bg-charcoal p-6 shadow-2xl sm:max-w-lg sm:rounded-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="h-card text-2xl">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted hover:bg-white/10 hover:text-white" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
