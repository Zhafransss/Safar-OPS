import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AvatarMenu } from "@/components/avatar-menu";
import { BellButton } from "@/components/bell-button";
import { Icon } from "@/components/icon";
import type { IconName } from "@/components/icons";
import { RoleLabel } from "@/components/role-label";
import { formatFullDate, greeting } from "@/lib/date";
import { getViewer, getWorkSummary } from "@/server/services/viewer";

// Mockup menu tile. `count` carries the summary the removed hub showed (CHANGELOG 26).
function MenuCard({
  href,
  icon,
  title,
  count,
  children,
}: {
  href: string;
  icon: IconName;
  title: string;
  count?: string;
  children: ReactNode;
}) {
  return (
    <Link className="menu hot" href={href}>
      <div className="ico">
        <Icon name={icon} />
      </div>
      <b>{title}</b>
      <small>{children}</small>
      {count && (
        <small>
          <b className="menu-cnt">{count}</b>
        </small>
      )}
    </Link>
  );
}

// Mockup vHome, with the Pekerjaan section from 02-navigasi-penugasan (CHANGELOG 26).
export default async function HomePage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  const { newReports, myTodos } = await getWorkSummary(viewer.id);
  const now = new Date();

  return (
    <>
      <div className="home-hd">
        <div>
          <div className="h1">SAFAR OPS 2</div>
          <div className="hi">Hi, {viewer.name}</div>
          <div className="hi" style={{ fontSize: 12 }}>
            <RoleLabel viewer={viewer} />
          </div>
        </div>
        <div className="hd-row">
          <BellButton count={viewer.unreadNotifications} />
          <AvatarMenu initials={viewer.initials} name={viewer.name} />
        </div>
      </div>
      <div className="datecard">
        <div className="dt">
          <span style={{ color: "var(--acc)" }}>
            <Icon name="cal" size={26} />
          </span>
          <div>
            <b>{formatFullDate(now)}</b>
            <small>{greeting(now)}</small>
          </div>
        </div>
      </div>
      <div className="sect-t">Pekerjaan</div>
      <div className="grid3">
        <MenuCard href="/penugasan/program" icon="list" title="Tugas" count={myTodos > 0 ? `${myTodos} to-do saya` : undefined}>
          Program dan to-do tim
        </MenuCard>
        <MenuCard href="/penugasan/laporan" icon="chat" title="Laporan" count={newReports > 0 ? `${newReports} baru` : undefined}>
          Lapor dan tanggapi
        </MenuCard>
        {/* V1.0: the team chart stays owner-only; everyone sees it from V2.0. */}
        {viewer.isOwner && (
          <MenuCard href="/penugasan/tim" icon="users" title="Tim">
            Susunan tim
          </MenuCard>
        )}
      </div>
      <div style={{ height: 20 }} />
    </>
  );
}
