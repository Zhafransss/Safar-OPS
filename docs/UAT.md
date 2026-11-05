# Skenario UAT — Fitur Penugasan, SAFAR OPS 2

**Status: draf.** PRD bagian 15 menyebut skenario uji final per role yang diturunkan dari 57 skenario uji mockup. Berkas itu belum diterima (SRS A-07), jadi draf ini disusun dari PRD v2.0 dan `docs/RTM.md`. Jika berkas skenario asli tersedia, draf ini dicocokkan dengannya dan skenario yang belum ada ditambahkan.

## Cara memakai

- Diuji oleh karyawan di aplikasi staging, di HP masing-masing (Android dan iPhone).
- Siapkan minimal 1 pemilik, 2 leader dari tim berbeda, dan 3 staff, salah satunya staff di dua tim.
- Isi kolom **Hasil** dengan Lulus atau Gagal. Jika Gagal, tulis yang terjadi di kolom Catatan.
- Semua skenario harus Lulus agar fitur diterima (PRD 15).

## A. Semua pengguna

| No | Skenario | Langkah | Hasil yang diharapkan | Hasil | Catatan |
|---|---|---|---|---|---|
| A-01 | Masuk dengan akun Jubelio | Buka aplikasi, isi email dan password Jubelio, ketuk Masuk | Beranda tampil dengan nama, label peran, dan tanggal hari ini | | |
| A-02 | Password salah | Isi password yang salah | Tampil "PNG-AUT-01: Email atau password salah." | | |
| A-03 | Pasang di layar utama | Android: menu browser, Pasang aplikasi. iPhone: Bagikan, Tambahkan ke Layar Utama | Ikon SAFAR OPS 2 muncul dan aplikasi terbuka tanpa bilah browser | | |
| A-04 | Tanpa internet | Matikan data dan Wi-Fi, buka aplikasi | Tampil halaman "Anda sedang offline" | | |
| A-05 | Keluar | Ketuk avatar di Beranda, ketuk Keluar | Kembali ke halaman masuk | | |
| A-06 | Buat laporan | Laporan, Buat laporan, isi judul, jenis, isi, 1 foto, pilih penerima, Kirim | Laporan bernomor seperti 2611-001 terkirim, penerima mendapat notifikasi | | |
| A-07 | Laporan tidak lengkap | Kirim laporan tanpa judul | Tampil "PNG-LAP-01: Judul laporan belum diisi." | | |
| A-08 | Foto dari kamera HP | Saat membuat laporan, ambil foto langsung dari kamera (termasuk iPhone) | Foto tampil di laporan dan bisa diperbesar | | |
| A-09 | Chat dan tanda baca | Kirim pesan di laporan, lalu minta penerima membuka laporan | Centang abu berubah menampilkan inisial; biru jika semua peserta sudah membaca | | |
| A-10 | Notifikasi: buka | Ketuk lonceng, ketuk satu notifikasi | Laporan atau tugas terkait terbuka, notifikasi hilang dari daftar | | |
| A-11 | Notifikasi: geser | Geser satu notifikasi ke kanan atau kiri, lalu ketuk Batalkan | Notifikasi hilang lalu kembali setelah Batalkan | | |
| A-12 | Notifikasi: bersihkan | Ketuk Bersihkan semua, konfirmasi | Daftar kosong, angka di lonceng hilang | | |
| A-13 | Data terbaru saat kembali | Tinggalkan aplikasi, minta orang lain mengirim laporan ke Anda, buka aplikasi lagi | Angka lonceng dan daftar ikut diperbarui tanpa menutup aplikasi | | |

## B. Penerima laporan

| No | Skenario | Langkah | Hasil yang diharapkan | Hasil | Catatan |
|---|---|---|---|---|---|
| B-01 | Laporan baru | Buka Laporan | Laporan yang belum dibuka diberi titik oranye; titik hilang setelah dibuka | | |
| B-02 | Tindak lanjuti | Buka laporan, ketuk Tindak lanjuti | Status Ditindaklanjuti, pelapor mendapat notifikasi | | |
| B-03 | Tolak tanpa alasan | Ketuk Tolak lalu Tolak tanpa mengisi alasan | Tampil "PNG-LAP-07: Alasan penolakan wajib diisi." | | |
| B-04 | Tolak dengan alasan | Isi alasan lalu Tolak | Alasan tampil di chat, laporan terkunci | | |
| B-05 | Teruskan | Ketuk Teruskan, pilih orang lain | Penerima berpindah, penerima lama menjadi CC | | |

## C. Pelapor

