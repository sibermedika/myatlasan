import React, { useState } from 'react';
import { 
  Building2, 
  X, 
  Search, 
  Layers, 
  Box, 
  Image as ImageIcon, 
  User, 
  ChevronRight, 
  Sparkles, 
  ExternalLink,
  GraduationCap,
  FolderTree,
  Filter,
  CheckCircle2,
  FileCheck
} from 'lucide-react';
import { Organ, InstitutionCluster, UserProfile } from '../types';
import { KNOWN_INSTITUTIONS } from '../services/db';

interface InstitutionClusterViewProps {
  organs: Organ[];
  onSelectOrgan: (organ: Organ) => void;
  onClose: () => void;
  currentUser?: UserProfile | null;
  theme: 'dark' | 'light';
}

export default function InstitutionClusterView({
  organs,
  onSelectOrgan,
  onClose,
  currentUser,
  theme
}: InstitutionClusterViewProps) {
  const [selectedInstitution, setSelectedInstitution] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const isDark = theme === 'dark';

  // Build cluster data
  const clustersMap: Record<string, {
    institution: string;
    organs: Organ[];
    lecturers: Set<string>;
    count2D: number;
    count3D: number;
  }> = {};

  organs.forEach((organ) => {
    const inst = organ.institution || 'Koleksi Mandiri / Terbuka';
    if (!clustersMap[inst]) {
      clustersMap[inst] = {
        institution: inst,
        organs: [],
        lecturers: new Set<string>(),
        count2D: 0,
        count3D: 0
      };
    }
    clustersMap[inst].organs.push(organ);
    if (organ.dosenName) {
      clustersMap[inst].lecturers.add(organ.dosenName);
    }
    if (organ.mediaType === '3d_model' || organ.mediaType === '3d_embed') {
      clustersMap[inst].count3D++;
    } else {
      clustersMap[inst].count2D++;
    }
  });

  const clusterList = Object.values(clustersMap);

  // Filter clusters & organs
  const filteredClusters = clusterList.filter((cluster) => {
    if (selectedInstitution !== 'ALL' && cluster.institution !== selectedInstitution) {
      return false;
    }
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      cluster.institution.toLowerCase().includes(query) ||
      Array.from(cluster.lecturers).some(l => l.toLowerCase().includes(query)) ||
      cluster.organs.some(o => 
        o.name.toLowerCase().includes(query) || 
        o.latinName.toLowerCase().includes(query) ||
        o.system.toLowerCase().includes(query)
      )
    );
  });

  const totalInstitutions = clusterList.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md animate-fade-in" id="institution-cluster-modal">
      <div className={`relative w-full max-w-5xl h-[92vh] rounded-2xl shadow-2xl border overflow-hidden flex flex-col ${
        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        
        {/* Header */}
        <div className={`flex items-center justify-between border-b px-6 py-4 shrink-0 ${
          isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-md">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold">
                  Cluster Koleksi Berdasarkan Institusi & Universitas
                </h2>
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono px-2 py-0.5 rounded-full font-bold">
                  {totalInstitutions} Institusi / Afiliasi
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Eksplorasi kontribusi materi anatomi 2D/3D dari Fakultas Kedokteran & RS Pendidikan, seluruhnya terstandarisasi Kurikulum Nasional PAAI 2019.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Filter Bar & Search */}
        <div className={`p-4 border-b shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3 ${
          isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-100/70 border-slate-200'
        }`}>
          
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari institusi, nama dosen, atau organ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full text-xs rounded-xl pl-9 pr-3 py-2 border focus:outline-none focus:border-amber-500 transition-colors ${
                isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-300 text-slate-900'
              }`}
            />
          </div>

          {/* Quick Filter Institution Dropdown */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedInstitution}
              onChange={(e) => setSelectedInstitution(e.target.value)}
              className={`text-xs rounded-xl px-3 py-2 border focus:outline-none focus:border-amber-500 transition-colors w-full sm:w-auto ${
                isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-300 text-slate-900'
              }`}
            >
              <option value="ALL">Semua Institusi ({totalInstitutions})</option>
              {clusterList.map(c => (
                <option key={c.institution} value={c.institution}>
                  {c.institution} ({c.organs.length} organ)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Content Body: Cluster Cards & Organs */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {filteredClusters.length === 0 ? (
            <div className="text-center py-16">
              <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-3 opacity-50" />
              <h3 className="text-sm font-bold text-slate-300">Tidak ada cluster institusi yang cocok</h3>
              <p className="text-xs text-slate-500 mt-1">Coba gunakan kata kunci pencarian lain.</p>
            </div>
          ) : (
            filteredClusters.map((cluster) => {
              const lecturerNames = Array.from(cluster.lecturers);

              return (
                <div 
                  key={cluster.institution}
                  className={`rounded-2xl border overflow-hidden transition-all shadow-sm ${
                    isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                  }`}
                >
                  {/* Cluster Card Header */}
                  <div className={`p-4 border-b flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                    isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/25 shrink-0 mt-0.5">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                          <span>{cluster.institution}</span>
                          {currentUser?.institution === cluster.institution && (
                            <span className="text-[10px] bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2 py-0.2 rounded-full font-mono">
                              Institusi Anda
                            </span>
                          )}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 mt-1">
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-amber-400" />
                            <span>Dosen Kontributor: <strong>{lecturerNames.join(', ') || 'Tim Kurikulum Anatomi'}</strong></span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Media Count Badges */}
                    <div className="flex items-center gap-2 shrink-0 self-start md:self-auto">
                      <span className="px-2.5 py-1 rounded-lg bg-teal-500/15 text-teal-300 border border-teal-500/30 text-xs font-semibold flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>{cluster.count2D} 2D</span>
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center gap-1.5">
                        <Box className="w-3.5 h-3.5" />
                        <span>{cluster.count3D} 3D</span>
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold font-mono">
                        Total {cluster.organs.length} Organ
                      </span>
                    </div>
                  </div>

                  {/* Organ Grid under this Cluster */}
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {cluster.organs.map((organ) => {
                      const is3D = organ.mediaType === '3d_model' || organ.mediaType === '3d_embed';

                      return (
                        <div
                          key={organ.id}
                          onClick={() => {
                            onSelectOrgan(organ);
                            onClose();
                          }}
                          className={`group p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                            isDark 
                              ? 'bg-slate-900 border-slate-800/80 hover:border-amber-500/50 hover:bg-slate-850' 
                              : 'bg-slate-50 border-slate-200 hover:border-amber-500/50 hover:bg-amber-50/40'
                          }`}
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-950 shrink-0 border border-slate-800 relative">
                              <img
                                src={organ.imageUrl}
                                alt={organ.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                referrerPolicy="no-referrer"
                              />
                              <div className={`absolute top-0.5 right-0.5 p-0.5 rounded text-[9px] font-bold ${
                                is3D ? 'bg-indigo-600 text-white' : 'bg-teal-600 text-white'
                              }`}>
                                {is3D ? '3D' : '2D'}
                              </div>
                            </div>

                            <div className="overflow-hidden">
                              <h4 className="text-xs font-bold text-slate-200 truncate group-hover:text-amber-400 transition-colors">
                                {organ.name}
                              </h4>
                              <p className="text-[10px] text-slate-400 italic truncate">
                                {organ.latinName}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[9px] text-slate-500 font-mono truncate">
                                  {organ.subSystem}
                                </span>
                                <span className="text-[8px] px-1 py-0.2 rounded bg-teal-950/60 text-teal-400 border border-teal-800/50 font-mono shrink-0">
                                  PAAI 2019
                                </span>
                              </div>
                            </div>
                          </div>

                          <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className={`px-6 py-3 border-t text-xs flex items-center justify-between shrink-0 font-mono ${
          isDark ? 'bg-slate-950 border-slate-800 text-slate-500' : 'bg-slate-100 border-slate-200 text-slate-600'
        }`}>
          <span>Cluster Institusi Anatomi Medis Terpadu</span>
          <span className="text-teal-400 font-semibold">Bebas Dikustomisasi Tiap Institusi</span>
        </div>

      </div>
    </div>
  );
}
