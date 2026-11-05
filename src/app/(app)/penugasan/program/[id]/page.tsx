import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Icon } from "@/components/icon";
import { PageHeader } from "@/components/page-header";
import { ProgramActions } from "@/components/program-actions";
import { Flags } from "@/components/program-list";
import { TeamChip } from "@/components/role-label";
import { formatError } from "@/config/error-codes";
import { PROGRAM_STATUS_BADGE, PROGRAM_STATUS_LABEL } from "@/lib/assignment-rules";
import { getSessionUser } from "@/server/auth/session";
import { getProgramDetail, type ProgramDetailData } from "@/server/services/assignment";
import { getViewer } from "@/server/services/viewer";

function TaskCard({ task }: { task: ProgramDetailData["openTasks"][number] }) {
  const { progress } = task;
  return (
    <Link className="tcard cmp" href={`/penugasan/tugas/${task.id}`}>
      <div className="tt">
        <b>{task.name}</b>
        {task.closed ? (
          <span className="badge b-green">Selesai</span>
        ) : (
          <span className="small muted">{progress.percent}%</span>
        )}
      </div>
      <div className="ts">
        <span>
          Dibuat {task.created} oleh {task.createdBy}
        </span>
        {task.reportNumber && <span>· {task.reportNumber}</span>}
        <span>
          · {progress.done}/{progress.total} langkah
        </span>
      </div>
      <div className={`pbar ${progress.percent === 100 ? "full" : ""}`}>
        <i style={{ width: `${progress.percent}%` }} />
      </div>
      <Flags flags={task.flags} />
    </Link>
  );
}

// Mockup vPrgDetail.
export default async function ProgramDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [viewer, user] = await Promise.all([getViewer(), getSessionUser()]);
  if (!viewer || !user) redirect("/login");
  const { id } = await params;
  const program = await getProgramDetail(id, user);
  if (!program) notFound();

  if (program.denied) {
    return (
      <>
        <PageHeader title="Program" backHref="/penugasan/program" unreadCount={viewer.unreadNotifications} />
        <div className="pad">
          <div className="alert err">{formatError("PNG-PRG-04")}</div>
        </div>
      </>
    );
  }

  const active = program.status === "ACTIVE";
  const teamChip = <TeamChip color={program.team.color}>{program.team.name}</TeamChip>;

  return (
    <>
      <PageHeader
        title={program.name}
        subtitle={
          <>
            {teamChip} · dibuat {program.created}
          </>
        }
        backHref="/penugasan/program"
        unreadCount={viewer.unreadNotifications}
      />
      <div className="pad">
        <div className="card">
          <div className="row">
            <span>Status</span>
            <span>
              <span className={`badge ${PROGRAM_STATUS_BADGE[program.status]}`}>
                {PROGRAM_STATUS_LABEL[program.status]}
              </span>
            </span>
          </div>
          <div className="row">
            <span>Tim</span>
            <span>{teamChip}</span>
          </div>
          <div className="row">
            <span>Leader</span>
            <span>{program.leaderName}</span>
          </div>
          <div className="row">
            <span>Dibuat</span>
            <span>
              {program.created} oleh {program.createdBy}
            </span>
          </div>
          <Flags flags={program.flags} />
        </div>
        {active && program.canManage && (
          <Link className="btn block mt" href={`/penugasan/program/${program.id}/tugas/baru`}>
            <Icon name="plus" size={18} /> Tambah tugas
          </Link>
        )}
        {!active && (
          <div className="lock-note">
            <Icon name="lock" size={14} /> Program {PROGRAM_STATUS_LABEL[program.status].toLowerCase()}. Tugas baru
            tidak bisa ditambahkan.
          </div>
        )}
        <div className="qh">
          <b>Tugas berjalan</b>
          <span>{program.openTasks.length}</span>
        </div>
        {program.openTasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
        {program.openTasks.length === 0 && <div className="empty">Belum ada tugas berjalan.</div>}
        {program.closedTasks.length > 0 && (
          <>
            <div className="qh">
              <b>Tugas selesai</b>
              <span>{program.closedTasks.length}</span>
            </div>
            {program.closedTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </>
        )}
        {active && program.isLeader && (
          <ProgramActions programId={program.id} hasOpenTasks={program.openTasks.length > 0} />
        )}
      </div>
    </>
  );
}
