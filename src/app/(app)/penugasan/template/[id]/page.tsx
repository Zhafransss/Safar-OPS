import { notFound, redirect } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { TemplateForm } from "@/components/template-form";
import { formatError } from "@/config/error-codes";
import { getTemplate } from "@/server/services/template";
import { getViewer } from "@/server/services/viewer";

const NEW_TEMPLATE = "baru";

// Mockup vTplEdit. "baru" is the add form (DESIGN section 1).
export default async function TemplateEditPage({ params }: { params: Promise<{ id: string }> }) {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  const { id } = await params;
  const isNew = id === NEW_TEMPLATE;
  const title = isNew ? "Buat template" : "Edit template";
  const backHref = "/penugasan/template";

  if (!viewer.ledTeam) {
    return (
      <>
        <PageHeader title={title} backHref={backHref} unreadCount={viewer.unreadNotifications} />
        <div className="pad">
          <div className="alert err">{formatError("PNG-TPL-03")}</div>
        </div>
      </>
    );
  }

  const template = isNew ? null : await getTemplate(id, viewer.ledTeam.id);
  if (!isNew && !template) notFound();

  return (
    <>
      <PageHeader title={title} backHref={backHref} unreadCount={viewer.unreadNotifications} />
      <TemplateForm
        template={template ? { id: template.id, name: template.name, todos: template.todos.map((t) => t.name) } : null}
      />
    </>
  );
}
