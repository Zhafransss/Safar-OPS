import { redirect } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { ReportList } from "@/components/report-list";
import { Icon } from "@/components/icon";
import { RoleLabel } from "@/components/role-label";
import { reportTabs } from "@/lib/report-rules";
import { getViewer } from "@/server/services/viewer";

// Mockup lapTabs and the vLapList header.
export default async function ReportsPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");

  const tabs = reportTabs({ isOwner: viewer.isOwner, leadsTeam: viewer.ledTeam !== null });

  return (
    <>
      {/* Desktop shows the list in the left pane (laporan/layout.tsx), so this side asks for a pick. */}
      <div className="lap-empty">
        <Icon name="chat" size={28} />
        <b>Pilih laporan di sebelah kiri</b>
        <span>atau buat laporan baru.</span>
      </div>
      <div className="lap-index">
        <PageHeader
          title="Laporan"
          subtitle={<RoleLabel viewer={viewer} />}
          subtitleIsRoles={viewer.teamRoles.length > 0}
          backHref="/"
          unreadCount={viewer.unreadNotifications}
        />
        <ReportList tabs={tabs} />
      </div>
    </>
  );
}
