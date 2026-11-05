# PRD — Fitur Penugasan (02)

| | |
|---|---|
| **Versi** | 2.0 (menggantikan seluruh PRD v1.0–v1.6, yang tidak berlaku lagi) |
| **Tanggal** | 4 November 2026 |
| **Aplikasi** | ops2.saefulaskar.com — nama tampilan **SAFAR OPS 2** |
| **Tim developer** | Velora |
| **Pemilik keputusan** | Chaesar Syaefuddin (Direktur) |
| **Dasar** | Catatan diskusi `02-fitur-penugasan.md` (keputusan K-T01–K-T83), mockup uji v1.7–v1.9 (lulus uji) |
| **Lampiran** | `02-mockup-final-fitur-penugasan.html`, skenario uji final per role (Pemilik, Leader, Staff) |

> **Untuk developer:** jika hasil jadi berbeda dari PRD ini (karena kendala teknis atau pertimbangan lain), **catat perbedaannya di `CHANGELOG-penugasan.md`**. Cukup dicatat, tidak perlu menunggu persetujuan. PRD dan mockup tidak akan diubah setelah terbit; perubahan dari CHANGELOG diterapkan ke SOP.

---

## 1. Latar belakang

Tim memakai fitur tugas di GajiHub (aplikasi absensi). Pemilik tidak dianggap karyawan sehingga tidak bisa memberi tugas, dan harus membeli add-on ±Rp1 juta/tahun hanya untuk satu fitur. Fitur Penugasan dibangun di ops2 sebagai penggantinya. Tahap awal dipakai **Tim Produk** (leader Kartika, staff Zarkasih), satu-satunya bagian yang sudah memakai penugasan.

Masalah yang ingin diatasi:

| Masalah | Akar masalah | Jawaban di fitur ini |
|---|---|---|
| SKU terlewat | Daftar SKU bergantung pada ingatan pembuat tugas | Program dan Tugas per SKU, terlihat di satu tempat |
| Proses terlewat | Langkah kerja ada di kepala orang | To-do checklist dan Template paket to-do |
| Terlambat dan tidak terpantau | Tidak ada tenggat per tahap | DL per to-do, label tenggat bertingkat, progress bar |
| Miss penentuan beban kerja | Tidak ada gambaran beban tiap orang | To-do selalu punya PIC; leader melihat semua to-do timnya |
| Serah terima gudang tidak tercatat | Barang ditaruh di keranjang tanpa kabar | Laporan dengan CC (bukan pemicu otomatis) |

**Prinsip (K-T18):** fitur tetap sederhana demi biaya development dan transisi karyawan.

## 2. Ruang lingkup

### 2.1 Masuk tahap 1
- Laporan: buat, chat (teks dan foto), status, Teruskan, CC, tanda baca dengan inisial, pencarian.
- Penugasan: Program → Tugas → To-do, QC oleh leader, revisi, label tenggat, riwayat, pengalihan to-do.
- Pemetaan tim (oleh pemilik), Template to-do list (oleh leader).
- Notifikasi di dalam aplikasi.

### 2.2 Tidak termasuk / bisa menyusul
| Hal | Status |
|---|---|
| Pemicu otomatis (mis. tugas dibuat saat gudang menerima barang) | Tidak dibuat (K-T44) |
| Aturan tenggat 2 hari setelah penerimaan gudang | Tidak dibuat (K-T45) |
| Lampiran/bukti pada to-do | Tidak dibuat; QC manual (K-T46) |
| Halaman pemantauan/dashboard khusus | Tidak dibuat; pakai progress bar (K-T47) |
| DL pada Tugas dan Program | Tidak dibuat (K-T49) |
| Notifikasi di luar aplikasi (WA, email, push) | Tidak dibuat (K-T40) |
| Chat realtime | Tidak; diperbarui dengan refresh (K-T42) |
| Penanda laporan menggantung | Bisa menyusul (K-T27) |
| Pencarian isi laporan dan isi chat | Bisa menyusul (K-T81) |
| Kolom cari di daftar Program/Tugas | Bisa menyusul (K-T81) |
| Label tenggat berbasis hari kerja | Bisa menyusul (hari kalender dipakai, K-T71) |
| Penambahan palet warna tim | Titipan T-06 (lihat bagian 14) |

## 3. Teknologi dan akun

