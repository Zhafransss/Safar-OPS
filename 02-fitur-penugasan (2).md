# 02 — Fitur Penugasan (ops2 / SAFAR OPS 2)

**Status:** Tahap 5 — testing dinyatakan selesai dan lulus (4 Nov 2026); PRD v2.0 dan mockup final terbit
**Aplikasi:** ops2.saefulaskar.com (SAFAR OPS 2), tim dev Velora
**Pemilik keputusan:** Chaesar Syaefuddin (Direktur)
**Terakhir diperbarui:** 4 November 2026

---

## 1. Latar belakang

- Sebelumnya tim memakai fitur tugas di GajiHub (aplikasi absensi). Pemilik tidak dianggap karyawan sehingga tidak bisa memberi tugas, dan harus membeli add-on ±Rp1 juta/tahun hanya untuk satu fitur.
- Fitur baru dibangun di ops2 (SAFAR OPS 2). Tahap awal mendukung **tim produk**, satu-satunya bagian yang sudah memakai penugasan.
- Tim produk: Kartika (leader; perencana + eksekutor) dan Zarkasih (staff; eksekutor).
- Harapan jangka panjang: tim punya mekanisme kerja yang solid dan terstruktur sehingga tidak selalu menunggu tugas dari pemilik (topik lebih luas, dibahas lain waktu).
- Kuesioner tim produk (41 pertanyaan; Claude Doc dan 02-pertanyaan-tim-produk.html) disiapkan tetapi tidak jadi dibagikan.

## 2. Alur kerja tim produk (versi pemilik, mungkin belum lengkap)

**Barang baru**
1. Procurement membuat SKU baru dan meminta penawaran ke supplier.
2. Gudang mengecek kesesuaian barang dengan data PO.
3. Barang yang sesuai diserahkan ke tim produk.
4. Tim produk: foto, edit foto, ukur berat & dimensi, buat deskripsi, tentukan product group, nama produk di MP, bundling jika diperlukan, upload ke MP, cek sinkronisasi di Jubelio.

**Barang lama beda fisik (SKU tetap)**
1. Identifikasi perbedaan fisik.
2. Foto ulang dan edit.
3. Update foto produk di MP dan Jubelio.

**Bundling barang**
1. Menentukan/membaca ketentuan produk yang akan dibundling.
2. Langkah sama dengan poin 4 barang baru.

**Materi promosi**
1. Menentukan/membaca ketentuan produk yang dipromosikan.
2. Menentukan platform/media promosi untuk menentukan desain.
3. Membuat desain.
4. Membuat copywriting/deskripsi/caption.
5. Mencetak/mengupload materi promosi.

## 3. Masalah yang ingin diatasi

| Error | Akar masalah |
|---|---|
| SKU terlewat | Daftar SKU bergantung pada ingatan pembuat tugas |
| Proses terlewat | Langkah kerja ada di kepala orang, bukan di sistem |
| Terlambat & tidak terpantau | Tidak ada tenggat per tahap dan pengingat |
| Miss penentuan load kerja | Tidak ada gambaran beban tiap orang saat membagi tugas |

Catatan: serah terima gudang ke tim produk belum tercatat. Barang hanya ditaruh di keranjang, dan barang besar (misalnya sepeda listrik) sering tidak terkabar sehingga belum punya foto produk.

## 4. Keputusan

### 4a. Struktur, wewenang, dan Penugasan

