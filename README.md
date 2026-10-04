# My Atlas

Atlas anatomi React dengan backend Express dan SQLite. Memerlukan **Node.js 24 atau lebih baru**.

## Menjalankan lokal

```powershell
npm.cmd ci
npm.cmd run dev:local
```

Buka http://localhost:3030. Perintah ini menjalankan Vite pada port 3030 dan API pada 3031. Kedua proses berhenti bersama. Server mendengarkan localhost secara default.

Saat pertama kali database dibuat, username `admin` dan `dosen` mendapatkan kata sandi acak. Baca `data/bootstrap-accounts.txt` di komputer ini. Berkas tersebut tidak masuk Git. Kata sandi lama yang tertanam di frontend sudah tidak berlaku. Admin dapat membuat akun dosen dan mahasiswa melalui `/admin/pengguna`.

Untuk build dengan satu server:

```powershell
npm.cmd run build
npm.cmd run serve
```

Frontend dan API kemudian dilayani pada http://127.0.0.1:3030. Jangan menjalankan Vite bersamaan pada port yang sama. `vite preview` hanya pratinjau frontend; gunakan `serve` untuk aplikasi lengkap.

## Pengaturan dan hak akses

- `/atlas/<id>`: materi yang dapat dibaca akun tersebut.
- `/kelola`: materi milik dosen tersebut. Tambahan materi mulai sebagai draf.
- `/admin/materi`, `/admin/pengguna`, `/admin/institusi`, `/admin/kurikulum`, `/admin/cadangan`, `/admin/pengaturan`: administrasi.
- `/admin/materi/<id>/edit` dan `/kelola/materi/<id>/edit`: editor, termasuk refresh dan tombol kembali browser.
- Admin dapat mengubah semua materi. Dosen hanya dapat mengubah dan menghapus materi miliknya. Server menentukan pemilik saat membuat materi; perubahan ownerId dari browser diabaikan.
- Mahasiswa membaca materi terbit. Tamu hanya mendapat materi terbit yang diizinkan untuk publik. Draf hanya dibaca pemilik dan admin.
- Logo dan nama aplikasi diatur melalui Pengaturan aplikasi. Logo PNG/JPEG/WebP maksimal 1 MB; berlaku pada header, judul tab dan identitas pada panel informasi.

Sesi memakai cookie HttpOnly dengan masa berlaku 8 jam; kata sandi disimpan sebagai hash scrypt bersalt. Perubahan role/kata sandi mencabut sesi akun tersebut. Semua perubahan menggunakan pemeriksaan sesi di server. Simpan materi/pin menggunakan versi agar perubahan akun lain tidak tertimpa diam-diam.

## Data, backup, dan gambar

`data/atlas.sqlite` menyimpan akun, materi, media, pengaturan, sesi, dan audit. Pertahankan direktori ini di server atau volume Docker. Materi bawaan dimiliki admin. Data IndexedDB versi lama di browser tidak dihapus dan tidak diimpor otomatis; migrasi materi pribadi lama memerlukan ekspor serta pemetaan media/pemilik secara terpisah.

Admin dapat mengunduh backup SQLite lengkap melalui `/admin/cadangan`. Backup memuat akun dan media; simpan privat. Untuk pemulihan: hentikan server, cadangkan direktori data yang lama, gunakan backup sebagai `atlas.sqlite` dalam direktori data baru, lalu jalankan server dengan DATA_DIR menunjuk direktori baru. Direktori baru mencegah pencampuran berkas WAL/SHM dari database lama. Jangan mengganti database saat server berjalan. JSON dan SQL di UI merupakan ekspor metadata/referensi, bukan backup lengkap media dan akun.

Gambar berada di `public/anatomy`; atribusi dan lisensi berada di `public/anatomy/README.md` dan `sources.json`, serta ditampilkan pada materi. Gambar pengantar diberi keterangan; topik yang belum memiliki gambar relevan memakai indikator belum tersedia. Penanda bawaan lama dihapus karena koordinat tidak terverifikasi terhadap gambar pengganti. Konten dan diagram khusus setiap topik masih memerlukan kurasi dosen.

## Penggunaan bersama

```powershell
docker compose up --build -d
```

Konfigurasi Compose memetakan port ke localhost host dan mempertahankan data dalam volume `atlas-data`. Docker memerlukan Node 24 di image yang sudah disediakan. Build Docker belum diverifikasi di lingkungan ini.

Untuk akses antar perangkat, tempatkan satu server di belakang HTTPS dengan penyimpanan persisten. Set `COOKIE_SECURE=true` setelah HTTPS tersedia; konfigurasi `TRUST_PROXY` hanya untuk alamat proxy yang dipercaya agar pemeriksaan origin memakai protokol yang benar. Jangan membuka Vite untuk penggunaan produksi. Contoh variabel tersedia di `.env.example`. ADMIN_PASSWORD dan LECTURER_PASSWORD hanya dipakai ketika membuat database pertama.

SQLite cocok untuk satu server dengan jumlah pengguna terbatas; beberapa instance membutuhkan rancangan database/storage bersama. Belum ada isolasi tenant antar institusi, reset password mandiri, UI pemindahan pemilik, pemulihan backup melalui UI, maupun autosave editor. Unggahan batas 60 MB menggunakan JSON base64; unggahan besar perlu streaming/object storage pada tahap berikutnya.

## Verifikasi

```powershell
npm.cmd run lint
npm.cmd test
npm.cmd run build
```

Uji server mencakup autentikasi, pembatasan pemilik, draf, konflik versi, akses media, origin, logout, backup dan persistensi setelah restart. Uji aset memeriksa seluruh 87 referensi materi dan 15 berkas sumber lokal.
