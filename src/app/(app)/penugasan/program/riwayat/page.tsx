import { redirect } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { ProgramCardLink } from "@/components/program-list";
import { formatError } from "@/config/error-codes";
import { getSessionUser } from "@/server/auth/session";
import { getProgramHistory } from "@/server/services/assignment";
import { getViewer } from "@/server/services/viewer";

// CHANGELOG 38: programs of deleted teams, opened from Riwayat on Daftar Program. Owners only.
export default async function ProgramHistoryPage() {
  const [viewer, user] = await Promise.all([getViewer(), getSessionUser()]);
  if (!viewer || !user) redirect("/login");
  const programs = await getProgramHistory(user);
  const header = (subtitle?: string) => (
    <PageHeader
      title="Riwayat Program"
      subtitle={subtitle}
      backHref="/penugasan/program"
      unreadCount={viewer.unreadNotifications}
    />
  );

  if (!programs) {
    return (
      <>
        {header()}
        <div className="pad">
          <div className="alert err">{formatError("PNG-PRG-04")}</div>
        </div>
      </>
    );
  }

  return (
    <>
      {header("Program dari tim yang sudah dihapus")}
      <div className="pad">
        {programs.map((program) => (
          <ProgramCardLink key={program.id} program={program} />
        ))}
        {programs.length === 0 && <div className="empty">Belum ada program dari tim yang dihapus.</div>}
      </div>
    </>
  );
}
