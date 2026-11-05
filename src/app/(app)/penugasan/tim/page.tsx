import Link from "next/link";
import { redirect } from "next/navigation";

import { AddTeamButton } from "@/components/add-team-button";
import { Icon } from "@/components/icon";
import { PageHeader } from "@/components/page-header";
import { TeamChip } from "@/components/role-label";
import { formatError } from "@/config/error-codes";
import { getTeamChart } from "@/server/services/team";
import { getViewer } from "@/server/services/viewer";

const STAFF_AVATAR = { background: "var(--surface2)", color: "var(--muted)" };

// Mockup vTim.
export default async function TeamsPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");

  if (!viewer.isOwner) {
    return (
      <>
        <PageHeader title="Pemetaan tim" backHref="/penugasan" unreadCount={viewer.unreadNotifications} />
        <div className="pad">
          <div className="alert err">{formatError("PNG-TIM-06")}</div>
        </div>
      </>
    );
  }

  const { owners, teams, paletteFull } = await getTeamChart();

  return (
    <>
      <PageHeader
        title="Pemetaan tim"
        subtitle="Hanya pemilik"
        backHref="/penugasan"
        unreadCount={viewer.unreadNotifications}
      />
      <div className="pad">
        <div className="card">
          {owners.map((owner) => (
            <div key={owner.name} className="tm">
              <div className="av">{owner.initials}</div>
              <div>
                <b>{owner.name}</b>
                <div className="small muted">Pemilik (tetap)</div>
              </div>
            </div>
          ))}
          <div className="tree">
            {teams.map((team) => (
              <Link
                key={team.id}
                className="tcard"
                href={`/penugasan/tim/${team.id}`}
                style={{ borderLeft: `4px solid ${team.color}` }}
              >
                <div className="tt">
                  <TeamChip color={team.color}>{team.name}</TeamChip>
                  <span className="muted">
                    <Icon name="pen" size={16} />
                  </span>
                </div>
                <div className="tm">
                  <div className="av">{team.leader.initials}</div>
                  <div>
                    <b>{team.leader.name}</b>
                    <div className="small muted">Leader</div>
                  </div>
                </div>
                {team.staff.map((staff) => (
                  <div key={staff.id} className="tm">
                    <div className="av" style={STAFF_AVATAR}>
                      {staff.initials}
                    </div>
                    <div>
                      {staff.name}
                      <div className="small muted">Staff{staff.isDoubleRole ? " · rangkap" : ""}</div>
                    </div>
                  </div>
                ))}
              </Link>
            ))}
          </div>
        </div>
        <AddTeamButton paletteFull={paletteFull} />
        <p className="small muted mt">
          Daftar nama diambil dari pengguna Jubelio. Satu orang hanya boleh menjadi leader di 1 tim, tetapi boleh menjadi
          staff di beberapa tim.
        </p>
      </div>
    </>
  );
}
