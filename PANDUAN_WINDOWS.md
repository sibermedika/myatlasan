# Panduan Instalasi & Menjalankan AnatoVerse di Localhost Windows (Port 3030)

Aplikasi **AnatoVerse - Atlas Anatomi Tubuh Manusia Interaktif** dirancang agar dapat diinstal dan dijalankan secara mandiri pada Laptop / PC Windows secara offline atau jaringan lokal di port `3030`.

---

## 1. Persyaratan Sistem
1. **Sistem Operasi**: Windows 10 atau Windows 11 (64-bit).
2. **Node.js**: Versi LTS 18 atau 20 ke atas (dapat diunduh gratis di [https://nodejs.org/](https://nodejs.org/)).
3. **Peramban Web**: Google Chrome, Microsoft Edge, Mozilla Firefox, atau Opera terbaru dengan dukungan WebGL 2.0.

---

## 2. Cara Menjalankan Cepat (1-Klik via Batch File)
1. Ekstrak seluruh folder proyek ini ke direktori laptop Anda (misal: `D:\AnatoVerse\` atau `C:\Proyek\AnatoVerse\`).
2. Klik ganda pada berkas **`run-windows.bat`**.
3. Skrip otomatis memeriksa Node.js, menginstal dependensi jika belum ada, dan langsung membuka peramban di alamat:
   ```
   http://localhost:3030
   ```

---

## 3. Cara Menjalankan Manual via Command Prompt / PowerShell
Jika Anda lebih suka menjalankan via terminal:
1. Buka **Command Prompt (cmd)** atau **PowerShell**.
2. Masuk ke direktori proyek:
   ```cmd
   cd D:\AnatoVerse
   ```
3. Instal dependensi modul (hanya perlu dijalankan satu kali):
   ```cmd
   npm install
   ```
4. Jalankan aplikasi di port **3030**:
   ```cmd
   npm run dev:windows
   ```
   *(atau `npm run dev:local`)*
5. Buka peramban di `http://localhost:3030`.

---

## 4. Basis Data Ringan & Format Berkas yang Didukung
Aplikasi menggunakan sistem basis data **IndexedDB** bawaan peramban yang sangat ringan, tanpa memerlukan instalasi server database eksternal seperti MySQL atau PostgreSQL:
- **Format 2D**: `.jpg`, `.jpeg`, `.png`, `.webp`.
- **Format 3D**:
  - `.fbx` (Autodesk FBX Loader)
  - `.obj` (Wavefront OBJ tunggal atau paket Folder/ZIP berisi `.obj` + `.mtl` + peta tekstur/kontur)
  - `.glb` / `.gltf` (GL Transmission Format terkompresi)
  - `.3ds` (3D Studio TDSLoader)
- **Fitur Embed 2D / 3D**:
  - **Sketchfab 3D**: Cukup tempel link model atau URL embed Sketchfab.
  - **Google Drive**: Mendukung link berbagi Google Drive publik (`/preview` atau `/view?usp=sharing`).

---

## 5. Hak Akses Akun Pengguna (Role-Based Access Control)
Hanya terdapat dua role dalam sistem:

### 1. **Role Admin**
- **Wewenang**: Mengelola seluruh **Master Data** anatomi, taksonomi kurikulum nasional PAAI 2019, daftar sistem organ, institusi fakultas kedokteran, akun pengguna/dosen, serta ekspor/impor dan reset basis data.
- **Kredensial Default**:
  - Username / ID: `admin` (atau `superadmin`)
  - Kata Sandi: `Sup3r@dm1n` (atau `admin123`)

### 2. **Role Dosen**
- **Wewenang**: **Menambah**, **mengedit**, dan **menghapus** konten 3D anatomi, mengunggah model 3D (FBX, OBJ, GLB, 3DS) serta paket folder kontur, mengatur pin landmark spasial 3D, dan memasukkan korelasi klinis.
- **Kredensial Default**:
  - Username / ID: `dosen` (atau `dosen-001`)
  - Kata Sandi: `dosen123`
  - Nama Profil: **dr. Paijo** (Institusi: Fakultas Kedokteran)
  
> **Catatan Fleksibilitas Multi-Institusi**: Aplikasi ini bebas digunakan dan kredensial/institusi dapat dikustomisasi mandiri untuk setiap universitas, fakultas kedokteran, rumah sakit pendidikan, maupun institusi kesehatan lainnya melalui menu Admin Master Data atau pendaftaran dosen baru.
