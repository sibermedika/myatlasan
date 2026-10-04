import React, { useState } from 'react';
import { UserRole, UserProfile } from '../types';
import { AnatomyDatabaseService } from '../services/db';
import { institutionName } from '../permissions';
interface Props { currentRole: UserRole; currentUser?: UserProfile | null; onClose: () => void; onLoginSuccess: (user: UserProfile) => Promise<void>; onLogout?: () => void; theme: 'dark' | 'light'; }
export default function AccountDialog(p: Props) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setError('');
    try { const result = await AnatomyDatabaseService.authenticateUser(identifier,password); if (result.success && result.user) await p.onLoginSuccess(result.user); else setError(result.message || 'Tidak dapat masuk.'); }
    catch { setError('Terjadi kendala. Coba kembali.'); } finally { setBusy(false); }
  };
  return <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4"><section role="dialog" aria-modal="true" aria-labelledby="account-title" className={`w-full max-w-md rounded-2xl p-6 shadow-xl ${p.theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}>
    <h2 id="account-title" className="text-xl font-semibold">{p.currentUser ? 'Akun Anda' : 'Masuk akun'}</h2>
    {p.currentUser ? <><p className="mt-4 font-medium">{p.currentUser.name}</p><p className="text-sm text-slate-400 mt-1">{p.currentRole === 'ADMIN_INSTITUSI' ? 'Admin instansi' : p.currentRole === 'ADMIN' || p.currentRole === 'SUPERADMIN' ? 'Admin General' : p.currentRole === 'DOSEN' ? 'Dosen' : 'Pengguna'}</p><p className="text-sm text-teal-500 mt-1">{institutionName(p.currentUser.institution)}</p><button className="mt-6 text-rose-500" onClick={()=>{p.onLogout?.();p.onClose();}}>Keluar akun</button></> : <form onSubmit={submit} className="mt-5 space-y-4"><p className="text-sm text-slate-400">Masuk untuk mengelola materi. Hak akses mengikuti akun Anda.</p><label className="block text-sm">Username atau email<input autoFocus required autoComplete="username" value={identifier} onChange={e=>setIdentifier(e.target.value)} className="mt-2 block w-full rounded-lg border border-slate-500/40 bg-transparent p-3"/></label><label className="block text-sm">Kata sandi<input required type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-2 block w-full rounded-lg border border-slate-500/40 bg-transparent p-3"/></label>{error && <p role="alert" className="text-sm text-rose-500">{error}</p>}<button disabled={busy} className="w-full rounded-xl bg-teal-500 text-slate-950 p-3 font-semibold disabled:opacity-50">{busy ? 'Memproses…' : 'Masuk'}</button><p className="text-xs text-slate-400">Akun dan koleksi dikelola oleh server.</p></form>}
    <button onClick={p.onClose} className="mt-5 text-sm p-2">Tutup</button>
  </section></div>;
}
