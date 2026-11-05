# RTM — Fitur Penugasan, SAFAR OPS 2

Terakhir diperbarui: 5 November 2026. Kolom **Status** wajib diperbarui tiap sesi: Not Started → In Progress → Done. Requirement UI baru boleh Done setelah lolos NFR-01. Tujuan bisnis ada di `docs/SRS.md` bagian 1.2.

Test Case di sini sementara, sampai skenario uji final per role tersedia (A-07).

| ID | Tujuan Bisnis | Requirement | Fitur/Modul | Prioritas | Status | Test Case |
|----|---|---|---|---|---|---|
| FR-AUT-01 | BG-06 | Login Jubelio, password tidak disimpan | Akun | Must | In Progress | TC-AUT-01: login benar masuk, salah PNG-AUT-01 |
| FR-AUT-02 | BG-06 | 4 pemilik dari daftar email | Akun | Must | Done | TC-AUT-02: keempat email berperan Pemilik |
| FR-AUT-03 | BG-04 | Daftar pengguna dari Jubelio | Akun | Must | In Progress | TC-AUT-03: pilihan penerima dan PIC berisi pengguna Jubelio |
| FR-AUT-04 | BG-06 | Peran dari Pemetaan tim, aturan di server | Akun | Must | In Progress | TC-AUT-04: panggil API tanpa hak ditolak dengan kode PNG |
| FR-AUT-05 | BG-06 | Logout | Akun | Must | Done | TC-AUT-05: setelah keluar, halaman kembali ke login |
| FR-NAV-01 | BG-06 | Beranda | Navigasi | Must | Done | TC-NAV-01: isi Beranda sama dengan mockup |
| FR-NAV-02 | BG-06 | Hub sesuai peran | Navigasi | Must | In Progress | TC-NAV-02: menu tampil sesuai pemilik, leader, staff |
| FR-NAV-03 | BG-03 | Lonceng di semua halaman | Navigasi | Must | In Progress | TC-NAV-03: lonceng ada di tiap halaman Penugasan |
| FR-LAP-01 | BG-05 | Buat laporan | Laporan | Must | Done | TC-LAP-01: isian kosong memunculkan PNG-LAP-01–05 |
| FR-LAP-02 | BG-05 | Nomor YYMM-NNN | Laporan | Must | Done | TC-LAP-02: kirim bersamaan tidak dobel; reset bulan baru |
| FR-LAP-03 | BG-05 | Foto dikompres, maksimal 5 | Laporan | Must | Done | TC-LAP-03: foto ke-6 memunculkan PNG-LAP-06 |
| FR-LAP-04 | BG-05 | Alur status | Laporan | Must | Done | TC-LAP-04: hanya pihak berhak bisa mengubah status |
| FR-LAP-05 | BG-05 | Tolak wajib alasan | Laporan | Must | Done | TC-LAP-05: alasan kosong memunculkan PNG-LAP-07 |
| FR-LAP-06 | BG-05 | Tidak bisa diedit atau dibuka kembali | Laporan | Must | Done | TC-LAP-06: laporan tertutup tampil terkunci |
| FR-LAP-07 | BG-05 | Teruskan | Laporan | Must | Done | TC-LAP-07: penerima lama menjadi CC |
| FR-LAP-08 | BG-05 | Tambah CC | Laporan | Must | Done | TC-LAP-08: CC bisa melihat dan chat |
| FR-LAP-09 | BG-05 | Chat teks dan foto | Laporan | Must | Done | TC-LAP-09: pesan kosong PNG-LAP-08; chat tutup setelah Selesai |
| FR-LAP-10 | BG-05 | Chat tidak realtime | Laporan | Must | Done | TC-LAP-10: pesan baru tampil setelah refresh |
| FR-LAP-11 | BG-05 | Tanda baca | Laporan | Must | Done | TC-LAP-11: abu dan biru sesuai peserta; pemilik tidak dihitung |
| FR-LAP-12 | BG-05 | Foto layar penuh | Laporan | Must | Done | TC-LAP-12: geser, penanda "2 / 3", tutup |
| FR-LAP-13 | BG-05 | Tab per peran | Laporan | Must | Done | TC-LAP-13: isi tab sesuai peran |
| FR-LAP-14 | BG-05 | Filter status | Laporan | Must | Done | TC-LAP-14: urutan benar; kembali ke Semua |
| FR-LAP-15 | BG-05 | Pencarian | Laporan | Must | Done | TC-LAP-15: cari nomor dan judul; pesan tidak ditemukan |
| FR-LAP-16 | BG-05 | Kartu laporan | Laporan | Must | Done | TC-LAP-16: titik oranye hilang setelah dibuka penerima |
| FR-LAP-17 | BG-05 | Hak melihat | Laporan | Must | Done | TC-LAP-17: orang lain mendapat PNG-LAP-11 |
| FR-LAP-18 | BG-05 | Riwayat laporan | Laporan | Must | In Progress | TC-LAP-18: tiap perubahan tercatat |
| FR-PRG-01 | BG-01 | Buat program | Program | Must | Not Started | TC-PRG-01: PNG-PRG-01, 02; leader terkunci ke timnya |
| FR-PRG-02 | BG-01 | Filter status dan jumlah | Program | Must | Not Started | TC-PRG-02: jumlah per filter benar |
| FR-PRG-03 | BG-01 | Tutup dan batal | Program | Must | Not Started | TC-PRG-03: PNG-PRG-03; batal mengunci tugas |
| FR-PRG-04 | BG-03 | Kartu program | Program | Must | Not Started | TC-PRG-04: label paling mendesak tampil |
| FR-PRG-05 | BG-01 | Detail program | Program | Must | Not Started | TC-PRG-05: tugas terbagi berjalan dan selesai |
| FR-TGS-01 | BG-01 | Buat tugas | Tugas | Must | Not Started | TC-TGS-01: PNG-TGS-01, 02; staff ditolak |
| FR-TGS-02 | BG-02 | Pakai template | Tugas | Must | Not Started | TC-TGS-02: to-do terisi, PIC dan DL kosong |
| FR-TGS-03 | BG-05 | Lampiran laporan | Tugas | Must | Not Started | TC-TGS-03: laporan otomatis Ditindaklanjuti |
| FR-TGS-04 | BG-03 | Progress langkah | Tugas | Must | Not Started | TC-TGS-04: total termasuk QC |
| FR-TGS-05 | BG-04 | Visibilitas staff | Tugas | Must | Not Started | TC-TGS-05: tugas tanpa to-do staff tidak terlihat |
| FR-TGS-06 | BG-03 | Riwayat tugas | Tugas | Must | Not Started | TC-TGS-06: perubahan to-do dan QC tercatat |
| FR-TGS-07 | BG-01 | Hapus tugas | Tugas | Must | Not Started | TC-TGS-07: tugas hilang dari daftar dan progress; tugas selesai ditolak PNG-TGS-04; staff ditolak; PIC dapat notifikasi; program bisa ditutup |
| FR-TDO-01 | BG-04 | Field dan validasi | To-do | Must | Not Started | TC-TDO-01: PNG-TDO-01–04; to-do terlambat bisa dialihkan tanpa ganti DL |
| FR-TDO-02 | BG-02 | Tambah, edit, geser, hapus | To-do | Must | Not Started | TC-TDO-02: to-do terakhir tidak bisa dihapus |
| FR-TDO-03 | BG-02 | Centang dan batal centang | To-do | Must | Not Started | TC-TDO-03: hanya PIC; terkunci setelah approve |
| FR-TDO-04 | BG-03 | Label tenggat | To-do | Must | Not Started | TC-TDO-04: tiap tingkat benar pada batas tanggal WIB |
| FR-TDO-05 | BG-04 | Pengalihan | To-do | Must | Not Started | TC-TDO-05: label hilang, PIC baru dapat notifikasi |
| FR-QC-01 | BG-02 | Baris QC otomatis | QC | Must | Not Started | TC-QC-01: QC terkunci sampai semua dicentang |
| FR-QC-02 | BG-02 | Approve | QC | Must | Not Started | TC-QC-02: tugas tertutup, "Lolos QC" |
| FR-QC-03 | BG-02 | Kembalikan revisi | QC | Must | Not Started | TC-QC-03: PNG-QC-01, 02; jumlah revisi naik |
| FR-QC-04 | BG-02 | QC pindah ke leader baru | QC | Must | Not Started | TC-QC-04: leader baru bisa approve |
| FR-TIM-01 | BG-04 | Bagan tim | Pemetaan tim | Must | Done | TC-TIM-01: non-pemilik PNG-TIM-06 |
| FR-TIM-02 | BG-04 | Tambah dan edit tim | Pemetaan tim | Must | Done | TC-TIM-02: PNG-TIM-01–04 |
| FR-TIM-03 | BG-04 | Palet warna | Pemetaan tim | Must | Done | TC-TIM-03: PNG-TIM-07, 08 |
| FR-TIM-04 | BG-04 | Staff keluar | Pemetaan tim | Must | Not Started | TC-TIM-04: to-do ditandai, leader dapat notifikasi |
| FR-TIM-05 | BG-04 | Ganti leader | Pemetaan tim | Must | Not Started | TC-TIM-05: to-do leader lama ditandai |
| FR-TPL-01 | BG-02 | Kelola template | Template | Must | Done | TC-TPL-01: PNG-TPL-01–03 |
| FR-NTF-01 | BG-03 | Daftar berkelompok | Notifikasi | Must | Not Started | TC-NTF-01: angka lonceng = jumlah daftar |
| FR-NTF-02 | BG-03 | Ketuk membuka target | Notifikasi | Must | Not Started | TC-NTF-02: semua jenis punya tujuan |
| FR-NTF-03 | BG-03 | Geser dan Batalkan | Notifikasi | Must | Not Started | TC-NTF-03: batalkan dalam 2,5 detik; uji HP nyata |
| FR-NTF-04 | BG-03 | Bersihkan semua | Notifikasi | Must | Not Started | TC-NTF-04: konfirmasi lalu daftar kosong |
| FR-NTF-05 | BG-05 | Label CC | Notifikasi | Must | Not Started | TC-NTF-05: hanya laporan CC berlabel |
| FR-NTF-06 | BG-03 | 15 pemicu | Notifikasi | Must | In Progress | TC-NTF-06: tiap pemicu ke penerima benar; tidak ke diri sendiri |
| FR-UI-01 | BG-06 | Token dan ukuran mockup | Tampilan | Must | In Progress | TC-UI-01: perbandingan layar terang dan gelap |
| FR-UI-02 | BG-06 | Area ketuk 44 px | Tampilan | Must | In Progress | TC-UI-02: elemen kecil punya area 44 px |
| FR-UI-03 | BG-06 | Label peran | Tampilan | Must | Done | TC-UI-03: label per tim dan rangkap |
| FR-UI-04 | BG-05 | Inisial | Tampilan | Must | Done | TC-UI-04: Ka/Ku, CS, C2 |
| FR-UI-05 | BG-05 | Umur relatif | Tampilan | Must | Done | TC-UI-05: teks benar pada batas hari WIB |
| FR-UI-06 | BG-04 | Label tim berwarna | Tampilan | Must | In Progress | TC-UI-06: semua nama tim berlabel |
| FR-PWA-01 | BG-06 | Bisa di-install | PWA | Must | In Progress | TC-PWA-01: install di Android dan iOS |
| FR-PWA-02 | BG-06 | Cache statis dan halaman offline | PWA | Must | Done | TC-PWA-02: tanpa internet tampil halaman offline, tanpa data pengguna |
| FR-PWA-03 | BG-03 | Muat ulang saat aktif | PWA | Must | Done | TC-PWA-03: buka kembali aplikasi memperbarui lonceng |
| NFR-01 | Semua | Kesesuaian mockup | Seluruh layar | Must | In Progress | TC-NFR-01: layar berdampingan 390 px |
| NFR-02 | BG-06 | Aturan akses di server | Keamanan | Must | In Progress | TC-NFR-02: uji akses per peran |
| NFR-03 | BG-06 | Password dan sesi aman | Keamanan | Must | Done | TC-NFR-03: log bersih; login dibatasi |
| NFR-04 | BG-05 | Foto privat | Keamanan | Must | In Progress | TC-NFR-04: URL foto ditolak tanpa hak |
| NFR-05 | BG-01 | Konsistensi data | Data | Must | In Progress | TC-NFR-05: aksi bersamaan tidak merusak data |
| NFR-06 | BG-03 | Zona waktu Asia/Jakarta | Data | Must | In Progress | TC-NFR-06: pukul 00.30 WIB tetap tanggal yang benar |
| NFR-07 | BG-06 | Performa | Seluruh layar | Should | Not Started | TC-NFR-07: daftar tampil < 2 detik di 4G |
| NFR-08 | BG-06 | Kompatibilitas | Seluruh layar | Must | In Progress | TC-NFR-08: uji Chrome Android dan Safari iOS |
| NFR-09 | BG-06 | Skala | Arsitektur | Should | Not Started | TC-NFR-09: data contoh 8 tim tetap lancar |
| NFR-10 | BG-06 | Konfigurasi terpusat | Kode | Should | Done | TC-NFR-10: tambah warna cukup di satu berkas |

