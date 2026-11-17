"use client";
import { useState, useTransition } from "react";
import { UserCheck, UserX, Archive, Pencil } from "lucide-react";
import { RANKS } from "@/config/nav";
import { changeRank, changeStatus, archiveMember, changeRole, editMemberDetails } from "@/app/actions/member";
import type { MemberRole, MemberStatus } from "@prisma/client";

type DeptOption = { id: string; name: string };
type CrewOption = { id: string; name: string };

const STATUS_OPTS: { value: MemberStatus; label: string }[] = [
  { value: "ACTIV", label: "Activ" },
  { value: "INACTIV", label: "Inactiv" },
  { value: "SUSPENDAT", label: "Suspendat" },
  { value: "PROBATORIE", label: "Perioadă de probă" },
];

type Perms = {
  canEdit: boolean;
  canEditCore: boolean;
  canPromote: boolean;
  canWarn: boolean;
  canStatus: boolean;
  canArchive: boolean;
};

function ActionModal({
  title,
  onClose,
  onSubmit,
  pending,
  error,
  children,
}: {
  title: string;
  onClose: () => void;
  onSubmit: () => void;
  pending: boolean;
  error: string;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/70 p-4 sm:items-center" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-line bg-charcoal p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="h-card mb-4">{title}</h2>
        {children}
        {error && <p className="mt-2 text-sm text-rose-400">{error}</p>}
        <div className="mt-5 flex gap-3">
          <button onClick={onClose} className="btn-ghost flex-1" disabled={pending}>Anulează</button>
          <button onClick={onSubmit} className="btn-primary flex-1" disabled={pending}>
            {pending ? "Se procesează..." : "Confirmă"}
          </button>
        </div>
      </div>
    </div>
  );
}

const ROLE_OPTS: { value: MemberRole; label: string }[] = [
  { value: "LEGAL", label: "Legal" },
  { value: "ILEGAL", label: "Ilegal" },
];

