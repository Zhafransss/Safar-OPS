import { notFound, redirect } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { TeamChip } from "@/components/role-label";
import { TaskDetail } from "@/components/task-detail";
import { formatError } from "@/config/error-codes";
import { getSessionUser } from "@/server/auth/session";
import { getTaskDetail } from "@/server/services/assignment";
import { getViewer } from "@/server/services/viewer";

// Mockup vTgsDetail.
export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [viewer, user] = await Promise.all([getViewer(), getSessionUser()]);
  if (!viewer || !user) redirect("/login");
  const { id } = await params;
  const task = await getTaskDetail(id, user);
  if (!task) notFound();

  if (task.denied) {
    return (
      <>
        <PageHeader title="Tugas" backHref="/penugasan/program" unreadCount={viewer.unreadNotifications} />
        <div className="pad">
          <div className="alert err">{formatError("PNG-TGS-03")}</div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={task.name}
        subtitle={
          <>
            {task.programName} · <TeamChip color={task.team.color}>{task.team.name}</TeamChip>
          </>
        }
        backHref={`/penugasan/program/${task.programId}`}
        unreadCount={viewer.unreadNotifications}
      />
      <TaskDetail task={task} />
    </>
  );
}
