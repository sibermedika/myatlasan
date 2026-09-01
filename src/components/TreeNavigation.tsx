import React, { useState, useEffect, useMemo } from 'react';
import { 
  FolderTree, 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Folder, 
  CircleDot,
  Box,
  Crown
} from 'lucide-react';
import { Organ, UserRole } from '../types';

interface TreeNavigationProps {
  organs: Organ[];
  selectedOrgan: Organ | null;
  onSelectOrgan: (organ: Organ) => void;
  currentRole: UserRole;
  onAddOrganClick: () => void;
  onOpenSuperadmin?: () => void;
  theme: 'dark' | 'light';
}

/**
 * PAAI Standard Curriculum Sorting Helpers
 */
export function getSystemOrder(systemName: string): number {
  const match = systemName.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : 999;
}

export function getSubSystemOrder(subSystemName: string): { major: number; minor: number } {
  const match = subSystemName.match(/^(\d+)(?:\.(\d+))?/);
  if (match) {
    return {
      major: parseInt(match[1], 10),
      minor: match[2] ? parseInt(match[2], 10) : 0
    };
  }
  return { major: 999, minor: 999 };
}

export function comparePaaiSystems(a: string, b: string): number {
  const orderA = getSystemOrder(a);
  const orderB = getSystemOrder(b);
  if (orderA !== orderB) return orderA - orderB;
  return a.localeCompare(b);
}

export function comparePaaiSubSystems(a: string, b: string): number {
  const orderA = getSubSystemOrder(a);
  const orderB = getSubSystemOrder(b);
  if (orderA.major !== orderB.major) return orderA.major - orderB.major;
  if (orderA.minor !== orderB.minor) return orderA.minor - orderB.minor;
  return a.localeCompare(b);
}

