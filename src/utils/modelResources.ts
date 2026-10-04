import { LoadingManager } from 'three';
import type { StoredBundleFile } from '../types';

export function bundleResources(files: StoredBundleFile[] = []) {
  const manager = new LoadingManager();
  let loading = false;
  const waiting: (() => void)[] = [];
  manager.onStart = () => { loading = true; };
  manager.onLoad = () => { loading = false; waiting.splice(0).forEach(resolve => resolve()); };
  const urls = files.map(file => ({ path: (file.path || file.name).replace(/\\/g, '/').replace(/^\.\//, '').toLowerCase(), url: URL.createObjectURL(file.blob) }));
  manager.setURLModifier(request => {
    if (request.startsWith('data:')) return request;
    let path = request;
    try { path = decodeURIComponent(path); } catch { /* Keep the literal path. */ }
    path = path.replace(/\\/g, '/').split('?')[0].toLowerCase();
    const exact = urls.find(file => path === file.path || path.endsWith('/' + file.path));
    if (exact) return exact.url;
    const matches = urls.filter(file => file.path.split('/').pop() === path.split('/').pop());
    if (matches.length === 1) return matches[0].url;
    if (matches.length > 1) throw new Error('Nama berkas pendukung ambigu. Pertahankan struktur folder paket model.');
    if (files.length && !request.startsWith('blob:') && !request.startsWith('data:')) throw new Error('Berkas pendukung tidak ditemukan: ' + path.split('/').pop());
    return request;
  });
  return { manager, ready: () => loading ? new Promise<void>(resolve => waiting.push(resolve)) : Promise.resolve(), dispose: () => urls.forEach(file => URL.revokeObjectURL(file.url)) };
}
