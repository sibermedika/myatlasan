# Panduan Lengkap Instalasi & Deployment AnatoVerse
### Pilihan Pemasangan di Cloud (Server/VPS/Docker) atau Localhost (PC/Laptop)

Aplikasi **AnatoVerse - Atlas Anatomi Tubuh Manusia Interaktif** dirancang dengan arsitektur terbuka (*open architecture*) dan modular. Sistem dapat diinstal dan dijalankan secara fleksibel sesuai kebutuhan klien dan institusi:
1. **Localhost PC / Laptop** (Windows, macOS, Linux) untuk penggunaan laboratorium, perkuliahan offline, dan ruang praktikum tanpa internet.
2. **Cloud Container (Docker & Kubernetes)** untuk deployment otomatis di Google Cloud Run, AWS ECS, DigitalOcean, atau Railway.
3. **Cloud VPS / Server Mandiri** (Ubuntu/Debian/CentOS) dengan Node.js, PM2, dan Nginx.
4. **Platform Hosting Statis** (Vercel, Netlify, Cloudflare Pages, Firebase Hosting).

---

## Opsi 1: Pemasangan di Localhost (PC / Laptop Offline)

Aplikasi bekerja 100% offline-first. Semua data organ, deskripsi medis, diagram 2D, dan model 3D disimpan di dalam basis data peramban (**IndexedDB**) tanpa membebani laptop dengan instalasi server SQL eksternal.

