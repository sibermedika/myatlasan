import React, { useState } from 'react';
import { X, MapPin, Box, Check, Trash2 } from 'lucide-react';
import { Pin } from '../types';

interface AddPinModalProps {
  x: number;
  y: number;
  z?: number;
  is3d?: boolean;
  initialPin?: Pin | null;
  onClose: () => void;
  onSave: (pinData: { title: string; description: string; x: number; y: number; z?: number; is3d?: boolean }) => void;
  onDelete?: (pinId: string) => void;
  theme: 'dark' | 'light';
}

export default function AddPinModal({
  x,
  y,
  z,
  is3d = false,
  initialPin,
  onClose,
  onSave,
  onDelete,
  theme
}: AddPinModalProps) {
  const [title, setTitle] = useState(initialPin?.title || '');
  const [description, setDescription] = useState(initialPin?.description || '');
  const [posX, setPosX] = useState(initialPin?.x ?? x);
  const [posY, setPosY] = useState(initialPin?.y ?? y);
  const [posZ, setPosZ] = useState(initialPin?.z ?? (z ?? 0));

  const isDark = theme === 'dark';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      alert('Mohon lengkapi judul dan deskripsi pin penanda.');
      return;
    }

    onSave({
      title,
      description,
      x: parseFloat(posX.toString()),
      y: parseFloat(posY.toString()),
      z: is3d ? parseFloat(posZ.toString()) : undefined,
      is3d
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md animate-fade-in" id="add-pin-modal">
      <div className={`relative w-full max-w-md rounded-2xl shadow-2xl border overflow-hidden flex flex-col ${
        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        
        {/* Modal Header */}
        <div className={`flex items-center justify-between border-b px-5 py-4 ${
          isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`flex h-8 w-8 items-center justify-center rounded-xl border ${
              is3d 
                ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' 
                : 'bg-teal-500/10 text-teal-400 border-teal-500/25'
            }`}>
              {is3d ? <Box className="h-4 w-4 text-indigo-400" /> : <MapPin className="h-4 w-4 text-teal-400" />}
            </div>
            <div>
              <h3 className="text-sm font-bold">
                {initialPin ? 'Edit Hotspot Pin' : is3d ? 'Tandai Hotspot Pin 3D (X,Y,Z)' : 'Letakkan Hotspot Pin 2D'}
              </h3>
              <p className="text-[10px] text-slate-400">
                {is3d ? 'Koordinat 3D spasial pada permukaan objek' : 'Koordinat bidang 2D (%)'}
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

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          {/* Coordinates Ribbon */}
          <div className={`rounded-xl p-3 border flex flex-col gap-2 ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-slate-400">
                {is3d ? 'Koordinat Spasial 3D:' : 'Koordinat Bidang 2D:'}
              </span>
              <span className={`font-mono font-bold text-xs px-2 py-0.5 rounded border ${
                is3d 
                  ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30' 
                  : 'bg-teal-500/10 text-teal-300 border-teal-500/30'
              }`}>
                {is3d 
                  ? `X: ${posX} | Y: ${posY} | Z: ${posZ}`
                  : `X: ${posX}% | Y: ${posY}%`
                }
              </span>
            </div>

            {/* Editable Coordinate Sliders/Inputs for fine tuning */}
            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-800/40 text-[10px]">
              <div>
                <label className="text-slate-400 block mb-0.5">X Axis</label>
                <input
                  type="number"
                  step="0.1"
                  value={posX}
                  onChange={(e) => setPosX(parseFloat(e.target.value) || 0)}
                  className={`w-full rounded border px-2 py-1 font-mono text-[11px] ${
                    isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-300'
                  }`}
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-0.5">Y Axis</label>
                <input
                  type="number"
                  step="0.1"
                  value={posY}
                  onChange={(e) => setPosY(parseFloat(e.target.value) || 0)}
                  className={`w-full rounded border px-2 py-1 font-mono text-[11px] ${
                    isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-300'
                  }`}
                />
              </div>
              {is3d && (
                <div>
                  <label className="text-slate-400 block mb-0.5">Z Axis</label>
                  <input
                    type="number"
                    step="0.1"
                    value={posZ}
                    onChange={(e) => setPosZ(parseFloat(e.target.value) || 0)}
                    className={`w-full rounded border px-2 py-1 font-mono text-[11px] ${
                      isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-300'
                    }`}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Label / Nama Struktur Bagian *
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="Misal: Atrium Sinistrum, Ventriculus Dexter, Aorta"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full rounded-lg border px-3 py-2 text-xs focus:outline-none focus:border-teal-500 ${
                isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-white border-slate-300 text-slate-900'
              }`}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Deskripsi Fisiologis / Keterangan Klinis Penanda *
            </label>
            <textarea
              required
              rows={3}
              placeholder="Jelaskan peran fisiologis, katup pembatas, atau vaskularisasi yang melintasi titik ini..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`w-full rounded-lg border px-3 py-2 text-xs focus:outline-none focus:border-teal-500 ${
                isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-white border-slate-300 text-slate-900'
              }`}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            {initialPin && onDelete ? (
              <button
                type="button"
                onClick={() => onDelete(initialPin.id)}
                className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Pin</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-teal-500 text-slate-950 text-xs font-bold hover:bg-teal-400 shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                id="save-pin-form-btn"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Simpan Pin</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
}