| No | Skenario | Langkah | Hasil yang diharapkan | Hasil | Catatan |
|---|---|---|---|---|---|
| C-01 | Tandai selesai | Setelah laporan Ditindaklanjuti, ketuk Tandai selesai | Laporan Selesai, chat ditutup, tidak bisa dibuka kembali | | |
| C-02 | Tambah CC | Ketuk CC, pilih orang | Orang itu bisa membuka laporan dan ikut chat | | |
| C-03 | Cari laporan | Ketik nomor atau sebagian judul di kolom cari | Hanya laporan yang cocok tampil; jika tidak ada, tampil pesan tidak ditemukan | | |

## D. Pemilik

| No | Skenario | Langkah | Hasil yang diharapkan | Hasil | Catatan |
|---|---|---|---|---|---|
| D-01 | Buat tim | Penugasan, Pemetaan tim, Tambah tim, isi nama, warna, leader, staff | Tim tampil di bagan dengan warna pilihan | | |
| D-02 | Warna dipakai | Pilih warna bertanda silang | Tampil "PNG-TIM-07" dengan nama tim pemakainya | | |
| D-03 | Satu leader satu tim | Pilih leader yang sudah memimpin tim lain | Tampil "PNG-TIM-03" | | |
| D-04 | Keluarkan staff yang masih punya to-do | Edit tim, keluarkan staff yang punya to-do aktif, simpan | Muncul konfirmasi; to-do-nya berlabel Perlu dialihkan dan leader mendapat notifikasi | | |
| D-05 | Ganti leader | Edit tim, ganti leader, simpan | Leader baru mendapat notifikasi; QC yang tertunda menjadi tugas leader baru | | |
| D-06 | Semua laporan | Laporan, tab Semua laporan | Semua laporan perusahaan tampil | | |
| D-07 | Buat program untuk tim | Penugasan, Buat program, pilih tim | Program tampil, leader tim itu mendapat notifikasi | | |

## E. Leader

| No | Skenario | Langkah | Hasil yang diharapkan | Hasil | Catatan |
|---|---|---|---|---|---|
| E-01 | Template | Template to-do list, Buat template berisi 3 to-do | Template tersimpan untuk tim sendiri | | |
| E-02 | Tugas dari template | Di program, Tambah tugas, Pakai template, isi PIC dan DL tiap to-do, simpan | Tugas dibuat, setiap PIC mendapat notifikasi | | |
| E-03 | DL di masa lalu | Isi DL kemarin | Tampil "PNG-TDO-04" | | |
| E-04 | Lampirkan laporan | Saat membuat tugas, pilih No. Laporan berstatus Terkirim | Laporan otomatis Ditindaklanjuti dan pelapor mendapat notifikasi | | |
| E-05 | Label tenggat | Lihat tugas dengan DL hari ini, besok, dan kemarin | Label Hari ini, H-1, dan Terlambat tampil dengan warnanya | | |
| E-06 | Alihkan to-do | Menu "⋯" pada to-do, Edit, ganti PIC, simpan | PIC baru mendapat notifikasi, riwayat mencatat pengalihan | | |
| E-07 | Kembalikan revisi | Setelah semua to-do dicentang, Kembalikan revisi, pilih to-do, tulis catatan | To-do terbuka lagi dengan catatan dan label Revisi 1 | | |
| E-08 | Approve QC | Setelah semua to-do dicentang lagi, Approve QC | Tugas Selesai (Lolos QC), para PIC mendapat notifikasi | | |
| E-09 | Hapus tugas salah buat | Buka tugas yang belum selesai, Hapus tugas, konfirmasi | Tugas hilang dari program, PIC mendapat notifikasi | | |
| E-10 | Tutup program terlalu cepat | Tutup program saat masih ada tugas berjalan | Tampil "PNG-PRG-03: Masih ada tugas yang belum selesai." | | |
| E-11 | Tutup program | Setelah semua tugas Lolos QC, Tutup program | Program pindah ke filter Selesai | | |
| E-12 | Laporan tim | Laporan, tab Laporan tim | Laporan yang ditujukan ke staff tim tampil, tanpa mengulang laporan sendiri | | |

## F. Staff

| No | Skenario | Langkah | Hasil yang diharapkan | Hasil | Catatan |
|---|---|---|---|---|---|
| F-01 | Hanya tugas sendiri | Buka program | Hanya tugas yang berisi to-do milik saya yang tampil | | |
| F-02 | Centang to-do | Centang to-do milik sendiri | Progress bertambah; jika semua selesai, leader mendapat notifikasi siap QC | | |
| F-03 | To-do orang lain | Coba centang to-do milik orang lain | Kotak centang tidak bisa ditekan | | |
| F-04 | Batal centang | Batalkan centang sebelum QC | Centang hilang dan progress berkurang | | |
| F-05 | Tidak bisa membuat program | Buka Penugasan | Tidak ada tombol Buat program; tampil keterangan hanya melihat tugas sendiri | | |
| F-06 | Staff di dua tim | Masuk sebagai staff yang ada di dua tim | Label peran menampilkan kedua tim dengan warnanya | | |
