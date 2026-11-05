import { redirect } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { ReportList } from "@/components/report-list";
import { RoleLabel } from "@/components/role-label";
import type { ReportTab } from "@/server/services/report";
import { getViewer } from "@/server/services/viewer";

// Mockup lapTabs and the vLapList header.
export default async function ReportsPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");

  const tabs: { value: ReportTab; label: string }[] = [
    { value: "saya", label: "Laporan saya" },
    ...(viewer.ledTeam ? [{ value: "tim" as const, label: "Laporan tim" }] : []),
    ...(viewer.isOwner ? [{ value: "semua" as const, label: "Semua laporan" }] : []),
  ];

  return (
    <>
      <PageHeader
        title="Laporan"
        subtitle={<RoleLabel viewer={viewer} />}
        subtitleIsRoles={viewer.teamRoles.length > 0}
        backHref="/penugasan"
        unreadCount={viewer.unreadNotifications}
      />
      <ReportList tabs={tabs} />
    </>
  );
}
