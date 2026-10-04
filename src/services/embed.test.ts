import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeEmbedUrl } from '../utils/embedHelper';
import { resolveEmbedUrl } from './embed';

const id = '3aef2741ea754fb486451292b87e159a';
test('Sketchfab model links and iframe snippets use the canonical viewer and preserve options', () => {
  for (const input of [`https://sketchfab.com/3d-models/kidney-${id}`, `https://www.sketchfab.com/models/${id}`, `<DIV><IFRAME data-src="ignore" SRC = '//sketchfab.com/models/${id}/embed?autostart=0&amp;preload=1&amp;token=example'></IFRAME></DIV>`]) {
    const info = normalizeEmbedUrl(input);
    assert.equal(info.isValid, true);
    assert.equal(new URL(info.normalizedEmbedUrl).pathname, `/models/${id}/embed`);
    assert.equal(normalizeEmbedUrl(info.normalizedEmbedUrl).normalizedEmbedUrl, info.normalizedEmbedUrl);
    if (input.includes('token=')) {
      const url = new URL(info.normalizedEmbedUrl);
      assert.equal(url.searchParams.get('token'), 'example');
      assert.equal(url.searchParams.get('autostart'), '0');
      assert.equal(url.searchParams.has('amp;preload'), false);
    }
  }
  for (const input of ['https://skfb.ly/6xyAT','https://sketchfab.com/s/6xyAT']) assert.equal(normalizeEmbedUrl(input).requiresResolution, true);
});

test('invalid Sketchfab pages cannot be saved as a working viewer', () => {
  for (const input of ['', '<iframe data-src="https://example.com"></iframe>', 'javascript:alert(1)', 'https://sketchfab.com/thunderpig', 'https://sketchfab.com/models/wrong/embed','https://user:pass@sketchfab.com/models/' + id]) assert.equal(normalizeEmbedUrl(input).isValid, false, input);
  const unrelated = normalizeEmbedUrl('https://example.com/?next=sketchfab.com/models/' + id);
  assert.equal(unrelated.sourceType, 'generic');
  assert.equal(normalizeEmbedUrl('https://drive.google.com/file/d/test-id/view?resourcekey=important&usp=sharing').normalizedEmbedUrl, 'https://drive.google.com/file/d/test-id/preview?resourcekey=important');
});

test('short-link resolver converts the response and reports failures instead of embedding a page', async () => {
  const previous = globalThis.fetch;
  try {
    globalThis.fetch = async input => {
      assert.match(String(input), /^\/api\/embeds\/sketchfab\?url=/);
      return new Response(JSON.stringify({url:`https://sketchfab.com/models/${id}/embed`}), {headers:{'Content-Type':'application/json'}});
    };
    assert.match((await resolveEmbedUrl('https://skfb.ly/6xyAT')).normalizedEmbedUrl, new RegExp(`/models/${id}/embed`));
    globalThis.fetch = async () => new Response(JSON.stringify({message:'Tempel URL lengkap model.'}), {status:400});
    await assert.rejects(resolveEmbedUrl('https://skfb.ly/6xyAT'), /URL lengkap/);
  } finally { globalThis.fetch = previous; }
});
