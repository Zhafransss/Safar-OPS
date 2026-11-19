# Rencana Deploy — HRIS

Versi 1.1, 19 November 2026 (versi 1.0: 5 November 2026). Keputusan hosting (SRS A-04): aplikasi di **Vercel**, data di **PostgreSQL** (Prisma Postgres), foto di **Cloudflare R2**.

## 1. Susunan lingkungan

Diputuskan 19 November 2026: production pindah ke branch `main` dengan data sendiri. Development tetap menjadi tempat uji klien.

| | Production | Development (uji) |
|---|---|---|
| Branch Git | `main` | `development` |
| Jenis deploy Vercel | Production | Preview |
| Alamat | **hris.saefulaskar.com** | Domain bawaan Vercel untuk branch `development` |
| Database | Prisma Postgres **baru**, region Singapura | Prisma Postgres yang sudah ada |
| Foto | Bucket R2 **baru** | Bucket R2 `safarops` |
| Login | Jubelio asli saja | Jubelio asli dan akun uji `LOCAL_ACCOUNTS` |

| Komponen | Layanan | Catatan |
|---|---|---|
| Aplikasi | Vercel, region Singapura (`vercel.json`) | Paket Hobby dilarang untuk pemakaian komersial menurut syarat Vercel; risikonya sudah dijelaskan dan diterima. Log runtime Hobby hanya 1 jam |
| Database | Prisma Postgres, Singapura | Satu alamat koneksi langsung, dipakai untuk `DATABASE_URL` dan `DIRECT_URL` |
| Foto | Cloudflare R2, bucket privat | Gratis sampai 10 GB. Server memeriksa hak akses lalu meneruskan foto dari R2 ke browser. HP tidak pernah membuka domain R2, karena domain R2 diblokir ISP Indonesia |
| Domain | hris.saefulaskar.com | SSL otomatis dari Vercel |

## 2. Langkah pindah production ke `main`

Urutan ini menjaga development tetap jalan selama perpindahan. Semua URL database dan kunci R2 diketik langsung di dasbor atau terminal sendiri, tidak dikirim lewat chat.

1. **Database production.** Buat database Prisma Postgres baru di region Singapura (bagian 4). Simpan alamat koneksinya.
2. **Migrasi database production** dari terminal sendiri. Database baru menerima ketiga migrasi:
   ```
   DIRECT_URL="<alamat database production>" pnpm db:deploy
   ```
   Pastikan baris "Datasource" menunjuk ke database baru, lalu muncul "All migrations have been successfully applied."
3. **Bucket foto production.** Buat bucket R2 baru dan API token khusus bucket itu (bagian 3).
4. **Salin variabel development ke scope Preview.** Saat ini semua variabel di Vercel ber-scope Production, karena `development` dulu menjadi branch production. Di Project Settings > Environment Variables, tambahkan nilai yang sekarang (database lama, bucket `safarops`, `LOCAL_ACCOUNTS`, dan lainnya) dengan scope **Preview**, dibatasi ke branch `development`. Tanpa langkah ini, development rusak setelah langkah 6.
5. **Ganti variabel Production** dengan nilai baru: database dari langkah 1, bucket dan token dari langkah 3. **Hapus `LOCAL_ACCOUNTS`** dari scope Production. Daftar lengkap ada di bagian 5.
6. **Ganti branch production.** Project Settings > Git > Production Branch: `main`.
7. **Domain.** Tambahkan `hris.saefulaskar.com` (bagian 7). Lepas `safarops.veloradigitalworks.com` dari proyek, karena domain itu terpasang ke production dan akan ikut menampilkan `main`. Development dibuka lewat domain bawaan Vercel untuk branch `development` (terlihat di halaman Deployments, berbentuk `<proyek>-git-development-<akun>.vercel.app`).
8. **Rilis.** Perbarui `main` hingga sama dengan `development` lalu push. Vercel men-deploy production.
9. **Periksa** daftar di bagian 10, lalu minta karyawan memasang ulang PWA dari alamat baru. Aplikasi yang terpasang dari alamat lama tidak ikut pindah.

## 3. Menyiapkan Cloudflare R2

