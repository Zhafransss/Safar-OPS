"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { TeamChip } from "@/components/role-label";
import { useToast } from "@/components/toast";
import { formatError } from "@/config/error-codes";
import { errorText } from "@/lib/error-text";
import { useTRPC } from "@/lib/trpc-client";

type TeamOption = { id: string; name: string; color: string };

// Mockup vPrgNew.
export function ProgramForm({
  isOwner,
  teams,
  ledTeam,
}: {
  isOwner: boolean;
  teams: TeamOption[];
  ledTeam: TeamOption | null;
}) {
  const [name, setName] = useState("");
  const [teamId, setTeamId] = useState<string | null>(isOwner ? null : (ledTeam?.id ?? null));
  const [error, setError] = useState("");
  const router = useRouter();
  const toast = useToast();
  const trpc = useTRPC();
  const create = useMutation(
    trpc.program.create.mutationOptions({
      onSuccess: ({ id }) => {
        toast("Program dibuat.");
        router.replace(`/penugasan/program/${id}`);
      },
      onError: (e) => setError(errorText(e.message)),
    }),
  );

  function save() {
    if (!name.trim()) return setError(formatError("PNG-PRG-01"));
    if (!teamId) return setError(formatError("PNG-PRG-02"));
    create.mutate({ name, teamId });
  }

  return (
    <div className="pad">
      {error && <div className="alert err">{error}</div>}
      <div className={`card ${error ? "mt" : ""}`}>
        <label className="lab" htmlFor="pN">
          Nama program
        </label>
        <input
          id="pN"
          className="inp"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Contoh: PO-130 Barang Baru"
        />
        <label className="lab mt">Tim penanggung jawab</label>
        {isOwner ? (
          <div className="pills" style={{ flexWrap: "wrap" }}>
            {teams.map((team) => (
              <button key={team.id} className={`pill ${teamId === team.id ? "on" : ""}`} onClick={() => setTeamId(team.id)}>
                <span className="tdot" style={{ background: team.color }} />
                {team.name}
              </button>
            ))}
          </div>
        ) : (
          ledTeam && (
            <>
              <div className="inp" style={{ background: "var(--surface2)" }}>
                <TeamChip color={ledTeam.color}>{ledTeam.name}</TeamChip>
              </div>
              <div className="small muted" style={{ marginTop: 4 }}>
                Leader hanya bisa membuat program untuk timnya sendiri.
              </div>
            </>
          )
        )}
        <p className="small muted" style={{ margin: "10px 0 0" }}>
          Program tidak punya DL. Yang tampil hanya tanggal pembuatan.
        </p>
      </div>
      <button className="btn block mt2" onClick={save} disabled={create.isPending}>
        Simpan program
      </button>
    </div>
  );
}
