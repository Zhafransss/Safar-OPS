import { notFound, redirect } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { TeamForm } from "@/components/team-form";
import { formatError } from "@/config/error-codes";
import { getTeamFormData } from "@/server/services/team";
import { getViewer } from "@/server/services/viewer";

const NEW_TEAM = "baru";

// Mockup vTimEdit. "baru" is the add form (DESIGN section 1).
export default async function TeamEditPage({ params }: { params: Promise<{ id: string }> }) {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  const { id } = await params;
  const isNew = id === NEW_TEAM;
  const title = isNew ? "Tambah tim" : "Edit tim";
  const backHref = "/penugasan/tim";

  if (!viewer.isOwner) {
    return (
      <>
        <PageHeader title={title} backHref={backHref} unreadCount={viewer.unreadNotifications} />
        <div className="pad">
          <div className="alert err">{formatError("PNG-TIM-06")}</div>
        </div>
      </>
    );
  }

  const data = await getTeamFormData(isNew ? null : id);
  if (!data) notFound();

  return (
    <>
      <PageHeader title={title} backHref={backHref} unreadCount={viewer.unreadNotifications} />
      <TeamForm {...data} />
    </>
  );
}
