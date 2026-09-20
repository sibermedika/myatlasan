@echo off
TITLE Instalasi Dependensi AnatoVerse
color 0B
echo ================================================================
echo     Instalasi Dependensi AnatoVerse untuk Windows
echo ================================================================
echo.
echo Memeriksa Node.js...
node -v
if %errorlevel% neq 0 (
    echo [ERROR] Node.js belum terpasang! Unduh di https://nodejs.org/
    pause
    exit /b
)
echo.
echo Menjalankan npm install...
call npm install
echo.
if %errorlevel% equ 0 (
    echo ================================================================
    echo [SUKSES] Instalasi dependensi selesai!
    echo Anda dapat menjalankan aplikasi dengan mengklik ganda: run-windows.bat
    echo Atau jalankan perintah: npm run dev:windows
    echo ================================================================
) else (
    echo [ERROR] Terjadi kendala saat instalasi.
)
pause
