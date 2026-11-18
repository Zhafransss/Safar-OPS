# Hasil Uji 1 — Fitur Penugasan (ops2 / SAFAR OPS 2)

| | |
|---|---|
| **Tanggal uji** | 18 November 2026 |
| **Penguji** | Chaesar Syaefuddin (Direktur), menjalankan semua peran sendiri |
| **Akun uji** | Leader: saefulaskar.adm.2 · Staff 1: saefulaskar.adm.3 |
| **Acuan** | PRD v2.0 Penugasan, mockup final, navigasi V1.0 (02-navigasi-penugasan) |
| **Untuk** | Tim developer Velora |

> **Untuk developer (dan AI developer):** dokumen ini berisi hasil uji aplikasi jadi dan permintaan perbaikan. Kode **U-xx** dipakai untuk merujuk setiap temuan. Label **Wajib tahap 1** = dikerjakan sebelum rilis ke karyawan. **Bisa menyusul** = boleh setelah rilis. Jika ada perbedaan hasil dengan permintaan di bawah, catat di `CHANGELOG-penugasan.md` dengan kode U-xx.

## 1. Ringkasan

- **21 skenario alur kritis lulus, 0 gagal.** Alur Tim, Laporan, Program, Tugas, Template, QC, revisi, dan penutupan program berjalan sesuai PRD.
- 3 skenario belum diuji: E-01 (label Terlambat, dicek keesokan hari), E-02 (batalkan program), E-03 (pengalihan to-do saat staff keluar).
- Ada **9 temuan** (U-01 sampai U-09) dan **2 pertanyaan** untuk developer.

| Kelompok | Skenario | Hasil |
|---|---|---|
| A · Tim dan akses | A-01 s.d. A-03 | 3 lulus |
| B · Laporan | B-01 s.d. B-07 | 7 lulus |
| C · Program, template, tugas | C-01 s.d. C-05 | 5 lulus |
| D · Pengerjaan dan QC | D-01 s.d. D-06 | 6 lulus |
| E · Tenggat, pengalihan, batal | E-01 s.d. E-03 | belum diuji |

## 2. Temuan dan permintaan

| Kode | Area | Ringkas | Label |
|---|---|---|---|
| U-01 | Semua | Nama pengguna harus dari Jubelio | Wajib tahap 1 |
| U-02 | Laporan | Sembunyikan nama sendiri dari pilihan penerima | Wajib tahap 1 |
| U-03 | Tugas | Tombol "Pakai template" diperkecil | Wajib tahap 1 |
| U-04 | Tugas | Ikon titik tiga di to-do diganti pensil | Wajib tahap 1 |
| U-05 | Semua form | Kotak isian terlalu besar, cek ukuran | Wajib tahap 1 |
| U-06 | Semua dropdown | Tampilkan 3 teratas, sisanya lewat cari | Wajib tahap 1 |
| U-07 | Tugas (pemilik) | Filter tim di daftar program | Wajib tahap 1 |
| U-08 | Tugas | Geser urutan to-do dengan tekan lama | Bisa menyusul |
| U-09 | Tim | Hapus tim | Wajib tahap 1 |

### U-01 · Nama pengguna harus diambil dari Jubelio
- **Yang terjadi:** nama pengguna yang tampil berupa email. Khusus akun `saefulaskarcompany@gmail.com` tampil "Chaesar Syaefuddin", padahal nama penggunanya di Jubelio "Saeful Askar".
- **Yang diharapkan:** semua nama pengguna, termasuk 4 akun pemilik, diambil dari **nama pengguna di Jubelio**. Berlaku di semua tampilan: sapaan beranda, Tim, penerima/CC/teruskan laporan, PIC to-do, riwayat, dan inisial avatar (K-T79).
- **Klarifikasi PRD:** kolom "Nama tampilan" di tabel akun pemilik (PRD v2.0 bagian 3) hanya penanda akun. Pemilik dikenali dari **email**; namanya tetap dari Jubelio.

### U-02 · Sembunyikan nama sendiri dari pilihan penerima laporan
- Di pilihan **penerima, CC, dan teruskan** laporan, nama pengguna yang sedang login tidak ditampilkan.
- **Tidak berlaku untuk PIC to-do:** leader tetap bisa memilih dirinya sendiri sebagai PIC, karena leader juga mengerjakan to-do.
- Kode error PNG-LAP-05 tetap dipertahankan di server sebagai pengaman.

### U-03 · Tombol template di form tugas
- Teks "Pakai template" dipersingkat menjadi **"Template"**.
- Ukuran tombol kecil (32 px, sesuai K-T82).
- Posisi dipindah **sebaris dengan judul bagian "To-do"**, rata kanan.

```
To-do                         [ Template ]
┌──────────────────────────────────────┐
│ Foto produk                          │
```

### U-04 · Ikon edit to-do
- Ikon **titik tiga** di baris to-do diganti ikon **pensil**.
- Diketuk langsung membuka form edit to-do (tanpa menu perantara).
- Hapus to-do tetap tersedia di dalam form edit.

