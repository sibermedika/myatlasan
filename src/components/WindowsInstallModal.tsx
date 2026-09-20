import React, { useState } from 'react';
import { 
  X, 
  Monitor, 
  Terminal, 
  Copy, 
  Check, 
  Layers, 
  Database, 
  ShieldCheck, 
  Crown, 
  Server,
  Cloud,
  Box,
  CheckCircle2,
  FileCode,
  Globe,
  HardDrive
} from 'lucide-react';

interface WindowsInstallModalProps {
  onClose: () => void;
  theme: 'dark' | 'light';
}

export default function WindowsInstallModal({
  onClose,
  theme
}: WindowsInstallModalProps) {
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState<'LOCAL' | 'DOCKER' | 'CLOUD' | 'SPECS'>('LOCAL');
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const localSnippets = [
    { id: 'w1', title: '1-Klik Windows (Rekomendasi Laptop/PC Windows)', cmd: 'run-windows.bat' },
    { id: 'l1', title: '1-Klik Linux / macOS', cmd: 'chmod +x run-linux-mac.sh && ./run-linux-mac.sh' },
    { id: 'm1', title: 'Terminal Manual: Instal Dependensi', cmd: 'npm install' },
    { id: 'm2', title: 'Terminal Manual: Jalankan Localhost Port 3030', cmd: 'npm run dev:windows' },
  ];

  const dockerSnippets = [
    { id: 'd1', title: 'Docker Compose (1-Perintah Langsung Jalan)', cmd: 'docker compose up -d' },
    { id: 'd2', title: 'Build Docker Image Mandiri', cmd: 'docker build -t anatoverse .' },
    { id: 'd3', title: 'Jalankan Container di Port 3030', cmd: 'docker run -d -p 3030:80 --name anatoverse anatoverse' },
    { id: 'd4', title: 'Periksa Status & Healthcheck', cmd: 'curl http://localhost:3030/health' },
  ];

  const cloudSnippets = [
    { id: 'c1', title: 'Build Berkas Produksi', cmd: 'npm run build' },
    { id: 'c2', title: 'Jalankan Server Node.js Produksi (server.mjs)', cmd: 'npm run serve' },
    { id: 'c3', title: 'Deploy ke Cloud Run / VPS dengan Port Kustom', cmd: 'PORT=8080 npm run serve' },
    { id: 'c4', title: 'Hosting Statis (Vercel/Netlify/Cloudflare)', cmd: 'Deploy folder dist/ hasil "npm run build"' },
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-3 sm:p-4 backdrop-blur-sm animate-fade-in"
      id="install-deployment-modal"
    >
      <div 
        className={`relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-2xl shadow-2xl border overflow-hidden transition-all ${
          isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between border-b px-5 py-3.5 shrink-0 ${
          isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-500/15 text-teal-400 border border-teal-500/30">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold flex items-center gap-2">
                Instalasi & Deployment Sistem
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  Cloud & Localhost
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Pilihan pemasangan fleksibel sesuai infrastruktur klien (Offline PC, Server VPS, atau Cloud Container)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors cursor-pointer"
            title="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className={`flex items-center border-b px-5 pt-2 gap-2 shrink-0 overflow-x-auto ${
          isDark ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-100/60 border-slate-200'
        }`}>
          <button
            type="button"
            onClick={() => setActiveTab('LOCAL')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'LOCAL'
                ? 'border-teal-400 text-teal-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Localhost (PC / Laptop)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('DOCKER')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'DOCKER'
                ? 'border-teal-400 text-teal-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>Docker & Container</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('CLOUD')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'CLOUD'
                ? 'border-teal-400 text-teal-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>Cloud Server & VPS</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('SPECS')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'SPECS'
                ? 'border-teal-400 text-teal-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Spesifikasi & Role</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          
          {/* TAB 1: LOCALHOST */}
          {activeTab === 'LOCAL' && (
            <div className="space-y-3.5 animate-fade-in">
              <div className={`p-4 rounded-xl border flex flex-col gap-2 ${
                isDark ? 'bg-teal-950/30 border-teal-500/30 text-teal-200' : 'bg-teal-50 border-teal-300 text-teal-900'
              }`}>
                <div className="flex items-center gap-2 font-bold text-sm text-teal-400">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Jalankan di Localhost Port 3030 (Offline-First)</span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-300">
                  Aplikasi dapat berjalan 100% offline di laptop dosen, ruang praktikum anatomi, atau komputer lab tanpa membutuhkan koneksi internet. Data tersimpan di peramban menggunakan IndexedDB.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-300 flex items-center gap-1.5 text-xs">
                  <Terminal className="w-4 h-4 text-teal-400" />
                  Pilihan Perintah Eksekusi:
                </h4>

                {localSnippets.map((item) => (
                  <div 
                    key={item.id}
                    className={`p-3 rounded-xl border space-y-1.5 ${
                      isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <span className="text-[11px] font-semibold text-slate-400 block">
                      {item.title}
                    </span>
                    <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-black/60 border border-slate-800 font-mono text-xs text-teal-300">
                      <span className="truncate">{item.cmd}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(item.cmd, item.id)}
                        className="p-1 rounded text-slate-400 hover:text-teal-300 hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                        title="Salin Perintah"
                      >
                        {copiedIndex === item.id ? <Check className="w-3.5 h-3.5 text-teal-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: DOCKER & CONTAINER */}
          {activeTab === 'DOCKER' && (
            <div className="space-y-3.5 animate-fade-in">
              <div className={`p-4 rounded-xl border flex flex-col gap-2 ${
                isDark ? 'bg-indigo-950/30 border-indigo-500/30 text-indigo-200' : 'bg-indigo-50 border-indigo-300 text-indigo-900'
              }`}>
                <div className="flex items-center gap-2 font-bold text-sm text-indigo-400">
                  <Box className="w-4 h-4 shrink-0" />
                  <span>Deployment Container (Docker & Kubernetes)</span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-300">
                  Telah disediakan berkas <strong>Dockerfile</strong> (multi-stage build Node 20 + Nginx Alpine) dan <strong>docker-compose.yml</strong>. Sangat efisien, hemat RAM (&lt;50MB), dan mendukung caching optimal untuk berkas 3D ukuran besar (.fbx, .obj, .glb, .3ds).
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-300 flex items-center gap-1.5 text-xs">
                  <Terminal className="w-4 h-4 text-indigo-400" />
                  Perintah Docker:
                </h4>

                {dockerSnippets.map((item) => (
                  <div 
                    key={item.id}
                    className={`p-3 rounded-xl border space-y-1.5 ${
                      isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <span className="text-[11px] font-semibold text-slate-400 block">
                      {item.title}
                    </span>
                    <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-black/60 border border-slate-800 font-mono text-xs text-indigo-300">
                      <span className="truncate">{item.cmd}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(item.cmd, item.id)}
                        className="p-1 rounded text-slate-400 hover:text-indigo-300 hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                        title="Salin Perintah"
                      >
                        {copiedIndex === item.id ? <Check className="w-3.5 h-3.5 text-teal-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: CLOUD SERVER & VPS */}
          {activeTab === 'CLOUD' && (
            <div className="space-y-3.5 animate-fade-in">
              <div className={`p-4 rounded-xl border flex flex-col gap-2 ${
                isDark ? 'bg-sky-950/30 border-sky-500/30 text-sky-200' : 'bg-sky-50 border-sky-300 text-sky-900'
              }`}>
                <div className="flex items-center gap-2 font-bold text-sm text-sky-400">
                  <Globe className="w-4 h-4 shrink-0" />
                  <span>Deployment Cloud VPS, PaaS, & Static Hosting</span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-300">
                  Dapat dipasang di Google Cloud Run, AWS, DigitalOcean, Hetzner, VPS Ubuntu (Nginx + PM2), atau static hosting seperti Vercel, Netlify, dan Cloudflare Pages. Dilengkapi skrip server produksi <code>server.mjs</code> dengan endpoint healthcheck <code>/api/health</code>.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-300 flex items-center gap-1.5 text-xs">
                  <Terminal className="w-4 h-4 text-sky-400" />
                  Perintah Build & Server Produksi:
                </h4>

                {cloudSnippets.map((item) => (
                  <div 
                    key={item.id}
                    className={`p-3 rounded-xl border space-y-1.5 ${
                      isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <span className="text-[11px] font-semibold text-slate-400 block">
                      {item.title}
                    </span>
                    <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-black/60 border border-slate-800 font-mono text-xs text-sky-300">
                      <span className="truncate">{item.cmd}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(item.cmd, item.id)}
                        className="p-1 rounded text-slate-400 hover:text-sky-300 hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                        title="Salin Perintah"
                      >
                        {copiedIndex === item.id ? <Check className="w-3.5 h-3.5 text-teal-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: SPECS & ROLES */}
          {activeTab === 'SPECS' && (
            <div className="space-y-3.5 animate-fade-in">
              {/* Media formats */}
              <div className={`p-4 rounded-xl border space-y-2.5 ${
                isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <h4 className="font-bold text-slate-300 flex items-center gap-1.5 text-xs">
                  <HardDrive className="w-4 h-4 text-teal-400" />
                  Dukungan Media Medis & Basis Data Ringan
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px]">
                  <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-900">
                    <span className="font-bold text-amber-400 block mb-1">Format 2D:</span>
                    <span className="text-slate-300 font-mono">.jpg, .jpeg, .png, .webp</span>
                    <p className="text-[10px] text-slate-400 mt-1">Diagram morfologi resolusi tinggi tersimpan langsung di browser (IndexedDB).</p>
                  </div>

                  <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-900">
                    <span className="font-bold text-teal-400 block mb-1">Format 3D:</span>
                    <span className="text-slate-300 font-mono">.fbx, .obj, .glb, .3ds</span>
                    <p className="text-[10px] text-slate-400 mt-1">Mendukung berkas tunggal, folder OBJ + MTL tekstur, dan arsip ZIP.</p>
                  </div>

                  <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-900">
                    <span className="font-bold text-indigo-400 block mb-1">Embed Interaktif:</span>
                    <span className="text-slate-300 font-mono">Sketchfab & GDrive</span>
                    <p className="text-[10px] text-slate-400 mt-1">Normalisasi otomatis tautan Sketchfab dan Google Drive menjadi iframe interaktif.</p>
                  </div>
                </div>
              </div>

              {/* Roles */}
              <div className={`p-4 rounded-xl border space-y-2.5 ${
                isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <h4 className="font-bold text-slate-300 flex items-center gap-1.5 text-xs">
                  <ShieldCheck className="w-4 h-4 text-teal-400" />
                  Hak Akses Role Pengguna
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px]">
                  <div className="p-3 rounded-lg border border-rose-500/30 bg-rose-500/5 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-rose-400">
                      <Crown className="w-3.5 h-3.5" />
                      <span>Role: Admin</span>
                    </div>
                    <p className="text-slate-300">
                      Wewenang <strong>mengedit master data</strong>: kurikulum PAAI 2019, taksonomi organ, institusi, akun dosen, dan backup database.
                    </p>
                    <div className="font-mono text-[10px] text-slate-400 pt-1">
                      User: <span className="text-rose-300 font-bold">admin</span> | Sandi: <span className="text-rose-300 font-bold">Sup3r@dm1n</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/5 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-amber-400">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Role: Dosen</span>
                    </div>
                    <p className="text-slate-300">
                      Wewenang <strong>menambah, mengedit, dan menghapus konten 3D</strong>, upload model FBX/OBJ/GLB/3DS, dan mengelola pin landmark 3D.
                    </p>
                    <div className="font-mono text-[10px] text-slate-400 pt-1">
                      User: <span className="text-amber-300 font-bold">dosen</span> (dr. Paijo) | Sandi: <span className="text-amber-300 font-bold">dosen123</span>
                    </div>
                    <div className="text-[10px] text-teal-400/90 pt-0.5">
                      Bebas dikustomisasi untuk tiap fakultas / universitas.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className={`flex items-center justify-between border-t px-5 py-3 shrink-0 ${
          isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <span className="text-[11px] font-mono text-slate-400 truncate max-w-[340px] sm:max-w-none">
            Dokumentasi lengkap: <span className="text-teal-400">PANDUAN_INSTALASI.md</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-bold bg-teal-500 text-slate-950 hover:bg-teal-400 transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
