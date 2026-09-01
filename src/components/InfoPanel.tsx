import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Tag, 
  CheckCircle, 
  AlertTriangle, 
  FileText,
  Compass,
  Edit3,
  Trash2,
  Sparkles,
  User,
  Box,
  Building2,
  FileCheck
} from 'lucide-react';
import { Organ, Pin, UserRole } from '../types';
import { AnatomyDatabaseService } from '../services/db';

interface InfoPanelProps {
  selectedOrgan: Organ | null;
  selectedPin: Pin | null;
  currentRole: UserRole;
  onEditPin?: (pin: Pin) => void;
  onDeletePin?: (pinId: string) => void;
  theme: 'dark' | 'light';
}

export default function InfoPanel({ 
  selectedOrgan, 
  selectedPin,
  currentRole,
  onEditPin,
  onDeletePin,
  theme
}: InfoPanelProps) {
  const [activeTab, setActiveTab] = useState<'ORGAN' | 'PIN'>('ORGAN');

  const isDark = theme === 'dark';

  // Automatically focus on PIN tab when a pin is selected on the canvas
  useEffect(() => {
    if (selectedPin) {
      setActiveTab('PIN');
    }
  }, [selectedPin]);

  if (!selectedOrgan) {
    return (
      <div className={`flex h-full flex-col items-center justify-center p-6 text-center border-l ${
        isDark ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
      }`} id="info-panel-empty">
        <FileText className="h-8 w-8 animate-pulse mb-2 text-slate-500" />
        <h4 className="text-[11px] font-bold uppercase tracking-wider">
          Informasi Medis
        </h4>
        <p className="mt-1 text-xs leading-relaxed text-slate-500 max-w-[200px]">
          Pilih organ dari taksonomi kiri untuk menampilkan tinjauan anatomi dan korelasi klinis.
        </p>
      </div>
    );
  }

  const isDosenOrAdmin = currentRole === 'DOSEN' || currentRole === 'SUPERADMIN';

  return (
    <div className={`flex h-full flex-col border-l transition-colors ${
      isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
    }`} id="right-info-panel">
      
      {/* Tab Navigation Headers */}
      <div className={`flex border-b p-1.5 shrink-0 ${
        isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
      }`} id="info-tabs">
        <button
          onClick={() => setActiveTab('ORGAN')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'ORGAN'
              ? isDark 
                ? 'bg-slate-900 text-teal-400 border border-slate-800 shadow-md' 
                : 'bg-white text-teal-800 border border-slate-200 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          id="tab-organ-btn"
        >
          <BookOpen className="h-3.5 w-3.5 text-teal-500" />
          <span>Deskripsi Organ</span>
        </button>

        <button
          onClick={() => setActiveTab('PIN')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'PIN'
              ? isDark 
                ? 'bg-slate-900 text-teal-400 border border-slate-800 shadow-md' 
                : 'bg-white text-teal-800 border border-slate-200 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          id="tab-pin-btn"
        >
          <Tag className="h-3.5 w-3.5 text-teal-500" />
          <span>Pin Aktif</span>
          {selectedOrgan.pins && selectedOrgan.pins.length > 0 && (
            <span className={`rounded-full px-1.5 py-0.2 text-[9px] font-mono border ${
              isDark ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-200 border-slate-300 text-slate-700'
            }`}>
              {selectedOrgan.pins.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab Content Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {activeTab === 'ORGAN' ? (
          /* Tab 1: Full Organ Medical Details */
          <div className="space-y-4" id="info-tab-organ-content">
            
            {/* Header: Organ Names, Standard & Institution Attribution */}
            <div className={`border-b pb-3 space-y-2 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-teal-500">
                  {selectedOrgan.system}
                </span>
                {selectedOrgan.subSystem && (
                  <span className="text-[10px] font-mono text-slate-400">
                    {selectedOrgan.subSystem}
                  </span>
                )}
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-bold leading-snug">
                  {selectedOrgan.name}
                </h3>
                <p className="mt-0.5 text-xs font-medium italic text-teal-400 font-mono">
                  {selectedOrgan.latinName}
                </p>
              </div>

              {/* Attribution Badges: Standard vs Institution vs Dosen */}
              <div className="flex flex-wrap gap-1.5 pt-1 text-[10px] font-mono">
                {/* 1. Standar Acuan Kurikulum */}
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border font-semibold ${
                  isDark 
                    ? 'bg-teal-950/60 text-teal-300 border-teal-800/60' 
                    : 'bg-teal-50 text-teal-800 border-teal-200'
                }`} title="Standar Acuan Kurikulum Kedokteran">
                  <FileCheck className="w-3 h-3 text-teal-400" />
                  <span>{selectedOrgan.standard || 'Standar Kurikulum Nasional PAAI 2019'}</span>
                </span>

                {/* 2. Asal Institusi / Universitas */}
                {selectedOrgan.institution && (
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border ${
                    isDark 
                      ? 'bg-slate-800/80 text-amber-300 border-amber-500/30' 
                      : 'bg-amber-50 text-amber-900 border-amber-200'
                  }`} title="Asal Institusi / Fakultas Kedokteran Dosen">
                    <Building2 className="w-3 h-3 text-amber-400" />
                    <span>{selectedOrgan.institution}</span>
                  </span>
                )}

                {/* 3. Dosen Kontributor */}
                {selectedOrgan.dosenCode && (
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border ${
                    isDark 
                      ? 'bg-slate-900 text-slate-300 border-slate-700' 
                      : 'bg-slate-100 text-slate-700 border-slate-300'
                  }`}>
                    <User className="w-3 h-3 text-slate-400" />
                    <span>{selectedOrgan.dosenName ? `${selectedOrgan.dosenName} (${selectedOrgan.dosenCode})` : selectedOrgan.dosenCode}</span>
                  </span>
                )}
              </div>

              {/* Multi-Media Assets Indicator */}
              <div className={`p-2 rounded-lg border flex items-center justify-between gap-2 text-[10px] ${
                isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <span className="text-slate-400 font-mono flex items-center gap-1">
                  <Box className="w-3 h-3 text-teal-400" /> Media Terlampir:
                </span>
                <div className="flex items-center gap-1 flex-wrap font-mono font-bold">
                  {AnatomyDatabaseService.resolveOrganMediaItems(selectedOrgan).map((m, idx) => (
                    <span
                      key={m.id || idx}
                      className={`px-1.5 py-0.2 rounded border ${
                        m.type === '3d_model' 
                          ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' 
                          : m.type === '3d_embed' 
                          ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30' 
                          : 'bg-teal-500/10 text-teal-300 border-teal-500/30'
                      }`}
                    >
                      {m.type === '2d_image' ? '2D' : m.type === '3d_model' ? '3D' : 'Embed'}
                      {m.format ? ` (${m.format.toUpperCase()})` : ''}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Section: Deskripsi Umum */}
            <div className="space-y-1">
              <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                Deskripsi Morfologis
              </h4>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                {selectedOrgan.description}
              </p>
            </div>

            {/* Section: Fungsi Utama */}
            <div className={`rounded-xl p-3 border space-y-1 ${
              isDark ? 'bg-teal-500/10 border-teal-500/20 text-teal-200' : 'bg-teal-50 border-teal-200 text-teal-900'
            }`}>
              <h4 className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-teal-500">
                <CheckCircle className="h-3.5 w-3.5" />
                Fungsi Fisiologis Utama
              </h4>
              <p className="text-xs leading-relaxed">
                {selectedOrgan.functionMain}
              </p>
            </div>

            {/* Section: Vaskularisasi */}
            <div className="space-y-1">
              <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                Vaskularisasi (Suplai Darah)
              </h4>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                {selectedOrgan.vascularization}
              </p>
            </div>

            {/* Section: Inervasi */}
            <div className="space-y-1">
              <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                Inervasi (Persarafan)
              </h4>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                {selectedOrgan.innervation}
              </p>
            </div>

            {/* Section: Catatan Klinis */}
            <div className={`rounded-xl p-3 border space-y-1.5 shadow-sm ${
              isDark ? 'bg-amber-500/10 border-amber-500/25 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}>
              <h4 className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-amber-500">
                <AlertTriangle className="h-3.5 w-3.5" />
                Catatan Korelasi Klinis
              </h4>
              <p className="text-xs leading-relaxed font-medium">
                {selectedOrgan.clinicalNotes}
              </p>
            </div>

          </div>
        ) : (
          /* Tab 2: Hotspot Pin Details */
          <div className="h-full space-y-4" id="info-tab-pin-content">
            {selectedPin ? (
              <div className="space-y-4">
                
                {/* Labeled Header */}
                <div className={`flex items-center justify-between border-b pb-3 ${
                  isDark ? 'border-slate-800' : 'border-slate-200'
                }`}>
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-500 text-slate-950 text-xs font-black shadow-md shrink-0">
                      {selectedOrgan.pins ? selectedOrgan.pins.findIndex(p => p.id === selectedPin.id) + 1 : 1}
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold">
                        {selectedPin.title}
                      </h3>
                      <p className="text-[9px] uppercase tracking-wider font-semibold text-teal-500">
                        {selectedPin.is3d ? 'Hotspot Spasial 3D' : 'Hotspot Diagram 2D'}
                      </p>
                    </div>
                  </div>

                  {isDosenOrAdmin && onEditPin && (
                    <button
                      onClick={() => onEditPin(selectedPin)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-teal-400 hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Edit Pin"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Hotspot Description */}
                <div className="space-y-1">
                  <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                    Keterangan Struktur Anatomi
                  </h4>
                  <p className={`text-xs leading-relaxed p-3 rounded-xl border ${
                    isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}>
                    {selectedPin.description}
                  </p>
                </div>

                {/* Position Coordinates Reference */}
                <div className={`rounded-xl p-2.5 border flex items-center justify-between text-[10px] ${
                  isDark ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}>
                  <span className="font-mono">Koordinat Spasial:</span>
                  <span className="font-mono font-bold text-teal-500">
                    {selectedPin.is3d || selectedPin.z !== undefined
                      ? `X: ${selectedPin.x} | Y: ${selectedPin.y} | Z: ${selectedPin.z ?? 0}`
                      : `X: ${selectedPin.x}% | Y: ${selectedPin.y}%`
                    }
                  </span>
                </div>

              </div>
            ) : (
              <div className="flex h-64 flex-col items-center justify-center text-center p-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-full mb-3 border ${
                  isDark ? 'bg-slate-950 border-slate-800 text-slate-500' : 'bg-slate-100 border-slate-200 text-slate-400'
                }`}>
                  <Compass className="h-5 w-5 animate-pulse" />
                </div>
                <h4 className="text-xs font-bold text-slate-400">Tidak Ada Pin Terpilih</h4>
                <p className="mt-1 max-w-[200px] text-[11px] leading-relaxed text-slate-500">
                  Klik salah satu penanda angka pada diagram 2D atau model 3D untuk membuka deskripsi spesifik.
                </p>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Panel Footer Brand & Dr. Penggalih Credit */}
      <div className={`border-t px-4 py-3 text-center text-[10px] font-medium shrink-0 font-mono flex flex-col items-center justify-center gap-0.5 ${
        isDark ? 'bg-slate-950 border-slate-800 text-slate-500' : 'bg-slate-100 border-slate-200 text-slate-600'
      }`}>
        <span className="text-teal-500 font-semibold">dikembangkan oleh dr. Penggalih</span>
        <span className="text-[9px] opacity-75">Standar Kurikulum PAAI 2019</span>
      </div>

    </div>
  );
}
