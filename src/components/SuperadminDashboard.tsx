import React, { useState, useEffect } from 'react';
import { 
  X, 
  Crown, 
  Plus, 
  Trash2, 
  Edit3, 
  Search, 
  Database, 
  FolderTree, 
  Download, 
  Upload, 
  RotateCcw, 
  CheckCircle, 
  AlertTriangle,
  Users,
  Building2,
  FileCode2,
  ChevronRight,
  Shield,
  GraduationCap,
  UserCheck,
  Check,
  UserPlus,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  LogOut
} from 'lucide-react';
import { Organ, UserProfile, UserRole } from '../types';
import { AnatomyDatabaseService, OFFICIAL_SUPERADMIN } from '../services/db';
import { comparePaaiSystems, comparePaaiSubSystems } from './TreeNavigation';

interface SuperadminDashboardProps {
  organs: Organ[];
  onClose: () => void;
  onAddOrgan: () => void;
  onEditOrgan: (organ: Organ) => void;
  onDeleteOrgan: (organId: string) => void;
  onResetMasterData: () => void;
  onImportMasterData: (jsonData: Organ[]) => void;
  onLogout?: () => void;
  currentUser?: UserProfile | null;
  theme: 'dark' | 'light';
}

export default function SuperadminDashboard({
  organs,
  onClose,
  onAddOrgan,
  onEditOrgan,
  onDeleteOrgan,
  onResetMasterData,
  onImportMasterData,
  onLogout,
  currentUser,
  theme
}: SuperadminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'USERS' | 'ORGANS' | 'SUBCATEGORIES' | 'CLUSTERS' | 'DATA_TOOLS'>('USERS');
  
  // Organ Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [systemFilter, setSystemFilter] = useState<string>('ALL');

  // User Management State
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('ALL');
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [userSuccessMessage, setUserSuccessMessage] = useState<string | null>(null);
  const [showUserFormPassword, setShowUserFormPassword] = useState(false);

  // Reset Password State
  const [resettingUser, setResettingUser] = useState<UserProfile | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  // New User Form State
  const [userForm, setUserForm] = useState<Partial<UserProfile>>({
    name: '',
    email: '',
    password: '',
    role: 'MAHASISWA',
    institution: '',
    identifierNumber: '',
    specialization: '',
    dosenCode: ''
  });

  const isDark = theme === 'dark';

  // Load Users from Database
  const refreshUsers = async () => {
    try {
      const dbUsers = await AnatomyDatabaseService.getAllUsers();
      setUsersList(dbUsers);
    } catch (e) {
      console.error('Failed to load users:', e);
      setUsersList([OFFICIAL_SUPERADMIN]);
    }
  };

  useEffect(() => {
    refreshUsers();
  }, []);

  // Filter Organs
  const filteredOrgans = organs.filter(organ => {
    const matchesSearch = 
      organ.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      organ.latinName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      organ.subSystem.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (organ.institution && organ.institution.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (organ.dosenCode && organ.dosenCode.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesSystem = systemFilter === 'ALL' || organ.system === systemFilter;

    return matchesSearch && matchesSystem;
  });

  // Filter Users
  const filteredUsers = usersList.filter(user => {
    const query = userSearchTerm.toLowerCase();
    const matchesSearch = 
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      (user.identifierNumber && user.identifierNumber.toLowerCase().includes(query)) ||
      (user.institution && user.institution.toLowerCase().includes(query)) ||
      (user.dosenCode && user.dosenCode.toLowerCase().includes(query));

    const matchesRole = userRoleFilter === 'ALL' || user.role === userRoleFilter;

    return matchesSearch && matchesRole;
  });

  // Unique systems sorted strictly by PAAI
  const uniqueSystems = Array.from(new Set(organs.map(o => o.system))).sort(comparePaaiSystems);

  // Statistics
  const totalOrgans = organs.length;
  const total3DModels = organs.filter(o => o.mediaType?.includes('3d') || o.imageUrl?.includes('sketchfab')).length;
  const uniqueInstitutions = Array.from(new Set(organs.map(o => o.institution || 'Koleksi Mandiri / Terbuka')));
  const institutionClusters = AnatomyDatabaseService.computeInstitutionClusters(organs);

  // Handle Save User (Create or Update)
  const handleSaveUserForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.name || !userForm.email || !userForm.role) {
      alert('Nama, Email, dan Role wajib diisi.');
      return;
    }

    const userId = editingUser ? editingUser.id : `user-${Date.now()}`;
    const userToSave: UserProfile = {
      id: userId,
      name: userForm.name.trim(),
      email: userForm.email.trim().toLowerCase(),
      password: userForm.password?.trim() ? userForm.password.trim() : (editingUser?.password || 'anatomi2026'),
      role: (userForm.role as UserRole) || 'MAHASISWA',
      institution: userForm.institution?.trim() || '',
      identifierNumber: userForm.identifierNumber?.trim() || '',
      specialization: userForm.specialization?.trim() || '',
      dosenCode: userForm.dosenCode?.trim() || (userForm.role === 'DOSEN' ? `DOSEN-${Date.now().toString().slice(-4)}` : undefined),
      createdAt: editingUser ? editingUser.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await AnatomyDatabaseService.saveUser(userToSave);
      await refreshUsers();
      setIsAddingUser(false);
      setEditingUser(null);
      setUserSuccessMessage(
        `Pengguna "${userToSave.name}" (${userToSave.role}) berhasil disimpan! Gunakan Email: "${userToSave.email}" atau ID: "${userToSave.identifierNumber || userToSave.name}" dengan Kata Sandi: "${userToSave.password}" untuk masuk.`
      );
      setTimeout(() => setUserSuccessMessage(null), 8000);
    } catch (err) {
      console.error('Error saving user:', err);
      alert('Gagal menyimpan pengguna ke basis data.');
    }
  };

  // Reset Password Action Handlers
  const handleOpenResetPassword = (user: UserProfile) => {
    setResettingUser(user);
    setNewPassword('');
    setConfirmPassword('');
    setResetError(null);
    setShowNewPassword(false);
  };

  const handleGenerateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    let generated = 'Anato';
    for (let i = 0; i < 4; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    generated += '2026';
    setNewPassword(generated);
    setConfirmPassword(generated);
    setShowNewPassword(true);
    setResetError(null);
  };

  const handleSaveResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingUser) return;

    if (!newPassword.trim()) {
      setResetError('Kata sandi baru tidak boleh kosong.');
      return;
    }

    if (newPassword.trim().length < 4) {
      setResetError('Kata sandi minimal 4 karakter.');
      return;
    }

    if (newPassword.trim() !== confirmPassword.trim()) {
      setResetError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    try {
      const ok = await AnatomyDatabaseService.resetUserPassword(resettingUser.id, newPassword.trim());
      if (ok) {
        await refreshUsers();
        setUserSuccessMessage(`Kata sandi untuk pengguna "${resettingUser.name}" (${resettingUser.email}) berhasil direset!`);
        setResettingUser(null);
        setTimeout(() => setUserSuccessMessage(null), 4000);
      } else {
        setResetError('Gagal mereset kata sandi pada basis data.');
      }
    } catch (err) {
      console.error(err);
      setResetError('Terjadi kesalahan sistem saat mereset kata sandi.');
    }
  };

  // Handle Delete User
  const handleDeleteUser = async (userId: string, userName: string) => {
    if (userId === OFFICIAL_SUPERADMIN.id) {
      alert('Akun Superadmin Utama Sistem tidak dapat dihapus.');
      return;
    }
    if (currentUser && currentUser.id === userId) {
      alert('Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif.');
      return;
    }
    if (!window.confirm(`Konfirmasi penghapusan pengguna "${userName}"? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }

    try {
      await AnatomyDatabaseService.deleteUser(userId);
      await refreshUsers();
      setUserSuccessMessage(`Pengguna "${userName}" berhasil dihapus.`);
      setTimeout(() => setUserSuccessMessage(null), 4000);
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('Gagal menghapus pengguna.');
    }
  };

  // Quick Role Change
  const handleQuickRoleChange = async (user: UserProfile, newRole: UserRole) => {
    if (user.id === OFFICIAL_SUPERADMIN.id && newRole !== 'SUPERADMIN') {
      alert('Peran Superadmin Utama Sistem tidak dapat diturunkan.');
      return;
    }
    const updated: UserProfile = {
      ...user,
      role: newRole,
      dosenCode: (newRole === 'DOSEN' && !user.dosenCode) ? `DOSEN-${Date.now().toString().slice(-4)}` : user.dosenCode
    };
    try {
      await AnatomyDatabaseService.saveUser(updated);
      await refreshUsers();
      setUserSuccessMessage(`Role ${user.name} diperbarui menjadi ${newRole}.`);
      setTimeout(() => setUserSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Failed to change role:', err);
    }
  };

  // Export JSON
  const handleExportJSON = () => {
    const dataStr = JSON.stringify(organs, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AnatoVerse_Master_Data_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Export SQL (SQLite & MySQL Compatible Dump)
  const handleExportSQL = () => {
    const sqlScript = AnatomyDatabaseService.generateSQLiteDump(organs, usersList);
    const blob = new Blob([sqlScript], { type: 'application/sql' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AnatoVerse_Schema_SQLite_MySQL_${new Date().toISOString().slice(0, 10)}.sql`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON handler
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].id) {
          if (window.confirm(`Berhasil memuat berkas JSON dengan ${parsed.length} organ. Terapkan data master ini sekarang?`)) {
            onImportMasterData(parsed);
          }
        } else {
          alert('Format JSON tidak valid atau bukan struktur Master Organ yang sesuai.');
        }
      } catch {
        alert('Gagal membaca berkas JSON. Pastikan format sintaks valid.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-fade-in" id="superadmin-dashboard-modal">
      <div className={`relative w-full max-w-5xl h-[90vh] rounded-xl shadow-2xl border overflow-hidden flex flex-col ${
        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        
        {/* Header Bar */}
        <div className={`flex items-center justify-between border-b px-5 py-3 shrink-0 ${
          isDark ? 'bg-slate-950/90 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/15 text-rose-400 border border-rose-500/30">
              <Crown className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold tracking-wide">
                  Master Data & User Management
                </h2>
                <span className="bg-rose-500/15 text-rose-400 border border-rose-500/30 text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold">
                  SUPERADMIN
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Pusat kendali pengguna, hak akses role, master data PAAI, dan cluster institusi.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'USERS' && (
              <button
                onClick={() => {
                  setUserForm({
                    name: '',
                    email: '',
                    role: 'MAHASISWA',
                    institution: '',
                    identifierNumber: '',
                    specialization: '',
                    dosenCode: ''
                  });
                  setEditingUser(null);
                  setIsAddingUser(true);
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-teal-500 text-slate-950 text-xs font-semibold hover:bg-teal-400 transition-colors cursor-pointer"
                id="btn-add-new-user"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Tambah Pengguna</span>
              </button>
            )}

            {activeTab === 'ORGANS' && (
              <button
                onClick={onAddOrgan}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-teal-500 text-slate-950 text-xs font-semibold hover:bg-teal-400 transition-colors cursor-pointer"
                id="superadmin-add-organ-btn"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Organ</span>
              </button>
            )}

            {onLogout && (
              <button
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 hover:bg-rose-500/25 text-xs font-semibold transition-colors cursor-pointer"
                title="Keluar dari Akses Superadmin ke Mode Publik/Guest"
                id="superadmin-logout-btn"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Keluar Superadmin</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Stats Metrics Ribbon */}
        <div className={`grid grid-cols-4 gap-2 px-5 py-2.5 border-b shrink-0 text-xs ${
          isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50/70 border-slate-200'
        }`}>
          <div className="flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-teal-400" />
            <div>
              <span className="text-slate-400 text-[10px] block">Total Pengguna</span>
              <span className="font-semibold text-xs font-mono">{usersList.length} Akun</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FolderTree className="w-3.5 h-3.5 text-indigo-400" />
            <div>
              <span className="text-slate-400 text-[10px] block">Katalog PAAI</span>
              <span className="font-semibold text-xs font-mono">{totalOrgans} Organ</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5 text-amber-400" />
            <div>
              <span className="text-slate-400 text-[10px] block">Cluster Institusi</span>
              <span className="font-semibold text-xs font-mono">{uniqueInstitutions.length} Kampus</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-rose-400" />
            <div>
              <span className="text-slate-400 text-[10px] block">Model 3D</span>
              <span className="font-semibold text-xs font-mono">{total3DModels} Objek</span>
            </div>
          </div>
        </div>

        {/* Success Alert Banner */}
        {userSuccessMessage && (
          <div className="bg-teal-500/15 border-b border-teal-500/30 text-teal-300 px-5 py-1.5 text-xs flex items-center gap-2 animate-fade-in shrink-0">
            <CheckCircle className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <span>{userSuccessMessage}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className={`flex border-b px-5 gap-1 shrink-0 overflow-x-auto ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100/50 border-slate-200'
        }`}>
          <button
            onClick={() => setActiveTab('USERS')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'USERS'
                ? 'border-teal-500 text-teal-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
            id="tab-superadmin-users"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Pengguna & Role ({usersList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('ORGANS')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'ORGANS'
                ? 'border-teal-500 text-teal-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
            id="tab-superadmin-organs"
          >
            <FolderTree className="w-3.5 h-3.5" />
            <span>Koleksi Organ ({totalOrgans})</span>
          </button>

          <button
            onClick={() => setActiveTab('CLUSTERS')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'CLUSTERS'
                ? 'border-teal-500 text-teal-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
            id="tab-superadmin-clusters"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Cluster Institusi ({uniqueInstitutions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('SUBCATEGORIES')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'SUBCATEGORIES'
                ? 'border-teal-500 text-teal-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
            id="tab-superadmin-subcategories"
          >
            <FolderTree className="w-3.5 h-3.5" />
            <span>Taksonomi PAAI</span>
          </button>

          <button
            onClick={() => setActiveTab('DATA_TOOLS')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'DATA_TOOLS'
                ? 'border-teal-500 text-teal-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
            id="tab-superadmin-datatools"
          >
            <Database className="w-3.5 h-3.5" />
            <span>Backup & SQL Dump</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-5">
          
          {/* TAB 1: USERS & ROLE MANAGEMENT */}
          {activeTab === 'USERS' && (
            <div className="space-y-4">
              
              {/* User Search & Filters */}
              <div className="flex flex-col sm:flex-row gap-2 justify-between items-stretch sm:items-center">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                  <input
                    type="text"
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    placeholder="Cari pengguna berdasarkan nama, email, institusi, NIM/NIDN..."
                    className={`w-full pl-8 pr-3 py-1.5 rounded-lg border text-xs outline-none transition-colors ${
                      isDark 
                        ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-teal-500' 
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-teal-500'
                    }`}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-500">Role:</span>
                    <select
                      value={userRoleFilter}
                      onChange={(e) => setUserRoleFilter(e.target.value)}
                      className={`px-2.5 py-1.5 rounded-lg border text-xs outline-none ${
                        isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      <option value="ALL">Semua Role ({usersList.length})</option>
                      <option value="SUPERADMIN">SUPERADMIN</option>
                      <option value="DOSEN">DOSEN / KONTRIBUTOR</option>
                      <option value="MAHASISWA">MAHASISWA</option>
                      <option value="GUEST">GUEST / UMUM</option>
                    </select>
                  </div>

                  <button
                    onClick={() => {
                      setEditingUser(null);
                      setUserForm({
                        name: '',
                        email: '',
                        password: '',
                        role: 'MAHASISWA',
                        institution: '',
                        identifierNumber: '',
                        specialization: '',
                        dosenCode: ''
                      });
                      setIsAddingUser(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs shadow-sm transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Tambah Pengguna Baru</span>
                  </button>
                </div>
              </div>

              {/* Users Table */}
              <div className={`rounded-xl border overflow-hidden ${
                isDark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-white'
              }`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className={`border-b text-[11px] uppercase tracking-wider ${
                      isDark ? 'bg-slate-950/80 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}>
                      <tr>
                        <th className="px-4 py-2.5">Pengguna</th>
                        <th className="px-3 py-2.5">Role</th>
                        <th className="px-3 py-2.5">Identitas (NIM/NIDN)</th>
                        <th className="px-3 py-2.5">Institusi / Afiliasi</th>
                        <th className="px-3 py-2.5">Kode Dosen</th>
                        <th className="px-4 py-2.5 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 dark:divide-slate-800/60 light:divide-slate-200">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-slate-500 italic">
                            Tidak ada pengguna yang cocok dengan kriteria pencarian.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((user) => {
                          const isSuperadmin = user.role === 'SUPERADMIN';
                          const isDosen = user.role === 'DOSEN';
                          const isMahasiswa = user.role === 'MAHASISWA';

                          return (
                            <tr 
                              key={user.id} 
                              className={`transition-colors ${
                                isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'
                              }`}
                            >
                              <td className="px-4 py-2.5">
                                <div className="font-semibold text-slate-200 dark:text-slate-200 light:text-slate-800">
                                  {user.name}
                                </div>
                                <div className="text-[11px] text-slate-500 font-mono">
                                  {user.email}
                                </div>
                              </td>

                              <td className="px-3 py-2.5">
                                <div className="flex items-center gap-1.5">
                                  <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${
                                    isSuperadmin 
                                      ? 'bg-rose-500/15 text-rose-400 border-rose-500/30' 
                                      : isDosen 
                                      ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                                      : isMahasiswa
                                      ? 'bg-teal-500/15 text-teal-400 border-teal-500/30'
                                      : 'bg-slate-800 text-slate-400 border-slate-700'
                                  }`}>
                                    {user.role}
                                  </span>

                                  {/* Quick Role Switch Dropdown */}
                                  <select
                                    value={user.role}
                                    onChange={(e) => handleQuickRoleChange(user, e.target.value as UserRole)}
                                    disabled={user.id === OFFICIAL_SUPERADMIN.id}
                                    className={`text-[10px] py-0.5 px-1 rounded border outline-none cursor-pointer ${
                                      isDark 
                                        ? 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200' 
                                        : 'bg-white border-slate-300 text-slate-600'
                                    }`}
                                    title="Ganti Role Cepat"
                                  >
                                    <option value="MAHASISWA">MAHASISWA</option>
                                    <option value="DOSEN">DOSEN</option>
                                    <option value="SUPERADMIN">SUPERADMIN</option>
                                    <option value="GUEST">GUEST</option>
                                  </select>
                                </div>
                              </td>

                              <td className="px-3 py-2.5 text-[11px] font-mono text-slate-400">
                                {user.identifierNumber || '-'}
                              </td>

                              <td className="px-3 py-2.5 text-[11px] text-slate-300 dark:text-slate-300 light:text-slate-700 max-w-[180px] truncate">
                                {user.institution || 'Kurikulum PAAI / Konsorsium'}
                              </td>

                              <td className="px-3 py-2.5 text-[11px] font-mono">
                                {user.dosenCode ? (
                                  <span className="text-amber-400/90 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                                    {user.dosenCode}
                                  </span>
                                ) : (
                                  <span className="text-slate-500">-</span>
                                )}
                              </td>

                              <td className="px-4 py-2.5 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  {/* Reset Password Button */}
                                  <button
                                    onClick={() => handleOpenResetPassword(user)}
                                    className="p-1 rounded text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors cursor-pointer"
                                    title={`Reset Kata Sandi untuk ${user.name}`}
                                  >
                                    <KeyRound className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    onClick={() => {
                                      setEditingUser(user);
                                      setUserForm({ ...user, password: '' });
                                      setIsAddingUser(true);
                                    }}
                                    className="p-1 rounded text-slate-400 hover:text-teal-400 hover:bg-slate-800 transition-colors cursor-pointer"
                                    title="Edit Pengguna & Role"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    onClick={() => handleDeleteUser(user.id, user.name)}
                                    disabled={user.id === OFFICIAL_SUPERADMIN.id || (currentUser?.id === user.id)}
                                    className={`p-1 rounded transition-colors cursor-pointer ${
                                      user.id === OFFICIAL_SUPERADMIN.id || (currentUser?.id === user.id)
                                        ? 'text-slate-600 cursor-not-allowed'
                                        : 'text-slate-400 hover:text-rose-400 hover:bg-slate-800'
                                    }`}
                                    title={user.id === OFFICIAL_SUPERADMIN.id ? 'Superadmin Utama tidak dapat dihapus' : 'Hapus Pengguna'}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MASTER ORGANS CRUD */}
          {activeTab === 'ORGANS' && (
            <div className="space-y-4">
              
              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-2 justify-between items-stretch sm:items-center">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Cari organ, nama latin, sub-sistem, dosen..."
                    className={`w-full pl-8 pr-3 py-1.5 rounded-lg border text-xs outline-none transition-colors ${
                      isDark 
                        ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-teal-500' 
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-teal-500'
                    }`}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500">Sistem:</span>
                  <select
                    value={systemFilter}
                    onChange={(e) => setSystemFilter(e.target.value)}
                    className={`px-2.5 py-1.5 rounded-lg border text-xs outline-none ${
                      isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <option value="ALL">Semua 12 Sistem ({organs.length})</option>
                    {uniqueSystems.map(sys => (
                      <option key={sys} value={sys}>{sys}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Organs Table */}
              <div className={`rounded-xl border overflow-hidden ${
                isDark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-white'
              }`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className={`border-b text-[11px] uppercase tracking-wider ${
                      isDark ? 'bg-slate-950/80 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}>
                      <tr>
                        <th className="px-4 py-2.5">Organ & Nama Latin</th>
                        <th className="px-3 py-2.5">Sistem & Sub-Sistem PAAI</th>
                        <th className="px-3 py-2.5">Media</th>
                        <th className="px-3 py-2.5">Pin Hotspot</th>
                        <th className="px-3 py-2.5">Institusi / Dosen</th>
                        <th className="px-4 py-2.5 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 dark:divide-slate-800/60 light:divide-slate-200">
                      {filteredOrgans.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-slate-500 italic">
                            Tidak ada organ yang cocok.
                          </td>
                        </tr>
                      ) : (
                        filteredOrgans.map((organ) => {
                          const is3D = organ.mediaType?.includes('3d') || organ.imageUrl?.includes('sketchfab');
                          return (
                            <tr 
                              key={organ.id} 
                              className={`transition-colors ${
                                isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'
                              }`}
                            >
                              <td className="px-4 py-2.5">
                                <div className="font-semibold text-slate-200 dark:text-slate-200 light:text-slate-800">
                                  {organ.name}
                                </div>
                                <div className="text-[11px] text-teal-400/90 italic font-mono">
                                  {organ.latinName}
                                </div>
                              </td>

                              <td className="px-3 py-2.5">
                                <div className="text-[11px] font-medium text-slate-300 dark:text-slate-300 light:text-slate-700">
                                  {organ.system}
                                </div>
                                <div className="text-[10px] text-slate-500">
                                  {organ.subSystem}
                                </div>
                              </td>

                              <td className="px-3 py-2.5">
                                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                                  is3D 
                                    ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30' 
                                    : 'bg-teal-500/15 text-teal-400 border-teal-500/30'
                                }`}>
                                  {is3D ? '3D Model' : '2D Image'}
                                </span>
                              </td>

                              <td className="px-3 py-2.5 font-mono text-[11px] text-slate-400">
                                {organ.pins?.length || 0} Pin
                              </td>

                              <td className="px-3 py-2.5 text-[11px]">
                                <div className="text-slate-300 dark:text-slate-300 light:text-slate-700 truncate max-w-[150px]">
                                  {organ.institution || 'Kurikulum PAAI'}
                                </div>
                                {organ.dosenCode && (
                                  <div className="text-[10px] text-amber-400 font-mono">
                                    {organ.dosenCode}
                                  </div>
                                )}
                              </td>

                              <td className="px-4 py-2.5 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    onClick={() => onEditOrgan(organ)}
                                    className="p-1 rounded text-slate-400 hover:text-teal-400 hover:bg-slate-800 transition-colors cursor-pointer"
                                    title="Edit Organ"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    onClick={() => {
                                      if (window.confirm(`Hapus organ "${organ.name}" dari basis data?`)) {
                                        onDeleteOrgan(organ.id);
                                      }
                                    }}
                                    className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                                    title="Hapus Organ"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: INSTITUTION CLUSTERS */}
          {activeTab === 'CLUSTERS' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {institutionClusters.map(cluster => (
                  <div
                    key={cluster.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isDark ? 'bg-slate-950/40 border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <span className="text-[10px] font-mono text-teal-400 bg-teal-500/10 px-1.5 py-0.5 rounded border border-teal-500/20">
                          {cluster.shortName}
                        </span>
                        <h4 className="text-xs font-bold mt-1 text-slate-200 dark:text-slate-200 light:text-slate-800">
                          {cluster.name}
                        </h4>
                      </div>
                      <span className="text-xs font-mono font-bold text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded">
                        {cluster.organCount} Organ
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 mt-3 pt-3 border-t border-slate-800/60 dark:border-slate-800/60 light:border-slate-200">
                      <div>
                        <span className="text-slate-500">Model 3D:</span> {cluster.threeDCount}
                      </div>
                      <div>
                        <span className="text-slate-500">Hotspot Pin:</span> {cluster.pinsCount}
                      </div>
                    </div>

                    {cluster.lecturers.length > 0 && (
                      <div className="mt-2 text-[10px] text-slate-500">
                        Kontributor: <span className="text-amber-400/90 font-mono">{cluster.lecturers.join(', ')}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: PAAI TAXONOMY HIERARCHY OVERVIEW */}
          {activeTab === 'SUBCATEGORIES' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                Struktur pohon kurikulum anatomi PAAI disusun secara urut 1 sampai 12 sesuai silabus nasional:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {uniqueSystems.map(systemName => {
                  const systemOrgans = organs.filter(o => o.system === systemName);
                  const subSystems = Array.from(new Set(systemOrgans.map(o => o.subSystem))).sort(comparePaaiSubSystems);
                  
                  return (
                    <div 
                      key={systemName}
                      className={`p-3 rounded-xl border ${
                        isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-bold text-slate-200 dark:text-slate-200 light:text-slate-800 flex items-center gap-1.5">
                          <FolderTree className="w-3.5 h-3.5 text-teal-400" />
                          <span>{systemName}</span>
                        </h4>
                        <span className="text-[10px] font-mono text-slate-500">
                          {systemOrgans.length} materi
                        </span>
                      </div>

                      <div className="space-y-1 pl-3 border-l border-slate-800 dark:border-slate-800 light:border-slate-200">
                        {subSystems.map(subSys => {
                          const subOrgansCount = systemOrgans.filter(o => o.subSystem === subSys).length;
                          return (
                            <div key={subSys} className="text-[11px] flex justify-between text-slate-400">
                              <span className="truncate pr-2">{subSys}</span>
                              <span className="text-[10px] font-mono text-slate-500 shrink-0">
                                {subOrgansCount}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 5: BACKUP & DATABASE TOOLS */}
          {activeTab === 'DATA_TOOLS' && (
            <div className="space-y-4 max-w-3xl">
              
              {/* SQL Backup Card */}
              <div className={`p-4 rounded-xl border ${
                isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <FileCode2 className="w-4 h-4 text-teal-400" />
                      <h4 className="text-xs font-bold text-slate-200 dark:text-slate-200 light:text-slate-800">
                        Ekspor SQLite & MySQL Production Dump (.sql)
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Menghasilkan skrip SQL lengkap (tabel <code>users</code>, <code>institutions</code>, <code>organs</code>, <code>media_files</code>) beserta data riil pengguna dan kurikulum.
                    </p>
                  </div>

                  <button
                    onClick={handleExportSQL}
                    className="px-3 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh .SQL Dump</span>
                  </button>
                </div>
              </div>

              {/* JSON Backup Card */}
              <div className={`p-4 rounded-xl border ${
                isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-indigo-400" />
                      <h4 className="text-xs font-bold text-slate-200 dark:text-slate-200 light:text-slate-800">
                        Master Data JSON (Export & Import)
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Simpan cadangan data kurikulum atau pulihkan data dari berkas JSON eksternal.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={handleExportJSON}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Ekspor JSON</span>
                    </button>

                    <label className="px-2.5 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Impor JSON</span>
                      <input 
                        type="file" 
                        accept=".json" 
                        onChange={handleImportFile} 
                        className="hidden" 
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Reset to Default PAAI */}
              <div className={`p-4 rounded-xl border border-rose-500/20 ${
                isDark ? 'bg-rose-500/5' : 'bg-rose-50/50'
              }`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <RotateCcw className="w-4 h-4 text-rose-400" />
                      <h4 className="text-xs font-bold text-rose-300">
                        Reset Master Data ke Standar Nasional PAAI 2019
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Mengembalikan seluruh koleksi organ ke 87 topik standar kurikulum resmi PAAI Bab V.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      if (window.confirm('PERINGATAN: Seluruh perubahan organ kustom akan direset ke standar PAAI awal. Lanjutkan?')) {
                        onResetMasterData();
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Master Data</span>
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

      {/* MODAL: ADD / EDIT USER FORM */}
      {isAddingUser && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-lg rounded-xl p-5 shadow-2xl border ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between border-b pb-3 mb-4 border-slate-800 dark:border-slate-800 light:border-slate-200">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-teal-400" />
                <h3 className="text-sm font-bold">
                  {editingUser ? 'Edit Pengguna & Hak Akses' : 'Tambah Pengguna Baru'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsAddingUser(false);
                  setEditingUser(null);
                }}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUserForm} className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Nama Lengkap & Gelar *
                </label>
                <input
                  type="text"
                  required
                  value={userForm.name || ''}
                  onChange={(e) => setUserForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Contoh: dr. Nama Pengguna, Sp.A"
                  className={`w-full px-3 py-1.5 rounded-lg border text-xs outline-none ${
                    isDark ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-teal-500' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Email Pengguna *
                  </label>
                  <input
                    type="email"
                    required
                    value={userForm.email || ''}
                    onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="pengguna@fk.ac.id"
                    className={`w-full px-3 py-1.5 rounded-lg border text-xs outline-none ${
                      isDark ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-teal-500' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Role & Hak Akses *
                  </label>
                  <select
                    value={userForm.role || 'MAHASISWA'}
                    onChange={(e) => setUserForm(prev => ({ ...prev, role: e.target.value as UserRole }))}
                    className={`w-full px-3 py-1.5 rounded-lg border text-xs outline-none ${
                      isDark ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-teal-500' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <option value="MAHASISWA">MAHASISWA (Akses Penuh Kurikulum)</option>
                    <option value="DOSEN">DOSEN (Kelola Sub-Kategori & Upload)</option>
                    <option value="SUPERADMIN">SUPERADMIN (Master Data & User Full Control)</option>
                    <option value="GUEST">GUEST (Akses Publik Terbatas)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Nomor Identitas (NIM / NIDN / NIP)
                  </label>
                  <input
                    type="text"
                    value={userForm.identifierNumber || ''}
                    onChange={(e) => setUserForm(prev => ({ ...prev, identifierNumber: e.target.value }))}
                    placeholder="Contoh: 0628048901 / 3010190012"
                    className={`w-full px-3 py-1.5 rounded-lg border text-xs outline-none ${
                      isDark ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-teal-500' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Institusi / Universitas
                  </label>
                  <input
                    type="text"
                    value={userForm.institution || ''}
                    onChange={(e) => setUserForm(prev => ({ ...prev, institution: e.target.value }))}
                    placeholder="Contoh: FK UNISSULA Semarang"
                    className={`w-full px-3 py-1.5 rounded-lg border text-xs outline-none ${
                      isDark ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-teal-500' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-medium text-slate-400">
                    {editingUser ? 'Kata Sandi Baru (Opsional)' : 'Kata Sandi Akun *'}
                  </label>
                  {!editingUser && (
                    <button
                      type="button"
                      onClick={() => setUserForm(prev => ({ ...prev, password: 'anatomi2026' }))}
                      className="text-[10px] text-teal-400 hover:text-teal-300 transition-colors cursor-pointer underline"
                    >
                      Gunakan default: anatomi2026
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showUserFormPassword ? 'text' : 'password'}
                    required={!editingUser}
                    value={userForm.password || ''}
                    onChange={(e) => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                    placeholder={editingUser ? '•••••• (Kosongkan bila tidak ingin mengubah)' : 'Minimal 4 karakter (contoh: anatomi2026)'}
                    className={`w-full pl-3 pr-8 py-1.5 rounded-lg border text-xs outline-none ${
                      isDark ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-teal-500' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowUserFormPassword(!showUserFormPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                    title={showUserFormPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  >
                    {showUserFormPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                {!editingUser && (
                  <p className="text-[10px] text-slate-500 mt-1">
                    Kata sandi ini digunakan oleh pengguna baru saat masuk melalui modal login.
                  </p>
                )}
              </div>

              {userForm.role === 'DOSEN' && (
                <div>
                  <label className="block text-[11px] font-medium text-amber-400 mb-1">
                    Kode Dosen Kontributor (Kombinasi Nama & Tanggal)
                  </label>
                  <input
                    type="text"
                    value={userForm.dosenCode || ''}
                    onChange={(e) => setUserForm(prev => ({ ...prev, dosenCode: e.target.value }))}
                    placeholder="Contoh: DR-PENGGALIH-20260828"
                    className={`w-full px-3 py-1.5 rounded-lg border text-xs font-mono outline-none ${
                      isDark ? 'bg-slate-950 border-slate-800 text-amber-400 focus:border-amber-500' : 'bg-slate-50 border-slate-200 text-amber-600'
                    }`}
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800 dark:border-slate-800 light:border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingUser(false);
                    setEditingUser(null);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:bg-slate-800 text-xs font-medium transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-semibold transition-colors cursor-pointer"
                >
                  {editingUser ? 'Simpan Perubahan' : 'Buat Pengguna'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RESET PASSWORD PENGGUNA (SUPERADMIN) */}
      {resettingUser && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-fade-in" id="reset-password-modal">
          <div className={`w-full max-w-md rounded-2xl p-5 shadow-2xl border ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center justify-between border-b pb-3 mb-4 border-slate-800 dark:border-slate-800 light:border-slate-200">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Reset Kata Sandi Pengguna</h3>
                  <p className="text-[10px] text-slate-400">Otoritas Master Data Superadmin</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setResettingUser(null);
                  setResetError(null);
                }}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Target User Info Summary */}
            <div className={`p-3 rounded-xl border mb-4 text-xs space-y-1.5 ${
              isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Nama Pengguna:</span>
                <span className="font-semibold">{resettingUser.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Email Akun:</span>
                <span className="font-mono text-teal-400">{resettingUser.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Role / Hak Akses:</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                  {resettingUser.role}
                </span>
              </div>
              {resettingUser.identifierNumber && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">NIM / NIDN / NIP:</span>
                  <span className="font-mono text-slate-300">{resettingUser.identifierNumber}</span>
                </div>
              )}
            </div>

            {resetError && (
              <div className="mb-3 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{resetError}</span>
              </div>
            )}

            <form onSubmit={handleSaveResetPassword} className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-medium text-slate-400">
                    Kata Sandi Baru *
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateRandomPassword}
                    className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    Buat Sandi Acak Kuat
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Masukkan kata sandi baru..."
                    className={`w-full pl-3 pr-8 py-2 rounded-lg border text-xs outline-none ${
                      isDark ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-amber-500' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                    title={showNewPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Konfirmasi Kata Sandi Baru *
                </label>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ketik ulang kata sandi baru..."
                  className={`w-full px-3 py-2 rounded-lg border text-xs outline-none ${
                    isDark ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-amber-500' : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800 dark:border-slate-800 light:border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setResettingUser(null);
                    setResetError(null);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:bg-slate-800 text-xs font-medium transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  Simpan & Reset Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
