# Rencana Deploy — HRIS

Versi 1.1, 19 November 2026 (versi 1.0: 5 November 2026). Keputusan hosting (SRS A-04): aplikasi di **Vercel**, data di **PostgreSQL** (Prisma Postgres), foto di **Cloudflare R2**.

## 1. Susunan lingkungan

Diputuskan 19 November 2026: production pindah ke branch `main` dengan data sendiri, di **proyek Vercel terpisah**. Development tetap menjadi tempat uji klien di proyek Vercel yang sudah ada.

| | Production | Development (uji) |
|---|---|---|
| Proyek Vercel | Proyek baru (misalnya `hris`) | `safarops` (yang sudah ada) |
| Branch Git | `main` | `development` |
| Build dipicu oleh | Push ke `main` | Push ke `development` |
| Alamat | **hris.saefulaskar.com** | `safarops.veloradigitalworks.com` dan domain bawaan proyek (Settings > Domains) |
| Database | Database **baru** `HRIS-Production`, di proyek Prisma `safar-ops` | Database `SafarOps`, di proyek Prisma yang sama |
| Foto | Bucket R2 **baru** | Bucket R2 `safarops` |
| Login | Jubelio asli saja | Jubelio asli dan akun uji `LOCAL_ACCOUNTS` |

| Komponen | Layanan | Catatan |
|---|---|---|
| Aplikasi | Vercel, region Singapura (`vercel.json`) | Paket Hobby dilarang untuk pemakaian komersial menurut syarat Vercel; risikonya sudah dijelaskan dan diterima. Log runtime Hobby hanya 1 jam |
| Database | Prisma Postgres, Singapura, proyek `safar-ops` di console.prisma.io | Satu alamat koneksi langsung (`db.prisma.io`), dipakai untuk `DATABASE_URL` dan `DIRECT_URL`. Paket Free: tanpa backup dan kuota operasi bulanan (bagian 4) |
| Foto | Cloudflare R2, bucket privat | Gratis sampai 10 GB. Server memeriksa hak akses lalu meneruskan foto dari R2 ke browser. HP tidak pernah membuka domain R2, karena domain R2 diblokir ISP Indonesia |
| Domain | hris.saefulaskar.com | SSL otomatis dari Vercel |

## 2. Langkah pindah production ke `main`

Production dibuat sebagai proyek Vercel kedua yang tersambung ke repo yang sama. Dengan begitu kedua lingkungan sama-sama deploy production di proyeknya masing-masing: alamat development tetap publik untuk klien (deploy Preview dalam satu proyek mewajibkan login akun Vercel), dan variabel tiap lingkungan cukup diisi di scope Production proyeknya. Hobby mengizinkan hingga 25 proyek tersambung ke satu repo, asalkan repo milik akun pribadi, bukan organisasi GitHub.

Semua URL database dan kunci R2 diketik langsung di dasbor atau terminal sendiri, tidak dikirim lewat chat.

1. **Database production.** Di console.prisma.io, buat database kedua `HRIS-Production` di proyek `safar-ops` (bagian 4), lalu jalankan migrasinya:
   ```
   DIRECT_URL="$(grep '^PROD_DATABASE_URL=' .env.vercel.local | cut -d= -f2-)" pnpm db:deploy
   ```
   Database baru menerima ketiga migrasi, diakhiri "All migrations have been successfully applied."
2. **Bucket foto production.** Buat bucket R2 `hris-production` dan API token khusus bucket itu (bagian 3).
3. **Proyek Vercel production.** Create New > Project > import repo `Zhafransss/Safar-OPS`. Framework Next.js terdeteksi otomatis; build command bawaan (`prisma generate && next build` dari `package.json`); region Singapura dari `vercel.json`. Isi variabel Production sesuai bagian 5. Deploy pertama saat import boleh diabaikan.
4. **Branch dan build proyek production.** Settings > Git: Production Branch `main`. Settings > Build: **Ignored Build Step = Only build production**, supaya proyek ini hanya membangun push ke `main`.
5. **Build proyek development.** Di proyek `safarops`, Production Branch tetap `development` dan variabelnya tidak diubah. Atur juga **Ignored Build Step = Only build production**, supaya push ke `main` tidak ikut membangun di sini.
6. **Domain.** Di proyek production, tambahkan `hris.saefulaskar.com` (bagian 7).
7. **Rilis.** Perbarui `main` hingga sama dengan `development` lalu push. Proyek production men-deploy `main`.
8. **Periksa** daftar di bagian 10, lalu minta karyawan memasang PWA dari alamat production. Aplikasi yang terpasang dari alamat development tidak ikut pindah.

