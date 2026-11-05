import Link from "next/link";
import { redirect } from "next/navigation";

import { AvatarMenu } from "@/components/avatar-menu";
import { BellButton } from "@/components/bell-button";
import { Icon } from "@/components/icon";
import { RoleLabel } from "@/components/role-label";
import { formatFullDate, greeting } from "@/lib/date";
import { getViewer } from "@/server/services/viewer";

// Mockup vHome.
export default async function HomePage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
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
      <div className="sect-t">Penugasan</div>
      <div className="grid3">
        <Link className="menu hot" href="/penugasan">
          <div className="ico">
            <Icon name="list" />
          </div>
          <b>Penugasan</b>
          <small>Laporan &amp; tugas tim</small>
        </Link>
      </div>
      <div style={{ height: 20 }} />
    </>
  );
}
