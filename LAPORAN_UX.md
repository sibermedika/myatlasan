# Audit UX AnatoVerse

Tanggal: 3 Oktober 2026. Basis: aplikasi lokal dari commit 5dc8432, inspeksi UI desktop sekitar 1077 × 884 dan mobile 390 × 844, serta pembacaan kode. Audit mencakup halaman atlas publik, login, dashboard pengguna/koleksi admin, formulir tambah organ, pencarian, dan drawer mobile. Tidak ada materi yang disimpan atau dihapus. Login admin lokal digunakan untuk inspeksi lalu logout. Semua media, unggahan, dan alur 3D belum diuji menyeluruh.

## Kesimpulan

Prioritas utama adalah memisahkan ruang belajar, ruang pengelolaan materi, dan administrasi. Saat ini fitur pengelolaan ditambahkan pada halaman belajar dan dibuka melalui modal besar. Akibatnya konteks, istilah peran, dan kontrol bercampur. Perbaikan visual akan lebih efektif setelah pembagian tugas ini jelas.

Fondasi yang layak dipertahankan: klasifikasi sistem anatomi, penampil 2D/3D, pin yang terhubung dengan panel informasi, pencarian nama Indonesia/Latin, dan dukungan beberapa media untuk satu materi.

## Temuan dan dampak

| Prioritas | Temuan terverifikasi | Dampak | Perbaikan |
|---|---|---|---|
| P0 | Tombol reset data tersedia untuk guest, memanggil reset tanpa konfirmasi di Navbar | Pengunjung dapat mengembalikan koleksi lokal ke default, termasuk menghilangkan perubahan pada koleksi | Pindah ke Pengaturan admin; batasi izin; jelaskan cakupan dan sediakan backup/konfirmasi |
| P0 | Login admin satu klik tersedia; role/profil tersimpan di localStorage dan autentikasi dilakukan di browser | Pemisahan halaman saja belum memberikan kontrol akses untuk aplikasi multiuser | Pisahkan demo dari penggunaan nyata; gunakan autentikasi dan otorisasi server bila dipakai bersama |
| P1 | Gambar Istilah & Terminologi gagal dimuat; pin tetap muncul bertumpuk pada gambar rusak | Pengguna tidak tahu apakah konten kosong atau aplikasi bermasalah | Status loading/error dengan Coba lagi; sembunyikan pin sampai media siap; periksa sumber gambar |
| P1 | ADMIN/SUPERADMIN tidak konsisten; InfoPanel dan penambahan pin mengecek DOSEN/SUPERADMIN tetapi tidak ADMIN | Admin mendapat kemampuan berbeda tergantung komponen | Tetapkan model peran dan gunakan fungsi izin terpusat |
| P1 | Dashboard akun Admin menampilkan label SUPERADMIN dan dropdown MAHASISWA pada baris Admin | Status akun membingungkan | Satukan label role, nilai dropdown, dan izin; tampilkan role akun yang sebenarnya |
| P1 | Header mobile meluber; pencarian desktop disembunyikan dan tidak tersedia di drawer | Tombol akun/tema sulit dijangkau; pencarian tidak tersedia di ponsel | Header ringkas dan pencarian di katalog/drawer mobile |
| P1 | Form tambah organ memiliki 10 pilihan sistem yang berbeda dari 12 sistem atlas | Materi baru berpotensi masuk kategori yang tidak konsisten | Gunakan satu sumber taksonomi untuk form, katalog, filter, dan admin |
| P1 | Form baru langsung memiliki 3 media contoh, termasuk embed eksternal | Pengguna dapat menyimpan media yang tidak sesuai tanpa sadar | Mulai dari kosong; contoh hanya dimasukkan lewat tindakan eksplisit |
| P2 | Pencarian jantung menghasilkan 2 materi tetapi hanya menampilkan kelompok sistem yang masih tertutup; viewer tetap menampilkan materi lama | Pengguna perlu membuka beberapa tingkat untuk melihat hasil | Tampilkan daftar hasil langsung dengan nama dan jalur kategori; beri jumlah hasil dan keadaan kosong |
| P2 | Banyak teks berukuran 8–12px, judul terpotong, metadata memakai font monospace | Membaca konten dan membedakan hierarki menjadi berat | Teks isi 14–16px; judul 20–24px; metadata sekunder 12–13px; judul dapat membungkus |
| P2 | Informasi kategori, nama, standar, media, dan jumlah pin berulang di beberapa panel | Visual ramai tanpa menambah pemahaman | Satu judul utama, satu breadcrumb, metadata sekunder dilipat |
| P2 | Dashboard berupa modal besar dan form baru dibuka di atasnya | Navigasi kembali, konteks kerja, dan URL tidak jelas | Halaman kelola tersendiri dengan navigasi dan editor materi |
| P2 | Istilah teknis seperti FBX/OBJ, WebGL, SQL Dump, deployment muncul dekat alur pengguna | Pengguna belajar harus memahami istilah pengelolaan | Simpan format di uploader/admin; gunakan label Gambar, Model 3D, Koleksi Institusi |