export default function TreeNavigation({
  organs,
  selectedOrgan,
  onSelectOrgan,
  currentRole,
  onAddOrganClick,
  onOpenSuperadmin,
  theme
}: TreeNavigationProps) {
  const [expandedSystems, setExpandedSystems] = useState<Record<string, boolean>>({});
  const [expandedSubSystems, setExpandedSubSystems] = useState<Record<string, boolean>>({});

  const isDark = theme === 'dark';

  // Group organs strictly by PAAI standard sequence
  const sortedSystemsList = useMemo(() => {
    const map: Record<string, Record<string, { title: string; dosenCode?: string; organs: Organ[] }>> = {};

    organs.forEach((organ) => {
      if (!map[organ.system]) {
        map[organ.system] = {};
      }
      const subKey = organ.dosenCode ? `${organ.subSystem}__${organ.dosenCode}` : organ.subSystem;
      if (!map[organ.system][subKey]) {
        map[organ.system][subKey] = {
          title: organ.subSystem,
          dosenCode: organ.dosenCode,
          organs: []
        };
      }
      map[organ.system][subKey].organs.push(organ);
    });

    // Sort systems according to standard PAAI index (1..12)
    const sortedSystems = Object.keys(map).sort(comparePaaiSystems);

    return sortedSystems.map((systemName) => {
      const subCatsMap = map[systemName];
      const sortedSubKeys = Object.keys(subCatsMap).sort((a, b) => {
        const titleA = subCatsMap[a].title;
        const titleB = subCatsMap[b].title;
        return comparePaaiSubSystems(titleA, titleB);
      });

      const subCategories = sortedSubKeys.map((subKey) => ({
        key: subKey,
        ...subCatsMap[subKey]
      }));

      return {
        systemName,
        subCategories,
        totalOrgans: subCategories.reduce((acc, curr) => acc + curr.organs.length, 0)
      };
    });
  }, [organs]);

  // Auto-expand active system & subsystem
  useEffect(() => {
    if (selectedOrgan) {
      setExpandedSystems(prev => ({ ...prev, [selectedOrgan.system]: true }));
      const subKey = selectedOrgan.dosenCode ? `${selectedOrgan.subSystem}__${selectedOrgan.dosenCode}` : selectedOrgan.subSystem;
      setExpandedSubSystems(prev => ({ ...prev, [`${selectedOrgan.system}-${subKey}`]: true }));
    } else if (sortedSystemsList.length > 0) {
      const firstSys = sortedSystemsList[0];
      setExpandedSystems(prev => ({ ...prev, [firstSys.systemName]: true }));
      if (firstSys.subCategories.length > 0) {
        setExpandedSubSystems(prev => ({ ...prev, [`${firstSys.systemName}-${firstSys.subCategories[0].key}`]: true }));
      }
    }
  }, [selectedOrgan, sortedSystemsList]);

  const toggleSystem = (systemName: string) => {
    setExpandedSystems((prev) => ({
      ...prev,
      [systemName]: !prev[systemName]
    }));
  };

  const toggleSubSystem = (systemName: string, subKey: string) => {
    const key = `${systemName}-${subKey}`;
    setExpandedSubSystems((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const isDosenOrAdmin = currentRole === 'DOSEN' || currentRole === 'SUPERADMIN';

  return (
    <div className={`flex h-full flex-col border-r ${
      isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
    }`} id="tree-sidebar">
      
      {/* Sidebar Header */}
      <div className={`px-3 py-2.5 border-b flex justify-between items-center sticky top-0 z-10 ${
        isDark ? 'bg-slate-900/95 border-slate-800' : 'bg-slate-50/95 border-slate-200'
      }`}>
        <div className="flex items-center gap-2">
          <FolderTree className="w-4 h-4 text-teal-500 shrink-0" />
          <h2 className="text-xs font-semibold tracking-wide text-slate-300 dark:text-slate-300 light:text-slate-700" id="taxonomy-header-title">
            Kurikulum PAAI
          </h2>
          <span className="text-[10px] text-slate-500 font-mono">({organs.length})</span>
        </div>

        <div className="flex items-center gap-1">
          {currentRole === 'SUPERADMIN' && onOpenSuperadmin && (
            <button
              onClick={onOpenSuperadmin}
              className="bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 border border-rose-500/30 text-[10px] px-2 py-1 rounded-lg flex items-center gap-1 transition-all font-semibold cursor-pointer"
              title="Kelola Master Data & Pengguna Superadmin"
            >
              <Crown className="w-3 h-3" /> Master
            </button>
          )}

          {isDosenOrAdmin && (
            <button 
              id="btnAddOrgan" 
              onClick={onAddOrganClick} 
              className="bg-teal-500/15 text-teal-400 hover:bg-teal-500/25 border border-teal-500/30 text-[10px] px-2 py-1 rounded-lg flex items-center gap-1 transition-colors font-semibold cursor-pointer"
              title="Tambah Organ Baru"
            >
              <Plus className="w-3 h-3" /> Organ
            </button>
          )}
        </div>
      </div>

      {/* Tree Content List - Ordered strictly by PAAI 1..12 */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 select-none" id="treeContainer">
        {sortedSystemsList.length === 0 ? (
          <p className="text-xs text-slate-500 italic p-4 text-center">Tidak ada organ ditemukan.</p>
        ) : (
          sortedSystemsList.map(({ systemName, subCategories, totalOrgans }) => {
            const isSystemExpanded = expandedSystems[systemName] || false;
            
            return (
              <div 
                key={systemName} 
                className={`rounded-lg overflow-hidden transition-all ${
                  isDark ? 'bg-slate-950/40' : 'bg-slate-50/70'
                }`}
              >
                {/* Level 1: Main System Category */}
                <button
                  onClick={() => toggleSystem(systemName)}
                  className={`w-full text-left px-2.5 py-1.5 text-xs font-semibold flex justify-between items-center cursor-pointer transition-colors ${
                    isDark 
                      ? 'text-slate-200 hover:bg-slate-800/60' 
                      : 'text-slate-800 hover:bg-slate-200/60'
                  }`}
                  id={`tree-system-${systemName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                >
                  <span className="truncate flex items-center gap-2 pr-1">
                    <Folder className={`w-3.5 h-3.5 shrink-0 ${isSystemExpanded ? 'text-teal-400' : 'text-slate-400'}`} />
                    <span className="truncate">{systemName}</span>
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] text-slate-500 font-mono">
                      {totalOrgans}
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${
                      isSystemExpanded ? 'rotate-180' : ''
                    }`} />
                  </div>
                </button>

                {/* Level 2: Sub-categories (PAAI Standard Structure) */}
                {isSystemExpanded && (
                  <div className="px-1.5 pb-1 pt-0.5 space-y-0.5">
                    {subCategories.map((subData) => {
                      const isSubExpanded = expandedSubSystems[`${systemName}-${subData.key}`] || false;

                      return (
                        <div key={subData.key}>
                          <button
                            onClick={() => toggleSubSystem(systemName, subData.key)}
                            className={`w-full text-left px-2 py-1 rounded text-[11px] font-medium flex justify-between items-center cursor-pointer transition-colors ${
                              isDark 
                                ? 'text-slate-300 hover:bg-slate-800/70' 
                                : 'text-slate-700 hover:bg-slate-200/70'
                            }`}
                            id={`tree-subsystem-${subData.key.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                          >
                            <span className="truncate flex items-center gap-1.5 min-w-0 pr-1">
                              <ChevronRight className={`w-3 h-3 text-slate-500 transition-transform duration-200 shrink-0 ${
                                isSubExpanded ? 'rotate-90' : ''
                              }`} />
                              <span className="truncate">{subData.title}</span>
                              {subData.dosenCode && (
                                <span className="text-[8px] font-mono px-1 rounded bg-amber-500/15 text-amber-400 truncate max-w-[70px]">
                                  {subData.dosenCode}
                                </span>
                              )}
                            </span>
                            <span className="text-[9px] text-slate-500 font-mono shrink-0">
                              {subData.organs.length}
                            </span>
                          </button>

                          {/* Level 3: Organs in Subcategory */}
                          {isSubExpanded && (
                            <div className="ml-3 pl-1 border-l border-slate-700/50 dark:border-slate-800 light:border-slate-300 space-y-0.5 my-0.5">
                              {subData.organs.map((organ) => {
                                const isActive = selectedOrgan && selectedOrgan.id === organ.id;
                                const isLocked = currentRole === 'GUEST' && !organ.isFree;
                                const is3D = organ.mediaType?.includes('3d') || organ.imageUrl?.includes('sketchfab');

                                return (
                                  <button
                                    key={organ.id}
                                    onClick={() => onSelectOrgan(organ)}
                                    className={`w-full text-left px-2 py-1 rounded text-[11px] flex items-center justify-between transition-colors cursor-pointer ${
                                      isActive 
                                        ? 'bg-teal-500/15 text-teal-400 font-semibold' 
                                        : isDark 
                                        ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40' 
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                    }`}
                                    id={`tree-organ-${organ.id}`}
                                  >
                                    <span className="truncate flex items-center gap-1.5">
                                      {is3D ? (
                                        <Box className={`w-3 h-3 shrink-0 ${isLocked ? 'text-amber-400' : 'text-indigo-400'}`} />
                                      ) : (
                                        <CircleDot className={`w-3 h-3 shrink-0 ${isLocked ? 'text-amber-400' : 'text-teal-400'}`} />
                                      )}
                                      <span className="truncate">{organ.name}</span>
                                    </span>

                                    <div className="flex items-center gap-1 shrink-0">
                                      {isLocked ? (
                                        <span className="text-[8px] bg-amber-500/15 text-amber-400 px-1 py-0.2 rounded font-mono">
                                          Lock
                                        </span>
                                      ) : organ.isFree ? (
                                        <span className="text-[8px] bg-teal-500/10 text-teal-400 px-1 py-0.2 rounded font-mono">
                                          Free
                                        </span>
                                      ) : null}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Tree Navigation Footer */}
      <div className={`px-3 py-2 border-t text-[11px] flex justify-between items-center shrink-0 ${
        isDark ? 'bg-slate-950/80 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
      }`}>
        <span className="text-[10px] text-slate-500">Standar PAAI 2019</span>
        <span className="text-[10px] text-teal-500/90 font-mono font-medium">12 Sistem Anatomi</span>
      </div>

    </div>
  );
}
