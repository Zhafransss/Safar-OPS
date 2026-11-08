# Rencana Deploy — SAFAR OPS 2

Versi 1.0, 5 November 2026. Keputusan hosting (SRS A-04): aplikasi di **Vercel**, data di **PostgreSQL**, foto di **Cloudflare R2**.

## 1. Komponen

| Komponen | Layanan | Catatan |
|---|---|---|
| Aplikasi | Vercel, region Singapura (`vercel.json`) | Paket Hobby dilarang untuk pemakaian komersial menurut syarat Vercel; risikonya sudah dijelaskan dan diterima. Log runtime Hobby hanya 1 jam |
| Database | PostgreSQL, penyedia belum dipilih | Syarat: PostgreSQL 15 ke atas, encoding UTF-8, region Singapura atau terdekat, ada koneksi pooled untuk serverless, backup harian |
| Foto | Cloudflare R2, bucket privat | Gratis sampai 10 GB. Server memeriksa hak akses lalu meneruskan foto dari R2 ke browser. HP tidak pernah membuka domain R2, karena domain R2 diblokir ISP Indonesia |
| Domain | ops2.saefulaskar.com | SSL otomatis dari Vercel |

## 2. Menyiapkan Cloudflare R2

1. Di dasbor Cloudflare, buka R2, buat bucket, misalnya `safar-ops2-photos`, dengan *Location hint* **Asia-Pacific (APAC)** agar dekat dengan Vercel Singapura. Jangan aktifkan akses publik.
2. Buat API token R2 dengan izin **Object Read & Write** yang dibatasi hanya ke bucket itu.
3. Catat **Account ID**, **Access Key ID**, dan **Secret Access Key**. Secret hanya tampil sekali.
4. Tidak perlu aturan CORS: unggahan lewat server aplikasi, dan foto dibuka lewat tautan biasa.

## 3. Menyiapkan PostgreSQL

1. Buat database dengan encoding UTF-8.
2. Siapkan dua alamat koneksi: **pooled** untuk aplikasi (`DATABASE_URL`) dan **langsung** untuk migrasi (`DIRECT_URL`). Jika penyedia hanya punya satu, isi keduanya dengan alamat yang sama.
3. Jalankan migrasi dari komputer developer: `DIRECT_URL=... pnpm db:deploy`.

## 4. Environment variable di Vercel

| Variabel | Production | Preview (branch `development`) |
|---|---|---|
| `DATABASE_URL` | Database produksi, pooled | **Database terpisah** untuk uji, jangan produksi |
| `DIRECT_URL` | Database produksi, langsung | Database uji, langsung |
| `R2_ACCOUNT_ID` | Dari langkah 2 | Sama |
| `R2_ACCESS_KEY_ID` | Dari langkah 2 | Sama |
| `R2_SECRET_ACCESS_KEY` | Dari langkah 2 | Sama |
| `R2_BUCKET` | Bucket produksi | Bucket terpisah untuk uji |
| `JUBELIO_BASE_URL` | `https://api2.jubelio.com` | Sama |
| `DEV_LOGIN_PASSWORD` | **Jangan diisi** | **Jangan diisi** |

Tanpa variabel `R2_*`, aplikasi di Vercel menolak menyimpan foto dengan pesan jelas, karena disk Vercel tidak permanen.

## 5. Branch dan rilis

- Vercel: **Production Branch = `main`**. Setiap push ke `development` menjadi preview deploy untuk uji (staging).
- `main` hanya diperbarui saat semua fitur siap dirilis (alur yang disepakati).
- Migrasi tidak dijalankan otomatis saat build, karena preview deploy bisa ikut mengubah database produksi. Urutannya: jalankan `pnpm db:deploy` ke database tujuan, lalu deploy.

## 6. Domain

1. Di Vercel, Project Settings > Domains, tambahkan `ops2.saefulaskar.com`.
2. Di pengelola DNS saefulaskar.com, buat CNAME `ops2` ke alamat yang ditunjukkan Vercel.
3. Tunggu SSL aktif, lalu uji install PWA di HP (butuh HTTPS).

## 7. Backup dan pemantauan

| Hal | Rencana |
|---|---|
| Database | Backup otomatis dari penyedia, ditambah `pg_dump` mingguan yang disimpan di luar penyedia |
| Foto | Foto tidak pernah diubah setelah diunggah. Salin bucket berkala ke tempat lain (misalnya `rclone`) jika foto dianggap penting jangka panjang |
| Error | Log runtime Hobby hanya 1 jam, jadi error bisa terlewat. Jika butuh jejak lebih panjang, pertimbangkan layanan pencatat error gratis |

## 8. Biaya operasional

| Komponen | Perkiraan per bulan | Catatan |
|---|---|---|
| Vercel Hobby | Rp0 | Berhenti sampai 30 hari jika kuota habis; melanggar syarat bila pembuatnya dibayar. Foto ikut memakai kuota transfer: 1.000 kali buka foto per hari sekitar 5 GB per bulan |
| Cloudflare R2 | Rp0 sampai 10 GB | Foto sekitar 165 KB; dengan 50 foto per hari, 10 GB cukup sekitar 3 tahun. Di atas itu sekitar US$0,015 per GB-bulan; unduh gratis |
| PostgreSQL | Tergantung penyedia | Banyak penyedia punya paket gratis 0,5–1 GB; data teks aplikasi ini kecil |
| Domain | Sudah dimiliki | Subdomain ops2 tidak menambah biaya |

Biaya pengembangan (sekali bayar) tidak termasuk di dokumen ini dan dirinci terpisah oleh Velora.

## 9. Daftar periksa sebelum go-live

| No | Periksa | Status |
|---|---|---|
| 1 | Login Jubelio asli berhasil untuk akun karyawan biasa dan nama tampil benar (A-01, A-03) | Belum |
| 2 | Keputusan daftar pengguna: API Jubelio atau tercatat saat login pertama (A-02) | Belum |
| 3 | Foto tersimpan dan terbuka dari bucket R2 asli | Belum |
| 4 | Install PWA dan halaman offline di Android dan iPhone | Belum |
| 5 | Geser notifikasi dan foto HEIC di iPhone asli | Belum |
| 6 | Semua skenario `docs/UAT.md` lulus di staging | Belum |
| 7 | `DEV_LOGIN_PASSWORD` tidak ada di Vercel; akun `@safar.local` tidak bisa masuk | Belum |
| 8 | Backup database pertama berhasil dipulihkan di database uji | Belum |