## 3. Menyiapkan Cloudflare R2

1. Di dasbor Cloudflare, buka R2, buat bucket, misalnya `hris-photos`, dengan *Location hint* **Asia-Pacific (APAC)** agar dekat dengan Vercel Singapura. Jangan aktifkan akses publik.
2. Buat API token R2 dengan izin **Object Read & Write** yang dibatasi hanya ke bucket itu.
3. Catat **Account ID**, **Access Key ID**, dan **Secret Access Key**. Secret hanya tampil sekali.
4. Tidak perlu aturan CORS: unggahan lewat server aplikasi, dan foto dibuka lewat tautan biasa.

## 4. Menyiapkan PostgreSQL (Prisma Postgres)

Production dan development memakai dua database di proyek Prisma `safar-ops` yang sama (diputuskan 19 November 2026). Satu proyek Prisma boleh berisi banyak database; paket Free mengizinkan 50.

1. Buka console.prisma.io, proyek `safar-ops`. Biarkan pilihan **Branch** tetap `main`. Branch di Prisma Console milik Prisma Compute (hosting aplikasi Prisma) dan tidak terhubung ke branch Git aplikasi; aplikasi ini di-host di Vercel, jadi deploy mana memakai database mana ditentukan oleh `DATABASE_URL` di Vercel. Menu **Git** di Prisma juga tidak perlu disambungkan.
2. Klik **+** di sebelah DATABASES (Create Database), isi nama `HRIS-Production`, pilih region **Singapore**, lalu buat.
3. Pilih database itu, klik **Connect to your database**, lalu **Generate new connection string**. Salin alamat **direct** (`postgres://...@db.prisma.io:5432/postgres?sslmode=require`), bukan yang pooled (`pooled.db.prisma.io`). Alamat ini dipakai untuk `DATABASE_URL` dan `DIRECT_URL`, sama seperti development.
4. Jalankan migrasi dari komputer developer: `DIRECT_URL=... pnpm db:deploy`.

Batas paket Free yang memengaruhi production:

| Hal | Paket Free | Dampak |
|---|---|---|
| Backup | Tidak ada | Backup otomatis penyedia tidak tersedia; pakai `pg_dump` berkala (bagian 8) atau naikkan paket |
| Kuota | 200.000 operasi per bulan | Jika habis, database berhenti menerima baca dan tulis sampai bulan berikutnya. Dokumentasi Prisma tidak menyebut apakah kuota dihitung per database atau per workspace; pantau di Dashboard masing-masing database |

## 5. Environment variable di Vercel

Setiap proyek hanya memakai scope **Production** (Preview dan Development tidak dipakai).

| Variabel | Proyek production | Proyek development (`safarops`) |
|---|---|---|
| `DATABASE_URL` | `HRIS-Production` | `SafarOps` |
| `DIRECT_URL` | `HRIS-Production` | `SafarOps` |
| `R2_ACCOUNT_ID` | Akun Cloudflare | Sama |
| `R2_ACCESS_KEY_ID` | Token bucket `hris-production` | Token bucket `safarops` |
| `R2_SECRET_ACCESS_KEY` | Token bucket `hris-production` | Token bucket `safarops` |
| `R2_BUCKET` | `hris-production` | `safarops` |
| `JUBELIO_BASE_URL` | `https://api2.jubelio.com` | Sama |
| `DEV_LOGIN_PASSWORD` | **Jangan diisi** | **Jangan diisi** |
| `LOCAL_ACCOUNTS` | **Jangan diisi** | Akun uji owner, leader, staff |

Nilai production dicatat di `.env.vercel.local` dengan awalan `PROD_` (`PROD_DATABASE_URL`, `PROD_R2_BUCKET`, `PROD_R2_ACCESS_KEY_ID`, `PROD_R2_SECRET_ACCESS_KEY`); nilai tanpa awalan milik development.

Tanpa variabel `R2_*`, aplikasi di Vercel menolak menyimpan foto dengan pesan jelas, karena disk Vercel tidak permanen.

### Akun uji tanpa Jubelio (`LOCAL_ACCOUNTS`)

Untuk menguji setiap peran di aplikasi online tanpa akun Jubelio (CHANGELOG 23). Hanya di development. Isinya array JSON:

```
[{"email":"owner@contoh.com","name":"Owner Uji","hash":"scrypt:...","owner":true},
 {"email":"leader@contoh.com","name":"Leader Uji","hash":"scrypt:..."},
 {"email":"staff@contoh.com","name":"Staff Uji","hash":"scrypt:..."}]
```

