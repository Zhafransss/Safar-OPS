# SAFAR OPS 2

Fitur Penugasan untuk ops2.saefulaskar.com. Acuan kebenaran ada di `docs/SRS.md`, `docs/RTM.md`, dan `CHANGELOG-penugasan.md`. Tampilan mengikuti `02-mockup-final-fitur-penugasan.html`.

## Menjalankan di lokal

Butuh Node 20.9 ke atas dan pnpm.

```bash
pnpm install
cp .env.example .env.local   # isi DATABASE_URL dan DIRECT_URL, lihat di bawah
pnpm db:local                # terminal 1: PostgreSQL asli (UTF-8) di .pgdata, tanpa Docker
pnpm db:deploy               # terminal 2: terapkan migrasi
pnpm dev                     # terminal 2: buka http://localhost:3000
```

URL database lokal untuk `DATABASE_URL` dan `DIRECT_URL`:

```
postgresql://postgres:postgres@127.0.0.1:54330/postgres?sslmode=disable
```

Login memakai akun Jubelio asli. Password diteruskan ke Jubelio dan tidak disimpan.

## Akun developer lokal

Untuk developer tanpa akun Jubelio. Tambahkan ke `.env.local`, lalu jalankan `pnpm dev:jubelio` di terminal terpisah:

```
JUBELIO_BASE_URL=http://127.0.0.1:54340
DEV_LOGIN_PASSWORD=<password pilihan Anda>
```

Jalankan `pnpm db:seed-dev` untuk menambahkan Kartika, Zarkasih, Dimas, dan Rudi sebagai pengguna `@safar.local`, supaya pilihan leader dan staff tidak kosong.

| Email | Peran |
|---|---|
| `developer@safar.local` | Pemilik, hanya saat `pnpm dev` |
| Alamat lain `@safar.local`, misalnya `rudi@safar.local` | Pengguna biasa, untuk uji leader dan staff |

Email selain `@safar.local` diteruskan ke Jubelio asli. Jangan pasang kedua variabel itu di staging atau produksi. Peran Pemilik developer tidak ada di build produksi.

Untuk menguji aplikasi online tanpa akun Jubelio, pakai `LOCAL_ACCOUNTS` (lihat `docs/DEPLOY.md`).

## Pemeriksaan

```bash
pnpm test
pnpm typecheck
pnpm build
```

## Aturan tampilan

`src/styles/mockup.css` disalin apa adanya dari mockup, jadi nilainya jangan diubah di sana. Aturan khusus aplikasi ditulis di `src/styles/app.css`.
