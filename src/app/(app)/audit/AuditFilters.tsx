"use client";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { useTransition } from "react";

type Member = { id: string; name: string };

export function AuditFilters({
  members,
  currentAction,
  currentEntity,
  currentActorId,
}: {
  members: Member[];
  currentAction: string;
  currentEntity: string;
  currentActorId: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  function clear() {
    startTransition(() => {
      router.push(pathname);
    });
  }

  const hasFilters = currentAction || currentEntity || currentActorId;

  return (
    <div className="panel p-4 flex flex-wrap items-end gap-3">
      <div className="flex-1 min-w-36">
        <label className="label">Acțiune</label>
        <div className="relative mt-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
          <input
            className="input pl-8"
            placeholder="ex: CREATE_MEMBER"
            defaultValue={currentAction}
            onChange={(e) => update("action", e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 min-w-36">
        <label className="label">Entitate</label>
        <div className="relative mt-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
          <input
            className="input pl-8"
            placeholder="ex: Member, Task"
            defaultValue={currentEntity}
            onChange={(e) => update("entity", e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 min-w-36">
        <label className="label">Actor</label>
        <select
          className="input mt-1"
          value={currentActorId}
          onChange={(e) => update("actorId", e.target.value)}
        >
          <option value="">Toți</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>

      {hasFilters && (
        <button onClick={clear} className="btn-ghost flex items-center gap-1 text-xs">
          <X className="h-3.5 w-3.5" /> Resetează
        </button>
      )}
    </div>
  );
}
