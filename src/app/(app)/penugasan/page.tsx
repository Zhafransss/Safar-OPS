import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { Icon } from "@/components/icon";
import type { IconName } from "@/components/icons";
import { PageHeader } from "@/components/page-header";
import { RoleLabel, TeamChip } from "@/components/role-label";
import { getHubSummary, getViewer } from "@/server/services/viewer";

function HubRow({ href, icon, title, children }: { href: string; icon: IconName; title: string; children: ReactNode }) {
  return (
    <Link className="li" href={href}>
      <div className="li-ic" style={{ color: "var(--acc)" }}>
        <Icon name={icon} />
      </div>
      <div className="li-b">
        <b>{title}</b>
        <small>{children}</small>
      </div>
      <span className="muted">›</span>
    </Link>
  );
}

// Mockup vHub.
export default async function HubPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  const { newReports, myTodos } = await getHubSummary(viewer.id);

  return (
    <>
      <PageHeader
        title="Penugasan"
        subtitle={<RoleLabel viewer={viewer} />}
        subtitleIsRoles={viewer.teamRoles.length > 0}
        backHref="/"
        unreadCount={viewer.unreadNotifications}
      />
      <div className="pad">
        <div className="listbox">
          <HubRow href="/penugasan/laporan" icon="chat" title="Laporan">
            Pekerjaan lepas
            {newReports > 0 && (
              <>
                {" · "}
                <b style={{ color: "var(--acc)" }}>{newReports} baru</b>
              </>
            )}
          </HubRow>
          <HubRow href="/penugasan/program" icon="list" title="Penugasan">
            Pekerjaan terstruktur{myTodos > 0 && ` · ${myTodos} to-do saya`}
          </HubRow>
          {viewer.isOwner && (
            <HubRow href="/penugasan/tim" icon="users" title="Pemetaan tim">
              Atur tim, leader, dan staff
            </HubRow>
          )}
          {viewer.ledTeam && (
            <HubRow href="/penugasan/template" icon="tpl" title="Template to-do list">
              Paket to-do <TeamChip color={viewer.ledTeam.color}>{viewer.ledTeam.name}</TeamChip>
            </HubRow>
          )}
        </div>
        {!viewer.isOwner && !viewer.ledTeam && (
          <p className="small muted mt">Pemetaan tim hanya untuk pemilik. Template to-do list hanya untuk leader tim.</p>
        )}
      </div>
    </>
  );
}