- **Tech stack:** Next.js, Tailwind CSS + shadcn/ui (Radix UI), tRPC, Prisma, PostgreSQL.
- **Login (K-T73):** memakai akun pengguna Jubelio, sama dengan fitur Absensi (K-A03). Satu login untuk seluruh ops2.
- **Daftar pengguna:** nama di Pemetaan tim, penerima laporan, CC, dan PIC diambil dari pengguna Jubelio (K-T16).
- **Pemilik (K-T72):** 4 akun di-hardcode berdasarkan email, semuanya setara:

| Nama tampilan | Email |
|---|---|
| Chaesar 2 | sesar040301@gmail.com |
| Wahyudin | wahyudinst@gmail.com |
| Nasuroh | nasurohazzam@gmail.com |
| Chaesar Syaefuddin | saefulaskarcompany@gmail.com |

  Dua akun Chaesar tampil sebagai dua pengguna terpisah (nama sesuai Jubelio). Keempat email sudah terdaftar di Jubelio. Pemilik **tidak bisa** dijadikan leader atau staff tim.
- **Foto (K-T43):** dikompres otomatis, maksimal 5 per pesan, disimpan di penyimpanan milik ops2. Detail teknis diserahkan ke developer.

## 4. Peran dan hak akses

Peran ditentukan dari Pemetaan tim (bagian 8). Satu orang hanya boleh menjadi leader di 1 tim; staff boleh di lebih dari 1 tim; leader satu tim boleh menjadi staff di tim lain (K-T20).

| Aksi | Pemilik | Leader | Staff |
|---|---|---|---|
| Membuat laporan ke siapa pun | ✓ | ✓ | ✓ |
| Melihat laporan | Semua (tab Semua laporan) | Miliknya + laporan yang ditujukan ke staff timnya (tab Laporan tim) | Miliknya (pelapor, penerima, atau CC) |
| Mengubah status ke Ditindaklanjuti/Ditolak | Hanya jika ia penerima | Hanya jika ia penerima | Hanya jika ia penerima |
| Menandai laporan Selesai | Hanya pelapor | Hanya pelapor | Hanya pelapor |
| Teruskan laporan | ✓ (semua laporan) | ✓ jika penerima, atau leader dari penerima | ✓ jika penerima |
| Menambah CC | Jika pelapor/penerima | Jika pelapor/penerima | Jika pelapor/penerima |
| Ikut chat | ✓ | ✓ (penerima, peserta, atau leader penerima) | ✓ jika peserta |
| Membuat dan menutup/membatalkan Program | Membuat ✓; tutup/batal oleh leader tim | ✓ untuk timnya | ✗ |
| Membuat Tugas | ✓ | ✓ untuk timnya | ✗ |
| Menambah, mengedit, menggeser, menghapus to-do | ✓ | ✓ | ✗ (lapor ke leader lewat Laporan) |
| Mencentang to-do | — | To-do miliknya | To-do miliknya |
| QC (approve/kembalikan revisi) | ✗ | ✓ untuk timnya, termasuk tugas yang ia kerjakan sendiri | ✗ |
| Mengalihkan to-do | Ke leader atau staff lain | Ke staff lain di timnya | ✗ |
| Mengatur Pemetaan tim | ✓ | ✗ | ✗ |
| Mengelola Template to-do list | ✗ | ✓ untuk timnya | ✗ |

Catatan: pembatasan **wajib di sisi server** (tRPC), bukan hanya disembunyikan di tampilan. Akses tanpa hak menampilkan kode error (bagian 13).

## 5. Navigasi (K-T17)

- **Beranda SAFAR OPS 2:** sapaan, label peran (K-T80), lonceng notifikasi, kartu tanggal, menu **Penugasan**.
- **Penugasan (hub):** 4 sub-menu:
  - **Laporan** — pekerjaan lepas (tidak berulang, tidak terstruktur).
  - **Penugasan** — pekerjaan terstruktur (mengikat, tidak rutin tapi berulang).
  - **Pemetaan tim** — hanya tampil untuk pemilik.
  - **Template to-do list** — hanya tampil untuk leader.
- Lonceng notifikasi tampil di semua halaman Penugasan (K-T57).

## 6. Modul Laporan

