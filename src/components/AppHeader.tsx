import React from 'react';
import { Activity, Search, Menu, Sun, Moon, LogIn, BookOpen, Settings, Info } from 'lucide-react';
import { UserRole, UserProfile } from '../types';
import { canManageContent } from '../permissions';
interface Props {
  branding?: {name:string;logoUrl:string};
  currentRole: UserRole; currentUser: UserProfile | null;
  onOpenLoginModal: () => void; onOpenSuperadminModal?: () => void;
  onOpenSecretAdmin?: () => void; onOpenClusterModal?: () => void;
  onOpenAboutModal?: () => void; onOpenWindowsModal?: () => void;
  onAddOrgan?: () => void; searchQuery: string; onSearchChange: (value: string) => void;
  onResetData: () => void; onToggleSidebar?: () => void;
  theme: 'dark' | 'light'; onToggleTheme: () => void;
  workspace?: boolean; onShowAtlas?: () => void;
  editing?: boolean; onToggleEditing?: () => void;
  canEditSelected?: boolean;
}
export default function AppHeader(p: Props) {
  const dark = p.theme === 'dark';
  return <header id="main-header" className={`h-16 shrink-0 flex items-center gap-2 px-3 sm:px-5 border-b ${dark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}>
    {!p.workspace && <button onClick={p.onToggleSidebar} aria-label="Buka katalog anatomi" className="md:hidden p-3 rounded-lg"><Menu size={20}/></button>}
    <button onClick={p.onShowAtlas} className="flex items-center gap-2 shrink-0" aria-label="Buka Atlas">{p.branding?.logoUrl ? <img src={p.branding.logoUrl} alt="" className="w-8 h-8 object-contain"/> : <Activity className="text-teal-500" size={24}/>}<span className="font-bold text-base">{p.branding?.name || 'AnatoVerse'}</span></button>
    {!p.workspace && <div className="hidden md:flex relative flex-1 max-w-lg ml-3"><Search className="absolute left-3 top-3 text-slate-400" size={18}/><input id="searchInput" aria-label="Cari anatomi" placeholder="Cari anatomi…" value={p.searchQuery} onChange={e=>p.onSearchChange(e.target.value)} className={`w-full pl-10 pr-3 py-2.5 rounded-xl border text-sm ${dark ? 'bg-slate-950 border-slate-700' : 'bg-slate-50 border-slate-200'}`}/></div>}
    <nav aria-label="Navigasi utama" className="ml-auto flex items-center gap-1 sm:gap-3">
      {!p.workspace && p.canEditSelected && canManageContent(p.currentRole) && <button aria-label={p.editing ? 'Selesai mengedit penanda' : 'Edit penanda'} onClick={p.onToggleEditing} className="text-sm text-teal-500 px-2 py-3"><span className="hidden sm:inline">{p.editing ? 'Selesai edit' : 'Edit penanda'}</span><Settings className="sm:hidden" size={18}/></button>}
      {p.workspace ? <button onClick={p.onShowAtlas} className="flex items-center gap-2 p-2 text-sm"><BookOpen size={18}/><span className="hidden sm:inline">Lihat Atlas</span></button> : canManageContent(p.currentRole) ? <button aria-label="Buka ruang kelola" onClick={p.onOpenSuperadminModal} className="flex items-center gap-2 p-2 text-sm"><Settings size={18}/><span className="hidden sm:inline">Kelola</span></button> : null}
      {!p.workspace && <button onClick={p.onOpenClusterModal} className="hidden lg:block text-sm p-2">Koleksi institusi</button>}
      <button onClick={p.onToggleTheme} className="p-3 rounded-lg" aria-label={dark ? 'Gunakan tema terang' : 'Gunakan tema gelap'}>{dark ? <Sun size={18}/> : <Moon size={18}/>}</button>
      <button id="navbar-about-btn" aria-label="Tentang aplikasi dan kredit" title="Tentang aplikasi dan kredit" onClick={p.onOpenAboutModal} className={`p-3 rounded-lg transition-colors ${dark ? 'hover:bg-slate-800 hover:text-teal-300' : 'hover:bg-slate-100 hover:text-teal-700'}`}><Info size={18}/></button>
      <button id="navbar-auth-btn" aria-label={p.currentUser ? 'Menu akun' : 'Masuk akun'} onClick={p.onOpenLoginModal} className="flex items-center gap-2 rounded-xl border border-slate-500/30 px-3 py-2.5 text-sm"><LogIn size={18}/><span className="hidden sm:block max-w-32 truncate">{p.currentUser?.name || 'Masuk'}</span></button>
    </nav>
  </header>;
}
