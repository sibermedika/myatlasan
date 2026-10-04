import React, { useEffect, useRef, useState } from 'react';
import { MapPin, X } from 'lucide-react';
import type { Pin } from '../types';
interface Props {
  x: number; y: number; z?: number; is3d?: boolean; initialPin?: Pin | null; mediaTitle?: string;
  onClose: () => void;
  onSave: (data: Pick<Pin, 'title' | 'description' | 'x' | 'y' | 'z' | 'is3d'>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>; theme: 'dark' | 'light';
}
export default function AddPinModal({ x, y, z, is3d = false, initialPin, mediaTitle, onClose, onSave, onDelete, theme }: Props) {
  const [title, setTitle] = useState(initialPin?.title || '');
  const [description, setDescription] = useState(initialPin?.description || '');
  const [position, setPosition] = useState({ x: initialPin?.x ?? x, y: initialPin?.y ?? y, z: initialPin?.z ?? z ?? 0 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const dialogRef = useRef<HTMLElement>(null);
  const previousFocus = useRef(document.activeElement instanceof HTMLElement ? document.activeElement : null);
  const dark = theme === 'dark';
  useEffect(() => {
    const dialog = dialogRef.current;
    const keepFocus = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !dialog) return;
      const controls = Array.from(dialog.querySelectorAll<HTMLElement>('input, textarea, button, summary')).filter(element => element.offsetParent !== null && !element.hasAttribute('disabled'));
      const target = event.shiftKey ? controls[controls.length - 1] : controls[0];
      if (!dialog.contains(document.activeElement) || document.activeElement === (event.shiftKey ? controls[0] : controls[controls.length - 1])) { event.preventDefault(); target?.focus(); }
    };
    window.addEventListener('keydown', keepFocus);
    return () => { window.removeEventListener('keydown', keepFocus); if (previousFocus.current?.isConnected) previousFocus.current.focus(); };
  }, []);
  useEffect(() => {
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape' && !saving) onClose(); };
    window.addEventListener('keydown', escape); return () => window.removeEventListener('keydown', escape);
  }, [saving, onClose]);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); if (saving) return;
    if (!title.trim() || !description.trim()) { setError('Isi nama struktur dan deskripsinya.'); return; }
    if (![position.x, position.y, ...(is3d ? [position.z] : [])].every(Number.isFinite) || (!is3d && (position.x < 0 || position.x > 100 || position.y < 0 || position.y > 100))) {
      setError('Posisi notasi tidak valid. Posisi 2D harus berada di dalam gambar.'); return;
    }
    setSaving(true); setError('');
    try { await onSave({ title: title.trim(), description: description.trim(), x: position.x, y: position.y, ...(is3d ? { z: position.z } : {}), is3d }); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Notasi belum tersimpan. Coba lagi.'); }
    finally { setSaving(false); }
  };
  const fieldClass = `mt-2 w-full rounded-lg border p-3 text-sm ${dark ? 'bg-slate-950 border-slate-700' : 'bg-white border-slate-300'}`;
  return <div id="add-pin-modal" className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/80 p-4">
    <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="annotation-title" className={`w-full max-w-lg max-h-[90vh] overflow-auto rounded-2xl border p-5 shadow-2xl ${dark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}>
      <div className="flex items-center justify-between gap-3">
        <h2 id="annotation-title" className="flex items-center gap-2 text-lg font-semibold"><MapPin size={20} className="text-teal-500" />{initialPin ? 'Edit notasi' : `Tambah notasi ${is3d ? '3D' : '2D'}`}</h2>
        <button disabled={saving} type="button" aria-label="Tutup editor notasi" onClick={onClose} className="rounded-lg p-2"><X size={20} /></button>
      </div>
      <p className="mt-2 text-sm text-slate-400">{mediaTitle || (is3d ? 'Permukaan model 3D' : 'Gambar 2D')}. Nama dan deskripsi muncul saat notasi dipilih.</p>
      <form onSubmit={submit} className="mt-5 space-y-4">
        <label className="block text-sm font-medium">Nama struktur<input autoFocus required maxLength={200} value={title} onChange={event => setTitle(event.target.value)} placeholder="Contoh: Atrium sinistrum" className={fieldClass} /></label>
        <label className="block text-sm font-medium">Deskripsi<textarea required maxLength={10000} rows={4} value={description} onChange={event => setDescription(event.target.value)} placeholder="Jelaskan struktur, fungsi, atau keterangan anatomi bagian ini." className={fieldClass} /></label>
        <details className="rounded-xl border border-slate-500/30 p-3">
          <summary className="cursor-pointer text-sm text-slate-400">Posisi notasi · {is3d ? '3D' : 'persen gambar'}</summary>
          <p className="mt-2 text-xs text-slate-400">{is3d ? 'Posisi berasal dari permukaan yang Anda klik. Setelah menutup editor, seret penanda atau klik lokasi baru pada model.' : 'X dihitung dari kiri, Y dari atas gambar. Zoom tidak mengubah posisi ini.'}</p>
          <div className={`mt-3 grid gap-2 ${is3d ? 'grid-cols-3' : 'grid-cols-2'}`}>
            {((is3d ? ['x', 'y', 'z'] : ['x', 'y']) as ('x' | 'y' | 'z')[]).map(axis => <label key={axis} className="text-xs uppercase">{axis}{!is3d && ' (%)'}<input type="number" required step="any" min={is3d ? undefined : 0} max={is3d ? undefined : 100} value={Number.isNaN(position[axis]) ? '' : position[axis]} onChange={event => setPosition(previous => ({ ...previous, [axis]: event.target.value === '' ? NaN : Number(event.target.value) }))} className={fieldClass} /></label>)}
          </div>
        </details>
        {error && <p role="alert" className="rounded-lg bg-rose-500/10 p-3 text-sm text-rose-500">{error}</p>}
        <div className="flex items-center justify-between gap-2 pt-2">
          {initialPin && onDelete ? <button disabled={saving} type="button" className="text-sm text-rose-500" onClick={async () => { setSaving(true); try { await onDelete(initialPin.id); } catch(cause) { setError((cause as Error).message); } finally { setSaving(false); } }}>Hapus notasi</button> : <span />}
          <div className="flex gap-2"><button disabled={saving} type="button" onClick={onClose} className="rounded-lg border border-slate-500/30 px-4 py-2 text-sm">Batal</button><button id="save-pin-form-btn" disabled={saving} type="submit" className="rounded-lg bg-teal-500 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50">{saving ? 'Menyimpan…' : 'Simpan notasi'}</button></div>
        </div>
      </form>
    </section>
  </div>;
}