1. Buat hash setiap password dengan `pnpm hash-password`. Password diketik di prompt, tidak masuk riwayat terminal.
2. Email di daftar ini tidak pernah diteruskan ke Jubelio. Jangan memakai email karyawan sungguhan.
3. `"owner": true` menjadikan akun itu pemilik tambahan dengan hak penuh. Akun lain menjadi leader atau staff setelah login sekali dan dipetakan pemilik di menu Tim.
4. Batas percobaan login (PNG-AUT-03) tetap berlaku. Pakai password yang kuat.

## 6. Branch dan rilis

- Proyek production membangun **hanya push ke `main`**; proyek `safarops` membangun **hanya push ke `development`** (Ignored Build Step "Only build production" di keduanya; build yang dibatalkan tetap dihitung dalam kuota 100 deploy per hari Hobby).
- `main` hanya diperbarui saat perubahan di `development` sudah diuji (fast-forward dari `development`).
- Migrasi tidak dijalankan otomatis saat build. Setiap migrasi baru dijalankan dua kali, sebelum deploy masing-masing: ke `SafarOps` sebelum push `development`, lalu ke `HRIS-Production` sebelum push `main`.

## 7. Domain

1. Di proyek Vercel production, Settings > Domains, tambahkan `hris.saefulaskar.com`.
2. Di pengelola DNS saefulaskar.com, buat CNAME `hris` ke alamat yang ditunjukkan Vercel.
3. Tunggu SSL aktif, lalu uji install PWA di HP (butuh HTTPS).

## 8. Backup dan pemantauan

| Hal | Rencana |
|---|---|
| Database | Paket Free Prisma tidak punya backup otomatis. `pg_dump` database production minimal mingguan, disimpan di luar Prisma, sampai paketnya dinaikkan |
| Foto | Foto tidak pernah diubah setelah diunggah. Salin bucket production berkala ke tempat lain (misalnya `rclone`) jika foto dianggap penting jangka panjang |
| Error | Log runtime Hobby hanya 1 jam, jadi error bisa terlewat. Jika butuh jejak lebih panjang, pertimbangkan layanan pencatat error gratis |

## 9. Biaya operasional

| Komponen | Perkiraan per bulan | Catatan |
|---|---|---|
| Vercel Hobby | Rp0 | Berhenti sampai 30 hari jika kuota habis; melanggar syarat bila pembuatnya dibayar. Kedua proyek berada di akun Hobby yang sama dan berbagi kuota akun. Foto ikut memakai kuota transfer: 1.000 kali buka foto per hari sekitar 5 GB per bulan |
| Cloudflare R2 | Rp0 sampai 10 GB | Gratis 10 GB untuk semua bucket di akun. Foto sekitar 165 KB; dengan 50 foto per hari, 10 GB cukup sekitar 3 tahun. Di atas itu sekitar US$0,015 per GB-bulan; unduh gratis |
| Prisma Postgres | Rp0 (Free) | Dua database di satu proyek. Free: 200.000 operasi per bulan dan tanpa backup; paket berbayar diperlukan jika kuota sering habis atau backup otomatis dibutuhkan |
| Domain | Sudah dimiliki | Subdomain hris tidak menambah biaya |

Biaya pengembangan (sekali bayar) tidak termasuk di dokumen ini dan dirinci terpisah oleh Velora.

## 10. Daftar periksa sebelum go-live

| No | Periksa | Status |
|---|---|---|
| 1 | Login Jubelio asli berhasil untuk akun karyawan biasa dan nama tampil benar (A-01, A-03, CHANGELOG 40) | Akun karyawan berhasil di development; akun pemilik belum |
| 2 | Keputusan daftar pengguna: API Jubelio atau tercatat saat login pertama (A-02) | Tercatat saat login pertama (CHANGELOG 40) |
| 3 | Foto tersimpan dan terbuka dari bucket R2 production | Belum |
| 4 | Install PWA dan halaman offline di Android dan iPhone, dari hris.saefulaskar.com | Belum |
| 5 | Geser notifikasi, seret to-do, kalender DL, dan foto HEIC di iPhone asli | Belum |
| 6 | Semua skenario `docs/UAT.md` lulus di development | Belum |
| 7 | `DEV_LOGIN_PASSWORD` tidak ada di Vercel; akun `@safar.local` tidak bisa masuk | Belum |
| 7a | `LOCAL_ACCOUNTS` tidak ada di Production; akun uji tidak bisa masuk di hris.saefulaskar.com | Belum |
| 8 | Backup database production pertama berhasil dipulihkan di database uji | Belum |
| 9 | Push ke `development` hanya membangun di `safarops`, push ke `main` hanya di proyek production | Belum |