P0 adalah masalah yang perlu dibereskan sebelum penggunaan bersama. P1 memengaruhi tugas inti. P2 memperbaiki keterbacaan dan efisiensi.

## Pembagian ruang yang disarankan

Tetap satu aplikasi dan satu katalog, dengan layout serta navigasi berbeda:

| Ruang | Pengguna | Menu utama | Tujuan |
|---|---|---|---|
| Atlas / Belajar | Pengunjung dan pengguna pembaca | Cari materi, sistem anatomi, koleksi institusi, bantuan | Menemukan dan memahami materi |
| Kelola Materi | Dosen | Materi saya, tambah materi, media, pratinjau | Menyiapkan materi ajar |
| Administrasi | Admin | Ringkasan, materi, pengguna, institusi, kurikulum, pengaturan | Mengatur katalog dan akses |

Contoh alamat: /atlas, /atlas/:id, /kelola/materi, /kelola/materi/:id/edit, /admin/pengguna, /admin/pengaturan. URL membantu tombol kembali, bookmark, dan berbagi materi. Guard izin tetap diperlukan pada setiap operasi; URL bukan kontrol keamanan.

Untuk versi sederhana: Pengunjung adalah kondisi belum login, Dosen adalah pengelola materi, Admin adalah pengelola keseluruhan. Tambahkan Mahasiswa hanya jika ada kebutuhan akun belajar seperti favorit atau progres. Pertahankan Superadmin hanya jika benar-benar ada administrasi lintas institusi. Bila dosen dibatasi pada materinya sendiri, tambahkan ID pemilik yang stabil; nama/kode dosen saja tidak cukup.

Login cukup identitas dan kata sandi. Sistem menentukan peran dari akun. Pengguna tidak perlu memilih kewenangan terlebih dahulu. Setelah login, dosen/admin melihat ruang kerjanya dan tombol Lihat Atlas; kontrol edit baru tampil di editor.

## Bentuk halaman belajar

Header: logo, pencarian singkat “Cari anatomi…”, Koleksi, akun. Bantuan dan tema masuk menu sekunder. Panduan instalasi masuk dokumentasi admin. Logo membuka atlas, bukan login rahasia.

Desktop lebar dapat mempertahankan tiga area, dengan panel kiri/kanan yang bisa ditutup. Pada layar laptop yang lebih sempit, gunakan dua area dan buka informasi lewat panel. Viewer harus mendapat ruang terbesar. Judul Indonesia tampil utuh, nama Latin berada di bawahnya, dan breadcrumb menjadi informasi sekunder.

Kontrol viewer: Gambar / Model 3D, perbesar, perkecil, atur ulang tampilan, layar penuh. Daftar pin diberi label “Penanda anatomi”; klik penanda membuka deskripsinya. Petunjuk gesture masuk Bantuan, bukan selalu menimpa viewer. Ukuran tombol sentuh sekitar 44px.

Panel informasi: Ringkasan dan Penanda. Ringkasan menampilkan deskripsi serta fungsi; suplai darah, persarafan, dan korelasi klinis dapat dibuka sesuai kebutuhan. Bagian tidak relevan tidak perlu mengulang “Tidak berlaku”. Sumber, kontributor, institusi, dan kurikulum diletakkan di detail materi.

Mobile: header logo + menu/akun, pencarian mudah diakses, viewer, lalu tab informasi. Drawer berisi katalog dan pencarian. Informasi dapat diperluas agar pembaca tidak harus menggulir dalam kotak pendek yang memiliki scroll tersendiri.

## Bentuk pengelolaan materi

