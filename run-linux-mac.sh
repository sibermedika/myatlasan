#!/usr/bin/env bash
# ================================================================
# AnatoVerse - Atlas Anatomi Tubuh Manusia Interaktif
# Skrip Eksekusi Localhost (Linux & macOS) - Port 3030
# ================================================================

echo "================================================================"
echo "    AnatoVerse - Atlas Anatomi Tubuh Manusia Interaktif"
echo "    Localhost Runner (Linux / macOS)"
echo "================================================================"
echo ""

echo "[1/3] Memeriksa instalasi Node.js..."
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js belum terpasang di sistem ini!"
    echo "Silakan pasang Node.js LTS (v18+) via https://nodejs.org/ atau package manager sistem Anda."
    exit 1
fi

echo "Node.js terdeteksi: $(node -v)"
echo ""

echo "[2/3] Memeriksa modul dependensi (node_modules)..."
if [ ! -d "node_modules" ]; then
    echo "Direktori node_modules belum ditemukan. Mengunduh dependensi (npm install)..."
    npm install
    if [ $? -ne 0 ]; then
        echo "[ERROR] Gagal menginstal paket dependensi."
        exit 1
    fi
else
    echo "Modul dependensi sudah terpasang."
fi

echo ""
echo "[3/3] Menjalankan server aplikasi di http://localhost:3030 ..."
echo "Tekan CTRL + C untuk menghentikan server."
echo "================================================================"

npm run dev:windows
