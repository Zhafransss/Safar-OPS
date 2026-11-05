import { redirect } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { ReportForm } from "@/components/report-form";
import { getReportRecipients } from "@/server/services/team";
import { getViewer } from "@/server/services/viewer";

// Mockup vLapNew.
export default async function NewReportPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  const users = await getReportRecipients();

  return (
    <>
      <PageHeader
        title="Buat laporan"
        subtitle="Pengganti grup WA"
        backHref="/penugasan/laporan"
        unreadCount={viewer.unreadNotifications}
      />
      <ReportForm users={users} meId={viewer.id} />
    </>
  );
}
