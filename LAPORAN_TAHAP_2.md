# Laporan tahap 2 — 3 Oktober 2026

## Hasil implementasi

Empat pekerjaan yang diminta sudah diimplementasikan dalam checkout lokal. Aplikasi berjalan di http://localhost:3030 dengan API lokal pada port 3031. Perubahan belum dipush ke GitHub.

### Gambar anatomi

- Referensi foto Unsplash pada 87 materi diganti dengan aset lokal. Ada 15 ilustrasi anatomi beratribusi untuk 86 materi dan satu indikator gambar belum tersedia untuk topik forensik.
- Sumber, pembuat, lisensi, dan keterangan cakupan ilustrasi tampil pada materi. Daftar sumber lengkap ada di `public/anatomy/README.md` dan `sources.json`.
- Penanda bawaan lama dihapus karena posisinya tidak dapat dipercaya pada gambar pengganti. Gambar umum diberi keterangan agar tidak dianggap diagram khusus setiap topik.
- Gambar memiliki status memuat, pesan gagal, dan tombol mencoba kembali. Pratinjau gambar menyesuaikan tinggi panel.

### Editor dan penyimpanan

- Editor dibagi menjadi Identitas, Media, Isi & akses, dan Pratinjau. Pratinjau memakai komponen penampil materi sebenarnya.
- Materi baru dimulai sebagai draf; pengelola dapat memilih publikasi. Upload media disimpan di backend dan memakai URL persisten.
- Tombol/form dikunci saat penyimpanan. Editor tetap terbuka ketika gagal; perubahan tidak dianggap tersimpan sebelum server mengonfirmasi.
- ID materi baru tetap selama percobaan ulang. Jika koneksi terputus setelah server menyimpan, klien membaca ulang hasil untuk menghindari duplikasi.
- Pemeriksaan versi mencegah perubahan lama menimpa revisi baru. Editor menyediakan muat ulang versi server dan konfirmasi dalam aplikasi ketika membuang perubahan.
- Belum ada autosave atau riwayat revisi yang dapat dipulihkan melalui UI.

### Navigasi dan identitas aplikasi

- Atlas, ruang dosen, tab admin, dan editor memiliki URL sendiri. Tautan editor dapat dibuka langsung dan dipulihkan saat refresh.
- Admin: `/admin/materi`, `/admin/pengguna`, `/admin/institusi`, `/admin/kurikulum`, `/admin/cadangan`, `/admin/pengaturan`.
- Dosen memiliki ruang `/kelola` dengan daftar materi miliknya. Kendali edit hanya ditawarkan pada materi yang boleh diedit.
- Nama aplikasi, deskripsi, dan logo dapat diubah di pengaturan admin. Identitas tersimpan di server dan digunakan pada header serta judul browser.

### Backend dan penggunaan bersama

- Express + SQLite menyimpan akun, sesi, materi, media, pengaturan, serta audit perubahan. Data lokal berada dalam direktori `data` yang diabaikan Git.
- Password di-hash; sesi memakai cookie HttpOnly. Role dan kepemilikan diperiksa server pada setiap permintaan, sehingga mengganti state browser tidak memberikan hak admin.
- Dosen hanya dapat mengubah/menghapus materi miliknya. Admin dapat mengelola semua materi. Draf hanya dapat dibaca pemilik/admin; pengguna biasa membaca materi terbit sesuai aksesnya.
- Pemeriksaan kepemilikan juga berlaku pada media, termasuk percobaan memakai URL media pribadi dosen lain.
- Backup SQLite lengkap tersedia bagi admin; mencakup media dan akun. Ekspor JSON/SQL diberi keterangan sebagai metadata/referensi.
- Konfigurasi produksi Node 24, Docker, volume persisten, variabel lingkungan, dan panduan HTTPS tersedia di README.

## Verifikasi

- `npm.cmd run lint`: lulus.
- `npm.cmd test`: 3 pengujian lulus. Mencakup autentikasi, draf, kepemilikan dua dosen, akses media, konflik revisi, backup, restart, seluruh referensi gambar, serta kehilangan respons sesudah penyimpanan.
- `npm.cmd run build`: lulus. Masih ada peringatan ukuran bundle: sekitar 550 KB untuk aplikasi utama dan 773 KB untuk modul 3D; modul 3D dimuat terpisah.
- Pemeriksaan browser sebelumnya mengonfirmasi penyimpanan, pesan konflik, refresh URL editor, pengaturan, dan semua 15 gambar berhasil dimuat. Pemeriksaan akhir mengonfirmasi URL langsung admin/editor dan tampilan empat tahap.
- Interaksi klik browser otomatis pada pemeriksaan terakhir terhambat setelah dialog konfirmasi browser lama macet. Konfirmasi tutup/muat ulang editor telah diganti dengan dialog dalam aplikasi; interaksi dialog pengganti masih perlu uji manual. Screenshot keadaan akhir ada di `EDITOR_PHASE2.png`.
- Docker belum diuji: executable Docker tidak tersedia di lingkungan ini. Alur upload 3D dengan model nyata dan pengujian beban juga belum dilakukan.

## Batasan dan prioritas berikutnya

1. **Kurasi konten:** diagram khusus per topik, penanda yang diperiksa dosen, serta sumber materi klinis. Saat ini 86 topik memakai 15 ilustrasi pengantar, bukan 86 diagram berbeda.
2. **Migrasi data lama:** data IndexedDB/localStorage lama tidak dihapus, tetapi tidak otomatis dimasukkan ke backend. Buat alur impor media dan pemetaan pemilik jika ada materi lama yang perlu dipertahankan.
3. **Pemakaian bersama:** siapkan satu server HTTPS, cookie Secure, backup berkala, dan uji pemulihan. SQLite saat ini ditujukan untuk satu instance; belum ada isolasi tenant antar kampus.
4. **Kenyamanan editor:** autosave draf, riwayat revisi, validasi gambar dengan decoding, navigasi keyboard/focus dialog, dan pengujian mobile menyeluruh.
5. **Operasional:** upload streaming/object storage untuk media besar, pembersihan media tak terpakai, UI transfer kepemilikan, reset password mandiri, dan optimasi bundle 3D.

Panduan menjalankan, akun bootstrap lokal, backup, serta konfigurasi produksi tersedia di `README.md`. Password lokal berada dalam `data/bootstrap-accounts.txt`; berkas tersebut tidak masuk Git.
