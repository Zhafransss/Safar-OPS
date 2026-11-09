import { PHOTO_ERROR } from "@/lib/photo-upload";

// Rule errors already carry their PNG text, and a failed photo upload has its own message (CHANGELOG 21).
// Anything else is a network or server failure.
export function errorText(message: string): string {
  return message.startsWith("PNG-") || message === PHOTO_ERROR ? message : "Gagal menyimpan. Periksa koneksi lalu coba lagi.";
}