| Kode | Keputusan |
|---|---|
| K-T01 | Struktur: **Program** (tim penanggung jawab, tanpa DL) → **Tugas** (progress bar, tanpa DL, tanpa PIC) → **To-do** (checklist, DL, arahan, revisi jika perlu, PIC) |
| K-T07 | Setiap Tugas wajib berada di dalam Program. Tim penanggung jawab Program berupa tim/bagian |
| K-T08 | To-do diketik manual. Template Paket To-do List (dinamis per tim) hanya untuk mempercepat |
| K-T09 | To-do bisa diedit, dihapus, dan digeser oleh pembuat Tugas dan leader/pemilik, tercatat di riwayat. Tidak ada status "tidak perlu" |
| K-T10 | Staff tidak bisa menambah To-do. Jika perlu, membuat Laporan ke leader timnya |
| K-T11 | Setiap Tugas otomatis diakhiri **To-do QC** (terkunci di urutan terakhir), di-approve leader tim. Leader boleh meng-QC Tugas yang ia kerjakan sendiri |
| K-T12 | QC di-approve → Tugas tertutup otomatis. Pekerjaan setelah QC dibuat sebagai Tugas baru |
| K-T13 | QC gagal → leader membuka kembali To-do tertentu dengan catatan revisi, PIC mendapat notifikasi, jumlah revisi per To-do tercatat |
| K-T14 | Urutan pengerjaan To-do bebas |
| K-T15 | Leader boleh mengubah DL. Staff hanya melihat tugasnya sendiri |
| K-T16 | Pemetaan tim: Pemilik hardcode (direvisi K-T72); Tim = free text; Leader = 1 nama pengguna Jubelio; Staff = 1 atau lebih nama pengguna Jubelio |
| K-T17 | Navigasi — Seksi: **Penugasan**; Menu: **Penugasan**; Sub-menu: **Laporan** (pekerjaan lepas, tidak berulang, tidak terstruktur), **Penugasan** (pekerjaan mengikat, tidak rutin tapi berulang, terstruktur), **Pemetaan tim** (bagan sederhana), **Template to-do list** (template paket tugas) |
| K-T18 | Prinsip: fitur tetap sederhana demi biaya development dan transisi karyawan |
| K-T19 | Hanya pemilik yang bisa mengatur Pemetaan tim |
| K-T20 | Rangkap tim: satu orang hanya boleh menjadi leader di 1 tim; staff boleh berada di lebih dari 1 tim; leader satu tim boleh menjadi staff di tim lain |
| K-T32 | Program dibuat oleh pemilik atau leader. Status: Aktif, Selesai, Dibatalkan. Ditutup manual oleh leader |
| K-T33 | Tugas dibuat oleh pemilik atau leader. Staff tidak bisa membuat Tugas |
| K-T34 | PIC To-do harus anggota tim pemilik Program |
| K-T35 | DL To-do wajib, berupa tanggal tanpa jam |
| K-T36 | Staff melihat seluruh Tugas yang berisi To-do miliknya, tapi hanya bisa mencentang To-do miliknya |
| K-T37 | PIC boleh membatalkan centang selama QC belum di-approve |
| K-T38 | Staff yang keluar atau berganti posisi wajib menyelesaikan tugasnya lewat handover. Jika tidak memungkinkan, leader mengalihkan ke staff lain; pemilik bisa mengalihkan ke leader atau staff lain |
| K-T39 | Template Paket To-do hanya berisi Nama dan daftar To-do. Arahan, PIC, dan DL diisi saat template dipakai. Dikelola hanya oleh leader tim (pemilik tidak bisa) |
| K-T40 | Notifikasi hanya di dalam aplikasi (ops2 / SAFAR OPS 2) |
| K-T44 | Tidak ada pemicu otomatis. Serah terima barang ke tim produk memakai Laporan dan CC |
| K-T45 | Aturan tenggat 2 hari setelah penerimaan gudang tidak diakomodasi dan tidak dibahas lagi |
| K-T46 | To-do tidak punya lampiran/bukti. QC dilakukan manual oleh leader |
| K-T47 | Tidak ada halaman pemantauan khusus. Pemantauan mengandalkan progress bar |
| K-T48 | To-do yang lewat DL dan belum dicentang berlabel merah **"Terlambat"**. Kartu Tugas menampilkan jumlahnya (misalnya "2 to-do terlambat"). Program menampilkan "Ada tugas yang memiliki to-do terlambat" |
| K-T49 | Tugas dan Program tidak punya DL, cukup menampilkan tanggal pembuatan |

### 4b. Laporan

