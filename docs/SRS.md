# SRS — Fitur Penugasan, SAFAR OPS 2

| | |
|---|---|
| **Versi** | 1.1 (5 November 2026) |
| **Aplikasi** | ops2.saefulaskar.com, nama tampilan SAFAR OPS 2 |
| **Tim developer** | Velora |
| **Pemilik keputusan** | Chaesar Syaefuddin (Direktur) |
| **Dokumen terkait** | `docs/RTM.md`, `docs/DESIGN.md`, `docs/PLAN.md`, `CHANGELOG-penugasan.md` |

## 0. Urutan acuan

Jika dua sumber berbeda, yang lebih atas yang berlaku:

1. **Keputusan 5 November 2026** yang tercatat di `CHANGELOG-penugasan.md` (PWA opsi A, celah 1–9, login Jubelio).
2. **Mockup final** `02-mockup-final-fitur-penugasan.html`: tampilan, teks, alur, dan perilaku. Ini patokan utama proyek.
3. **PRD v2.0** `02-PRD-fitur-penugasan (1).md`: aturan yang tidak bisa dilihat di mockup, seperti hak akses server dan 4 akun pemilik.
4. **Catatan keputusan** `02-fitur-penugasan (2).md`: riwayat K-T01–K-T83.

Yang **tidak** diambil dari mockup karena hanya alat peraga: pemilih "Masuk sebagai", tombol Reset data, bingkai HP, tanggal tetap 27 Okt 2026, awalan nomor `2610-` yang ditulis tetap, foto placeholder, dan pengguna contoh (Dimas, Rudi).

## 1. Konteks bisnis

### 1.1 Latar belakang dan masalah

Tim memakai fitur tugas di GajiHub. Pemilik tidak dianggap karyawan sehingga tidak bisa memberi tugas, dan harus membeli add-on ±Rp1 juta/tahun hanya untuk satu fitur. Tahap awal dipakai Tim Produk (leader Kartika, staff Zarkasih).

### 1.2 Tujuan bisnis

Ukuran di bawah adalah **usulan** karena PRD tidak menetapkan angka selain kelulusan skenario uji. Mohon dikonfirmasi.

| ID | Tujuan | Jawaban di sistem | Ukuran (usulan) |
|---|---|---|---|
| BG-01 | SKU tidak terlewat | Program dan Tugas per SKU di satu tempat | Semua SKU baru tercatat sebagai Tugas |
| BG-02 | Proses tidak terlewat | To-do checklist dan Template | Tugas berulang dibuat dari Template |
| BG-03 | Keterlambatan terpantau | DL per to-do, label tenggat, progress bar | To-do terlambat terlihat tanpa ditanya manual |
| BG-04 | Beban kerja terlihat | PIC wajib, leader melihat semua to-do tim | Tidak ada to-do tanpa PIC |
| BG-05 | Serah terima tercatat | Laporan dengan CC | Serah terima gudang lewat Laporan, bukan lisan |
| BG-06 | Lepas dari GajiHub | Pemilik bisa memberi tugas di ops2 | Tim Produk berhenti memakai fitur tugas GajiHub |

### 1.3 Proses bisnis

| | As-Is | To-Be |
|---|---|---|
| Memberi tugas | GajiHub, pemilik tidak bisa | Pemilik dan leader membuat Program dan Tugas |
| Daftar SKU dan langkah | Ingatan orang | Tugas per SKU, to-do dari Template |
| Pantau tenggat | Tidak ada tenggat per tahap | Label H-3 sampai Terlambat |
| Serah terima gudang | Barang ditaruh di keranjang | Laporan dengan CC ke tim produk |
| Komunikasi kasus | Grup WA | Laporan berbentuk chat |
| Pemeriksaan hasil | Tidak terstruktur | QC oleh leader, revisi tercatat |

### 1.4 Scope

**In-scope tahap 1:** Laporan, Penugasan (Program, Tugas, To-do, QC), Pemetaan tim, Template to-do list, notifikasi dalam aplikasi, PWA opsi A.

**Out-of-scope:**

