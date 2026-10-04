const modelPath = /^\/models\/(?:[a-f0-9]{32}|[a-zA-Z0-9]{22})(?:\/embed)?\/?$/i;
const pagePath = /^\/3d-models\/(?:[\w-]+-)?[a-f0-9]{32}\/?$/i;
function trustedUrl(input) {
  const url = new URL(input);
  if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443') || !['skfb.ly','sketchfab.com','www.sketchfab.com'].includes(url.hostname)) throw new Error('Tautan Sketchfab tidak sah.');
  return url;
}

export async function resolveSketchfabShortUrl(input, request = fetch) {
  let url = trustedUrl(input);
  const shortPath = url.hostname === 'skfb.ly' ? /^\/[a-zA-Z0-9]{4,16}\/?$/ : /^\/s\/[a-zA-Z0-9]{4,16}\/?$/;
  if (!shortPath.test(url.pathname)) throw new Error('Gunakan link pendek model Sketchfab.');
  const signal = AbortSignal.timeout(15000);
  // oEmbed returns the provider's canonical iframe without fetching arbitrary hosts.
  const response = await request('https://sketchfab.com/oembed?url=' + encodeURIComponent(url.href), { redirect: 'error', signal });
  if (response.ok && response.status !== 202) {
    const data = await response.json().catch(() => null);
    const src = typeof data?.html === 'string' ? data.html.match(/\ssrc\s*=\s*(["'])(.*?)\1/i)?.[2] : null;
    if (src) {
      const embed = trustedUrl(src.replace(/&amp;/gi,'&'));
      if (embed.hostname !== 'skfb.ly' && modelPath.test(embed.pathname)) return embed.href;
    }
  } else { await response.body?.cancel(); }
  // Some older short URLs are resolved only by redirects. Validate every hop.
  for (let hop = 0; hop < 4; hop++) {
    const redirect = await request(url.href, { redirect: 'manual', signal });
    const location = redirect.headers.get('location');
    await redirect.body?.cancel();
    if (![301,302,303,307,308].includes(redirect.status) || !location) break;
    url = trustedUrl(new URL(location,url).href);
    if (url.hostname !== 'skfb.ly' && (modelPath.test(url.pathname) || pagePath.test(url.pathname))) return url.href;
    if (!/^\/s\/[a-zA-Z0-9]{4,16}\/?$/.test(url.pathname)) break;
  }
  throw new Error('Sketchfab belum dapat membaca link pendek ini. Tempel URL lengkap halaman model atau kode iframe dari tombol Embed Sketchfab.');
}