### 6.1 Data laporan
| Field | Aturan |
|---|---|
| Nomor | Format **YYMM-urut 3 digit**, misalnya `2610-001`, tanpa awalan (K-T83). Urutan direset tiap bulan |
| Judul | Wajib |
| Jenis | Wajib: Temuan Kasus, Permintaan, Pertanyaan, Umum (K-T22) |
| Isi | Wajib |
| Foto | Opsional, maksimal 5 |
| Penerima | Wajib, tepat 1 orang, tidak boleh diri sendiri (K-T21, K-T23) |
| CC | Opsional, 0 atau lebih orang |
| Status | Terkirim, Ditindaklanjuti, Ditolak, Selesai (K-T03) |
| Tugas terkait | Diisi otomatis saat laporan dilampirkan ke Tugas |
| Riwayat | Pembuatan, perubahan status, teruskan, tambah CC |

Laporan **tidak bisa diedit, dihapus, atau dibuka kembali**. Koreksi lewat chat; masalah yang muncul lagi dibuat sebagai laporan baru (K-T31).

### 6.2 Status dan alur
```
Terkirim ──(penerima)──► Ditindaklanjuti ──(pelapor)──► Selesai
    │                          │
    └──────(penerima, wajib alasan)──────► Ditolak
Terkirim ──(dilampirkan ke Tugas)──► Ditindaklanjuti (otomatis)
```
- Penerima mengubah status ke Ditindaklanjuti atau Ditolak (Ditolak bisa dari Terkirim maupun Ditindaklanjuti); pelapor menandai Selesai setelah Ditindaklanjuti (K-T28).
- Menolak wajib menulis alasan (K-T25).
- Laporan yang dilampirkan ke Tugas otomatis menjadi Ditindaklanjuti dan menampilkan "Sudah ada Tugas: [nama tugas]" (K-T05, K-T28).
- Setelah Selesai atau Ditolak, chat ditutup (K-T51).
- Hanya penerima yang mengubah status; leader penerima dan CC boleh ikut chat (K-T56).

### 6.3 Teruskan dan CC (K-T29, K-T41, K-T52)
- **Teruskan** memindahkan penerima. Bisa dilakukan penerima, leader penerima, atau pemilik. Penerima lama otomatis menjadi CC.
- **CC** menambah peserta yang bisa melihat dan ikut chat. Bisa dilakukan pelapor atau penerima.
- Keduanya tercatat di chat sebagai pesan sistem dan di riwayat.

### 6.4 Chat
- Bentuk seperti WhatsApp: teks dan foto (K-T24). Pesan kosong tanpa foto ditolak.
- Tidak realtime; diperbarui dengan tombol refresh atau saat halaman dibuka ulang (K-T42).
- **Tanda baca (K-T78):** di bawah setiap pesan milik pengguna tampil ikon centang ganda dan inisial peserta yang sudah membaca.
  - Peserta = pelapor, penerima, dan CC. Leader penerima dan pemilik yang hanya melihat **tidak dihitung** dan tidak ditampilkan.
  - Centang **abu** = belum semua peserta membaca (inisial yang tampil = yang sudah membaca). Centang **biru** = semua peserta sudah membaca.
  - Pesan dianggap dibaca saat peserta membuka detail laporan.
- **Foto bisa diperbesar (K-T76):** semua foto (isi laporan, chat, form, foto yang siap dikirim) bisa diketuk untuk dibuka layar penuh, bisa digeser kiri/kanan jika lebih dari satu, dengan penanda "2 / 3". Ditutup dengan tombol X atau ketuk di luar foto.

### 6.5 Daftar laporan
- **Tab (K-T41):** Laporan saya (semua pengguna), Laporan tim (leader; laporan yang ditujukan ke staff timnya), Semua laporan (pemilik).
- **Filter status (K-T58):** urutan Terkirim, Ditindaklanjuti, Semua, Selesai, Ditolak. Saat menu Laporan dibuka, filter selalu kembali ke **Semua** (K-T75).
- **Pencarian (K-T81):** kolom cari di atas filter. Hanya mencari **nomor laporan dan judul**, tidak membedakan huruf besar/kecil, hasil langsung berubah saat mengetik, berjalan di dalam tab dan filter yang aktif. Kosong kembali saat menu Laporan dibuka ulang. Jika tidak ada hasil: *Tidak ada laporan yang cocok dengan "[kata kunci]".*
- **Kartu laporan:** nomor, jenis, label status, judul, arah ("Zarkasih → saya", "Saya → Kartika", "CC · A → B"), umur relatif ("1 hari yang lalu", K-T27), jumlah pesan. Laporan baru yang belum dibuka penerima diberi titik oranye.