| Hal | Dasar |
|---|---|
| Pemicu otomatis dan aturan tenggat 2 hari | K-T44, K-T45 |
| Lampiran pada to-do | K-T46 |
| Dashboard pemantauan khusus | K-T47 |
| DL pada Tugas dan Program | K-T49 |
| Notifikasi di luar aplikasi, termasuk Web Push | K-T40 |
| Chat realtime | K-T42 |
| Mode offline untuk membaca atau menulis data | Keputusan PWA opsi A |
| Penanda laporan menggantung, cari isi laporan, cari Program/Tugas, label hari kerja | Bisa menyusul (K-T27, K-T81, K-T71) |
| Batal per Tugas, hapus tim | Tidak ada di mockup |

### 1.5 Stakeholder dan peran

| Peran | Siapa | Ditentukan dari |
|---|---|---|
| Pemilik | 4 akun, semuanya setara | Daftar email di konfigurasi |
| Leader | 1 orang per tim, hanya boleh leader di 1 tim | Pemetaan tim |
| Staff | Minimal 1 per tim, boleh di beberapa tim | Pemetaan tim |
| Pengguna tanpa tim | Pengguna Jubelio yang belum dipetakan | Bisa membuat dan menerima Laporan |

Email pemilik: `sesar040301@gmail.com`, `wahyudinst@gmail.com`, `nasurohazzam@gmail.com`, `saefulaskarcompany@gmail.com`.

### 1.6 Batasan

- **Stack (PRD bagian 3):** Next.js, Tailwind CSS + shadcn/ui, tRPC, Prisma, PostgreSQL.
- **Prinsip K-T18:** fitur tetap sederhana demi biaya dan transisi karyawan.
- **PRD dan mockup tidak diubah.** Perbedaan dicatat di `CHANGELOG-penugasan.md`.
- **Repo:** sudah ada dan masih kosong, dibangun dari awal.

## 2. Functional requirements

Kolom **Mockup** menyebut fungsi tampilan di file mockup sebagai acuan persis.

### 2.1 Akun dan akses (AUT)

| ID | Requirement | Sumber | Mockup |
|---|---|---|---|
| FR-AUT-01 | Login dengan email dan password Jubelio lewat `POST https://api2.jubelio.com/login`. Password tidak disimpan dan tidak dicatat di log | K-T73, keputusan 5 Nov | Tidak ada, halaman baru |
| FR-AUT-02 | 4 akun pemilik ditentukan dari daftar email, setara, tidak bisa menjadi leader atau staff | K-T72 | `OWNERS` |
| FR-AUT-03 | Daftar pengguna untuk penerima, CC, leader, staff, dan PIC bersumber dari pengguna Jubelio | K-T16 | `pickUsers` |
| FR-AUT-04 | Peran dihitung dari Pemetaan tim; semua pembatasan hak akses PRD bagian 4 berlaku di server | PRD 4 | `canManageProg`, `canSeeLap` |
| FR-AUT-05 | Pengguna bisa keluar (logout) dari ketuk avatar di Beranda | Tambahan, lihat CHANGELOG | Tidak ada |

### 2.2 Navigasi (NAV)

| ID | Requirement | Sumber | Mockup |
|---|---|---|---|
| FR-NAV-01 | Beranda: nama aplikasi, sapaan, label peran, lonceng, avatar, kartu tanggal, menu Penugasan | K-T17, K-T80 | `vHome` |
| FR-NAV-02 | Hub: Laporan, Penugasan, Pemetaan tim (pemilik), Template (leader), dengan ringkasan "n baru" dan "n to-do saya" | K-T17 | `vHub` |
| FR-NAV-03 | Lonceng notifikasi tampil di semua halaman Penugasan | K-T57 | `bellBtn`, `hd` |

### 2.3 Laporan (LAP)

