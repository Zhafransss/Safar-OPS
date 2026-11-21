import { formatError } from "@/config/error-codes";
import {
  ATTACHMENT_PART_BYTES,
  attachmentExtension,
  MAX_ATTACHMENT_BYTES,
  MAX_ATTACHMENTS,
} from "@/lib/attachment-rules";

export const ATTACHMENT_UPLOAD_ERROR = "Lampiran gagal diunggah. Periksa koneksi lalu coba lagi.";

// CHANGELOG 57: the reason a picked file cannot be sent, or null. The server checks the same rules.
export function attachmentProblem(file: File, alreadyPicked: number): string | null {
  if (alreadyPicked >= MAX_ATTACHMENTS) return formatError("PNG-LAP-09");
  if (!attachmentExtension(file.name)) return formatError("PNG-LAP-12", { nama: file.name });
  if (file.size > MAX_ATTACHMENT_BYTES) return formatError("PNG-LAP-10", { nama: file.name });
  return null;
}

// Each file goes up in parts under the Vercel request limit: part 0 returns the upload id, the
// rest name it. Returns what sendMessage needs to claim the uploads.
export async function uploadAttachments(files: readonly File[]) {
  return Promise.all(
    files.map(async (file) => {
      let uploadId = "";
      for (let index = 0; index * ATTACHMENT_PART_BYTES < file.size; index++) {
        const body = new FormData();
        body.append("part", file.slice(index * ATTACHMENT_PART_BYTES, (index + 1) * ATTACHMENT_PART_BYTES), "part");
        body.append("name", file.name);
        body.append("index", String(index));
        if (uploadId) body.append("uploadId", uploadId);
        const response = await fetch("/api/attachments", { method: "POST", body });
        if (response.status === 415) throw new Error(formatError("PNG-LAP-12", { nama: file.name }));
        if (!response.ok) throw new Error(ATTACHMENT_UPLOAD_ERROR);
        uploadId = ((await response.json()) as { uploadId: string }).uploadId;
      }
      return { uploadId, name: file.name, size: file.size };
    }),
  );
}