## 7. Modul Penugasan

### 7.1 Struktur (K-T01)
```
Program (tim penanggung jawab, tanpa DL)
└─ Tugas (progress bar, tanpa DL, tanpa PIC)
   ├─ To-do (PIC, DL, arahan opsional, revisi)
   ├─ ...
   └─ To-do QC (otomatis, terkunci di urutan terakhir, oleh leader tim)
```
Contoh:
```
Program: PO-123 Barang Baru (Tim Produk)
├─ Tugas: SKU-1 Data & Foto      → to-do staff … → QC leader ✓ tertutup
├─ Tugas: SKU-2 Data & Foto      → … → QC leader
└─ Tugas: Upload MP SKU-1, SKU-2 → to-do leader … → QC leader
```

### 7.2 Program
- Dibuat oleh pemilik atau leader; wajib nama dan tim penanggung jawab (K-T07, K-T32).
- Status: **Aktif, Selesai, Dibatalkan**. Daftar program punya filter Aktif, Selesai, Dibatalkan dengan jumlah (K-T62).
- **Tutup** (jadi Selesai) dan **Batal** dilakukan leader tim. Tutup hanya bisa jika semua tugas selesai. Batal mengunci tugas yang masih berjalan (K-T53).
- Kartu program ringkas (K-T63): nama, label tim, status, tanggal dibuat (K-T49), dan satu label paling mendesak:
  - "Ada tugas dengan to-do terlambat" atau tingkat tenggat paling mendesak lain (K-T64, K-T71);
  - "Ada to-do perlu dialihkan" (K-T61).

### 7.3 Tugas
- Dibuat oleh pemilik atau leader; staff tidak bisa (K-T33). Wajib nama dan minimal 1 to-do. Setiap tugas wajib berada di dalam Program (K-T07).
- Bisa dibuat dari **Template to-do list** (K-T08): daftar to-do terisi, lalu arahan, PIC, dan DL diisi saat itu (K-T39).
- Bisa dilampiri **No. laporan** (opsional, dropdown dengan pencarian). Laporan Selesai/Ditolak tidak muncul di pilihan. Isi laporan dilihat lewat popup (K-T04).
- Progress bar dan teks "[n]/[total] langkah" (K-T67).
- Staff melihat seluruh tugas yang berisi to-do miliknya, tapi hanya bisa mencentang to-do miliknya (K-T36). Tugas tanpa to-do miliknya tidak terlihat oleh staff (K-T15).
- Riwayat mencatat semua perubahan to-do, QC, dan pengalihan (K-T09).

### 7.4 To-do
| Field | Aturan |
|---|---|
| Nama | Wajib, diketik manual (K-T08) |
| PIC | Wajib, harus anggota tim pemilik Program (K-T34, K-T54) |
| DL | Wajib, tanggal tanpa jam, tidak boleh sebelum hari ini saat dibuat/diubah (K-T35, K-T55) |
| Arahan | Opsional (K-T54) |
| Jumlah revisi | Bertambah setiap kali dikembalikan dari QC (K-T13) |

- Bisa ditambah, diedit, digeser, dan dihapus oleh pembuat tugas, leader, atau pemilik; tercatat di riwayat. Tidak ada status "tidak perlu" (K-T09). Staff tidak bisa menambah to-do (K-T10).
- Urutan pengerjaan bebas (K-T14).
- PIC boleh membatalkan centang selama QC belum di-approve (K-T37).
- Leader boleh mengubah DL (K-T15).

### 7.5 QC (K-T11–K-T13, K-T59)
- To-do QC dibuat otomatis, terkunci di urutan terakhir, dan hanya bisa dikerjakan setelah semua to-do dicentang. Selama itu tertulis "Menunggu to-do selesai".
- **Approve** → tugas tertutup otomatis ("Lolos QC"). Pekerjaan setelah QC dibuat sebagai tugas baru.
- **Kembalikan untuk revisi** → leader memilih to-do yang perlu direvisi dan menulis **catatan revisi per to-do** (wajib). To-do terpilih terbuka kembali, PIC mendapat notifikasi, jumlah revisi bertambah.

