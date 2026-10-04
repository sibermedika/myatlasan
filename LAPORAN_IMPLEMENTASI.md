# Implementasi UX tahap pertama — 3 Oktober 2026

## Sudah dikerjakan

- Header baru lebih ringkas. Reset data, panduan deployment, pilihan role, serta tombol tambah tidak muncul di halaman belajar. Logo membuka Atlas.
- Atlas dan ruang kerja dipisahkan menggunakan state tampilan. Admin masuk ke Administrasi halaman penuh; dosen masuk ke Kelola Materi. Keduanya bisa kembali ke Atlas.
- Mode belajar menyembunyikan kontrol edit. Pengelola mengaktifkan Edit penanda secara eksplisit untuk mengubah materi/pin melalui viewer.
- Login cukup username/email dan kata sandi. Peran mengikuti akun; login admin/dosen satu klik dan input password bawaan tidak dipakai di alur baru. Pendaftaran akun melalui dialog login lama tidak lagi tersedia; akun dapat dibuat admin.
- Izin konten memakai helper bersama, termasuk ADMIN yang sebelumnya terlewat pada viewer/panel. Handler simpan/hapus/import/reset diberi pemeriksaan peran di klien.
- Reset koleksi dan hapus materi/pin memiliki konfirmasi. Reset hanya untuk admin. Ini kontrol klien, belum otorisasi server.
- Pencarian menampilkan materi langsung, jumlah hasil, dan pesan kosong. Pencarian tersedia di drawer mobile.
- Header mobile diringkas; tombol akun dan tema tetap terjangkau pada lebar 390px.
- Gambar gagal memiliki pesan dan Coba lagi. Penanda tidak ditampilkan selama gambar belum siap.
- Teks isi informasi diperbesar, judul viewer dapat membungkus, fokus keyboard diperjelas. Label menjadi Ringkasan dan Penanda.
- Form baru berisi nol media; simpan membutuhkan setidaknya satu media. Tidak memasukkan gambar contoh sebagai fallback saat simpan.
- Pilihan 12 sistem di form berasal dari data katalog awal. Label Admin dan opsi ADMIN pada dropdown dashboard diperbaiki.
- Notifikasi berhasil/gagal penyimpanan materi ditambahkan.

## Verifikasi

TypeScript (`npm run lint`) dan build produksi berhasil. Pengujian browser: pencarian jantung menampilkan dua materi; login admin membuka Administrasi; form baru memiliki nol media dan 12 sistem; mode edit dapat diaktifkan/diselesaikan; pencarian mobile berfungsi; header muat pada 390 × 844; login dosen membuka Kelola Materi. Setelah pengujian, akun dikeluarkan dan preview dikembalikan ke Atlas publik. Screenshot: UX_AFTER.jpg.

Pengujian ini tidak menyimpan/menghapus koleksi, mengubah password, atau mengunggah model. Seluruh format 3D dan siklus simpan-muat ulang belum diuji. Build masih memperingatkan bundle JavaScript besar (~1,3 MB sebelum gzip).

## Batas tahap ini

Pemisahan ruang sudah berfungsi tetapi belum memakai routing URL. Form masih panjang dan dashboard admin masih memakai tab horizontal. Dosen saat ini mengelola seluruh koleksi, mengikuti kemampuan awal; pembatasan kepemilikan belum diterapkan. Penyimpanan dan autentikasi tetap IndexedDB/localStorage, termasuk mekanisme credential default lama dalam layanan database. Menghilangkan tombol login cepat tidak menjadikannya autentikasi produksi. Gambar eksternal yang rusak belum diganti dengan aset valid. File komponen lama yang tidak digunakan masih ada untuk referensi refactor berikutnya.

Feedback simpan ditambahkan, tetapi state masih diperbarui sebelum penyimpanan selesai; berikutnya ubah alur agar kegagalan menjaga editor tetap terbuka. Fungsi database yang menelan error juga perlu dirapikan sebelum feedback bisa dijamin menyeluruh.

## Rekomendasi berikutnya

1. Validasi dan ganti aset anatomi yang gagal. Gunakan aset lokal/penyimpanan media yang terkelola serta metadata sumber.
2. Pecah editor menjadi Identitas, Media/Penanda, dan Deskripsi/Pratinjau. Tambahkan perlindungan perubahan belum disimpan, validasi sumber media, dan uji simpan-muat ulang.
3. Tambahkan routing Atlas/Kelola/Admin, sidebar admin, panel informasi yang dapat diperluas, dan pencarian/filter pada daftar dosen.
4. Tetapkan model offline atau portal bersama. Untuk portal: backend autentikasi/database/media, pemeriksaan izin server, ID pemilik materi, dan pembatasan institusi.
5. Samakan taksonomi dinamis termasuk subkategori dan preset contoh; saat ini form mengambil sistem dari katalog bawaan, bukan sumber taksonomi yang dapat diubah admin.
6. Pisahkan pemuatan viewer 3D untuk mengurangi bundle awal dan lakukan pengujian unggahan 2D/3D serta akses keyboard/mobile.

Perubahan tersedia lokal di F:\My Atlas dan belum di-commit/push ke GitHub.