Editor memiliki tiga langkah: (1) identitas dan kategori, (2) media dan penanda, (3) deskripsi dan pratinjau. Identitas kontributor/institusi diambil dari akun dan hanya diubah bila berwenang. Mulai dengan media kosong. Format dan cara unggah ditampilkan setelah pengguna memilih jenis media.

Gunakan tombol konsisten: Simpan, Batal, Pratinjau. Bila alur draf/publikasi dibutuhkan, tambahkan status Draf/Terbit dan validasi media sebelum terbit. Ini fitur baru, bukan kemampuan yang sudah tersedia. Tampilkan berhasil/gagal penyimpanan dengan jelas; cegah penutupan editor tanpa pemberitahuan jika ada perubahan belum disimpan.

Admin memakai sidebar stabil. Daftar materi memprioritaskan Nama, Sistem, Kontributor, Status, dan Aksi; detail teknis tersedia setelah membuka materi. Satu tombol Tambah pada tiap halaman cukup. Aksi Hapus dan Reset memiliki konfirmasi yang menyebut objek dan cakupan, serta pemulihan atau backup jika tersedia.

## Arah visual

Gunakan satu aksen teal, latar netral, dan warna status yang konsisten. Hindari memberi warna kuat pada terlalu banyak badge. Font sans-serif untuk konten; monospace hanya untuk data teknis. Jarak antarseksi 16–24px dan ukuran tombol konsisten. Tema terang layak dijadikan kandidat default untuk membaca, dengan dark mode tetap tersedia; pilih final setelah uji pengguna. Hindari perubahan kosmetik besar sebelum alur dipisahkan.

## Urutan implementasi

1. Tetapkan peran, izin, dan satu taksonomi. Pindahkan reset, tutup akses demo untuk penggunaan nyata, dan perbaiki status media gagal.
2. Buat layout Atlas, Kelola Materi, dan Admin dengan navigasi berbeda. Ubah logo/login dan hilangkan kontrol kelola dari atlas.
3. Rapikan header, ukuran teks, judul, pencarian langsung, panel informasi, dan mobile.
4. Sederhanakan editor bertahap, media kosong, pratinjau, validasi, serta feedback penyimpanan.
5. Uji tugas nyata dengan pembaca, dosen, dan admin; baru tambahkan favorit/progres atau workflow publikasi bila diperlukan.

## Kriteria selesai

- Pengunjung tidak melihat kontrol tambah/edit/hapus/reset atau deployment.
- Admin dan dosen selalu mengetahui ruang yang sedang dipakai dan dapat kembali ke atlas.
- Pencarian menampilkan materi yang cocok langsung, termasuk di mobile.
- Tidak ada header yang meluber pada 390px; kontrol akun tetap terjangkau.
- Judul materi terbaca penuh dan teks isi nyaman pada zoom browser 100%.
- Media rusak memiliki pesan dan tindakan pemulihan; pin tidak tampil di atas media gagal.
- Pilihan taksonomi konsisten di katalog, form, dan admin.
- Simpan/gagal/hapus memiliki feedback yang jelas dan cakupan izin yang konsisten.
- Skenario uji: cari dan buka materi, baca satu pin, tambah materi tanpa contoh bawaan, edit materi sendiri, kelola akun, serta pastikan pembaca tidak dapat melakukan operasi admin.

## Batas teknis yang memengaruhi UX

server.mjs melayani aset statis dan healthcheck; penyimpanan materi/pengguna saat ini berada di browser melalui IndexedDB/localStorage. Pada kondisi ini, label multi-institusi belum berarti ada basis data bersama lintas perangkat. Jika ditargetkan sebagai portal bersama, backend akun, basis data, media, dan izin perlu dirancang. Jika ditargetkan sebagai aplikasi mandiri/offline, jelaskan “data tersimpan di perangkat ini” serta sediakan ekspor/impor yang utuh. Keputusan tersebut menentukan desain akun dan pengelolaan institusi.

Rujukan kode: src/App.tsx (layout, state role, handler reset), src/components/Navbar.tsx (header dan reset publik), src/components/LoginModal.tsx (pilihan role dan login cepat), src/components/InfoPanel.tsx dan AnatomyCanvas.tsx (pengecekan izin), src/components/AddOrganModal.tsx (form/taksonomi/media awal), src/components/SuperadminDashboard.tsx (dashboard dan role), src/services/db.ts (autentikasi/persistensi), server.mjs (server statis).
