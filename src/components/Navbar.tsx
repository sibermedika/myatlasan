import React from 'react';
import { 
  Search, 
  RotateCcw, 
  UserCheck, 
  Activity, 
  Menu, 
  Sun, 
  Moon, 
  LogIn, 
  ShieldCheck, 
  Crown, 
  GraduationCap, 
  Users,
  Info,
  Sparkles,
  Building2,
  Monitor,
  Server,
  Plus,
  Box
} from 'lucide-react';
import { UserRole, UserProfile } from '../types';

interface NavbarProps {
  currentRole: UserRole;
  currentUser: UserProfile | null;
  onOpenLoginModal: () => void;
  onOpenSuperadminModal?: () => void;
  onOpenSecretAdmin?: () => void;
  onOpenClusterModal?: () => void;
  onOpenAboutModal?: () => void;
  onOpenWindowsModal?: () => void;
  onAddOrgan?: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onResetData: () => void;
  onToggleSidebar?: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export default function Navbar({
  currentRole,
  currentUser,
  onOpenLoginModal,
  onOpenSuperadminModal,
  onOpenSecretAdmin,
  onOpenClusterModal,
  onOpenAboutModal,
  onOpenWindowsModal,
  onAddOrgan,
  searchQuery,
  onSearchChange,
  onResetData,
  onToggleSidebar,
  theme,
  onToggleTheme
}: NavbarProps) {
  const isDark = theme === 'dark';
  const isAdmin = currentRole === 'ADMIN' || currentRole === 'SUPERADMIN';
  const isDosen = currentRole === 'DOSEN';

  return (
    <header className={`h-16 px-4 flex items-center justify-between z-20 shrink-0 border-b shadow-md transition-colors ${
      isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
    }`} id="main-header">
      
      {/* Left Section: Logo & System Brand */}
      <div className="flex items-center space-x-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className={`flex h-9 w-9 items-center justify-center rounded-xl border md:hidden cursor-pointer active:scale-95 transition-transform shrink-0 ${
              isDark ? 'border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white' : 'border-slate-300 text-slate-600 hover:bg-slate-100'
            }`}
            title="Buka Navigasi Anatomi"
            id="mobile-sidebar-toggle-btn"
          >
            <Menu className="h-4.5 w-4.5" />
          </button>
        )}

        {/* Secret / Role Trigger: Click on Logo Icon */}
        <button
          onClick={onOpenSecretAdmin}
          className="bg-teal-500/15 border border-teal-500/30 p-2 rounded-xl text-teal-400 font-bold shrink-0 shadow-sm hover:bg-teal-500/25 active:scale-95 transition-all cursor-pointer focus:outline-none"
          title="AnatoVerse Medical Engine"
          id="navbar-brand-secret-trigger"
          type="button"
        >
          <Activity className="w-5 h-5" />
        </button>
        
        <div>
          <div className="flex items-center gap-2">
            <h1 
              onClick={onOpenSecretAdmin}
              className="font-bold text-sm sm:text-base leading-tight flex items-center gap-1.5 cursor-pointer select-none"
            >
              AnatoVerse
              <span className="text-[9px] bg-teal-500/20 text-teal-300 px-1.5 py-0.2 rounded font-mono border border-teal-500/30 hidden sm:inline-block">
                PAAI 2019
              </span>
            </h1>
            
            {/* Open Multi-Institusi info badge */}
            <span 
              onClick={onOpenAboutModal}
              className="text-[10px] font-medium bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full cursor-pointer hover:bg-indigo-500/25 transition-colors hidden md:inline-flex items-center gap-1"
              title="Informasi Platform & Multi-Institusi"
            >
              <Sparkles className="w-3 h-3 text-indigo-400" />
              <span>Multi-Institusi</span>
            </span>
          </div>
          <p className="text-[10px] sm:text-xs text-slate-400 truncate max-w-[200px] sm:max-w-none">
            Atlas Anatomi 2D & 3D (FBX/OBJ/GLB/3DS)
          </p>
        </div>
      </div>

      {/* Center Section: Search Bar */}
      <div className="relative w-1/4 lg:w-1/3 hidden md:block">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Cari organ, sistem, kode dosen, institusi, atau istilah latin..." 
          className={`w-full text-xs rounded-xl pl-9 pr-4 py-2 border focus:outline-none focus:border-teal-500 transition-colors ${
            isDark 
              ? 'bg-slate-950 text-slate-200 border-slate-800 placeholder:text-slate-500' 
              : 'bg-slate-100 text-slate-900 border-slate-300 placeholder:text-slate-500'
          }`}
          id="searchInput"
        />
      </div>

      {/* Right Section: Action Controls */}
      <div className="flex items-center space-x-1.5 sm:space-x-2">
        
        {/* Cloud & Localhost Installation Guide Button */}
        {onOpenWindowsModal && (
          <button
            onClick={onOpenWindowsModal}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-sm cursor-pointer shrink-0 ${
              isDark
                ? 'bg-teal-500/10 text-teal-300 border-teal-500/30 hover:bg-teal-500/20'
                : 'bg-teal-50 text-teal-900 border-teal-300 hover:bg-teal-100'
            }`}
            title="Panduan Instalasi & Deployment di Cloud (Docker/VPS) atau Localhost (Port 3030)"
            id="navbar-windows-btn"
          >
            <Server className="w-4 h-4 text-teal-400" />
            <span className="hidden xl:inline">Instalasi (Cloud/Local)</span>
          </button>
        )}

        {/* Cluster Institusi View Button */}
        {onOpenClusterModal && (
          <button
            onClick={onOpenClusterModal}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-sm cursor-pointer shrink-0 ${
              isDark
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
            }`}
            title="Lihat Koleksi Berdasarkan Cluster Institusi"
            id="navbar-cluster-btn"
          >
            <Building2 className="w-4 h-4 text-amber-400" />
            <span className="hidden lg:inline">Cluster FK</span>
          </button>
        )}

        {/* Dosen / Admin: Tambah Konten 3D Button */}
        {(isDosen || isAdmin) && onAddOrgan && (
          <button
            onClick={onAddOrgan}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold shadow-md hover:bg-amber-400 transition-all cursor-pointer shrink-0"
            title="Tambah Konten 3D & Organ Baru"
            id="navbar-add-3d-btn"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span className="hidden sm:inline">Tambah 3D</span>
          </button>
        )}

        {/* Admin Console: Master Data Button */}
        {isAdmin && onOpenSuperadminModal && (
          <button
            onClick={onOpenSuperadminModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-rose-500 text-white text-xs font-bold shadow-md hover:bg-rose-400 transition-all cursor-pointer shrink-0"
            title="Kelola Master Data (Wewenang Admin)"
            id="navbar-superadmin-btn"
          >
            <Crown className="w-4 h-4" />
            <span className="hidden sm:inline">Master Data</span>
          </button>
        )}

        {/* Dark / Light Mode Toggle */}
        <button
          onClick={onToggleTheme}
          className={`p-2 rounded-xl border transition-colors cursor-pointer active:scale-95 shrink-0 ${
            isDark 
              ? 'border-slate-800 text-amber-400 bg-slate-950 hover:bg-slate-800' 
              : 'border-slate-300 text-indigo-600 bg-slate-100 hover:bg-slate-200'
          }`}
          title={isDark ? 'Beralih ke Mode Terang (Light Mode)' : 'Beralih ke Mode Gelap (Dark Mode)'}
          id="theme-toggle-btn"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Role & User Login Trigger Button */}
        <button
          onClick={onOpenLoginModal}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-sm cursor-pointer shrink-0 ${
            isAdmin
              ? 'bg-rose-500/15 text-rose-400 border-rose-500/30 hover:bg-rose-500/25'
              : isDosen
              ? 'bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/25'
              : isDark 
              ? 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800' 
              : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
          }`}
          id="navbar-auth-btn"
        >
          {isAdmin ? (
            <Crown className="w-4 h-4 text-rose-400 shrink-0" />
          ) : isDosen ? (
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
          ) : (
            <LogIn className="w-4 h-4 text-slate-400 shrink-0" />
          )}

          <div className="text-left hidden sm:block leading-tight">
            <div className="text-[11px] font-bold truncate max-w-[120px]">
              {currentUser?.name || (isAdmin ? 'Admin' : isDosen ? 'Dosen' : 'Masuk Akun')}
            </div>
            <div className="text-[9px] opacity-80 font-mono">
              {isAdmin ? 'Admin (Master Data)' : isDosen ? 'Dosen (Konten 3D)' : 'Pilih Peran'}
            </div>
          </div>
        </button>

        {/* Reset Data Button */}
        <button 
          onClick={onResetData} 
          title="Reset Data ke Default Bawaan" 
          className={`p-2 rounded-xl border transition-colors cursor-pointer active:scale-95 shrink-0 ${
            isDark 
              ? 'text-slate-400 hover:text-rose-400 border-slate-800 hover:border-rose-500/50 bg-slate-950' 
              : 'text-slate-600 hover:text-rose-600 border-slate-300 hover:border-rose-400 bg-slate-100'
          }`}
          id="reset-data-btn"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

    </header>
  );
}
