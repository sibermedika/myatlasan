@echo off
TITLE AnatoVerse Atlas Anatomi - Localhost:3030
color 0A
echo ================================================================
echo     AnatoVerse - Atlas Anatomi Tubuh Manusia Interaktif
echo     Kurikulum Nasional PAAI 2019
echo ================================================================
echo.
echo [1/3] Memeriksa Instalasi Node.js...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js belum terpasang di komputer ini!
    echo Silakan unduh dan pasang Node.js LTS dari: https://nodejs.org/
    echo Setelah instalasi selesai, buka kembali berkas run-windows.bat ini.
    echo.
    pause
    exit /b
)
echo Node.js terdeteksi: 
node -v

echo.
echo [2/3] Memeriksa dependensi modul...
if not exist "node_modules\" (
    echo Direktori node_modules belum ditemukan.
    echo Memulai instalasi dependensi (npm install)...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Gagal menginstal dependensi npm.
        pause
        exit /b
    )
) else (
    echo Modul dependensi sudah tersedia.
)

echo.
echo [3/3] Menjalankan server aplikasi di port 3030...
echo Membuka peramban di http://localhost:3030 ...
echo Tekan CTRL + C di jendela ini untuk menghentikan server.
echo ================================================================
call npm run dev:windows
pause
