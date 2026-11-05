"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Icon } from "@/components/icon";
import { TeamChip } from "@/components/role-label";
import { Sheet } from "@/components/sheet";
import { useToast } from "@/components/toast";
import { UserPicker } from "@/components/user-picker";
import { formatError } from "@/config/error-codes";
import { TEAM_PALETTE } from "@/config/team-palette";
import { errorText } from "@/lib/error-text";
import { useTRPC } from "@/lib/trpc-client";
import type { PickerUser } from "@/server/services/team";

type TeamFormProps = {
  team: { id: string; name: string; color: string; leaderId: string; staffIds: string[] } | null;
  usedColors: { color: string; teamName: string }[];
  defaultColor: string;
  users: PickerUser[];
  openTodoCounts: Record<string, number>;
};

// Mockup vTimEdit.
export function TeamForm({ team, usedColors, defaultColor, users, openTodoCounts }: TeamFormProps) {
  const [name, setName] = useState(team?.name ?? "");
  const [color, setColor] = useState(team?.color ?? defaultColor);
  const [leaderId, setLeaderId] = useState<string | null>(team?.leaderId ?? null);
  const [staffIds, setStaffIds] = useState<string[]>(team?.staffIds ?? []);
  const [error, setError] = useState("");
  const [picking, setPicking] = useState<"leader" | "staff" | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  const router = useRouter();
  const toast = useToast();
  const trpc = useTRPC();
  const handlers = {
    onSuccess: ({ message }: { message: string }) => {
      toast(message);
      router.push("/penugasan/tim");
    },
    onError: (e: { message: string }) => setError(errorText(e.message)),
  };
  const create = useMutation(trpc.team.create.mutationOptions(handlers));
  const update = useMutation(trpc.team.update.mutationOptions(handlers));
  const saving = create.isPending || update.isPending;

  const nameOf = (id: string) => users.find((user) => user.id === id)?.name ?? "";
  const usedBy = (candidate: string) => usedColors.find((used) => used.color === candidate);

  function pickColor(candidate: string) {
    const used = usedBy(candidate);
    if (used) {
      setError(formatError("PNG-TIM-07", { "nama tim": used.teamName }));
      return;
    }
    setColor(candidate);
    if (error.startsWith("PNG-TIM-07")) setError("");
  }

  // Mockup rmStaff (FR-TIM-04): warn when the person still has open to-dos in this team.
  function removeStaff(id: string) {
    if (openTodoCounts[id]) setConfirmRemove(id);
    else setStaffIds(staffIds.filter((x) => x !== id));
  }

  function save() {
    const draft = { name, color, leaderId, staffIds };
    if (team) update.mutate({ id: team.id, ...draft });
    else create.mutate(draft);
  }

  return (
    <div className="pad">
      {error && <div className="alert err">{error}</div>}
      <div className={`card ${error ? "mt" : ""}`}>
        <label className="lab" htmlFor="tmN">
          Nama tim
        </label>
        <input
          id="tmN"
          className="inp"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Contoh: Tim Toko"
        />

        <label className="lab mt">Warna tim</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {TEAM_PALETTE.map((entry) => {
            const used = usedBy(entry.color);
            return (
              <button
                key={entry.color}
                className={`swatch ${color === entry.color ? "on" : ""} ${used ? "used" : ""}`}
                style={{ background: entry.color }}
                onClick={() => pickColor(entry.color)}
                aria-label={`${entry.name}${used ? ` (dipakai ${used.teamName})` : ""}`}
                title={`${entry.name}${used ? ` — dipakai ${used.teamName}` : ""}`}
              >
                {used && <Icon name="x" size={14} />}
              </button>
            );
          })}
        </div>
        <div className="small muted" style={{ marginTop: 6 }}>
          Warna bertanda silang sudah dipakai tim lain.
        </div>
        <div className="small muted" style={{ marginTop: 6 }}>
          Pratinjau: <TeamChip color={color}>{name || "Nama tim"}</TeamChip>
        </div>

        <label className="lab mt">Leader (1 orang)</label>
        <button className="picker" onClick={() => setPicking("leader")}>
          {leaderId ? <span>{nameOf(leaderId)}</span> : <span className="ph">Pilih pengguna Jubelio</span>}
          <span className="muted">›</span>
        </button>

        <label className="lab mt">Staff (1 atau lebih)</label>
        <div>
          {staffIds.map((id) => (
            <span key={id} className="mchip">
              {nameOf(id)}
              <button onClick={() => removeStaff(id)} aria-label="Keluarkan">
                <Icon name="x" size={14} />
              </button>
            </span>
          ))}
        </div>
        <button className="btn sec sm mt" onClick={() => setPicking("staff")}>
          <Icon name="plus" size={16} /> Tambah staff
        </button>
      </div>

      <button className="btn block mt2" onClick={save} disabled={saving}>
        Simpan tim
      </button>

      {confirmRemove && (
        <Sheet
          title={`Keluarkan ${nameOf(confirmRemove)}?`}
          onClose={() => setConfirmRemove(null)}
          actions={[
            { label: "Batal", variant: "sec", onClick: () => setConfirmRemove(null) },
            {
              label: "Tetap keluarkan",
              variant: "warn",
              onClick: () => {
                setStaffIds(staffIds.filter((x) => x !== confirmRemove));
                setConfirmRemove(null);
              },
            },
          ]}
        >
          <p className="small" style={{ lineHeight: 1.5, margin: 0 }}>
            {nameOf(confirmRemove)} masih punya <b>{openTodoCounts[confirmRemove]} to-do aktif</b> di tim ini. Idealnya
            diselesaikan lewat handover dulu. Jika tetap dikeluarkan, to-do tersebut ditandai <b>Perlu dialihkan</b>{" "}
            setelah tim disimpan.
          </p>
        </Sheet>
      )}
      {picking === "leader" && (
        <UserPicker
          title="Pilih leader"
          users={users}
          exclude={[]}
          onClose={() => setPicking(null)}
          onPick={(id) => {
            setLeaderId(id);
            setStaffIds(staffIds.filter((x) => x !== id));
            setPicking(null);
          }}
        />
      )}
      {picking === "staff" && (
        <UserPicker
          title="Tambah staff"
          users={users}
          exclude={[leaderId, ...staffIds]}
          onClose={() => setPicking(null)}
          onPick={(id) => {
            setStaffIds([...staffIds, id]);
            setPicking(null);
          }}
        />
      )}
    </div>
  );
}
