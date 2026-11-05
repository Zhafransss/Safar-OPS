import { notFound, redirect } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { TaskForm } from "@/components/task-form";
import { formatError } from "@/config/error-codes";
import { getSessionUser } from "@/server/auth/session";
import { getTaskForm } from "@/server/services/assignment";
import { getViewer } from "@/server/services/viewer";

// Mockup vTgsNew.
export default async function NewTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const [viewer, user] = await Promise.all([getViewer(), getSessionUser()]);
  if (!viewer || !user) redirect("/login");
  const { id } = await params;
  const form = await getTaskForm(id, user);
  if (!form) notFound();
  const backHref = `/penugasan/program/${id}`;

  if (form.denied) {
    return (
      <>
        <PageHeader title="Tambah tugas" backHref={backHref} unreadCount={viewer.unreadNotifications} />
        <div className="pad">
          <div className="alert err">{formatError("PNG-PRG-04")}</div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Tambah tugas"
        subtitle={form.programName}
        backHref={backHref}
        unreadCount={viewer.unreadNotifications}
      />
      <TaskForm form={form} />
    </>
  );
}
