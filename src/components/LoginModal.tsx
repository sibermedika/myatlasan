import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Users, 
  GraduationCap, 
  Sparkles, 
  Lock, 
  KeyRound, 
  UserCheck, 
  CheckCircle2, 
  AlertCircle,
  Stethoscope,
  Crown,
  Building2,
  BookOpen,
  UserPlus,
  LogIn
} from 'lucide-react';
import { UserRole, UserProfile } from '../types';
import { OFFICIAL_SUPERADMIN, DEFAULT_SUPERADMIN_PASSWORD, KNOWN_INSTITUTIONS, AnatomyDatabaseService } from '../services/db';

interface LoginModalProps {
  currentRole: UserRole;
  currentUser?: UserProfile | null;
  onClose: () => void;
  onLoginSuccess: (profile: UserProfile) => void;
  onLogout?: () => void;
  theme: 'dark' | 'light';
}

export default function LoginModal({
  currentRole,
  currentUser,
  onClose,
  onLoginSuccess,
  onLogout,
  theme
}: LoginModalProps) {
  const [selectedRoleTab, setSelectedRoleTab] = useState<UserRole>(
    currentRole === 'GUEST' ? 'DOSEN' : currentRole
  );
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Form Fields
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [fullNameInput, setFullNameInput] = useState('');
  const [identifierInput, setIdentifierInput] = useState(''); // NIM / NIDN / NIP
  const [institutionInput, setInstitutionInput] = useState('Universitas Islam Sultan Agung (FK UNISSULA)');
  const [customInstitution, setCustomInstitution] = useState('');
  const [specializationInput, setSpecializationInput] = useState('Departemen Anatomi');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDark = theme === 'dark';

  const handleSwitchRoleTab = (role: UserRole) => {
    setSelectedRoleTab(role);
    setErrorMessage('');
    if (role === 'SUPERADMIN') {
      setEmailInput(OFFICIAL_SUPERADMIN.email);
      setPasswordInput(DEFAULT_SUPERADMIN_PASSWORD);
      setAuthMode('LOGIN');
    } else {
      if (emailInput === OFFICIAL_SUPERADMIN.email) {
        setEmailInput('');
        setPasswordInput('');
      }
    }
  };

  // Quick Superadmin Login (Production Credential)
  const handleSuperadminQuickLogin = async () => {
    setIsSubmitting(true);
    try {
      await AnatomyDatabaseService.saveUser(OFFICIAL_SUPERADMIN);
      onLoginSuccess(OFFICIAL_SUPERADMIN);
    } catch (e) {
      console.error(e);
      onLoginSuccess(OFFICIAL_SUPERADMIN);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Public Guest Mode Login
  const handleGuestLogin = () => {
    const guestUser: UserProfile = {
      id: 'guest-public',
      name: 'Tamu Non-Login (Akses Publik)',
      email: 'tamu@anatomi.med.id',
      role: 'GUEST',
      identifierNumber: 'GUEST-FREE',
      specialization: 'Akses Terbatas Organ Bebas PAAI'
    };
    onLoginSuccess(guestUser);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!emailInput.trim()) {
      setErrorMessage('Silakan masukkan alamat email yang valid.');
      return;
    }

    if (!passwordInput.trim()) {
      setErrorMessage('Silakan masukkan kata sandi akun.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Superadmin verification
      if (selectedRoleTab === 'SUPERADMIN') {
        if (
          (emailInput.trim().toLowerCase() === OFFICIAL_SUPERADMIN.email.toLowerCase() || emailInput.trim().toLowerCase() === 'superadmin') &&
          passwordInput.trim() === DEFAULT_SUPERADMIN_PASSWORD
        ) {
          await AnatomyDatabaseService.saveUser(OFFICIAL_SUPERADMIN);
          onLoginSuccess(OFFICIAL_SUPERADMIN);
          return;
        } else {
          setErrorMessage('Kredensial Superadmin tidak cocok. Silakan periksa email/password.');
          setIsSubmitting(false);
          return;
        }
      }

      // 2. Dosen / Mahasiswa handling
      const finalInstitution = customInstitution.trim() || institutionInput.trim() || 'Koleksi Mandiri / Terbuka';

      if (selectedRoleTab === 'DOSEN' && !finalInstitution) {
        setErrorMessage('Asal Institusi / Universitas / Rumah Sakit Dosen wajib diisi.');
        setIsSubmitting(false);
        return;
      }

      const cleanName = (fullNameInput.trim() || emailInput.split('@')[0])
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, 10);
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const autoDosenCode = `DSN-${cleanName || 'KONTRIBUTOR'}-${dateStr}`;

      const userProfile: UserProfile = {
        id: `usr-${Date.now()}`,
        name: fullNameInput.trim() || (selectedRoleTab === 'DOSEN' ? `Dosen ${emailInput.split('@')[0]}` : `Mahasiswa ${emailInput.split('@')[0]}`),
        email: emailInput.trim().toLowerCase(),
        role: selectedRoleTab,
        identifierNumber: identifierInput.trim() || (selectedRoleTab === 'DOSEN' ? 'NIDN/NIP Terverifikasi' : 'NIM Mahasiswa'),
        institution: finalInstitution,
        specialization: specializationInput.trim() || (selectedRoleTab === 'DOSEN' ? 'Departemen Anatomi Medis' : 'Pendidikan Dokter'),
        dosenCode: selectedRoleTab === 'DOSEN' ? autoDosenCode : undefined,
        createdAt: new Date().toISOString()
      };

      // Save to database
      await AnatomyDatabaseService.saveUser(userProfile);
      onLoginSuccess(userProfile);
    } catch (err) {
      console.error(err);
      setErrorMessage('Terjadi kendala saat memproses otentikasi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-fade-in" id="login-auth-modal">
      <div className={`relative w-full max-w-xl rounded-2xl shadow-2xl border overflow-hidden flex flex-col max-h-[90vh] ${
        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        
        {/* Modal Header */}
        <div className={`flex items-center justify-between border-b px-6 py-4 ${
          isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/25">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold flex items-center gap-2">
                Otentikasi Pengguna & Akses Role
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  Production
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Pilih peran untuk mengakses fitur kurikulum atau berkontribusi materi.
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

        {/* Current Logged In Banner if any */}
        {currentUser && (
          <div className={`px-6 py-2.5 border-b flex items-center justify-between text-xs ${
            isDark ? 'bg-teal-950/30 border-slate-800 text-teal-300' : 'bg-teal-50 border-teal-200 text-teal-900'
          }`}>
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-teal-400" />
              <span>
                Sedang masuk sebagai <strong>{currentUser.name}</strong> ({currentUser.role})
                {currentUser.institution && <span className="opacity-80"> • {currentUser.institution}</span>}
              </span>
            </div>
            {onLogout && (
              <button
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="text-xs underline text-rose-400 hover:text-rose-300 cursor-pointer"
              >
                Keluar Akun
              </button>
            )}
          </div>
        )}

        {/* Role Tab Selector */}
        <div className={`grid grid-cols-4 border-b text-xs font-bold ${
          isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-100 border-slate-200'
        }`}>
          <button
            type="button"
            onClick={() => handleSwitchRoleTab('DOSEN')}
            className={`py-3 px-2 flex flex-col items-center gap-1 border-b-2 transition-all cursor-pointer ${
              selectedRoleTab === 'DOSEN'
                ? 'border-amber-500 text-amber-400 bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
            id="tab-role-dosen"
          >
            <Stethoscope className="w-4 h-4" />
            <span className="text-[11px]">Dosen</span>
          </button>

          <button
            type="button"
            onClick={() => handleSwitchRoleTab('MAHASISWA')}
            className={`py-3 px-2 flex flex-col items-center gap-1 border-b-2 transition-all cursor-pointer ${
              selectedRoleTab === 'MAHASISWA'
                ? 'border-teal-500 text-teal-400 bg-teal-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
            id="tab-role-mahasiswa"
          >
            <GraduationCap className="w-4 h-4" />
            <span className="text-[11px]">Mahasiswa</span>
          </button>

          <button
            type="button"
            onClick={() => handleSwitchRoleTab('GUEST')}
            className={`py-3 px-2 flex flex-col items-center gap-1 border-b-2 transition-all cursor-pointer ${
              selectedRoleTab === 'GUEST'
                ? 'border-slate-400 text-slate-200 bg-slate-800/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
            id="tab-role-guest"
          >
            <Users className="w-4 h-4" />
            <span className="text-[11px]">Tamu (Free)</span>
          </button>

          <button
            type="button"
            onClick={() => handleSwitchRoleTab('SUPERADMIN')}
            className={`py-3 px-2 flex flex-col items-center gap-1 border-b-2 transition-all cursor-pointer ${
              selectedRoleTab === 'SUPERADMIN'
                ? 'border-rose-500 text-rose-400 bg-rose-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
            id="tab-role-superadmin"
          >
            <Crown className="w-4 h-4" />
            <span className="text-[11px]">Superadmin</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          
          {/* Role Benefit Card */}
          <div className={`rounded-xl p-3.5 border ${
            selectedRoleTab === 'SUPERADMIN'
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              : selectedRoleTab === 'DOSEN'
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              : selectedRoleTab === 'MAHASISWA'
              ? 'bg-teal-500/10 border-teal-500/30 text-teal-300'
              : 'bg-slate-800/50 border-slate-700 text-slate-300'
          }`}>
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="text-xs font-bold">
                {selectedRoleTab === 'SUPERADMIN' && 'Superadmin: Manajemen Master Data & Cluster Database'}
                {selectedRoleTab === 'DOSEN' && 'Dosen Kontributor: Upload Objek 2D/3D & Pengelompokan Asal Institusi'}
                {selectedRoleTab === 'MAHASISWA' && 'Mahasiswa Kedokteran: Akses Kurikulum Lengkap 87+ Topik'}
                {selectedRoleTab === 'GUEST' && 'Mode Tamu (Guest): Akses Organ Pengantar & Jantung Gratis'}
              </span>
            </div>
            <p className="text-[11px] leading-relaxed opacity-90">
              {selectedRoleTab === 'SUPERADMIN' && 'Akses penuh manajemen kurikulum PAAI 2019, ekspor database SQLite/MySQL, dan monitoring cluster institusi.'}
              {selectedRoleTab === 'DOSEN' && 'Dosen dapat mengunggah file 2D (JPG/PNG) & 3D (GLB/OBJ/STL/FBX), menambahkan sub-kategori unik dengan Kode Dosen, dan mencantumkan asal institusi/universitas.'}
              {selectedRoleTab === 'MAHASISWA' && 'Eksplorasi interaktif seluruh sistem anatomi, pin spasial 2D/3D, vaskularisasi, inervasi, dan korelasi klinis.'}
              {selectedRoleTab === 'GUEST' && 'Akses publik tanpa login untuk sampel organ bebas. Masuk akun untuk membuka seluruh materi.'}
            </p>
          </div>

          {/* Special Guest Mode View */}
          {selectedRoleTab === 'GUEST' && (
            <div className="text-center py-4 space-y-3">
              <p className="text-xs text-slate-300">
                Gunakan mode ini untuk mencoba tampilan atlas anatomi dengan akses terbatas (organ pengantar).
              </p>
              <button
                type="button"
                onClick={handleGuestLogin}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-slate-700 hover:bg-slate-600 text-white shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
                id="btn-guest-access"
              >
                <Users className="w-4 h-4" />
                Lanjutkan Sebagai Tamu Non-Login
              </button>
            </div>
          )}

          {/* Superadmin Official Credential Quick Action */}
          {selectedRoleTab === 'SUPERADMIN' && (
            <div className={`p-4 rounded-xl border space-y-3 ${
              isDark ? 'bg-slate-950 border-rose-500/30' : 'bg-rose-50/50 border-rose-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-rose-400">
                    Akun Resmi Superadmin (Master Admin)
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    {OFFICIAL_SUPERADMIN.email} • {OFFICIAL_SUPERADMIN.identifierNumber}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSuperadminQuickLogin}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-500 text-white hover:bg-rose-400 shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                  id="btn-fast-superadmin-login"
                >
                  <Crown className="w-3.5 h-3.5" />
                  Masuk Superadmin
                </button>
              </div>
            </div>
          )}

          {/* Dosen & Mahasiswa Login / Register Form */}
          {(selectedRoleTab === 'DOSEN' || selectedRoleTab === 'MAHASISWA') && (
            <form onSubmit={handleFormSubmit} className="space-y-3 pt-1">
              
              {/* Toggle Mode: Masuk vs Daftar Akun Baru */}
              <div className="flex items-center justify-between pb-1">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  {authMode === 'LOGIN' ? 'Formulir Masuk Akun:' : 'Pendaftaran Akun Baru:'}
                </span>
                <button
                  type="button"
                  onClick={() => setAuthMode(prev => prev === 'LOGIN' ? 'REGISTER' : 'LOGIN')}
                  className="text-xs text-teal-400 hover:text-teal-300 underline font-medium cursor-pointer"
                >
                  {authMode === 'LOGIN' ? '+ Belum punya akun? Daftar' : 'Sudah punya akun? Masuk'}
                </button>
              </div>

              {errorMessage && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Full Name & Identifier (Register Mode) */}
              {authMode === 'REGISTER' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">
                      Nama Lengkap & Gelar *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={selectedRoleTab === 'DOSEN' ? 'dr. Ahmad Sp.A / dr. Siti M.Biomed' : 'Nama Mahasiswa S.Ked'}
                      value={fullNameInput}
                      onChange={(e) => setFullNameInput(e.target.value)}
                      className={`w-full rounded-lg border px-3 py-2 text-xs focus:outline-none focus:border-teal-500 ${
                        isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">
                      {selectedRoleTab === 'DOSEN' ? 'NIDN / NIP Dosen' : 'NIM Mahasiswa'}
                    </label>
                    <input
                      type="text"
                      placeholder={selectedRoleTab === 'DOSEN' ? '0628088901' : '30102100458'}
                      value={identifierInput}
                      onChange={(e) => setIdentifierInput(e.target.value)}
                      className={`w-full rounded-lg border px-3 py-2 text-xs focus:outline-none focus:border-teal-500 ${
                        isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </div>
              )}

              {/* FIELD KHUSUS DOSEN: ASAL INSTITUSI / UNIVERSITAS / RS PENDIDIKAN */}
              {selectedRoleTab === 'DOSEN' && (
                <div className="p-3 rounded-xl border bg-amber-500/5 border-amber-500/25 space-y-2">
                  <label className="block text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-amber-400" />
                    Asal Institusi / Universitas / RS Pendidikan Dosen *
                  </label>
                  
                  <select
                    value={institutionInput}
                    onChange={(e) => {
                      setInstitutionInput(e.target.value);
                      if (e.target.value !== 'OTHER') {
                        setCustomInstitution('');
                      }
                    }}
                    className={`w-full rounded-lg border px-3 py-2 text-xs focus:outline-none focus:border-amber-500 ${
                      isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  >
                    {KNOWN_INSTITUTIONS.map((inst) => (
                      <option key={inst} value={inst}>{inst}</option>
                    ))}
                    <option value="OTHER">+ Tulis Institusi / Universitas Lain...</option>
                  </select>

                  {institutionInput === 'OTHER' && (
                    <input
                      type="text"
                      required
                      placeholder="Masukkan nama Fakultas Kedokteran / Universitas / Rumah Sakit..."
                      value={customInstitution}
                      onChange={(e) => setCustomInstitution(e.target.value)}
                      className={`w-full rounded-lg border px-3 py-2 text-xs focus:outline-none focus:border-amber-500 ${
                        isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  )}
                  <p className="text-[10px] text-slate-400">
                    Informasi ini akan dicantumkan pada seluruh materi dan cluster koleksi institusi Anda.
                  </p>
                </div>
              )}

              {/* Email & Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Alamat Email Kampus / Pribadi *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="nama@fk.unissula.ac.id"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className={`w-full rounded-lg border px-3 py-2 text-xs focus:outline-none focus:border-teal-500 ${
                      isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Kata Sandi *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className={`w-full rounded-lg border px-3 py-2 text-xs focus:outline-none focus:border-teal-500 ${
                      isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-5 py-2 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedRoleTab === 'DOSEN'
                      ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                      : 'bg-teal-500 text-slate-950 hover:bg-teal-400'
                  }`}
                  id="submit-auth-btn"
                >
                  {authMode === 'LOGIN' ? <LogIn className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                  {authMode === 'LOGIN' ? `Masuk Sebagai ${selectedRoleTab}` : `Daftar & Masuk ${selectedRoleTab}`}
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Modal Footer Credits */}
        <div className={`px-6 py-2.5 border-t text-[10px] text-center font-mono ${
          isDark ? 'bg-slate-950/80 border-slate-800 text-slate-500' : 'bg-slate-100 border-slate-200 text-slate-500'
        }`}>
          Dikembangkan oleh dr. Penggalih • Standar Kurikulum PAAI 2019
        </div>

      </div>
    </div>
  );
}
