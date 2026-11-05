import { getSessionUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { photoResponse } from "@/server/integrations/photo-storage";
import { canViewViaTask } from "@/server/services/assignment";
import { userCanSeeReport } from "@/server/services/report";

// NFR-04: photos have no public URL. Every read repeats the report access check.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return new Response(null, { status: 401 });

  const { id } = await params;
  const reportInclude = { include: { ccs: { select: { userId: true } } } };
  const photo = await db.photo.findUnique({
    where: { id },
    include: { report: reportInclude, message: { include: { report: reportInclude } } },
  });
  const report = photo?.report ?? photo?.message?.report;
  if (!photo || !report) return new Response(null, { status: 404 });
  const allowed = (await userCanSeeReport(report, user)) || (await canViewViaTask(report.id, user));
  if (!allowed) return new Response(null, { status: 403 });

  return photoResponse(photo.blobPath);
}
