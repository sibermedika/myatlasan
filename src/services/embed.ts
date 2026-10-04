import { api } from './api';
import { normalizeEmbedUrl, type EmbedInfo } from '../utils/embedHelper';

export async function resolveEmbedUrl(input: string, signal?: AbortSignal): Promise<EmbedInfo> {
  let info = normalizeEmbedUrl(input);
  if (!info.isValid) throw new Error(info.previewTitle);
  if (info.requiresResolution) {
    const resolved = await api<{ url: string }>('/embeds/sketchfab?url=' + encodeURIComponent(info.normalizedEmbedUrl), { signal });
    info = normalizeEmbedUrl(resolved.url);
    if (!info.isValid || info.requiresResolution || info.sourceType !== 'sketchfab') throw new Error('Link pendek tidak menghasilkan model Sketchfab. Tempel URL lengkap model atau kode Embed.');
  }
  return info;
}
