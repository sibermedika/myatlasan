import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Crown, 
  UserCheck, 
  CheckCircle2, 
  AlertCircle,
  Stethoscope,
  Building2,
  BookOpen,
  UserPlus,
  LogIn,
  Eye,
  EyeOff,
  Sparkles,
  KeyRound
} from 'lucide-react';
import { UserRole, UserProfile } from '../types';
import { 
  OFFICIAL_SUPERADMIN, 
  OFFICIAL_DOSEN,
  DEFAULT_SUPERADMIN_PASSWORD, 
  DEFAULT_ADMIN_PASSWORD,
  DEFAULT_DOSEN_PASSWORD,
  KNOWN_INSTITUTIONS, 
  AnatomyDatabaseService 
} from '../services/db';

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
  // Only two roles per user requirement: ADMIN and DOSEN
  const [selectedRoleTab, setSelectedRoleTab] = useState<'ADMIN' | 'DOSEN'>(
    currentRole === 'ADMIN' || currentRole === 'SUPERADMIN' ? 'ADMIN' : 'DOSEN'
  );
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Form Fields
  const [emailInput, setEmailInput] = useState(
    selectedRoleTab === 'ADMIN' ? 'admin' : 'dosen'
  );
  const [passwordInput, setPasswordInput] = useState(
    selectedRoleTab === 'ADMIN' ? DEFAULT_ADMIN_PASSWORD : DEFAULT_DOSEN_PASSWORD
  );
  const [showPassword, setShowPassword] = useState(false);
  const [fullNameInput, setFullNameInput] = useState('');
  const [identifierInput, setIdentifierInput] = useState(''); // NIDN / NIP
  const [institutionInput, setInstitutionInput] = useState('Koleksi Mandiri / Terbuka');
  const [customInstitution, setCustomInstitution] = useState('');
  const [specializationInput, setSpecializationInput] = useState('Departemen Anatomi');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDark = theme === 'dark';

  const handleSwitchRoleTab = (role: 'ADMIN' | 'DOSEN') => {
    setSelectedRoleTab(role);
    setErrorMessage('');
    if (role === 'ADMIN') {
      setEmailInput('admin');
      setPasswordInput(DEFAULT_ADMIN_PASSWORD);
      setAuthMode('LOGIN');
    } else {
      setEmailInput('dosen');
      setPasswordInput(DEFAULT_DOSEN_PASSWORD);
      setAuthMode('LOGIN');
    }
  };

  // Quick 1-Click Login for Admin
  const handleAdminQuickLogin = async () => {
    setIsSubmitting(true);
    try {
      const auth = await AnatomyDatabaseService.authenticateUser('admin', DEFAULT_ADMIN_PASSWORD);
      if (auth.success && auth.user) {
        onLoginSuccess({ ...auth.user, role: 'ADMIN' });
      } else {
        const adminProfile: UserProfile = { ...OFFICIAL_SUPERADMIN, role: 'ADMIN' };
        await AnatomyDatabaseService.saveUser(adminProfile);
        onLoginSuccess(adminProfile);
      }
    } catch (e) {
      console.error(e);
      onLoginSuccess({ ...OFFICIAL_SUPERADMIN, role: 'ADMIN' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick 1-Click Login for Dosen
  const handleDosenQuickLogin = async () => {
    setIsSubmitting(true);
    try {
      const auth = await AnatomyDatabaseService.authenticateUser('dosen', DEFAULT_DOSEN_PASSWORD);
      if (auth.success && auth.user) {
        onLoginSuccess(auth.user);
      } else {
        await AnatomyDatabaseService.saveUser(OFFICIAL_DOSEN);
        onLoginSuccess(OFFICIAL_DOSEN);
      }
    } catch (e) {
      console.error(e);
      onLoginSuccess(OFFICIAL_DOSEN);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!emailInput.trim()) {
      setErrorMessage('Silakan masukkan Username / Email / NIDN.');
      return;
    }

    if (!passwordInput.trim()) {
      setErrorMessage('Silakan masukkan kata sandi.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. LOGIN MODE: Validate against database
      if (authMode === 'LOGIN') {
        const authResult = await AnatomyDatabaseService.authenticateUser(emailInput, passwordInput);
        if (!authResult.success || !authResult.user) {
          setErrorMessage(authResult.message || 'Kredensial login tidak cocok.');
          setIsSubmitting(false);
          return;
        }

        onLoginSuccess(authResult.user);
        return;
      }

      // 2. REGISTER MODE: Create new Dosen account
      const finalInstitution = customInstitution.trim() || institutionInput.trim() || 'Koleksi Mandiri / Terbuka';
      
      if (!fullNameInput.trim()) {
        setErrorMessage('Nama lengkap dokter / dosen wajib diisi.');
        setIsSubmitting(false);
        return;
      }

      const cleanCode = identifierInput.trim().toUpperCase() || `DOSEN-${Math.floor(100 + Math.random() * 900)}`;

      const userProfile: UserProfile = {
        id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        name: fullNameInput.trim(),
        email: emailInput.trim(),
        password: passwordInput.trim(),
        role: 'DOSEN',
        identifierNumber: identifierInput.trim() || cleanCode,
        institution: finalInstitution,
        specialization: specializationInput.trim() || 'Dosen Anatomi Klinis',
        dosenCode: cleanCode,
        createdAt: new Date().toISOString()
      };

      await AnatomyDatabaseService.saveUser(userProfile);
      onLoginSuccess(userProfile);
    } catch (err) {
      console.error(err);
      setErrorMessage('Terjadi kendala saat memproses otentikasi akun.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md animate-fade-in" id="login-auth-modal">
      <div className={`relative w-full max-w-lg rounded-2xl shadow-2xl border overflow-hidden flex flex-col max-h-[90vh] ${
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
                Hak Akses Pengguna
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  Admin & Dosen
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Pilih peran untuk mengelola master data atau konten 3D
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
            <div className="flex items-center gap-2 truncate">
              <UserCheck className="w-4 h-4 text-teal-400 shrink-0" />
              <span className="truncate">
                Sedang masuk sebagai <strong>{currentUser.name}</strong> ({currentUser.role})
              </span>
            </div>
            {onLogout && (
              <button
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="text-xs underline text-rose-400 hover:text-rose-300 cursor-pointer shrink-0 ml-2"
              >
                Keluar
              </button>
            )}
          </div>
        )}

        {/* Role Tab Selector: Strictly Admin & Dosen */}
        <div className={`grid grid-cols-2 border-b text-xs font-bold ${
          isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-100 border-slate-200'
        }`}>
          <button
            type="button"
            onClick={() => handleSwitchRoleTab('ADMIN')}
            className={`py-3.5 px-3 flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
              selectedRoleTab === 'ADMIN'
                ? 'border-rose-500 text-rose-400 bg-rose-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
            id="tab-role-admin"
          >
            <Crown className="w-4 h-4" />
            <div className="text-left">
              <div className="text-xs font-bold">Admin</div>
              <div className="text-[10px] font-normal opacity-80">Wewenang Master Data</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleSwitchRoleTab('DOSEN')}
            className={`py-3.5 px-3 flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
              selectedRoleTab === 'DOSEN'
                ? 'border-amber-500 text-amber-400 bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
            id="tab-role-dosen"
          >
            <Stethoscope className="w-4 h-4" />
            <div className="text-left">
              <div className="text-xs font-bold">Dosen</div>
              <div className="text-[10px] font-normal opacity-80">Wewenang Konten 3D</div>
            </div>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          
          {/* Role Authority & Benefit Card */}
          <div className={`rounded-xl p-3.5 border ${
            selectedRoleTab === 'ADMIN'
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
          }`}>
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="text-xs font-bold">
                {selectedRoleTab === 'ADMIN' && 'Wewenang Admin: Mengedit Master Data'}
                {selectedRoleTab === 'DOSEN' && 'Wewenang Dosen: Menambah, Menghapus & Mengedit Konten 3D'}
              </span>
            </div>
            <p className="text-[11px] leading-relaxed opacity-90">
              {selectedRoleTab === 'ADMIN' && 'Admin mengendalikan taksonomi kurikulum nasional PAAI 2019, daftar sistem organ tubuh, daftar institusi universitas, manajemen akun dosen, serta impor/ekspor dan reset basis data.'}
              {selectedRoleTab === 'DOSEN' && 'Dosen memiliki kewenangan penuh untuk mengunggah dan memperbarui objek anatomi 3D (FBX, OBJ, GLB, 3DS), mengunggah folder kontur, menghapus konten 3D, menyematkan embed Sketchfab/GDrive, serta menambahkan penanda pin spasial 3D.'}
            </p>
          </div>

          {/* Quick 1-Click Login Card */}
          <div className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="text-xs">
              <div className="font-bold flex items-center gap-1.5 text-teal-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Masuk Cepat 1-Klik</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {selectedRoleTab === 'ADMIN' ? 'User: admin (Admin Master Data)' : 'User: dosen (dr. Paijo)'}
              </span>
            </div>

            <button
              type="button"
              onClick={selectedRoleTab === 'ADMIN' ? handleAdminQuickLogin : handleDosenQuickLogin}
              disabled={isSubmitting}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-950 shadow-sm transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 disabled:opacity-50 ${
                selectedRoleTab === 'ADMIN' ? 'bg-rose-400 hover:bg-rose-300' : 'bg-amber-400 hover:bg-amber-300'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Masuk Sebagai {selectedRoleTab === 'ADMIN' ? 'Admin' : 'Dosen'}</span>
            </button>
          </div>

          {/* Login / Register Form */}
          <form onSubmit={handleFormSubmit} className="space-y-3 pt-1">
            
            {/* Toggle Mode: Masuk vs Daftar Akun Baru (Dosen only) */}
            {selectedRoleTab === 'DOSEN' && (
              <div className="flex items-center justify-between pb-1">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  {authMode === 'LOGIN' ? 'Masuk dengan Akun Dosen:' : 'Daftarkan Akun Dosen Baru:'}
                </span>
                <button
                  type="button"
                  onClick={() => setAuthMode(prev => prev === 'LOGIN' ? 'REGISTER' : 'LOGIN')}
                  className="text-xs text-amber-400 hover:text-amber-300 underline font-medium cursor-pointer"
                >
                  {authMode === 'LOGIN' ? '+ Daftar Akun Dosen Baru' : 'Sudah punya akun? Masuk'}
                </button>
              </div>
            )}

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Registration specific fields */}
            {authMode === 'REGISTER' && selectedRoleTab === 'DOSEN' && (
              <>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Nama Lengkap & Gelar Dosen *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullNameInput}
                    onChange={(e) => setFullNameInput(e.target.value)}
                    placeholder="misal: dr. Ahmad, Sp.Rad"
                    className={`w-full rounded-xl border px-3 py-2 text-xs focus:outline-none focus:border-amber-500 ${
                      isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-300'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    NIDN / NIP / Kode Dosen
                  </label>
                  <input
                    type="text"
                    value={identifierInput}
                    onChange={(e) => setIdentifierInput(e.target.value)}
                    placeholder="misal: DOSEN-002 atau 06123456"
                    className={`w-full rounded-xl border px-3 py-2 text-xs focus:outline-none focus:border-amber-500 ${
                      isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-300'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Asal Institusi / Universitas Dosen *
                  </label>
                  <select
                    value={institutionInput}
                    onChange={(e) => setInstitutionInput(e.target.value)}
                    className={`w-full rounded-xl border px-3 py-2 text-xs focus:outline-none focus:border-amber-500 ${
                      isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-300'
                    }`}
                  >
                    {KNOWN_INSTITUTIONS.map(inst => (
                      <option key={inst} value={inst}>{inst}</option>
                    ))}
                    <option value="LAINNYA">+ Institusi / Universitas Lainnya...</option>
                  </select>
                  {institutionInput === 'LAINNYA' && (
                    <input
                      type="text"
                      required
                      value={customInstitution}
                      onChange={(e) => setCustomInstitution(e.target.value)}
                      placeholder="Ketikkan nama Institusi / FK Universitas..."
                      className={`w-full mt-2 rounded-xl border px-3 py-2 text-xs focus:outline-none focus:border-amber-500 ${
                        isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-300'
                      }`}
                    />
                  )}
                </div>
              </>
            )}

            {/* Email / Username Field */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Username / Email / Kode
              </label>
              <input
                type="text"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder={selectedRoleTab === 'ADMIN' ? 'admin' : 'dosen atau email...'}
                className={`w-full rounded-xl border px-3 py-2 text-xs focus:outline-none focus:border-teal-500 ${
                  isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-300'
                }`}
                id="login-username-input"
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Kata Sandi
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full rounded-xl border pl-3 pr-9 py-2 text-xs focus:outline-none focus:border-teal-500 ${
                    isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-300'
                  }`}
                  id="login-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
                  isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-teal-500 text-slate-950 hover:bg-teal-400 shadow-md transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                id="login-submit-btn"
              >
                {authMode === 'REGISTER' ? <UserPlus className="w-3.5 h-3.5" /> : <LogIn className="w-3.5 h-3.5" />}
                <span>{authMode === 'REGISTER' ? 'Daftarkan Akun' : 'Masuk Sekarang'}</span>
              </button>
            </div>
          </form>

        </div>

        {/* Modal Footer */}
        <div className={`border-t px-6 py-3 flex items-center justify-between text-[11px] text-slate-400 ${
          isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <span>PAAI 2019 Curriculum Engine</span>
          <span className="font-mono text-teal-400">Localhost :3030</span>
        </div>

      </div>
    </div>
  );
}