### 7.6 Label tenggat (K-T48, K-T65, K-T71, K-T74)
Dihitung dengan **hari kalender** dari tanggal hari ini ke DL, hanya untuk to-do yang belum dicentang.

| Tingkat | Kondisi | Warna |
|---|---|---|
| H-3 | DL 3 hari lagi | Kuning |
| H-2 | DL 2 hari lagi | Kuning |
| H-1 | DL besok | Merah bata |
| Hari ini | DL hari ini | Merah bata |
| Terlambat | DL sudah lewat | Merah penuh, tulisan putih |

- Baris to-do menampilkan labelnya sendiri. To-do yang sudah dicentang dan To-do QC tidak diberi label.
- Kartu tugas hanya menampilkan tingkat paling mendesak beserta jumlahnya, mis. "2 to-do terlambat", "1 to-do hari ini".
- Kartu program hanya menampilkan tingkat paling mendesak sebagai kalimat, mis. "Ada tugas dengan to-do terlambat".

### 7.7 Pengalihan to-do (K-T38)
- Staff yang keluar atau berganti posisi wajib menyelesaikan tugasnya lewat handover.
- Jika tidak memungkinkan, to-do miliknya berlabel **"Ada to-do perlu dialihkan"** (juga di kartu program, K-T61). Leader mengalihkan ke staff lain; pemilik bisa mengalihkan ke leader atau staff lain. PIC baru mendapat notifikasi.
- Saat leader tim diganti, QC yang tertunda ikut pindah ke leader baru.

## 8. Pemetaan tim (K-T16, K-T19, K-T20, K-T70)

- Hanya pemilik yang bisa mengatur. Tampil sebagai bagan sederhana: kotak Pemilik (4 akun) di atas, lalu kartu tiap tim.
- Data tim: **nama** (wajib, teks bebas), **warna** (wajib), **leader** (tepat 1 pengguna Jubelio), **staff** (minimal 1 pengguna Jubelio).
- Pemilik tidak muncul di pilihan leader maupun staff.
- **Warna tim:** dari palet tetap 8 warna, tidak boleh sama antar tim, sehingga **maksimal 8 tim**.

| Nama | Kode warna (acuan mockup) |
|---|---|
| Ungu | #7C4DCC |
| Toska | #138A8A |
| Biru | #2F6FD8 |
| Hijau | #2E8B57 |
| Indigo | #3F51B5 |
| Zaitun | #6B7A2A |
| Cokelat | #8A5A2B |
| Abu | #5F6B7A |

  - Saat menambah tim, warna bawaan = warna pertama yang belum dipakai. Warna yang sudah dipakai tim lain tampil pudar dengan tanda silang; jika dipilih muncul PNG-TIM-07.
  - Jika 8 warna sudah terpakai, tombol Tambah tim memunculkan PNG-TIM-08.
  - Simpan palet sebagai **satu daftar konfigurasi** yang mudah ditambah (titipan T-06).
- Setiap tulisan yang mengandung nama tim tampil sebagai label berwarna dengan titik warna tim (K-T60).

## 9. Template to-do list (K-T39)

- Dikelola hanya oleh leader untuk timnya sendiri; pemilik tidak bisa.
- Isi: **nama template** dan **daftar to-do** (minimal 1). Arahan, PIC, dan DL diisi saat template dipakai.

## 10. Notifikasi (K-T40, K-T66, K-T68, K-T69, K-T77)

### 10.1 Tampilan
- Hanya di dalam aplikasi, lewat lonceng di header. Angka di lonceng = jumlah notifikasi di daftar.
- Satu daftar berkelompok dengan judul dan garis pemisah: **LAPORAN (n)** di atas, **PENUGASAN (n)** di bawah. Kelompok kosong tidak tampil. Terbaru di atas.
- **Ketuk** = membuka laporan/tugas terkait, lalu notifikasi hilang dari daftar.
- **Geser kanan/kiri** = tandai dibaca (latar bertulisan "Dibaca"), notifikasi hilang, tombol **Batalkan** muncul 2,5 detik. Antisipasi gestur back di tepi layar HP.
- Tombol **Bersihkan semua** dengan konfirmasi.
- Notifikasi laporan yang diterima sebagai **CC** diberi label abu-abu **"CC"**. Laporan yang ditujukan langsung tidak diberi label (K-T77).

