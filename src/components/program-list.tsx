"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { ChoiceList } from "@/components/choice-sheet";
import { Icon } from "@/components/icon";
import { TeamChip } from "@/components/role-label";
import { PROGRAM_FILTERS, PROGRAM_STATUS_BADGE, PROGRAM_STATUS_LABEL, type ProgramStatus } from "@/lib/assignment-rules";
import type { ProgramCard, ProgramTeam } from "@/server/services/assignment";

// The mockup keeps the chosen filter while the app stays open (S.prgFilter); the team filter does too.
let rememberedFilter: ProgramStatus = "ACTIVE";
let rememberedTeamId: string | null = null;

const ALL_TEAMS = "all";

// Hasil Uji 1 U-07 simulation: "Semua tim ▾" opens a list that drops down below the button.
// "Semua tim" stays on top and does not count toward the three teams of U-06.
function TeamFilter({
  teams,
  teamId,
  onChange,
}: {
  teams: ProgramTeam[];
  teamId: string | null;
  onChange: (teamId: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const current = teams.find((team) => team.id === teamId);

  // A tap anywhere outside closes the list, like the simulation.
  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!wrap.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  const chip = (team: ProgramTeam) => <TeamChip color={team.color}>{team.name}</TeamChip>;

  return (
    <div className="team-filter" ref={wrap}>
      <button className={`tf ${current ? "is-picked" : ""}`} onClick={() => setOpen(!open)} aria-expanded={open}>
        {current ? chip(current) : "Semua tim"} ▾
      </button>
      {open && (
        <div className="team-dd">
          <ChoiceList
            placeholder="Cari tim"
            items={[...teams]
              .sort((a, b) => a.name.localeCompare(b.name, "id"))
              .map((team) => ({ key: team.id, label: chip(team), search: team.name }))}
            lead={{ key: ALL_TEAMS, label: "Semua tim", search: "" }}
            selectedKey={teamId ?? ALL_TEAMS}
            onPick={(key) => {
              onChange(key === ALL_TEAMS ? null : key);
              setOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
}

export function Flags({ flags }: { flags: { text: string; badge: string }[] }) {
  if (flags.length === 0) return null;
  return (
    <div className="flags">
      {flags.map((flag) => (
        <span key={flag.text} className={`badge ${flag.badge}`}>
          {flag.text}
        </span>
      ))}
    </div>
  );
}

// Mockup vPrgList card. Riwayat Program shows the status, since it mixes finished and cancelled
// programs, and the day the team was deleted.
export function ProgramCardLink({ program }: { program: ProgramCard }) {
  return (
    <Link className="tcard cmp" href={`/penugasan/program/${program.id}`}>
      <div className="tt">
        <b>{program.name}</b>
        {program.teamDeletedOn ? (
          <span className={`badge ${PROGRAM_STATUS_BADGE[program.status]}`}>{PROGRAM_STATUS_LABEL[program.status]}</span>
        ) : (
          <span className="small muted">{program.percent}%</span>
        )}
      </div>
      <div className="ts">
        <TeamChip color={program.team.color}>{program.team.name}</TeamChip>
        {program.teamDeletedOn && <span>tim dihapus {program.teamDeletedOn}</span>}
        <span>{program.teamDeletedOn ? "· " : ""}dibuat {program.created}</span>
        <span>
          · {program.doneTasks}/{program.totalTasks} tugas selesai
        </span>
      </div>
      <div className={`pbar ${program.percent === 100 ? "full" : ""}`}>
        <i style={{ width: `${program.percent}%` }} />
      </div>
      <Flags flags={program.flags} />
    </Link>
  );
}

// Mockup vPrgList.
export function ProgramList({
  programs,
  teams,
  canCreate,
  showTemplates,
  showHistory,
}: {
  programs: ProgramCard[];
  teams: ProgramTeam[];
  canCreate: boolean;
  showTemplates: boolean;
  showHistory: boolean;
}) {
  const [filter, setFilterState] = useState<ProgramStatus>(rememberedFilter);
  const setFilter = (next: ProgramStatus) => {
    rememberedFilter = next;
    setFilterState(next);
  };
  // A remembered team that no longer exists falls back to every team.
  const [teamIdState, setTeamIdState] = useState<string | null>(rememberedTeamId);
  const teamId = teams.some((team) => team.id === teamIdState) ? teamIdState : null;
  const setTeamId = (next: string | null) => {
    rememberedTeamId = next;
    setTeamIdState(next);
  };
  // U-07: the status counts follow the chosen team.
  const ofTeam = teamId ? programs.filter((program) => program.team.id === teamId) : programs;
  const shown = ofTeam.filter((program) => program.status === filter);

  return (
    <div className="pad">
      {canCreate ? (
        <div className="btns">
          <Link className="btn" href="/penugasan/program/baru">
            <Icon name="plus" size={18} /> Buat program
          </Link>
          {/* CHANGELOG 26: Template To-do moved here from the removed hub. */}
          {showTemplates && (
            <Link className="btn sec" href="/penugasan/template">
              <Icon name="tpl" size={18} /> Template To-do
            </Link>
          )}
        </div>
      ) : (
        <p className="small muted" style={{ margin: 0 }}>
          Anda melihat tugas yang berisi to-do milik Anda.
        </p>
      )}
      {/* U-07 and CHANGELOG 38: owners only; the server sends no teams to leaders and staff. */}
      {(teams.length > 0 || showHistory) && (
        <div className="filter-row">
          {teams.length > 0 ? <TeamFilter teams={teams} teamId={teamId} onChange={setTeamId} /> : <span />}
          {showHistory && (
            <Link className="btn sec sm" href="/penugasan/program/riwayat">
              <Icon name="history" size={16} /> Riwayat
            </Link>
          )}
        </div>
      )}
      <div className="pills mt">
        {PROGRAM_FILTERS.map((status) => (
          <button key={status} className={`pill ${filter === status ? "on" : ""}`} onClick={() => setFilter(status)}>
            {PROGRAM_STATUS_LABEL[status]} ({ofTeam.filter((program) => program.status === status).length})
          </button>
        ))}
      </div>
      {shown.map((program) => (
        <ProgramCardLink key={program.id} program={program} />
      ))}
      {shown.length === 0 && (
        <div className="empty">Tidak ada program {PROGRAM_STATUS_LABEL[filter].toLowerCase()}.</div>
      )}
    </div>
  );
}