| Kode | Keputusan |
|---|---|
| K-T02 | **Laporan**: siapa pun ke siapa pun, pengganti grup WA. Staff melapor ke leader; hal ke pemilik juga lewat Laporan |
| K-T03 (revisi) | Status Laporan hanya 4: **Terkirim, Ditindaklanjuti, Ditolak, Selesai** |
| K-T04 | Tugas bisa dilampiri No. Laporan (opsional, dropdown search). Isi laporan dilihat lewat popup modal |
| K-T05 | Laporan yang sudah dilampirkan ke Tugas menampilkan "Sudah ada Tugas: [nama Tugas]" |
| K-T06 | Pekerjaan lepas cukup lewat Laporan, tidak menjadi Tugas |
| K-T21 | Laporan ditujukan dengan tag orang tertentu. Yang bisa melihat: pelapor, orang yang ditag, leader-nya, peserta CC, dan pemilik |
| K-T22 | Jenis laporan: Temuan Kasus, Permintaan, Pertanyaan, Umum |
| K-T23 | Isi laporan: Judul, Jenis, Isi, foto opsional, Penerima |
| K-T24 | Respon laporan berbentuk chat seperti WA (teks dan foto) |
| K-T25 | Menolak laporan wajib menulis alasan |
| K-T26 | Nomor laporan: LAP-YYMM-001 |
| K-T27 | Laporan menampilkan umur relatif ("1 hari yang lalu"). Penanda laporan menggantung menyusul |
| K-T28 | Penerima mengubah status ke Ditindaklanjuti atau Ditolak. Pelapor menandai Selesai. Laporan yang dilampirkan ke Tugas otomatis menjadi Ditindaklanjuti |
| K-T29 | Fitur Teruskan wajib di tahap 1 |
| K-T30 | Leader bisa melihat, merespon, dan meneruskan laporan untuk staffnya, di tab terpisah dari laporannya sendiri |
| K-T31 | Laporan tidak bisa diedit, dihapus, atau dibuka kembali. Koreksi lewat chat. Masalah yang muncul lagi dibuat sebagai laporan baru |
| K-T41 | **Teruskan** (memindahkan penanggung jawab; oleh penerima, leader penerima, atau pemilik) dan **CC** (menambah peserta yang bisa melihat dan chat; oleh pelapor atau penerima) masuk tahap 1. Tab: Laporan saya, Laporan tim (leader), Semua laporan (pemilik) |
| K-T42 | Chat memakai 2 tanda: abu = terkirim, biru = dibaca (saat penerima membuka). Tidak realtime, diperbarui dengan refresh. *Tanda baca direvisi K-T78* |
| K-T43 | Foto dikompres otomatis, maksimal 5 per pesan, disimpan di penyimpanan milik ops2 (detail teknis oleh developer) |


### 4c. Asumsi mockup yang disetujui (2 November 2026)

| Kode | Keputusan |
|---|---|
| K-T50 | Kode error berprefiks **PNG-** dengan modul LAP, PRG, TGS, TDO, QC, TIM, TPL |
| K-T51 | Chat ditutup setelah laporan Selesai atau Ditolak |
| K-T52 | Saat laporan diteruskan, penerima lama otomatis menjadi CC |
| K-T53 | Program hanya bisa ditutup jika semua tugas selesai; tutup dan batal oleh leader tim; batal mengunci tugas yang berjalan |
| K-T54 | Arahan to-do opsional; PIC dan DL wajib |
| K-T55 | DL tidak boleh tanggal yang sudah lewat saat to-do dibuat/diubah |
| K-T56 | Leader penerima dan peserta CC boleh ikut chat; hanya penerima yang mengubah status |

### 4d. Keputusan 4 November 2026 (tampilan, pemilik, akun)

| Kode | Keputusan |
|---|---|
| K-T70 | Warna tim dari palet tetap 8 warna: Ungu, Toska, Biru, Hijau, Indigo, Zaitun, Cokelat, Abu. Oranye dan Merah muda tidak dipakai karena mirip label DL. Warna tim tidak boleh sama, sehingga maksimal 8 tim |
| K-T71 | Label DL dihitung dengan hari kalender. Setiap baris to-do menampilkan labelnya sendiri. Kartu tugas dan kartu program hanya menampilkan tingkat paling mendesak. To-do yang sudah dicentang dan To-do QC tidak diberi label |
| K-T72 | Revisi K-T16: 4 akun pemilik di-hardcode berdasarkan email dan semuanya setara (selaras dengan K-A59 di Absensi). Dua akun Chaesar tampil sebagai dua pengguna terpisah. Pemilik tidak bisa dijadikan leader atau staff |
| K-T73 | Login memakai akun Jubelio, sama dengan Absensi (K-A03). Keempat email pemilik sudah terdaftar di Jubelio |
| K-T74 | Nama tampilan ops2: **SAFAR OPS 2**. Tema oranye berlaku untuk semua aplikasi Velora (Penugasan, Absensi & Payroll); Operation lama tetap kuning/emas. Label DL: H-3 dan H-2 kuning, H-1 dan Hari ini merah bata, Terlambat merah penuh dengan tulisan putih |
| K-T75 | Filter Laporan saat pertama dibuka: **Semua** |

