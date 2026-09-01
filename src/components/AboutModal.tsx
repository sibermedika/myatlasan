import React from 'react';
import { X, Sparkles, Activity, CheckCircle, Heart, GraduationCap, ShieldCheck, Crown } from 'lucide-react';

interface AboutModalProps {
  onClose: () => void;
  theme: 'dark' | 'light';
}

export default function AboutModal({ onClose, theme }: AboutModalProps) {
  const isDark = theme === 'dark';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md animate-fade-in" id="about-info-modal">
      <div className={`relative w-full max-w-lg rounded-2xl shadow-2xl border overflow-hidden flex flex-col ${
        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        
        {/* Header */}
        <div className={`flex items-center justify-between border-b px-6 py-4 ${
          isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/25">
              <Activity className="h-5 w-5 text-teal-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold flex items-center gap-1.5">
                Tentang AnatoVerse Atlas
              </h3>
              <p className="text-[10px] text-slate-400">
                Platform Visualisasi Edukasi Anatomi Medis
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs leading-relaxed">
          
          {/* Main Credit Highlight */}
          <div className={`p-4 rounded-xl border flex items-center gap-3.5 ${
            isDark ? 'bg-teal-500/10 border-teal-500/30' : 'bg-teal-50 border-teal-200'
          }`}>
            <div className="p-2.5 rounded-full bg-teal-500 text-slate-950 shrink-0 font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-teal-500 font-bold block">
                Inisiator & Pengembang Utama
              </span>
              <h4 className="text-sm font-bold text-teal-300 dark:text-teal-300 light:text-teal-900">
                dikembangkan oleh dr. Penggalih
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Departemen Anatomi Medis • Berdasarkan Kurikulum PAAI 2019 Standard
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h5 className="font-bold text-xs uppercase tracking-wider text-slate-400 font-mono">
              Fitur Utama Sistem:
            </h5>
            <ul className="space-y-2 text-slate-300 dark:text-slate-300 light:text-slate-700">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <span><strong>Multi-Role Authentication:</strong> Tamu (Guest Free), Mahasiswa Kedokteran (Full Access), Dosen Kontributor, dan Superadmin Master Data.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <span><strong>Kontributor Dosen & Kode Dosen:</strong> Dosen dapat menambah sub-kategori sendiri walau namanya sama, dibedakan dengan Kode Dosen otomatis (kombinasi nama dan tanggal).</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <span><strong>Objek Visual 2D & 3D:</strong> Dukungan upload gambar 2D, upload berkas 3D (.glb/.gltf/.obj), model 3D Three.js bawaan, dan iframe embed Sketchfab.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <span><strong>Labeling Pin Spasial X, Y, Z:</strong> Kemudahan menandai titik koordinat klik pada objek 2D dan 3D di backend dosen secara instan.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <span><strong>Mode Gelap-Terang Nyaman:</strong> Komposisi rasio kontras tinggi dan tipografi tajam yang nyaman untuk belajar.</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Footer */}
        <div className={`px-6 py-3 border-t text-center text-xs font-mono ${
          isDark ? 'bg-slate-950 border-slate-800 text-slate-500' : 'bg-slate-100 border-slate-200 text-slate-600'
        }`}>
          © 2026 AnatoVerse Medika • dikembangkan oleh dr. Penggalih
        </div>

      </div>
    </div>
  );
}
