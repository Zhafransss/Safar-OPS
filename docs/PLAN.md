# Development Plan — SAFAR OPS 2

Versi 1.0, 5 November 2026. Estimasi berikut perkiraan awal untuk 1 developer dan belum menjadi komitmen tanggal, karena PRD tidak menetapkan deadline.

## 1. Sprint

Urutan mengikuti ketergantungan: login dan pemetaan tim dibutuhkan semua fitur lain, dan Laporan dibutuhkan Tugas untuk fitur lampiran.

| Sprint | Isi | Requirement | Estimasi (hari kerja) | Selesai jika |
|---|---|---|---|---|
| S0 Fondasi | Repo, stack, token tampilan, kerangka layar, database, login Jubelio, PWA dasar, uji A-01 sampai A-03 | AUT, NAV, UI, PWA | 4–5 | Login nyata berhasil, Beranda dan Hub sama dengan mockup, aplikasi bisa di-install |
| S1 Tim & Template | Pemetaan tim, palet warna, Template | TIM-01–03, TPL | 2–3 | Tim bisa dibuat dan peran tampil benar |
| S2 Laporan | Daftar, form, detail, chat, foto, tanda baca, teruskan, CC, mesin notifikasi | LAP, NTF-06 sebagian | 6–7 | Seluruh alur laporan berjalan untuk semua peran |
| S3 Penugasan | Program, Tugas, hapus Tugas, To-do, label tenggat, QC, pengalihan | PRG, TGS, TDO, QC, TIM-04–05 | 6–7 | Alur PO-123 pada contoh PRD berjalan sampai program ditutup |
| S4 Notifikasi | Daftar berkelompok, geser, batalkan, bersihkan, label CC, audit 15 pemicu | NTF | 2–3 | Semua pemicu PRD 10.2 lolos uji |
| S5 Penyelarasan & UAT | Pemeriksaan semua layar terhadap mockup, keamanan, uji HP nyata, deploy, manual book | NFR | 4–5 | Skenario uji lulus di staging |

**Total perkiraan: 24–30 hari kerja.**

## 2. Risiko

| Risiko | Dampak | Penanganan |
|---|---|---|
| Daftar pengguna Jubelio tidak tersedia (A-02) | Tinggi | Diuji hari pertama S0; cadangan opsi B di `docs/DESIGN.md` 4.2 |
| Login Jubelio karyawan berbeda dari akun sistem (A-01, A-03) | Tinggi | Butuh 1 akun karyawan untuk uji |
| Hosting belum diputuskan (A-04) | Sedang | Dibutuhkan sebelum deploy staging; kode tetap bisa berjalan di Vercel Pro maupun VPS |
| Skenario uji final belum ada (A-07) | Sedang | Diperlukan sebelum S5; sementara memakai Test Case RTM |
| Tampilan bergeser dari mockup | Sedang | Pemeriksaan NFR-01 per layar, bukan di akhir |

## 3. Branching

Semua pekerjaan masuk ke `development`. `main` hanya diperbarui saat semua fitur selesai dan siap deploy. Lingkungan staging, jika dipakai, di-deploy dari `development`.

## 4. Environment variable

Menjadi isi `.env.example` di S0.

| Variabel | Fungsi |
|---|---|
| `DATABASE_URL` | Koneksi pooled untuk aplikasi |
| `DIRECT_URL` | Koneksi langsung untuk migrasi Prisma |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` | Cloudflare R2 untuk foto, wajib di Vercel |
| `PHOTO_STORAGE_DIR` | Folder foto lokal untuk pengembangan |
| `JUBELIO_BASE_URL` | `https://api2.jubelio.com` |
| `JUBELIO_SERVICE_EMAIL` | Akun sistem untuk daftar pengguna, jika opsi A terbukti |
| `JUBELIO_SERVICE_PASSWORD` | Pasangan akun sistem |

## 5. Persiapan sebelum S0

| Kebutuhan | Dari siapa |
|---|---|
| URL repo dan akses | Selesai: `developersaefulaskar/SAFAR-OPS-2`, private, masih kosong |
| Akun Jubelio untuk uji login, diisi sendiri ke `.env.local` | Pemilik |
| Keputusan hosting dan akses akun | Pemilik |
| PostgreSQL lokal | Selesai: `pnpm db:local` (PostgreSQL asli lewat `embedded-postgres`, tanpa Docker atau instalasi) |