| ID | Requirement | Sumber | Mockup |
|---|---|---|---|
| FR-LAP-01 | Buat laporan: judul, jenis, isi, foto opsional, 1 penerima bukan diri sendiri, CC opsional. Error PNG-LAP-01 sampai 05 | K-T21–23 | `vLapNew`, `saveLap` |
| FR-LAP-02 | Nomor YYMM-NNN, urutan direset tiap bulan, tidak boleh dobel | K-T83 | `saveLap` |
| FR-LAP-03 | Foto dikompres otomatis, maksimal 5 per pesan (PNG-LAP-06) | K-T43 | `addFotoNew`, `addFotoMsg` |
| FR-LAP-04 | Status Terkirim → Ditindaklanjuti (penerima) → Selesai (pelapor); Ditolak oleh penerima dari Terkirim atau Ditindaklanjuti | K-T03, K-T28 | `vLapDetail`, `lapStatus` |
| FR-LAP-05 | Menolak wajib alasan (PNG-LAP-07), alasan tampil di chat sebagai pesan sistem | K-T25 | `lapTolak` |
| FR-LAP-06 | Laporan tidak bisa diedit, dihapus, atau dibuka kembali; tampil catatan terkunci | K-T31 | `vLapDetail` |
| FR-LAP-07 | Teruskan oleh penerima, leader penerima, atau pemilik; penerima lama jadi CC; tidak tersedia setelah laporan tertutup | K-T29, K-T41, K-T52 | `lapFwd` |
| FR-LAP-08 | Tambah CC oleh pelapor atau penerima, selama laporan belum tertutup | K-T41 | `lapCC` |
| FR-LAP-09 | Chat teks dan foto; pesan kosong ditolak (PNG-LAP-08); ditutup setelah Selesai atau Ditolak | K-T24, K-T51 | `sendMsg` |
| FR-LAP-10 | Chat tidak realtime; diperbarui dengan tombol refresh atau saat halaman dibuka ulang | K-T42 | `vLapDetail` |
| FR-LAP-11 | Tanda baca: centang ganda dan inisial peserta; abu jika belum semua, biru jika semua. Leader dan pemilik yang hanya melihat tidak dihitung | K-T78 | `tickHTML`, `lapParts` |
| FR-LAP-12 | Foto bisa dibuka layar penuh, digeser, penanda "2 / 3", tutup dengan X atau ketuk luar | K-T76 | `openFoto`, `fotoGo` |
| FR-LAP-13 | Tab Laporan saya, Laporan tim (leader), Semua laporan (pemilik). Laporan tim tidak mengulang laporan milik sendiri | K-T30, K-T41 | `lapTabs`, `lapsFor` |
| FR-LAP-14 | Filter urut Terkirim, Ditindaklanjuti, Semua, Selesai, Ditolak; kembali ke Semua saat menu dibuka | K-T58, K-T75 | `vLapList`, `openLapList` |
| FR-LAP-15 | Cari nomor dan judul, tanpa peka huruf besar/kecil, langsung saat mengetik, di dalam tab dan filter aktif | K-T81 | `lapResHTML` |
| FR-LAP-16 | Kartu: nomor, jenis, status, judul, arah, umur relatif, jumlah pesan, titik oranye jika belum dibuka penerima | K-T27 | `lapCard` |
| FR-LAP-17 | Yang boleh melihat: pelapor, penerima, CC, leader penerima, pemilik. Selain itu PNG-LAP-11 | K-T21 | `canSeeLap` |
| FR-LAP-18 | Riwayat: pembuatan, status, teruskan, CC, lampiran ke tugas | PRD 6.1 | `logL` |

### 2.4 Program (PRG)

| ID | Requirement | Sumber | Mockup |
|---|---|---|---|
| FR-PRG-01 | Buat program: nama dan tim (PNG-PRG-01, 02). Pemilik memilih tim, leader otomatis timnya | K-T07, K-T32 | `vPrgNew`, `savePrg` |
| FR-PRG-02 | Daftar dengan filter Aktif, Selesai, Dibatalkan beserta jumlah | K-T62 | `vPrgList` |
| FR-PRG-03 | Tutup (semua tugas selesai, jika belum PNG-PRG-03) dan Batal (mengunci tugas berjalan) hanya oleh leader tim | K-T53 | `prgClose`, `prgCancel` |
| FR-PRG-04 | Kartu program mengikuti mockup: nama, persen, label tim, tanggal, "n/m tugas selesai", progress bar, label tenggat dan label alih | K-T63, K-T64, celah 6 | `vPrgList`, `progFlags` |
| FR-PRG-05 | Detail program: info, tugas berjalan, tugas selesai, catatan terkunci | K-T53 | `vPrgDetail` |