### 10.2 Pemicu
| Kejadian | Penerima notifikasi |
|---|---|
| Laporan baru | Penerima dan peserta CC |
| Pesan chat baru | Semua peserta laporan selain pengirim |
| Status berubah (Ditindaklanjuti/Ditolak) | Pelapor |
| Laporan ditandai Selesai | Penerima |
| Laporan diteruskan | Penerima baru dan pelapor |
| Ditambahkan sebagai CC | Orang yang ditambahkan |
| Laporan dilampirkan ke tugas | Pelapor |
| Program baru | Leader tim penanggung jawab |
| To-do baru / dialihkan | PIC to-do |
| Semua to-do selesai (siap QC) | Leader tim |
| Tugas lolos QC | Para PIC di tugas tersebut |
| To-do dikembalikan untuk revisi | PIC to-do tersebut |
| Menjadi leader tim | Leader baru (QC tertunda ikut pindah) |
| Staff keluar dari tim, ada to-do yang perlu dialihkan | Leader tim |

Pengguna tidak menerima notifikasi atas tindakannya sendiri.

## 11. Pola tampilan (berlaku di seluruh ops2)

| Pola | Aturan |
|---|---|
| Tema (K-T74) | SAFAR OPS 2 berwarna **oranye** (header gradasi oranye, tulisan putih, tombol utama oranye). Operation lama tetap kuning/emas |
| Ukuran komponen (K-T82) | Ukuran bawaan shadcn/ui: tombol utama dan isian/dropdown **36 px** (sudut 8); tombol kecil dan tab **32 px**; filter status **26 px**; header halaman ±52 px dengan tombol kembali 32 px; kartu jarak dalam 12 px (sudut 12); header beranda dipendekkan |
| Area ketuk (K-T82) | Minimal **44 px** untuk semua yang bisa diketuk. Elemen yang tampil lebih kecil diberi area ketuk tak terlihat di sekelilingnya |
| Mobile-first | Kartu ringkas di HP; label status tidak memakan lebar kartu; dropdown dengan pencarian |
| Label peran (K-T80) | Header beranda dan subjudul header: satu label per tim berisi **"Peran · Tim"** (mis. "Staff · Tim Produk") dengan titik warna tim, berlatar putih; boleh turun baris. Pemilik cukup teks "Pemilik" |
| Inisial (K-T79) | Huruf pertama tiap kata, maksimal 2 huruf (Kartika → K, Chaesar Syaefuddin → CS, Chaesar 2 → C2). Jika dua pengguna berinisial sama, **keduanya** memakai 2 huruf pertama nama (Ka, Ku). Dipakai di avatar, Pemetaan tim, dan tanda baca chat |
| Umur relatif (K-T27) | "hari ini", "1 hari yang lalu", dst. |
| Teks label (K-T67) | Baris QC "Menunggu to-do selesai"; "Lolos QC"; progres "[n]/[total] langkah"; hub "Pekerjaan lepas" dan "Pekerjaan terstruktur"; arah laporan "Zarkasih → saya"; "Dilihat sebagai leader [nama]" |

## 12. Model data (usulan, detail diserahkan ke developer)

| Entitas | Field utama |
|---|---|
| User | id (dari Jubelio), nama, email, isOwner (dari daftar email pemilik) |
| Team | id, nama, warna, leaderId |
| TeamMember | teamId, userId (staff) |
| Report | id, nomor (YYMM-NNN), judul, jenis, isi, status, fromId, toId, alasanTolak, createdAt |
| ReportCC | reportId, userId |
| ReportMessage | id, reportId, byId, teks, isSystem, createdAt |
| ReportMessageRead | messageId, userId, readAt |
| Photo | id, ownerType (report/message), ownerId, url |
| Program | id, nama, teamId, status, createdById, createdAt |
| Task | id, programId, nama, reportId (opsional), closed, createdById, createdAt |
| Todo | id, taskId, urutan, nama, picId, dl (date), arahan, done, revisiCount, needsReassign, isQC |
| RevisionNote | todoId, catatan, byId, createdAt |
| Template | id, teamId, nama |
| TemplateTodo | templateId, urutan, nama |
| Notification | id, userId, teks, tipe (laporan/penugasan), target, createdAt, dibaca |
| ActivityLog | entitas, entitasId, teks, byId, createdAt |

