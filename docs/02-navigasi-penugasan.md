# 02 — Perubahan Navigasi Penugasan (ops2 V1.0)

**Untuk:** Tim dev Velora — ops2.saefulaskar.com (SAFAR OPS 2)
**Rujukan:** PRD Penugasan v2.0; keputusan K-A145 (03-fitur-absensi-payroll.md)
**Tanggal:** 10 November 2026
**Penyetuju:** Chaesar Syaefuddin (Direktur)
**Sifat perubahan:** navigasi saja

---

## 1. Ringkasan

Kartu menu **Penugasan** di beranda dipecah menjadi tiga kartu menu: **Tugas**, **Laporan**, dan **Tim**. Halaman hub Penugasan dihapus.

Yang **tidak berubah**: isi setiap halaman, alur, hak akses, notifikasi, dan kode error PNG-.

## 2. Sebelum dan sesudah

| Bagian | Sebelum (PRD v2.0) | Sesudah |
|---|---|---|
| Judul bagian di beranda | PENUGASAN | **PEKERJAAN** |
| Kartu menu | 1 kartu: Penugasan → halaman hub | 3 kartu: Tugas, Laporan, Tim |
| Laporan | Hub → Laporan | Kartu **Laporan** → halaman Laporan |
| Penugasan (daftar Program) | Hub → Penugasan | Kartu **Tugas** → halaman **Daftar Program** |
| Pemetaan tim | Hub → Pemetaan tim | Kartu **Tim** → halaman Pemetaan Tim |
| Template to-do list | Hub → Template to-do list | Di dalam Tugas: tombol **Template To-do** di halaman Daftar Program, khusus leader |

```
SEBELUM                          SESUDAH
PENUGASAN                        PEKERJAAN
┌───────────┐                    ┌─────────┐ ┌─────────┐ ┌─────────┐
│ Penugasan │                    │  Tugas  │ │ Laporan │ │   Tim   │
└─────┬─────┘                    └────┬────┘ └────┬────┘ └────┬────┘
      ▼                               ▼           ▼           ▼
  Halaman hub                    Daftar      Laporan     Pemetaan
  ├ Laporan                      Program                 Tim
  ├ Penugasan                    └ Template To-do
  ├ Pemetaan tim                   (leader)
  └ Template to-do list
```

## 3. Rincian kartu menu

Urutan kartu: **Tugas, Laporan, Tim**.

| Kartu | Deskripsi di kartu | Ikon (saran, lucide) | Membuka | Tampil untuk |
|---|---|---|---|---|
| Tugas | Program dan to-do tim | `ListChecks` | Daftar Program (halaman daftar Program yang sudah ada) | Pengguna yang di PRD v2.0 bisa membuka daftar Program |
| Laporan | Lapor dan tanggapi | `MessageSquare` | Laporan (tab Laporan saya / Laporan tim / Semua laporan sesuai PRD, K-T41) | Semua pengguna |
| Tim | Susunan tim | `Users` | Pemetaan Tim | Mengikuti hak lihat Pemetaan tim di PRD v2.0 |

Gaya kartu sama dengan kartu menu Penugasan saat ini (kotak ikon oranye, nama menu, deskripsi). Ukuran mengikuti standar komponen ops2 (K-T82).

## 4. Aturan

1. **Nama unik.** Tidak boleh ada dua menu, halaman, atau tab (yang menunjukkan tempat) dengan nama sama di ops2. Nama "Penugasan" tidak lagi dipakai sebagai nama menu atau halaman. Halaman yang dibuka kartu Tugas berjudul **Daftar Program**, agar tidak tertukar dengan tingkat "Tugas" di struktur Program → Tugas → To-do. Label status (Terkirim, Selesai, dsb.) boleh sama.
2. **Template To-do** hanya tampil untuk leader (K-T39); tidak tampil untuk staff dan pemilik.
3. **Tombol kembali** dari Daftar Program, Laporan, dan Pemetaan Tim kembali ke Beranda. Dari Template To-do kembali ke Daftar Program.
4. **Notifikasi** (lonceng, K-T68/K-T69): tautan tetap membuka halaman tujuan yang sama.
5. **Tautan lama** ke halaman hub (bila ada) diarahkan ke Beranda.
6. Header beranda, kartu tanggal, dan lonceng **tidak berubah** di V1.0.

## 5. Di luar dokumen ini

- Bagian beranda lain (Kehadiran, Keuangan, dan lainnya) serta isi kartu tanggal versi baru datang bersama **PRD V2.0** (Absensi & Payroll).
- Hak lihat Tim untuk semua karyawan berlaku mulai **V2.0**.

## 6. Cek cepat setelah diterapkan

| Kode | Jenis | Langkah | Hasil yang diharapkan |
|---|---|---|---|
| NAV-P01 | Positif | Staff membuka beranda | Bagian PEKERJAAN tampil dengan kartu Tugas dan Laporan (Tim bila berhak) |
| NAV-P02 | Positif | Leader membuka kartu Tugas | Halaman Daftar Program tampil dengan tombol Template To-do |
| NAV-P03 | Positif | Leader menekan Template To-do, lalu kembali | Daftar template tampil; tombol kembali menuju Daftar Program |
| NAV-P04 | Positif | Pemilik membuka kartu Tim | Pemetaan Tim tampil dan bisa diubah |
| NAV-P05 | Positif | Mengetuk notifikasi laporan di lonceng | Halaman laporan terbuka seperti sebelumnya |
| NAV-P06 | Positif | Menekan kembali dari halaman Laporan | Kembali ke Beranda |
| NAV-N01 | Negatif | Staff membuka kartu Tugas | Tombol Template To-do tidak tampil |
| NAV-N02 | Negatif | Pemilik membuka kartu Tugas | Tombol Template To-do tidak tampil |
| NAV-N03 | Negatif | Mencari kartu atau halaman bernama "Penugasan" | Tidak ada lagi |
| NAV-N04 | Negatif | Membuka tautan lama halaman hub | Diarahkan ke Beranda |

## 7. CHANGELOG

Perbedaan hasil jadi dari dokumen ini dicatat developer di **CHANGELOG-penugasan.md** — cukup dicatat, tanpa perlu persetujuan.