### 2.5 Tugas (TGS)

| ID | Requirement | Sumber | Mockup |
|---|---|---|---|
| FR-TGS-01 | Buat tugas dalam Program: nama dan minimal 1 to-do (PNG-TGS-01, 02), oleh pemilik atau leader tim | K-T07, K-T33 | `vTgsNew`, `saveTgs` |
| FR-TGS-02 | Pakai template mengisi daftar to-do; arahan, PIC, DL diisi saat itu | K-T08, K-T39 | `pickTpl` |
| FR-TGS-03 | Lampirkan No. laporan (hanya Terkirim dan Ditindaklanjuti); laporan Terkirim otomatis jadi Ditindaklanjuti; isi dilihat lewat popup | K-T04, K-T05, K-T28 | `pickLap`, `lapModal` |
| FR-TGS-04 | Progress bar dan "[n]/[total] langkah", total termasuk langkah QC | K-T67 | `progressOf` |
| FR-TGS-05 | Staff melihat tugas berisi to-do miliknya, tugas lain tidak terlihat | K-T15, K-T36 | `visibleTugas` |
| FR-TGS-06 | Riwayat semua perubahan to-do, QC, dan pengalihan | K-T09 | `logT` |
| FR-TGS-07 | Hapus tugas oleh pemilik atau leader tim dengan konfirmasi, selama tugas belum selesai dan Program Aktif (selain itu PNG-TGS-04). Tugas hilang dari semua daftar dan progress, data tetap tersimpan. Laporan terlampir tidak berubah. PIC terdampak diberi notifikasi | CHANGELOG 19 | Pola `delTpl`, `confirmSheet` |

### 2.6 To-do (TDO)

| ID | Requirement | Sumber | Mockup |
|---|---|---|---|
| FR-TDO-01 | Field nama, PIC anggota tim, DL tanpa jam, arahan opsional. Error PNG-TDO-01 sampai 04. DL lewat hanya ditolak jika nilai DL diubah | K-T34, K-T35, K-T54, K-T55, celah 1 | `validTodos` |
| FR-TDO-02 | Tambah, edit, geser, hapus oleh pemilik atau leader tim, tercatat di riwayat. To-do terakhir tidak bisa dihapus; jika seluruh tugas salah buat, hapus tugasnya (FR-TGS-07) | K-T09, K-T10, celah 3 | `editTodo`, `mvTodo` |
| FR-TDO-03 | PIC mencentang to-do miliknya dan boleh membatalkan selama QC belum di-approve | K-T14, K-T36, K-T37 | `tickTodo` |
| FR-TDO-04 | Label tenggat hari kalender: H-3, H-2 kuning; H-1, Hari ini merah bata; Terlambat merah penuh. Kartu menampilkan tingkat paling mendesak | K-T48, K-T65, K-T71, K-T74 | `dueRank`, `DUE`, `worstDue` |
| FR-TDO-05 | Pengalihan lewat form edit; label "Perlu dialihkan" di to-do dan kartu; PIC baru diberi notifikasi | K-T38, K-T61 | `todoForm`, `editTodo` |

### 2.7 QC

| ID | Requirement | Sumber | Mockup |
|---|---|---|---|
| FR-QC-01 | Baris QC otomatis, selalu terakhir, tertulis "Menunggu to-do selesai" sampai semua dicentang | K-T11, K-T67 | `vTgsDetail` |
| FR-QC-02 | Approve oleh leader tim, termasuk tugas yang ia kerjakan sendiri; tugas tertutup, "Lolos QC" | K-T11, K-T12 | `qcOk` |
| FR-QC-03 | Kembalikan revisi: pilih to-do dan tulis catatan per to-do (PNG-QC-01, 02); to-do terbuka, jumlah revisi bertambah | K-T13, K-T59 | `qcFail` |
| FR-QC-04 | Saat leader diganti, QC tertunda otomatis pindah ke leader baru | PRD 7.7 | `saveTim` |

