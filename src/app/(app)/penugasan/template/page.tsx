import Link from "next/link";
import { redirect } from "next/navigation";

import { Icon } from "@/components/icon";
import { PageHeader } from "@/components/page-header";
import { TeamChip } from "@/components/role-label";
import { formatError } from "@/config/error-codes";
import { listTemplates } from "@/server/services/template";
import { getViewer } from "@/server/services/viewer";

// Mockup vTpl.
export default async function TemplatesPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  const team = viewer.ledTeam;

  if (!team) {
    return (
      <>
        <PageHeader title="Template to-do list" backHref="/penugasan" unreadCount={viewer.unreadNotifications} />
        <div className="pad">
          <div className="alert err">{formatError("PNG-TPL-03")}</div>
        </div>
      </>
    );
  }

  const templates = await listTemplates(team.id);

  return (
    <>
      <PageHeader
        title="Template to-do list"
        subtitle={<TeamChip color={team.color}>{team.name}</TeamChip>}
        backHref="/penugasan"
        unreadCount={viewer.unreadNotifications}
      />
      <div className="pad">
        <Link className="btn block" href="/penugasan/template/baru">
          <Icon name="plus" size={18} /> Buat template
        </Link>
        {templates.map((template) => (
          <Link key={template.id} className="tcard" href={`/penugasan/template/${template.id}`}>
            <div className="tt">
              <b>{template.name}</b>
              <span className="muted">
                <Icon name="pen" size={16} />
              </span>
            </div>
            <div className="ts">
              {template.todos.length} to-do · {template.todos.map((todo) => todo.name).join(", ")}
            </div>
          </Link>
        ))}
        {templates.length === 0 && <div className="empty">Belum ada template.</div>}
        <p className="small muted mt">
          Template hanya berisi nama dan daftar to-do. Arahan, PIC, dan DL diisi saat template dipakai.
        </p>
      </div>
    </>
  );
}
