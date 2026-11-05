// Single source for error text (NFR-10). PRD section 13 plus CHANGELOG rows 4, 16 and 19.
// [n] and [nama] are placeholders filled by formatError.
export const ERROR_CODES = {
  "PNG-AUT-01": "Email atau password salah.",
  "PNG-AUT-02": "Layanan login sedang bermasalah. Coba lagi.",
  "PNG-AUT-03": "Terlalu banyak percobaan login. Coba lagi 15 menit lagi.",
  "PNG-LAP-01": "Judul laporan belum diisi.",
  "PNG-LAP-02": "Pilih jenis laporan.",
  "PNG-LAP-03": "Isi laporan belum diisi.",
  "PNG-LAP-04": "Pilih penerima laporan.",
  "PNG-LAP-05": "Tidak bisa melapor ke diri sendiri.",
  "PNG-LAP-06": "Maksimal 5 foto per pesan.",
  "PNG-LAP-07": "Alasan penolakan wajib diisi.",
  "PNG-LAP-08": "Pesan kosong. Tulis pesan atau tambah foto.",
  "PNG-LAP-11": "Anda tidak punya akses ke laporan ini.",
  "PNG-PRG-01": "Nama program belum diisi.",
  "PNG-PRG-02": "Pilih tim penanggung jawab.",
  "PNG-PRG-03": "Masih ada tugas yang belum selesai.",
  "PNG-PRG-04": "Anda tidak punya akses ke program ini.",
  "PNG-QC-01": "Pilih to-do yang perlu direvisi.",
  "PNG-QC-02": "Catatan revisi \"[nama to-do]\" wajib diisi.",
  "PNG-QC-03": "Hanya leader tim yang bisa melakukan QC.",
  "PNG-TDO-01": "Nama to-do [n] belum diisi.",
  "PNG-TDO-02": "PIC to-do \"[nama]\" belum dipilih.",
  "PNG-TDO-03": "DL to-do \"[nama]\" belum diisi.",
  "PNG-TDO-04": "DL \"[nama]\" tidak boleh sebelum hari ini.",
  "PNG-TDO-05": "Anda tidak bisa mengubah to-do ini.",
  "PNG-TGS-01": "Nama tugas belum diisi.",
  "PNG-TGS-02": "Tambahkan minimal 1 to-do.",
  "PNG-TGS-03": "Anda tidak punya akses ke tugas ini.",
  "PNG-TGS-04": "Tugas yang sudah selesai atau terkunci tidak bisa dihapus.",
  "PNG-TIM-01": "Nama tim belum diisi.",
  "PNG-TIM-02": "Pilih leader tim.",
  "PNG-TIM-03": "[Nama] sudah menjadi leader di [Tim]. Satu orang hanya boleh leader di 1 tim.",
  "PNG-TIM-04": "Pilih minimal 1 staff.",
  "PNG-TIM-06": "Hanya pemilik yang bisa mengatur pemetaan tim.",
  "PNG-TIM-07": "Warna ini sudah dipakai [nama tim]. Pilih warna lain.",
  "PNG-TIM-08": "Semua 8 warna tim sudah dipakai. Tim baru belum bisa ditambahkan.",
  "PNG-TPL-01": "Nama template belum diisi.",
  "PNG-TPL-02": "Tambahkan minimal 1 to-do.",
  "PNG-TPL-03": "Template hanya bisa dikelola leader tim.",
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;

export function formatError(code: ErrorCode, params: Record<string, string | number> = {}): string {
  const text = Object.entries(params).reduce<string>((acc, [key, value]) => acc.replace(`[${key}]`, String(value)), ERROR_CODES[code]);
  return `${code}: ${text}`;
}