### 2.8 Pemetaan tim (TIM)

| ID | Requirement | Sumber | Mockup |
|---|---|---|---|
| FR-TIM-01 | Bagan: kotak 4 pemilik, lalu kartu tiap tim dengan leader, staff, dan tanda rangkap. Hanya pemilik (PNG-TIM-06) | K-T19, K-T70 | `vTim` |
| FR-TIM-02 | Tambah dan edit tim dengan nama, warna, leader, staff. Error PNG-TIM-01 sampai 04. Pemilik tidak muncul di pilihan | K-T16, K-T20 | `vTimEdit`, `saveTim` |
| FR-TIM-03 | Palet 8 warna di satu daftar konfigurasi, tidak boleh sama (PNG-TIM-07), penuh = PNG-TIM-08 | K-T70, T-06 | `PALET`, `pickWarna` |
| FR-TIM-04 | Mengeluarkan staff dengan to-do aktif: konfirmasi, to-do ditandai Perlu dialihkan, leader diberi notifikasi | K-T38 | `rmStaff`, `saveTim` |
| FR-TIM-05 | Mengganti leader: to-do aktif leader lama yang sudah tidak di tim ditandai Perlu dialihkan | Celah 2 | `saveTim` |

### 2.9 Template (TPL)

| ID | Requirement | Sumber | Mockup |
|---|---|---|---|
| FR-TPL-01 | Leader mengelola template timnya: nama dan minimal 1 to-do (PNG-TPL-01, 02), edit dan hapus. Selain leader PNG-TPL-03 | K-T39 | `vTpl`, `vTplEdit` |

### 2.10 Notifikasi (NTF)

| ID | Requirement | Sumber | Mockup |
|---|---|---|---|
| FR-NTF-01 | Daftar berkelompok LAPORAN (n) dan PENUGASAN (n), terbaru di atas, kelompok kosong tidak tampil, angka lonceng = jumlah di daftar | K-T66, K-T68 | `openNotif` |
| FR-NTF-02 | Ketuk membuka target lalu notifikasi hilang. Program baru ke detail program; Menjadi leader dan Staff keluar ke daftar Penugasan | K-T69, celah 7 | `notifGo` |
| FR-NTF-03 | Geser kanan/kiri = dibaca, tombol Batalkan 2,5 detik, antisipasi gestur back di tepi layar | K-T69 | `bindSwipes`, `undoNotif` |
| FR-NTF-04 | Bersihkan semua dengan konfirmasi | K-T68 | `openNotif` |
| FR-NTF-05 | Label abu-abu "CC" untuk laporan yang diterima sebagai CC | K-T77 | `notifCC` |
| FR-NTF-06 | 14 pemicu sesuai PRD 10.2 ditambah Tugas dihapus (CHANGELOG 19); pengguna tidak menerima notifikasi atas tindakannya sendiri | PRD 10.2, CHANGELOG 19 | `notify` |

### 2.11 Pola tampilan (UI)

| ID | Requirement | Sumber | Mockup |
|---|---|---|---|
| FR-UI-01 | Token warna terang dan gelap, ukuran komponen, dan teks persis mockup | K-T74, K-T82 | CSS `:root` |
| FR-UI-02 | Area ketuk minimal 44 px; aksi to-do digabung ke satu tombol menu "⋯" | K-T82, celah 5 | `.pill::after`, `.tact` |
| FR-UI-03 | Label peran "Peran · Tim" dengan titik warna tim; pemilik cukup teks "Pemilik" | K-T80 | `roleHTML` |
| FR-UI-04 | Inisial 1–2 huruf; jika bentrok keduanya memakai 2 huruf pertama nama | K-T79 | `initials` |
| FR-UI-05 | Umur relatif "hari ini", "1 hari yang lalu" | K-T27 | `ago` |
| FR-UI-06 | Semua nama tim tampil sebagai label berwarna | K-T60 | `teamChip` |