## Catatan status Sprint 0 (5 November 2026)

| ID | Sisa pekerjaan |
|---|---|
| FR-AUT-01 | Koneksi ke Jubelio asli dan jawaban kredensial salah (PNG-AUT-01) terbukti; login berhasil dengan akun asli belum diuji (A-01) |
| FR-AUT-03 | Sementara memakai opsi B, pengguna tercatat saat pertama login (A-02) |
| FR-AUT-04 | Peran sudah dihitung dari data tim; aturan per fitur menyusul di S1–S3 |
| FR-NAV-02 | Layar sama dengan mockup; rute tujuan dibuat di S1–S3 |
| FR-NAV-03 | Lonceng tampil; daftar notifikasi dibuat di S4 |
| FR-PWA-01 | Manifest dan ikon lolos di Chrome desktop; uji install di HP asli menunggu HTTPS staging |
| NFR-01 | Beranda dan Hub lolos pada 390 px, terang dan gelap; layar lain menyusul |
| NFR-08 | Baru diuji di Chrome desktop dengan lebar HP |

## Catatan status Sprint 1 (5 November 2026)

| ID | Sisa pekerjaan |
|---|---|
| FR-TIM-01–03, FR-TPL-01 | Selesai. Pemilik, leader, dan staff diuji lewat layar; jalur terlarang diuji langsung ke API |
| FR-TIM-04, FR-TIM-05 | Sprint 3, karena butuh To-do. Tombol keluarkan staff belum menampilkan konfirmasi to-do aktif |
| FR-UI-06 | Label tim dipakai di Pemetaan tim, Template, dan label peran; layar lain menyusul |
| FR-NTF-06 | Baru pemicu Menjadi leader tim. Daftar notifikasi dibuat di Sprint 4 |
| NFR-01 | Ditambah 4 layar: Pemetaan tim, form tim, Template, form template |

## Catatan status Sprint 2 (5 November 2026)

| ID | Sisa pekerjaan |
|---|---|
| FR-LAP-01–17 | Selesai, diuji lewat layar dengan 6 pengguna pada PostgreSQL asli |
| FR-LAP-02 | 12 pengiriman serentak mendapat nomor unik |
| FR-LAP-18 | Riwayat lampiran ke tugas dibuat di Sprint 3 |
| NFR-04 | Akses foto selesai; penyimpanan masih disk lokal dan perlu driver sesuai hosting (A-04) |
| NFR-05 | Laporan selesai; Tugas dan QC menyusul di Sprint 3 |
| FR-NTF-06 | Pemicu laporan selesai; pemicu Penugasan di Sprint 3 |
| NFR-01 | Ditambah 3 layar: Laporan, form laporan, detail laporan |
