import React, { useEffect, useRef, useState } from 'react';
import { Activity, AlertCircle, CheckCircle2, ImagePlus, Loader2, Save, Trash2, Upload, Undo2 } from 'lucide-react';
import { api, blobBase64 } from '../services/api';

export type Branding = { name: string; description: string; logoUrl: string };
export default function BrandingSettings({ branding, onSaved, theme = 'dark' }: { branding: Branding; onSaved: (value: Branding) => void; theme?: 'dark' | 'light' }) {
  const [value, setValue] = useState(branding);
  const [savedValue, setSavedValue] = useState(branding);
  const [busy, setBusy] = useState(false);
  const [reading, setReading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [fileInfo, setFileInfo] = useState<{ name: string; size: string; width: number; height: number } | null>(null);
  const [notice, setNotice] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const selection = useRef(0);
  const dragDepth = useRef(0);
  useEffect(() => () => { selection.current++; }, []);
  const dark = theme === 'dark';
  const dirty = JSON.stringify(value) !== JSON.stringify(savedValue);
  const disabled = busy || reading;
  const panel = dark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200';
  const muted = dark ? 'text-slate-400' : 'text-slate-500';
  const field = `w-full rounded-xl border px-3.5 py-3 text-sm outline-none transition-colors focus:border-teal-500 disabled:opacity-60 ${dark ? 'bg-slate-950/60 border-slate-700 placeholder:text-slate-500' : 'bg-slate-50 border-slate-200 placeholder:text-slate-400'}`;
  const secondary = `inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${dark ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-100'}`;

  async function selectLogo(files: FileList | File[]) {
    if (disabled || !files.length) return;
    const attempt = ++selection.current;
    setNotice(null);
    if (files.length !== 1) { setNotice({ kind: 'error', text: 'Pilih satu gambar untuk logo aplikasi.' }); return; }
    const file = files[0];
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 1024 * 1024) {
      setNotice({ kind: 'error', text: 'Gunakan PNG, JPG, atau WebP dengan ukuran maksimal 1 MB.' }); return;
    }
    setReading(true);
    const objectUrl = URL.createObjectURL(file);
    try {
      const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
        const image = new Image();
        image.onload = () => image.naturalWidth && image.naturalHeight ? resolve({ width: image.naturalWidth, height: image.naturalHeight }) : reject(new Error('Gambar tidak memiliki ukuran yang valid.'));
        image.onerror = () => reject(new Error('Gambar tidak dapat dibaca. Coba gunakan berkas gambar lain.'));
        image.src = objectUrl;
      });
      const logoUrl = `data:${file.type};base64,${await blobBase64(file)}`;
      if (attempt !== selection.current) return;
      setValue(previous => ({ ...previous, logoUrl }));
      setFileInfo({ name: file.name, size: `${(file.size / 1024).toFixed(1)} KB`, ...dimensions });
    } catch (error) { if (attempt === selection.current) setNotice({ kind: 'error', text: (error as Error).message }); }
    finally { URL.revokeObjectURL(objectUrl); if (attempt === selection.current) setReading(false); }
  }

  function reset() { selection.current++; setValue(savedValue); setFileInfo(null); setNotice(null); setReading(false); }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (disabled || !dirty) return;
    if (!value.name.trim()) { setNotice({ kind: 'error', text: 'Nama aplikasi wajib diisi.' }); return; }
    setBusy(true); setNotice(null);
    try {
      const saved = await api<Branding>('/settings/branding', { method: 'PUT', body: JSON.stringify({ ...value, name: value.name.trim(), description: value.description.trim() }) });
      setValue(saved); setSavedValue(saved); onSaved(saved);
      setNotice({ kind: 'success', text: 'Identitas aplikasi berhasil diperbarui untuk seluruh pengguna.' });
    } catch (error) { setNotice({ kind: 'error', text: (error as Error).message }); }
    finally { setBusy(false); }
  }

  return <form onSubmit={save} className={`w-full max-w-4xl space-y-6 ${dark ? 'text-slate-100' : 'text-slate-900'}`} aria-busy={disabled}>
    <div>
      <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Identitas aplikasi</h2>
      <p className={`mt-1.5 text-sm leading-relaxed ${muted}`}>Atur nama, deskripsi, dan logo yang tampil di aplikasi Anda.</p>
    </div>

    <div className="grid gap-5 lg:grid-cols-2">
      <section className={`rounded-2xl border p-5 sm:p-6 space-y-5 ${panel}`} aria-labelledby="branding-details-heading">
        <div><h3 id="branding-details-heading" className="font-semibold">Informasi aplikasi</h3><p className={`mt-1 text-xs ${muted}`}>Bantu pengguna mengenali atlas Anda.</p></div>
        <div>
          <label htmlFor="branding-name" className="mb-2 block text-sm font-medium">Nama aplikasi <span className="text-teal-500">*</span></label>
          <input id="branding-name" required maxLength={60} disabled={disabled} className={field} placeholder="Contoh: AnatoVerse" value={value.name} onChange={event => { setValue(previous => ({ ...previous, name: event.target.value })); setNotice(null); }} />
          <p className={`mt-2 text-xs ${muted}`}>Nama ini tampil di navigasi utama.</p>
        </div>
        <div>
          <label htmlFor="branding-description" className="mb-2 block text-sm font-medium">Deskripsi singkat</label>
          <textarea id="branding-description" rows={3} maxLength={160} disabled={disabled} className={`${field} resize-y min-h-24`} placeholder="Jelaskan aplikasi Anda dalam satu kalimat." value={value.description} onChange={event => { setValue(previous => ({ ...previous, description: event.target.value })); setNotice(null); }} aria-describedby="branding-description-hint" />
          <p id="branding-description-hint" className={`mt-2 text-xs text-right tabular-nums ${muted}`}>{value.description.length}/160 karakter</p>
        </div>
      </section>

      <section className={`rounded-2xl border p-5 sm:p-6 ${panel}`} aria-labelledby="branding-logo-heading">
        <div className="flex items-center justify-between gap-3"><h3 id="branding-logo-heading" className="font-semibold">Logo aplikasi</h3><span className={`rounded-full px-2.5 py-1 text-[11px] ${dark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>Opsional</span></div>
        <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" tabIndex={-1} className="hidden" disabled={disabled} aria-label="Pilih berkas logo aplikasi" onChange={event => { const files = event.target.files; if (files?.length) void selectLogo(files); event.target.value = ''; }} />
        <div className={`mt-4 rounded-2xl border-2 border-dashed px-4 py-5 text-center transition-colors ${dragging ? 'border-teal-500 bg-teal-500/10' : dark ? 'border-slate-700 bg-slate-950/40' : 'border-slate-200 bg-slate-50'}`}
          onDragEnter={event => { if (!event.dataTransfer.types.includes('Files')) return; event.preventDefault(); dragDepth.current++; if (!disabled) setDragging(true); }}
          onDragOver={event => { event.preventDefault(); event.dataTransfer.dropEffect = disabled ? 'none' : 'copy'; }}
          onDragLeave={event => { event.preventDefault(); dragDepth.current = Math.max(0, dragDepth.current - 1); if (!dragDepth.current) setDragging(false); }}
          onDrop={event => { event.preventDefault(); dragDepth.current = 0; setDragging(false); void selectLogo(event.dataTransfer.files); }}>
          <button type="button" disabled={disabled} onClick={() => inputRef.current?.click()} aria-label={value.logoUrl ? 'Klik kotak untuk mengganti logo' : 'Klik kotak untuk upload logo'} className="mx-auto flex h-36 w-36 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-teal-500/60 p-4 transition-shadow hover:ring-4 hover:ring-teal-500/15 disabled:cursor-wait" style={{ backgroundColor: '#fff', backgroundImage: 'conic-gradient(#e2e8f0 25%, #fff 0 50%, #e2e8f0 0 75%, #fff 0)', backgroundSize: '16px 16px' }}>
            {reading ? <Loader2 aria-label="Membaca logo" className="h-8 w-8 animate-spin text-teal-600" /> : value.logoUrl ? <img src={value.logoUrl} alt="Pratinjau logo aplikasi" className="h-full w-full object-contain" /> : <ImagePlus className="h-9 w-9 text-slate-400" />}
          </button>
          <p className="mt-3 text-sm font-medium">{dragging ? 'Lepaskan gambar di sini' : value.logoUrl ? 'Logo siap digunakan' : 'Tambahkan logo Anda'}</p>
          <p className={`mt-1 text-xs leading-relaxed ${muted}`}>Klik kotak atau seret gambar ke sini.</p>
          <button type="button" disabled={disabled} onClick={() => inputRef.current?.click()} className={`mt-4 ${secondary}`}><Upload size={16} />{value.logoUrl ? 'Ganti logo' : 'Pilih gambar'}</button>
          <p className={`mt-3 text-[11px] ${muted}`}>PNG, JPG, atau WebP · Maksimal 1 MB</p>
        </div>
        <div className="mt-3 flex items-start justify-between gap-3">
          <div className="min-w-0 pt-1">
            {fileInfo ? <><p className="truncate text-xs font-medium" title={fileInfo.name}>{fileInfo.name}</p><p className={`mt-1 text-[11px] ${muted}`}>{fileInfo.width} × {fileInfo.height} px · {fileInfo.size}</p></> : <p className={`text-xs leading-relaxed ${muted}`}>{value.logoUrl ? 'Logo tersimpan saat ini.' : 'Gambar persegi dan latar transparan memberi hasil terbaik.'}</p>}
          </div>
          {value.logoUrl && <button type="button" disabled={disabled} className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg px-2 text-xs text-rose-400 hover:bg-rose-500/10 disabled:opacity-40" onClick={() => { selection.current++; setValue(previous => ({ ...previous, logoUrl: '' })); setFileInfo(null); setNotice(null); }}><Trash2 size={15} />Hapus</button>}
        </div>
      </section>
    </div>

    <section className={`rounded-2xl border p-5 ${panel}`} aria-labelledby="branding-preview-heading">
      <div className="flex flex-wrap items-center justify-between gap-2"><h3 id="branding-preview-heading" className={`text-xs font-semibold uppercase tracking-wider ${muted}`}>Pratinjau navigasi</h3><span className={`text-xs ${muted}`}>Perubahan tampil setelah disimpan</span></div>
      <div className={`mt-4 flex min-w-0 items-center gap-3 rounded-xl border px-4 py-4 ${dark ? 'border-slate-700/60 bg-slate-950/50' : 'border-slate-200 bg-slate-50'}`}>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center">{value.logoUrl ? <img src={value.logoUrl} alt="" className="h-full w-full object-contain" /> : <Activity className="h-7 w-7 text-teal-500" />}</div>
        <div className="min-w-0"><p className="truncate font-bold">{value.name.trim() || 'Nama aplikasi'}</p><p className={`mt-0.5 break-words text-xs leading-relaxed ${muted}`}>{value.description.trim() || 'Deskripsi aplikasi'}</p></div>
      </div>
    </section>

    {notice && <div role={notice.kind === 'error' ? 'alert' : 'status'} className={`flex items-start gap-2.5 rounded-xl border p-3.5 text-sm ${notice.kind === 'error' ? 'border-rose-500/30 bg-rose-500/10 text-rose-400' : 'border-teal-500/30 bg-teal-500/10 text-teal-500'}`}>{notice.kind === 'error' ? <AlertCircle size={18} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={18} className="mt-0.5 shrink-0" />}<p>{notice.text}</p></div>}
    <div className={`flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between ${dark ? 'border-slate-800' : 'border-slate-200'}`}>
      <p aria-live="polite" className={`text-xs ${muted}`}>{reading ? 'Sedang menyiapkan gambar…' : busy ? 'Menyimpan perubahan…' : dirty ? 'Ada perubahan yang belum disimpan.' : 'Semua perubahan telah tersimpan.'}</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <button type="button" disabled={!dirty || disabled} onClick={reset} className={secondary}><Undo2 size={16} />Batalkan perubahan</button>
        <button type="submit" disabled={!dirty || disabled} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-teal-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-teal-400 disabled:opacity-40 disabled:cursor-not-allowed">{busy ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />}{busy ? 'Menyimpan…' : 'Simpan pengaturan'}</button>
      </div>
    </div>
  </form>;
}