### U-05 · Kotak isian form masih terlalu besar
- Penguji menilai hampir semua kotak isian di form masih terlalu besar.
- **Mohon dicek terhadap PRD v2.0 bagian 11 (K-T82):** isian dan dropdown **36 px**, sudut 8; tombol kecil 32 px; jarak dalam kartu 12 px. Jika ukuran saat ini lebih besar, sesuaikan ke angka tersebut.
- Jika sudah sesuai 36 px tetapi masih terasa besar, kabari kami; kemungkinan yang besar adalah jarak antar isian atau padding form, bukan tinggi kotaknya.

### U-06 · Dropdown dan popup pilihan: 3 teratas + pencarian
Berlaku untuk **semua dropdown dan popup pilihan** di ops2 (penerima, CC, teruskan, PIC, leader, staff, no. laporan, dan seterusnya). Aturan ini juga akan dipakai di fitur Absensi.
- Saat dibuka, tampilkan **3 pilihan teratas** saja.
- Urutan **alfabetis berdasarkan nama**.
- Kotak cari selalu ada di atas daftar. Pilihan lain muncul saat mengetik; hasil pencarian juga **maksimal 3**, urut alfabet.
- Kotak cari mencakup **data yang kemungkinan dicari** (untuk orang: nama; untuk laporan: nomor dan judul).
- Di bawah 3 pilihan, tampilkan keterangan jumlah sisanya, misalnya *"Ketik untuk mencari 12 lainnya"*. Jika pencarian tidak menemukan apa pun: *"Tidak ada hasil"*.
- Tinggi popup/daftar **tetap** saat hasil pencarian kurang dari 3 (tidak mengecil).

```
┌ Pilih penerima ───────────────┐
│ 🔍 Cari nama                  │
│ Andi                          │
│ Budi                          │
│ Citra                         │
│ Ketik untuk mencari 12 lainnya│
└───────────────────────────────┘
```

> Simulasi: `02-simulasi-u06-u07-penugasan.html` (tab U-06). Jika ada perbedaan dengan deskripsi ini, simulasi yang dipakai.

### U-07 · Filter tim di daftar program (pemilik)
- Di halaman Daftar Program, **pemilik** mendapat filter tim.
- Bentuk: satu tombol/kotak (mis. **"Semua tim ▾"**). Saat diketuk, muncul **daftar yang turun ke bawah** berisi "Semua tim" dan nama-nama tim (dengan label warna tim). Pilih satu tim → daftar program hanya menampilkan program tim itu.
- Filter tim bekerja bersama filter status yang sudah ada (Aktif / Selesai / Dibatalkan).
- Untuk leader dan staff tidak perlu ditampilkan.

- "Semua tim" selalu di urutan paling atas dan tidak dihitung dalam 3 teratas; daftar tim mengikuti aturan U-06.
- Angka di filter status (Aktif/Selesai/Dibatalkan) menghitung program tim yang sedang dipilih.

> Simulasi: `02-simulasi-u06-u07-penugasan.html` (tab U-07).

### U-08 · Geser urutan to-do dengan tekan lama — *Bisa menyusul*
- Saat ini urutan to-do diubah dengan tombol naik/turun.
- Keinginan ke depan: **tekan lama lalu seret** untuk memindah urutan. To-do QC tetap terkunci di urutan terakhir.
- Tidak wajib untuk rilis tahap 1.

### U-09 · Hapus tim
Saat ini belum ada opsi menghapus tim di menu Tim.
- Hanya **pemilik** yang bisa menghapus tim.
- Tim **hanya bisa dihapus jika tidak punya program berstatus Aktif.** Jika masih ada, tampilkan pesan, usulan: `PNG-TIM-09: Tim ini masih punya program aktif. Selesaikan atau batalkan dulu.`
- Program lama (Selesai/Dibatalkan) **tetap tersimpan** dan tetap bisa dilihat, beserta nama timnya.
- Warna tim yang dihapus **kembali bebas** dipakai tim lain.
- Gunakan dialog konfirmasi berisi konsekuensinya, dengan tombol Batal dan Hapus berjejer kiri–kanan berwarna berbeda (pola umum aplikasi).
- Template to-do milik tim tersebut ikut terhapus atau diarsipkan — mohon usulan dari developer.

## 3. Pertanyaan untuk developer

| No | Pertanyaan |
|---|---|
| Q-01 | Di kalender DL to-do, bisakah **tanggal sebelum hari ini dinonaktifkan** (tidak bisa dipilih), bukan hanya ditolak setelah disimpan (PNG-TDO-04)? |
| Q-02 | Bisakah **desain kalender pemilih tanggal diganti** agar lebih sesuai tampilan aplikasi? Mohon tunjukkan opsi yang tersedia di shadcn/ui. |

## 4. Langkah berikutnya

1. Developer menindaklanjuti U-01 s.d. U-07 dan U-09, serta menjawab Q-01 dan Q-02.
2. Simulasi U-06 dan U-07 terlampir (`02-simulasi-u06-u07-penugasan.html`); developer mengerjakan mengikuti simulasi.
3. Pemilik menguji E-01 s.d. E-03, lalu uji ulang semua temuan setelah perbaikan.
4. Setiap perbedaan hasil dicatat di `CHANGELOG-penugasan.md` dengan kode U-xx.