### 2.12 PWA

| ID | Requirement | Sumber | Mockup |
|---|---|---|---|
| FR-PWA-01 | Bisa di-install ke layar utama: manifest, ikon, mode standalone, warna tema oranye | Keputusan 5 Nov | `viewport-fit=cover`, safe-area |
| FR-PWA-02 | File statis di-cache; saat tanpa internet tampil halaman "Anda sedang offline"; data pengguna tidak di-cache | Keputusan 5 Nov | Tidak ada, halaman baru |
| FR-PWA-03 | Data dimuat ulang saat aplikasi kembali dibuka atau aktif, tanpa tambahan tombol di tampilan | K-T42 | Tidak mengubah tampilan |

## 3. Non-functional requirements

| ID | Kategori | Requirement |
|---|---|---|
| NFR-01 | Kesesuaian mockup | Setiap layar dibandingkan berdampingan dengan mockup pada lebar 390 px, terang dan gelap, sebelum dinyatakan Done |
| NFR-02 | Keamanan | Semua aturan akses di server; aksi tanpa hak mengembalikan kode error PNG |
| NFR-03 | Keamanan | Password Jubelio tidak disimpan; sesi memakai cookie httpOnly dan Secure; percobaan login dibatasi |
| NFR-04 | Keamanan | Foto tidak punya URL publik; dibuka lewat jalur yang memeriksa hak melihat laporan |
| NFR-05 | Konsistensi data | Aksi yang mengubah status berjalan dalam transaksi; nomor laporan unik pada pengiriman bersamaan |
| NFR-06 | Zona waktu | "Hari ini", label tenggat, dan YYMM memakai Asia/Jakarta, tidak bergantung zona waktu server |
| NFR-07 | Performa | Halaman daftar tampil kurang dari 2 detik di koneksi 4G; foto dikompres di HP sebelum diunggah |
| NFR-08 | Kompatibilitas | Chrome Android, Safari iOS, dan browser desktop terbaru; dioptimalkan untuk HP |
| NFR-09 | Skala | Dirancang untuk puluhan pengguna dan maksimal 8 tim; tanpa kebutuhan microservice |
| NFR-10 | Pemeliharaan | Palet tim, email pemilik, dan kode error masing-masing di satu berkas konfigurasi |

## 4. Asumsi dan poin terbuka

| ID | Poin | Dampak | Status |
|---|---|---|---|
| A-01 | **Login Jubelio per karyawan belum diuji.** Di proyek E-Commerce endpoint ini dipakai sebagai satu akun sistem | Inti login | Uji di Sprint 0 |
| A-02 | **Endpoint daftar pengguna Jubelio belum ditemukan.** Tidak ada di proyek E-Commerce maupun hasil pencarian web | Pemetaan tim, Penerima, CC, PIC | Terbuka, risiko tertinggi |
| A-03 | Dokumentasi login mencantumkan `token`, `userName`, `currentCompany` (dipotong ke field yang dipakai). Nama tampilan belum tentu ada | Nama di seluruh aplikasi | Uji di Sprint 0 |
| A-04 | Diputuskan 5 November: aplikasi di Vercel, data di PostgreSQL, foto di Cloudflare R2. Risiko syarat paket Hobby sudah dijelaskan ke pengguna. Penyedia PostgreSQL dan driver R2 belum ditentukan atau dibuat | `docs/DESIGN.md` bagian 3 | Diputuskan, sisa pekerjaan sebelum deploy |
| A-05 | Tugas salah buat bisa dihapus (FR-TGS-07, CHANGELOG 19). Tugas yang sudah Lolos QC tidak bisa dihapus agar catatan pekerjaan selesai tetap utuh | Kerapian data | Selesai diputuskan |
| A-06 | Tampilan desktop memakai kolom tengah selebar HP, tanpa bingkai HP, karena mockup hanya menggambar HP | Tampilan desktop | Disetujui (CHANGELOG 17) |
| A-07 | Skenario uji final per role belum dibuat, padahal menjadi kriteria penerimaan (PRD 15) | UAT | Menunggu; sementara memakai Test Case di RTM |