Catatan mockup: mockup uji memakai 1 akun pemilik saja; kesetaraan 4 pemilik tidak diuji di mockup.

### Contoh penerapan

```
Program: PO-123 Barang Baru (Tim Produk)
├─ Tugas: SKU-1 Data & Foto      → To-do staff ... → QC leader ✓ tertutup
├─ Tugas: SKU-2 Data & Foto      → ... → QC leader
└─ Tugas: Upload MP SKU-1, SKU-2 → To-do leader ... → QC leader
```

## 5. Belum dibahas / menunggu

| Kode | Poin | Status |
|---|---|---|
| T-06 | Titipan PRD: palet warna tim kemungkinan ditambah jika jumlah tim lebih dari 8, waktunya belum bisa ditentukan. Developer diminta menyimpan palet sebagai satu daftar yang mudah ditambah | Masuk PRD |

T-01, T-04, dan T-05 selesai diputuskan (K-T70–K-T75).

## 6. Dokumen

- `02-mockup-fitur-penugasan.html` — mockup uji v1.9 + 57 skenario uji (arsip tahap 4)
- `02-mockup-final-fitur-penugasan.html` — mockup final tanpa skenario uji
- `02-PRD-fitur-penugasan.md` / `.html` — PRD v2.0
- Berikutnya: skenario uji final per role (Pemilik, Leader, Staff), lalu draf SOP
- PRD v1.0–v1.6 dan paket SOP draf yang sudah terbit **tidak dipakai**. PRD (.html + .md), mockup final, draf SOP (.html), dan skenario uji final per role (Pemilik, Leader, Staff, file terpisah) disusun setelah Chaesar menyatakan testing selesai
- `02-sop-penugasan.md` — bahan SOP mentah

## 7. Perubahan rencana

**3 November 2026 (dikoreksi 4 November 2026)**
- Penugasan dibangun di aplikasi baru ops2.saefulaskar.com (SAFAR OPS 2) oleh tim dev Velora, dengan tech stack Next.js, Tailwind CSS + shadcn/ui (Radix UI), tRPC, Prisma, PostgreSQL. Operation lama (operation.saefulaskar.com, Syahrul & Muadz) tidak dibangun ulang.
- Di ops2, menu yang dikembangkan saat ini hanya Penugasan.

**4 November 2026**
- Keputusan melewati tahap 4 (2 November 2026) dibatalkan. Kembali ke tahap 4: mockup v1.7 diuji dulu, dokumen tahap 5 disusun setelah testing selesai.

## 8. Hasil uji mockup v1.1 (3 November 2026)

36 skenario lulus. P-06 gagal karena laporan ujinya sudah ditolak di P-04 (urutan data uji, bukan cacat fitur); di v1.2 P-06 memakai laporan uji tersendiri (LAP-2610-008).

| Kode | Keputusan dari catatan uji |
|---|---|
| K-T57 | Lonceng notifikasi tampil di semua halaman Penugasan, bukan hanya beranda |
| K-T58 | Urutan filter status Laporan: Terkirim, Ditindaklanjuti, Semua, Selesai, Ditolak |
| K-T59 | Catatan revisi QC dibuat per to-do |
| K-T60 | Setiap tim punya warna; semua tulisan yang mengandung nama tim tampil sebagai label berwarna |
| K-T61 | Label "Ada to-do yang perlu dialihkan" juga tampil di kartu program |
| K-T62 | Daftar program punya filter Aktif, Selesai, Dibatalkan |
| K-T63 | Kartu program dan kartu tugas dibuat lebih ringkas |
| K-T64 | Label program dipersingkat menjadi "Ada tugas dengan to-do terlambat" dan "Ada to-do perlu dialihkan" |
| K-T65 | Label DL bertingkat sebelum Terlambat: H-3, H-2, H-1, Hari ini, lalu Terlambat |
| K-T66 | Notifikasi dipisah menjadi Laporan dan Penugasan (bentuk tab diganti K-T68) |
| K-T67 | Penyingkatan label disetujui: baris QC "Menunggu to-do selesai"; "Lolos QC"; progres "[n]/[total] langkah"; hub "Pekerjaan lepas" dan "Pekerjaan terstruktur"; arah laporan "Zarkasih → saya" / "Saya → Kartika"; "Dilihat sebagai leader [nama]"; baris Tugas di detail laporan cukup nama tugas; "Ada to-do perlu dialihkan" |
| K-T68 | Notifikasi berupa satu daftar berkelompok dengan judul dan garis pemisah: LAPORAN (n) di atas, PENUGASAN (n) di bawah; kelompok kosong tidak tampil; terbaru di atas; satu tombol "Bersihkan semua" dengan konfirmasi |
| K-T69 | Geser kanan/kiri = tandai dibaca dengan latar "Dibaca"; notifikasi dibaca hilang dari daftar; tombol Batalkan 2,5 detik; ketuk = buka dan hapus dari daftar; angka lonceng = jumlah notifikasi di daftar; antisipasi gestur back di tepi layar |