## 13. Kode error

Format **PNG-[MODUL]-[nomor]** (K-T50). Pesan tampil singkat di atas form atau di bawah isian.

| Kode | Pesan di layar |
|---|---|
| PNG-LAP-01 | Judul laporan belum diisi. |
| PNG-LAP-02 | Pilih jenis laporan. |
| PNG-LAP-03 | Isi laporan belum diisi. |
| PNG-LAP-04 | Pilih penerima laporan. |
| PNG-LAP-05 | Tidak bisa melapor ke diri sendiri. |
| PNG-LAP-06 | Maksimal 5 foto per pesan. |
| PNG-LAP-07 | Alasan penolakan wajib diisi. |
| PNG-LAP-08 | Pesan kosong. Tulis pesan atau tambah foto. |
| PNG-LAP-11 | Anda tidak punya akses ke laporan ini. |
| PNG-PRG-01 | Nama program belum diisi. |
| PNG-PRG-02 | Pilih tim penanggung jawab. |
| PNG-PRG-03 | Masih ada tugas yang belum selesai. |
| PNG-TGS-01 | Nama tugas belum diisi. |
| PNG-TGS-02 | Tambahkan minimal 1 to-do. |
| PNG-TDO-01 | Nama to-do [n] belum diisi. |
| PNG-TDO-02 | PIC to-do "[nama]" belum dipilih. |
| PNG-TDO-03 | DL to-do "[nama]" belum diisi. |
| PNG-TDO-04 | DL "[nama]" tidak boleh sebelum hari ini. |
| PNG-QC-01 | Pilih to-do yang perlu direvisi. |
| PNG-QC-02 | Catatan revisi "[nama to-do]" wajib diisi. |
| PNG-TIM-01 | Nama tim belum diisi. |
| PNG-TIM-02 | Pilih leader tim. |
| PNG-TIM-03 | [Nama] sudah menjadi leader di [Tim]. Satu orang hanya boleh leader di 1 tim. |
| PNG-TIM-04 | Pilih minimal 1 staff. |
| PNG-TIM-06 | Hanya pemilik yang bisa mengatur pemetaan tim. |
| PNG-TIM-07 | Warna ini sudah dipakai [nama tim]. Pilih warna lain. |
| PNG-TIM-08 | Semua 8 warna tim sudah dipakai. Tim baru belum bisa ditambahkan. |
| PNG-TPL-01 | Nama template belum diisi. |
| PNG-TPL-02 | Tambahkan minimal 1 to-do. |
| PNG-TPL-03 | Template hanya bisa dikelola leader tim. |

Nomor yang tidak ada (PNG-LAP-09, PNG-LAP-10, PNG-TIM-05) tidak dipakai; jangan diisi ulang agar tidak membingungkan SOP.

## 14. Poin terbuka dan titipan

| Kode | Poin |
|---|---|
| T-06 | Palet warna tim kemungkinan ditambah jika jumlah tim lebih dari 8, waktunya belum bisa ditentukan. Simpan palet sebagai satu daftar konfigurasi agar penambahan warna tidak perlu mengubah banyak tempat |

## 15. Kriteria penerimaan

Fitur dianggap sesuai jika semua skenario di file skenario uji final per role (Pemilik, Leader, Staff) lulus saat diuji karyawan di aplikasi jadi. Skenario tersebut diturunkan dari 57 skenario uji mockup yang sudah lulus.

## 16. CHANGELOG

Developer membuat dan merawat `CHANGELOG-penugasan.md` berisi setiap perbedaan hasil jadi dari PRD ini. Format usulan per baris: tanggal, bagian PRD/kode keputusan, yang diminta, yang dibuat, alasan. Cukup dicatat, tidak perlu persetujuan. CHANGELOG menjadi dasar finalisasi SOP.

## Lampiran — Daftar keputusan

Rincian dan riwayat setiap keputusan (K-T01–K-T83) ada di catatan diskusi `02-fitur-penugasan.md`. Keputusan yang direvisi: K-T16 → K-T72 (pemilik), K-T26 → K-T83 (nomor laporan), K-T42 → K-T78 (tanda baca).
