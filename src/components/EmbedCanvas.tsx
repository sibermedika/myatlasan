import { useEffect, useState } from 'react';
import { ExternalLink, Loader2, RotateCw } from 'lucide-react';
import { resolveEmbedUrl } from '../services/embed';
import { normalizeEmbedUrl } from '../utils/embedHelper';

export default function EmbedCanvas({ source, title }: { source: string; title: string }) {
  const [attempt, setAttempt] = useState(0);
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    setUrl(''); setError(''); setLoading(true); setSlow(false);
    resolveEmbedUrl(source, controller.signal).then(info => {
      if (!controller.signal.aborted) setUrl(info.normalizedEmbedUrl);
    }).catch(reason => {
      if (!controller.signal.aborted) { setError(reason.message || 'Embed gagal dimuat.'); setLoading(false); }
    });
    const timer = window.setTimeout(() => setSlow(true), 15000);
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [source, attempt]);
  const external = normalizeEmbedUrl(source);
  return (
    <div className="w-full h-full relative bg-slate-950">
      {url && <iframe
        key={url + ':' + attempt}
        src={url}
        title={title}
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-presentation"
        allow="autoplay; fullscreen; xr-spatial-tracking; web-share"
        allowFullScreen
        onLoad={() => setLoading(false)}
        onError={() => { setError('Viewer gagal dimuat. Periksa koneksi atau akses model Sketchfab.'); setLoading(false); }}
        className="w-full h-full border-0"
      />}
      {loading && !slow && <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 pointer-events-none text-slate-200">
        <Loader2 className="w-8 h-8 text-teal-400 animate-spin mb-2" />
        <p className="text-xs font-bold">Menghubungkan ke viewer...</p>
      </div>}
      {(error || (loading && slow)) && <div role="status" className="absolute bottom-4 left-4 right-4 rounded-xl bg-slate-900/95 border border-amber-500/40 p-4 text-xs text-slate-200">
        {error || 'Koneksi viewer memerlukan waktu lebih lama. Coba muat ulang atau buka model di Sketchfab.'}
      </div>}
      <div className="absolute top-4 right-4 flex gap-1.5 bg-slate-900/90 border border-slate-800 p-1.5 rounded-xl text-slate-300">
        <button type="button" onClick={() => setAttempt(value => value + 1)} title="Muat ulang viewer" aria-label="Muat ulang viewer" className="p-2 hover:text-teal-400 rounded-lg hover:bg-slate-800"><RotateCw className="w-4 h-4" /></button>
        {external.isValid && <a href={external.normalizedEmbedUrl} target="_blank" rel="noopener noreferrer" title="Buka model di tab baru" aria-label="Buka model di tab baru" className="p-2 hover:text-teal-400 rounded-lg hover:bg-slate-800"><ExternalLink className="w-4 h-4" /></a>}
      </div>
    </div>
  );
}