## 9. Hasil uji mockup v1.7 (4 November 2026)

Seluruh 49 skenario lulus. Catatan uji P-01 dan P-02 menjadi revisi berikut (mockup v1.8, 5 skenario uji baru: P-28 sampai P-31 dan N-23; P-01 dan P-02 disesuaikan).

| Kode | Keputusan |
|---|---|
| K-T76 | Foto di form laporan dan di chat bisa diketuk untuk dibuka sebagai popup layar penuh. Kalau lebih dari satu foto, bisa digeser kiri/kanan. Ditutup dengan tombol X atau ketuk di luar foto |
| K-T77 | Di daftar notifikasi, laporan yang diterima sebagai CC diberi label abu-abu "CC". Laporan yang ditujukan langsung tidak diberi label |
| K-T78 | Revisi K-T42: di bawah setiap pesan chat tampil inisial peserta laporan (pelapor, penerima, CC) yang sudah membaca. Leader penerima dan pemilik yang hanya melihat tidak ditampilkan. Centang abu = belum semua peserta membaca; centang biru = semua peserta sudah membaca |
| K-T79 | Aturan inisial: huruf pertama tiap kata, maksimal 2 huruf (Kartika → K, Chaesar Syaefuddin → CS, Chaesar 2 → C2). Jika dua orang berinisial sama, keduanya memakai 2 huruf pertama nama (Ka, Ku). Untuk sementara berlaku di semua tampilan inisial di ops2 |

| K-T80 | Tampilan peran dan tim pengguna (header beranda, subjudul halaman Laporan) memakai label per tim berisi "Peran · Tim" (misalnya "Staff · Tim Produk", "Leader · Tim Produk") dengan titik warna tim, berlatar putih agar kontras di header oranye. Label boleh turun baris. Dipilih dari 3 opsi (opsi B) |

Perbaikan alat uji (bukan fitur): tombol Reset data dan Salin hasil uji tidak lagi memakai jendela bawaan browser yang diblokir di pratinjau.

## 10. Hasil uji mockup v1.8 (4 November 2026)

Skenario yang diuji (P-01, P-02, P-28 sampai P-31, N-23) semuanya lulus. Revisi masuk mockup v1.9 dengan skenario baru P-32, P-33, N-24 (P-14 disesuaikan).

| Kode | Keputusan |
|---|---|
| K-T81 | Kolom cari di daftar Laporan, hanya mencari no. laporan dan judul, tidak membedakan huruf besar/kecil, hasil langsung tampil saat mengetik. Pencarian berjalan di dalam tab dan filter status yang aktif. Kolom cari kosong kembali saat menu Laporan dibuka ulang. Pencarian isi laporan/chat dan kolom cari di daftar Program/Tugas: *Bisa menyusul* |
| K-T82 | Standar ukuran komponen ops2 = ukuran bawaan shadcn/ui: tombol utama dan isian/dropdown 36 px (sudut 8); tombol kecil dan tab 32 px; filter status 26 px; header ±52 px (tombol kembali 32 px); kartu jarak dalam 12 px (sudut 12); header beranda dipendekkan. Area ketuk minimal 44 px |
| K-T83 | Revisi K-T26: nomor laporan tanpa "LAP-", format YYMM-urut (mis. 2610-001). Kode error tetap PNG-LAP |

K-T82 dan K-T83 tidak diuji di mockup (perubahan tampilan). Testing dinyatakan selesai dan lulus oleh Chaesar, 4 November 2026.