### A. Pengguna Windows (1-Klik Jalankan)
1. Ekstrak folder aplikasi ke komputer Anda.
2. Pastikan **Node.js** (versi 18 ke atas) sudah terpasang dari [https://nodejs.org/](https://nodejs.org/).
3. **Klik ganda berkas `run-windows.bat`**.
   - Skrip akan otomatis memeriksa dependensi (`npm install` jika belum ada).
   - Server lokal akan aktif di port **3030**.
   - Peramban web akan otomatis terbuka ke `http://localhost:3030`.

### B. Pengguna Linux & macOS
1. Buka terminal di folder aplikasi.
2. Berikan izin eksekusi skrip (cukup sekali):
   ```bash
   chmod +x run-linux-mac.sh
   ```
3. Jalankan skrip:
   ```bash
   ./run-linux-mac.sh
   ```
4. Buka peramban di `http://localhost:3030`.

### C. Eksekusi Manual via Terminal (Semua OS)
```bash
# 1. Pasang modul dependensi
npm install

# 2. Jalankan server dev lokal di port 3030
npm run dev:windows
# atau jika tanpa membuka peramban otomatis:
npm run dev:local
```

---

## Opsi 2: Pemasangan Cloud Container (Docker & Kubernetes)

Sistem telah dilengkapi dengan berkas **`Dockerfile`** (multi-stage build Node.js + Nginx Alpine) yang sangat ringan (< 40MB) dan **`docker-compose.yml`**.

### A. Jalankan Menggunakan Docker Compose (1-Perintah)
```bash
docker compose up -d
```
Aplikasi langsung aktif dan dapat diakses di:
`http://localhost:3030` (atau `http://<IP-SERVER>:3030`).

Untuk menghentikan container:
```bash
docker compose down
```

### B. Build Docker Image Mandiri
```bash
# 1. Build image
docker build -t anatoverse .

# 2. Jalankan container di port 3030 (atau port 80)
docker run -d -p 3030:80 --name anatoverse-app anatoverse

# 3. Cek status kesehatan aplikasi
curl http://localhost:3030/health
```

### C. Deploy ke Google Cloud Run / AWS App Runner / Railway
1. Hubungkan repositori Git ke penyedia Cloud Anda.
2. Pilih deployment berbasis **Dockerfile**.
3. Sistem cloud akan otomatis melakukan build dan mengekspos aplikasi dengan sertifikat HTTPS SSL gratis.

---

## Opsi 3: Pemasangan di Cloud VPS (Ubuntu / Debian Linux)

Gunakan metode ini jika klien memiliki Virtual Private Server (VPS) mandiri di DigitalOcean, AWS EC2, GCP Compute Engine, Hetzner, atau Biznet.

### Langkah-langkah:
1. **Pasang Node.js & Git** di VPS:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt install -y nodejs git nginx
   sudo npm install -g pm2
   ```

2. **Klon / Unggah Berkas Aplikasi**:
   ```bash
   cd /var/www
   git clone <URL_REPOSITORI> anatoverse
   cd anatoverse
   ```

3. **Instal Dependensi & Kompilasi**:
   ```bash
   npm install
   npm run build
   ```

4. **Jalankan Server Produksi dengan PM2**:
   ```bash
   # Jalankan server.mjs menggunakan PM2 agar berjalan terus di latar belakang
   pm2 start server.mjs --name anatoverse
   pm2 save
   pm2 startup
   ```
   *Catatan*: Port server dapat diubah dengan menambahkan variabel lingkungan, misalnya: `PORT=8080 pm2 start server.mjs --name anatoverse`.

5. **Endpoint Health Check**:
   Server produksi menyediakan endpoint monitor kesehatan di:
   `http://<IP-SERVER>:3000/api/health`

---

## Opsi 4: Pemasangan di Hosting Statis (Vercel / Netlify / Cloudflare Pages)

Karena aplikasi berbasis SPA (Single Page Application) dengan penyimpanan data lokal di browser (IndexedDB):
1. **Build Perintah**: `npm run build`
2. **Direktori Output**: `dist`
3. **Konfigurasi Single Page Rewrite**:
   - Vercel / Netlify: Arahkan seluruh rute ke `/index.html`.

---

## Konfigurasi Port & Variabel Lingkungan (`.env`)

Tersedia berkas `.env.example` yang dapat disalin menjadi `.env`:
```env
# Port server backend (Default 3000 untuk Cloud, 3030 untuk Localhost)
PORT=3000

# Antarmuka Host (0.0.0.0 agar dapat diakses oleh container dan jaringan luar)
HOST=0.0.0.0

# Port pemetaan container Docker Compose
APP_PORT=3030

# Mode Lingkungan
NODE_ENV=production
```

---

## Format Media 2D & 3D yang Didukung
- **Format 2D**: `.jpg`, `.jpeg`, `.png`, `.webp` (resolusi tinggi).
- **Format 3D**:
  - `.fbx` (Autodesk FBX Loader dengan pencahayaan medis)
  - `.obj` (Berkas Wavefront OBJ tunggal atau paket folder/ZIP berisi `.obj` + `.mtl` + peta tekstur)
  - `.glb` / `.gltf` (Format biner 3D terkompresi)
  - `.3ds` (Format 3D Studio dengan TDSLoader)
- **Embed 2D/3D**: Tautan publik Sketchfab dan Google Drive (`/preview` atau `/view?usp=sharing`).

---

## Kredensial Hak Akses Resmi

Sistem menggunakan 2 peran resmi yang bebas dikustomisasi untuk tiap fakultas kedokteran atau institusi kesehatan:

### 1. Role Admin (Wewenang Master Data)
- **Wewenang**: Mengedit master data anatomi, taksonomi Kurikulum Nasional PAAI 2019, daftar institusi universitas/FK, manajemen akun dosen, serta backup & restore database.
- **Username / ID**: `admin`
- **Kata Sandi**: `Sup3r@dm1n`

### 2. Role Dosen (Wewenang Konten 3D)
- **Wewenang**: Menambah, mengedit, dan menghapus konten 3D anatomi, mengunggah model medis, serta mengelola pin landmark spasial 3D.
- **Username / ID**: `dosen`
- **Kata Sandi**: `dosen123`
- **Profil Default**: **dr. Paijo** (Institusi: *Fakultas Kedokteran*)

---
*AnatoVerse Medika • Platform Terbuka Atlas Anatomi Medis 2D & 3D Standar Kurikulum PAAI 2019*
