import { redirect } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { ProgramForm } from "@/components/program-form";
import { formatError } from "@/config/error-codes";
import { getSessionUser } from "@/server/auth/session";
import { getProgramForm } from "@/server/services/assignment";
import { getViewer } from "@/server/services/viewer";

// Mockup vPrgNew.
export default async function NewProgramPage() {
  const [viewer, user] = await Promise.all([getViewer(), getSessionUser()]);
  if (!viewer || !user) redirect("/login");
  const form = await getProgramForm(user);

  return (
    <>
      <PageHeader title="Buat program" backHref="/penugasan/program" unreadCount={viewer.unreadNotifications} />
      {form ? (
        <ProgramForm {...form} />
      ) : (
        <div className="pad">
          <div className="alert err">{formatError("PNG-PRG-04")}</div>
        </div>
      )}
    </>
  );
}