1. Di dasbor Cloudflare, buka R2, buat bucket, misalnya `hris-photos`, dengan *Location hint* **Asia-Pacific (APAC)** agar dekat dengan Vercel Singapura. Jangan aktifkan akses publik.
2. Buat API token R2 dengan izin **Object Read & Write** yang dibatasi hanya ke bucket itu.
3. Catat **Account ID**, **Access Key ID**, dan **Secret Access Key**. Secret hanya tampil sekali.
4. Tidak perlu aturan CORS: unggahan lewat server aplikasi, dan foto dibuka lewat tautan biasa.

## 4. Menyiapkan PostgreSQL

1. Buat database dengan encoding UTF-8, region Singapura.
2. Siapkan dua alamat koneksi: **pooled** untuk aplikasi (`DATABASE_URL`) dan **langsung** untuk migrasi (`DIRECT_URL`). Prisma Postgres memakai satu alamat langsung untuk keduanya.
3. Jalankan migrasi dari komputer developer: `DIRECT_URL=... pnpm db:deploy`.

## 5. Environment variable di Vercel

| Variabel | Production (`main`) | Preview (branch `development`) |
|---|---|---|
| `DATABASE_URL` | Database production baru | Database lama (uji) |
| `DIRECT_URL` | Database production baru | Database lama (uji) |
| `R2_ACCOUNT_ID` | Akun Cloudflare | Sama |
| `R2_ACCESS_KEY_ID` | Token bucket production | Token bucket `safarops` |
| `R2_SECRET_ACCESS_KEY` | Token bucket production | Token bucket `safarops` |
| `R2_BUCKET` | Bucket production baru | `safarops` |
| `JUBELIO_BASE_URL` | `https://api2.jubelio.com` | Sama |
| `DEV_LOGIN_PASSWORD` | **Jangan diisi** | **Jangan diisi** |
| `LOCAL_ACCOUNTS` | **Jangan diisi** | Akun uji owner, leader, staff |

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

- Vercel: **Production Branch = `main`**. Setiap push ke `development` menjadi preview deploy untuk uji.
- `main` hanya diperbarui saat perubahan di `development` sudah diuji (fast-forward dari `development`).
- Migrasi tidak dijalankan otomatis saat build. Setiap migrasi baru dijalankan dua kali, sebelum deploy masing-masing: ke database uji sebelum push `development`, lalu ke database production sebelum push `main`.

## 7. Domain

1. Di Vercel, Project Settings > Domains, tambahkan `hris.saefulaskar.com` untuk Production.
2. Di pengelola DNS saefulaskar.com, buat CNAME `hris` ke alamat yang ditunjukkan Vercel.
3. Tunggu SSL aktif, lalu uji install PWA di HP (butuh HTTPS).

## 8. Backup dan pemantauan

| Hal | Rencana |
|---|---|
| Database | Backup otomatis dari penyedia, ditambah `pg_dump` mingguan database production yang disimpan di luar penyedia |
| Foto | Foto tidak pernah diubah setelah diunggah. Salin bucket production berkala ke tempat lain (misalnya `rclone`) jika foto dianggap penting jangka panjang |
| Error | Log runtime Hobby hanya 1 jam, jadi error bisa terlewat. Jika butuh jejak lebih panjang, pertimbangkan layanan pencatat error gratis |

## 9. Biaya operasional

| Komponen | Perkiraan per bulan | Catatan |
|---|---|---|
| Vercel Hobby | Rp0 | Berhenti sampai 30 hari jika kuota habis; melanggar syarat bila pembuatnya dibayar. Production dan development berbagi kuota satu proyek. Foto ikut memakai kuota transfer: 1.000 kali buka foto per hari sekitar 5 GB per bulan |
| Cloudflare R2 | Rp0 sampai 10 GB | Gratis 10 GB untuk semua bucket di akun. Foto sekitar 165 KB; dengan 50 foto per hari, 10 GB cukup sekitar 3 tahun. Di atas itu sekitar US$0,015 per GB-bulan; unduh gratis |
| PostgreSQL | Tergantung paket Prisma Postgres | Dua database (production dan uji); data teks aplikasi ini kecil |
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
| 9 | Development tetap bisa dibuka dan login dengan akun uji setelah perpindahan | Belum |
