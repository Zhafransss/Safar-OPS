// Rule errors already carry their PNG text. Anything else is a network or server failure.
export function errorText(message: string): string {
  return message.startsWith("PNG-") ? message : "Gagal menyimpan. Periksa koneksi lalu coba lagi.";
}
