"use client";

import Link from "next/link";
import { useState } from "react";

import { Icon } from "@/components/icon";
import { TeamChip } from "@/components/role-label";
import { PROGRAM_FILTERS, PROGRAM_STATUS_LABEL, type ProgramStatus } from "@/lib/assignment-rules";
import type { ProgramCard } from "@/server/services/assignment";

// The mockup keeps the chosen filter while the app stays open (S.prgFilter).
let rememberedFilter: ProgramStatus = "ACTIVE";

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

// Mockup vPrgList.
export function ProgramList({ programs, canCreate }: { programs: ProgramCard[]; canCreate: boolean }) {
  const [filter, setFilterState] = useState<ProgramStatus>(rememberedFilter);
  const setFilter = (next: ProgramStatus) => {
    rememberedFilter = next;
    setFilterState(next);
  };
  const shown = programs.filter((program) => program.status === filter);

  return (
    <div className="pad">
      {canCreate ? (
        <Link className="btn block" href="/penugasan/program/baru">
          <Icon name="plus" size={18} /> Buat program
        </Link>
      ) : (
        <p className="small muted" style={{ margin: 0 }}>
          Anda melihat tugas yang berisi to-do milik Anda.
        </p>
      )}
      <div className="pills mt">
        {PROGRAM_FILTERS.map((status) => (
          <button key={status} className={`pill ${filter === status ? "on" : ""}`} onClick={() => setFilter(status)}>
            {PROGRAM_STATUS_LABEL[status]} ({programs.filter((program) => program.status === status).length})
          </button>
        ))}
      </div>
      {shown.map((program) => (
        <Link key={program.id} className="tcard cmp" href={`/penugasan/program/${program.id}`}>
          <div className="tt">
            <b>{program.name}</b>
            <span className="small muted">{program.percent}%</span>
          </div>
          <div className="ts">
            <TeamChip color={program.team.color}>{program.team.name}</TeamChip>
            <span>dibuat {program.created}</span>
            <span>
              · {program.doneTasks}/{program.totalTasks} tugas selesai
            </span>
          </div>
          <div className={`pbar ${program.percent === 100 ? "full" : ""}`}>
            <i style={{ width: `${program.percent}%` }} />
          </div>
          <Flags flags={program.flags} />
        </Link>
      ))}
      {shown.length === 0 && (
        <div className="empty">Tidak ada program {PROGRAM_STATUS_LABEL[filter].toLowerCase()}.</div>
      )}
    </div>
  );
}
