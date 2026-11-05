import { notFound, redirect } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { ReportDetail } from "@/components/report-detail";
import { formatError } from "@/config/error-codes";
import { getSessionUser } from "@/server/auth/session";
import { getReportDetail } from "@/server/services/report";
import { getReportRecipients } from "@/server/services/team";
import { getViewer } from "@/server/services/viewer";

// Mockup vLapDetail.
export default async function ReportDetailPage({ params }: { params: Promise<{ no: string }> }) {
  const [viewer, user] = await Promise.all([getViewer(), getSessionUser()]);
  if (!viewer || !user) redirect("/login");

  const { no } = await params;
  const report = await getReportDetail(no, user);
  if (!report) notFound();

  if (report.denied) {
    return (
      <>
        <PageHeader title="Laporan" backHref="/penugasan/laporan" unreadCount={viewer.unreadNotifications} />
        <div className="pad">
          <div className="alert err">{formatError("PNG-LAP-11")}</div>
        </div>
      </>
    );
  }

  const needsPicker = report.actions.canForward || report.actions.canAddCc;
  const users = needsPicker ? await getReportRecipients() : [];

  return <ReportDetail report={report} users={users} unreadCount={viewer.unreadNotifications} />;
}
