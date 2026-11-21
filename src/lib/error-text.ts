import { ATTACHMENT_UPLOAD_ERROR } from "@/lib/attachment-upload";
import { PHOTO_ERROR } from "@/lib/photo-upload";

// Rule errors already carry their PNG text, and failed photo and attachment uploads have their own
// message (CHANGELOG 21, 57). Anything else is a network or server failure.
const OWN_MESSAGES: readonly string[] = [PHOTO_ERROR, ATTACHMENT_UPLOAD_ERROR];

export function errorText(message: string): string {
  return message.startsWith("PNG-") || OWN_MESSAGES.includes(message)
    ? message
    : "Gagal menyimpan. Periksa koneksi lalu coba lagi.";
}
