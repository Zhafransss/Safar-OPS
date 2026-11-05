import { redirect } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { ProgramList } from "@/components/program-list";
import { RoleLabel } from "@/components/role-label";
import { getSessionUser } from "@/server/auth/session";
import { getProgramList } from "@/server/services/assignment";
import { getViewer } from "@/server/services/viewer";

// Mockup vPrgList.
export default async function ProgramsPage() {
  const [viewer, user] = await Promise.all([getViewer(), getSessionUser()]);
  if (!viewer || !user) redirect("/login");
  const { programs, canCreate } = await getProgramList(user);

  return (
    <>
      <PageHeader
        title="Penugasan"
        subtitle={<RoleLabel viewer={viewer} />}
        subtitleIsRoles={viewer.teamRoles.length > 0}
        backHref="/penugasan"
        unreadCount={viewer.unreadNotifications}
      />
      <ProgramList programs={programs} canCreate={canCreate} />
    </>
  );
}
