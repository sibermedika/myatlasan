/** Convert model pages and copied iframe snippets to embeddable URLs. */
export interface EmbedInfo {
  originalUrl: string;
  normalizedEmbedUrl: string;
  sourceType: 'sketchfab' | 'google_drive' | 'generic';
  mediaCategory: '3d' | '2d' | 'unknown';
  previewTitle: string;
  isValid: boolean;
  requiresResolution?: boolean;
}

export function normalizeEmbedUrl(rawInput: string): EmbedInfo {
  const result: EmbedInfo = { originalUrl: rawInput || '', normalizedEmbedUrl: '', sourceType: 'generic', mediaCategory: 'unknown', previewTitle: 'Gunakan URL HTTPS atau kode iframe yang valid.', isValid: false };
  if (typeof rawInput !== 'string' || !rawInput.trim()) return result;
  let clean = rawInput.trim();
  if (/<iframe\b/i.test(clean)) {
    const tag = clean.match(/<iframe\b[^>]*>/i)?.[0];
    const src = tag?.match(/\ssrc\s*=\s*(["'])(.*?)\1/i)?.[2];
    if (!src) return result;
    clean = src;
  }
  clean = clean.replace(/&amp;/gi, '&').replace(/&#(?:0*38|x0*26);/gi, '&');
  if (clean.startsWith('//')) clean = 'https:' + clean;
  let url: URL;
  try { url = new URL(clean); } catch { return result; }
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return result;
  result.normalizedEmbedUrl = url.href;
  const host = url.hostname.toLowerCase();
  if (['sketchfab.com', 'www.sketchfab.com', 'skfb.ly'].includes(host)) {
    result.sourceType = 'sketchfab'; result.mediaCategory = '3d';
    url.protocol = 'https:';
    if (url.port && url.port !== '443') return result;
    url.port = '';
    const short = host === 'skfb.ly' ? /^\/[a-zA-Z0-9]{4,16}\/?$/.test(url.pathname) : /^\/s\/[a-zA-Z0-9]{4,16}\/?$/.test(url.pathname);
    if (short) return { ...result, normalizedEmbedUrl: url.href, isValid: true, requiresResolution: true, previewTitle: 'Link pendek Sketchfab — akan dikonversi ke viewer.' };
    const id = url.pathname.match(/^\/models\/([a-f0-9]{32}|[a-zA-Z0-9]{22})(?:\/embed)?\/?$/i)?.[1]
      || url.pathname.match(/^\/3d-models\/(?:[\w-]+-)?([a-f0-9]{32})\/?$/i)?.[1];
    if (!id) return { ...result, previewTitle: 'Tautan Sketchfab harus menuju sebuah model, bukan profil atau koleksi.' };
    url.hostname = 'sketchfab.com'; url.pathname = `/models/${id}/embed`; url.hash = '';
    if (!url.searchParams.has('autostart')) url.searchParams.set('autostart', '1');
    if (!url.searchParams.has('preload')) url.searchParams.set('preload', '1');
    return { ...result, normalizedEmbedUrl: url.href, isValid: true, previewTitle: 'Sketchfab 3D Embed' };
  }
  if (host === 'drive.google.com') {
    result.sourceType = 'google_drive'; result.mediaCategory = '2d';
    const id = url.pathname.match(/^\/file\/d\/([\w-]+)(?:\/(?:view|preview))?\/?$/)?.[1] || url.searchParams.get('id');
    if (!id || !/^[\w-]+$/.test(id)) return { ...result, previewTitle: 'Gunakan tautan berbagi berkas Google Drive.' };
    url.protocol = 'https:'; url.pathname = `/file/d/${id}/preview`; url.searchParams.delete('id'); url.searchParams.delete('usp'); url.hash = '';
    return { ...result, normalizedEmbedUrl: url.href, isValid: true, previewTitle: 'Google Drive Embed Preview' };
  }
  return { ...result, isValid: url.protocol === 'https:', previewTitle: url.protocol === 'https:' ? 'Embed HTTPS eksternal' : 'Gunakan HTTPS untuk embed.' };
}
