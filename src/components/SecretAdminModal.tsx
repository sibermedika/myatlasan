import React, { useState } from 'react';
import { 
  X, 
  Lock, 
  KeyRound, 
  LogIn, 
  Eye, 
  EyeOff, 
  AlertCircle 
} from 'lucide-react';
import { UserProfile } from '../types';
import { AnatomyDatabaseService, OFFICIAL_SUPERADMIN, DEFAULT_SUPERADMIN_PASSWORD } from '../services/db';

interface SecretAdminModalProps {
  onClose: () => void;
  onLoginSuccess: (profile: UserProfile) => void;
  theme: 'dark' | 'light';
}

export default function SecretAdminModal({
  onClose,
  onLoginSuccess,
  theme
}: SecretAdminModalProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDark = theme === 'dark';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanUser = username.trim();
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      setErrorMessage('Kredensial tidak lengkap.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Direct verify against hardcoded default superadmin credentials
      const isDirectMatch = 
        (cleanUser.toLowerCase() === 'superadmin' || cleanUser.toLowerCase() === OFFICIAL_SUPERADMIN.email.toLowerCase()) &&
        (cleanPass === DEFAULT_SUPERADMIN_PASSWORD || cleanPass === 'Sup3r@dm1n');

      if (isDirectMatch) {
        // Ensure official superadmin user object
        const adminProfile: UserProfile = {
          ...OFFICIAL_SUPERADMIN,
          role: 'SUPERADMIN'
        };
        await AnatomyDatabaseService.saveUser(adminProfile);
        onLoginSuccess(adminProfile);
        onClose();
        return;
      }

      // 2. Database verification via AnatomyDatabaseService
      const authResult = await AnatomyDatabaseService.authenticateUser(cleanUser, cleanPass);
      if (authResult.success && authResult.user && authResult.user.role === 'SUPERADMIN') {
        onLoginSuccess(authResult.user);
        onClose();
        return;
      }

      // If credentials do not match
      setErrorMessage('Kredensial tidak valid.');
    } catch (err) {
      console.error(err);
      setErrorMessage('Terjadi kendala otentikasi sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md animate-fade-in"
      id="secret-auth-modal"
    >
      <div 
        className={`relative w-full max-w-sm rounded-2xl shadow-2xl border overflow-hidden transition-all ${
          isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Subtle Minimalist Header - Discreet without explicit "Superadmin" banners */}
        <div className={`flex items-center justify-between border-b px-5 py-3.5 ${
          isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <KeyRound className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold tracking-wide">
              Verifikasi Kredensial
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors cursor-pointer"
            title="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Minimalist Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          {errorMessage && (
            <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Username Field */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Username / ID Pengguna
            </label>
            <input
              type="text"
              autoFocus
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan username..."
              className={`w-full rounded-xl border px-3 py-2 text-xs focus:outline-none focus:border-teal-500 transition-colors ${
                isDark ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-600' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'
              }`}
              id="secret-input-username"
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full rounded-xl border pl-3 pr-9 py-2 text-xs focus:outline-none focus:border-teal-500 transition-colors ${
                  isDark ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-600' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'
                }`}
                id="secret-input-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                title={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
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
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 rounded-xl text-xs font-bold bg-teal-500 text-slate-950 hover:bg-teal-400 shadow-md transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
              id="secret-submit-btn"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Masuk</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