export function MemberActions({
  memberId,
  currentRank,
  currentStatus,
  currentRole,
  currentName,
  currentDiscordName,
  currentDeptId,
  currentCrewId,
  depts,
  crews,
  actorLevel,
  perms,
}: {
  memberId: string;
  currentRank: string;
  currentStatus: MemberStatus;
  currentRole: MemberRole;
  currentName: string;
  currentDiscordName: string;
  currentDeptId: string | null;
  currentCrewId: string | null;
  depts: DeptOption[];
  crews: CrewOption[];
  actorLevel: number;
  perms: Perms;
}) {
  const [modal, setModal] = useState<"rank" | "status" | "archive" | "role" | "edit" | null>(null);
  const [newRank, setNewRank] = useState(currentRank);
  const [reason, setReason] = useState("");
  const [newStatus, setNewStatus] = useState<MemberStatus>(currentStatus);
  const [newRole, setNewRole] = useState<MemberRole>(currentRole);
  const [archiveNote, setArchiveNote] = useState("");
  const [editName, setEditName] = useState(currentName);
  const [editDiscord, setEditDiscord] = useState(currentDiscordName);
  const [editDeptId, setEditDeptId] = useState(currentDeptId ?? "");
  const [editCrewId, setEditCrewId] = useState(currentCrewId ?? "");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const availableRanks = RANKS.filter((r) => r.level < actorLevel);

  function close() {
    setModal(null);
    setError("");
    setReason("");
    setArchiveNote("");
    setEditName(currentName);
    setEditDiscord(currentDiscordName);
    setEditDeptId(currentDeptId ?? "");
    setEditCrewId(currentCrewId ?? "");
  }

  function submitRank() {
    startTransition(async () => {
      const r = await changeRank(memberId, newRank, reason);
      if (r.error) { setError(r.error); return; }
      close();
    });
  }

  function submitStatus() {
    startTransition(async () => {
      const r = await changeStatus(memberId, newStatus, reason || undefined);
      if (r.error) { setError(r.error); return; }
      close();
    });
  }

  function submitRole() {
    startTransition(async () => {
      const r = await changeRole(memberId, newRole);
      if (r.error) { setError(r.error); return; }
      close();
    });
  }

  function submitArchive() {
    startTransition(async () => {
      const r = await archiveMember(memberId, archiveNote);
      if (r.error) { setError(r.error); return; }
      close();
    });
  }

  function submitEdit() {
    startTransition(async () => {
      const r = await editMemberDetails(memberId, {
        name: editName,
        discordName: editDiscord,
        deptId: editDeptId || null,
        crewId: editCrewId || null,
      });
      if (r.error) { setError(r.error); return; }
      close();
    });
  }

  return (
    <>
      <div className="panel p-4">
        <h2 className="h-card mb-3">Acțiuni</h2>
        <div className="flex flex-wrap gap-2">
          {perms.canEditCore && (
            <button onClick={() => setModal("edit")} className="btn-ghost gap-2">
              <Pencil className="h-4 w-4" /> Editează profilul
            </button>
          )}
          {perms.canPromote && (
            <button onClick={() => setModal("rank")} className="btn-ghost gap-2">
              <UserCheck className="h-4 w-4" /> Schimbă gradul
            </button>
          )}
          {perms.canEdit && (
            <button onClick={() => setModal("role")} className="btn-ghost gap-2">
              <UserCheck className="h-4 w-4" /> Schimbă rolul
            </button>
          )}
          {perms.canStatus && (
            <button onClick={() => setModal("status")} className="btn-ghost gap-2">
              <UserX className="h-4 w-4" /> Schimbă starea
            </button>
          )}
          {perms.canArchive && (
            <button onClick={() => setModal("archive")} className="btn-danger gap-2">
              <Archive className="h-4 w-4" /> Arhivează
            </button>
          )}
        </div>
      </div>

      {modal === "rank" && (
        <ActionModal title="Schimbă gradul" onClose={close} onSubmit={submitRank} pending={pending} error={error}>
          <div className="space-y-3">
            <label className="block">
              <span className="label">Grad nou</span>
              <select value={newRank} onChange={(e) => setNewRank(e.target.value)} className="input">
                {availableRanks.map((r) => <option key={r.name} value={r.name}>{r.name} (niv. {r.level})</option>)}
              </select>
            </label>
            <label className="block">
              <span className="label">Motiv</span>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="input min-h-[80px]"
                placeholder="Motivul promovării sau retrogradării..."
                required
              />
            </label>
          </div>
        </ActionModal>
      )}

      {modal === "status" && (
        <ActionModal title="Schimbă starea" onClose={close} onSubmit={submitStatus} pending={pending} error={error}>
          <div className="space-y-3">
            <label className="block">
              <span className="label">Stare nouă</span>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as MemberStatus)}
                className="input"
              >
                {STATUS_OPTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="label">Notă (opțional)</span>
              <input value={reason} onChange={(e) => setReason(e.target.value)} className="input" />
            </label>
          </div>
        </ActionModal>
      )}

      {modal === "role" && (
        <ActionModal title="Schimbă rolul" onClose={close} onSubmit={submitRole} pending={pending} error={error}>
          <label className="block">
            <span className="label">Rol nou</span>
            <select value={newRole} onChange={(e) => setNewRole(e.target.value as MemberRole)} className="input">
              {ROLE_OPTS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </label>
        </ActionModal>
      )}

      {modal === "archive" && (
        <ActionModal title="Arhivează membrul" onClose={close} onSubmit={submitArchive} pending={pending} error={error}>
          <p className="mb-3 text-sm text-muted">
            Acțiunea este ireversibilă fără intervenția unui Boss. Istoricul membrului este păstrat.
          </p>
          <label className="block">
            <span className="label">Motiv arhivare</span>
            <textarea
              value={archiveNote}
              onChange={(e) => setArchiveNote(e.target.value)}
              className="input min-h-[80px]"
              placeholder="Motivul arhivării..."
              required
            />
          </label>
        </ActionModal>
      )}

      {modal === "edit" && (
        <ActionModal title="Editează profilul" onClose={close} onSubmit={submitEdit} pending={pending} error={error}>
          <div className="space-y-3">
            <label className="block">
              <span className="label">Nume personaj</span>
              <input
                className="input"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />
            </label>
            <label className="block">
              <span className="label">Cont Discord</span>
              <input
                className="input"
                value={editDiscord}
                onChange={(e) => setEditDiscord(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="label">Departament</span>
              <select className="input" value={editDeptId} onChange={(e) => setEditDeptId(e.target.value)}>
                <option value="">— Fără departament —</option>
                {depts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="label">Echipă</span>
              <select className="input" value={editCrewId} onChange={(e) => setEditCrewId(e.target.value)}>
                <option value="">— Fără echipă —</option>
                {crews.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
          </div>
        </ActionModal>
      )}
    </>
  );
}
