import { redirect } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { ProgramList } from "@/components/program-list";
import { RoleLabel } from "@/components/role-label";
import { getSessionUser } from "@/server/auth/session";
import { getProgramList } from "@/server/services/assignment";
import { getViewer } from "@/server/services/viewer";

// Mockup vPrgList. Opened from the Tugas card on Beranda (CHANGELOG 26).
export default async function ProgramsPage() {
  const [viewer, user] = await Promise.all([getViewer(), getSessionUser()]);
  if (!viewer || !user) redirect("/login");
  const { programs, canCreate, teams } = await getProgramList(user);

  return (
    <>
      <PageHeader
        title="Daftar Program"
        subtitle={<RoleLabel viewer={viewer} />}
        subtitleIsRoles={viewer.teamRoles.length > 0}
        backHref="/"
        unreadCount={viewer.unreadNotifications}
      />
      {/* K-T39: Template To-do is for leaders only; owners never lead a team. */}
      <ProgramList
        programs={programs}
        teams={teams}
        canCreate={canCreate}
        showTemplates={viewer.ledTeam !== null}
        showHistory={viewer.isOwner}
      />
    </>
  );
}
