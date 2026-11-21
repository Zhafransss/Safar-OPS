import { attachmentExtension } from "@/lib/attachment-rules";
import { getSessionUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { attachmentResponse } from "@/server/integrations/photo-storage";
import { canViewViaTask } from "@/server/services/assignment";
import { userCanSeeReport } from "@/server/services/report";

// NFR-04, as for photos: attachments have no public URL and every download repeats the access check.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return new Response(null, { status: 401 });

  const { id } = await params;
  const attachment = await db.attachment.findUnique({
    where: { id },
    include: { message: { include: { report: { include: { ccs: { select: { userId: true } } } } } } },
  });
  const report = attachment?.message.report;
  const extension = attachment && attachmentExtension(`.${attachment.extension}`);
  if (!attachment || !report || !extension) return new Response(null, { status: 404 });
  const allowed = (await userCanSeeReport(report, user)) || (await canViewViaTask(report.id, user));
  if (!allowed) return new Response(null, { status: 403 });

  return attachmentResponse({ ...attachment, extension });
}
