import { ATTACHMENT_PART_BYTES, attachmentExtension, MAX_ATTACHMENT_PARTS } from "@/lib/attachment-rules";
import { getSessionUser } from "@/server/auth/session";
import {
  attachmentPartExists,
  attachmentPrefix,
  isUploadId,
  matchesAttachmentType,
  newAttachmentUploadId,
  saveAttachmentPart,
} from "@/server/integrations/photo-storage";
import { isCrossSite } from "@/server/same-origin";

// CHANGELOG 57: one part of a chat attachment. Part 0 starts the upload and is checked against the
// file's extension; later parts name the upload it returned. The message claims the upload when sent.
// A part is written once: a later part needs part 0 and may not replace one already stored, so a
// file cannot change after it was sent.
export async function POST(request: Request) {
  if (isCrossSite(request)) return new Response(null, { status: 403 });
  const user = await getSessionUser();
  if (!user) return new Response(null, { status: 401 });

  const form = await request.formData().catch(() => null);
  const part = form?.get("part");
  const index = Number(form?.get("index"));
  const extension = attachmentExtension(String(form?.get("name") ?? ""));
  if (!extension) return new Response(null, { status: 415 });
  if (!(part instanceof File) || part.size === 0 || part.size > ATTACHMENT_PART_BYTES) {
    return new Response(null, { status: 413 });
  }
  if (!Number.isInteger(index) || index < 0 || index >= MAX_ATTACHMENT_PARTS) return new Response(null, { status: 400 });

  const bytes = new Uint8Array(await part.arrayBuffer());
  const uploadId = index === 0 ? newAttachmentUploadId() : String(form?.get("uploadId") ?? "");
  if (!isUploadId(uploadId)) return new Response(null, { status: 400 });
  if (index === 0 && !matchesAttachmentType(extension, bytes)) return new Response(null, { status: 415 });

  const prefix = attachmentPrefix(user.id, uploadId);
  if (index > 0) {
    const [started, taken] = await Promise.all([
      attachmentPartExists(prefix, 0, extension),
      attachmentPartExists(prefix, index, extension),
    ]);
    if (!started || taken) return new Response(null, { status: 409 });
  }
  await saveAttachmentPart(prefix, index, extension, bytes);
  return Response.json({ uploadId });
}
