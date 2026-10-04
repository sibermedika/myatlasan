import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveSketchfabShortUrl } from './sketchfab.mjs';
import { createApi } from './api.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const model = 'https://sketchfab.com/models/3aef2741ea754fb486451292b87e159a/embed';

test('Sketchfab short URLs resolve from official oEmbed or validated redirects', async () => {
  assert.equal(await resolveSketchfabShortUrl('https://skfb.ly/6xyAT',async url => {
    assert.match(url,/^https:\/\/sketchfab.com\/oembed\?url=/);
    return new Response(JSON.stringify({html:`<iframe src="${model}"></iframe>`}));
  }),model);
  const calls=[];
  const resolved=await resolveSketchfabShortUrl('https://skfb.ly/6xyAT',async (url,options) => {
    calls.push(url);
    if(calls.length===1) return new Response('{}',{status:404});
    assert.equal(options.redirect,'manual');
    return new Response(null,{status:301,headers:{location:calls.length===2?'https://sketchfab.com:443/s/6xyAT':model}});
  });
  assert.equal(resolved,model); assert.equal(calls.length,3);
});

test('resolver rejects arbitrary hosts, unsafe redirects, and unavailable links', async () => {
  let calls=0;
  const request=async () => {calls++;return new Response(null,{status:301,headers:{location:'http://127.0.0.1/private'}});};
  for(const input of ['https://example.com/6xyAT','http://skfb.ly/6xyAT','https://skfb.ly:8443/6xyAT','https://skfb.ly@localhost/6xyAT','https://sketchfab.com/arbitrary']) await assert.rejects(resolveSketchfabShortUrl(input,request));
  assert.equal(calls,0);
  await assert.rejects(resolveSketchfabShortUrl('https://skfb.ly/6xyAT',request));
  assert.equal(calls,2);
  await assert.rejects(resolveSketchfabShortUrl('https://skfb.ly/6xyAT',async () => new Response(null,{status:202})),/URL lengkap/);
});

test('embed API returns canonical URLs and actionable validation errors', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(),'atlas-embed-test-'));
  const api = createApi({directory,adminPassword:'test-admin-password',lecturerPassword:'test-lecturer-password'});
  const server = api.app.listen(0,'127.0.0.1');
  await new Promise(resolve=>server.once('listening',resolve));
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (url,options) => String(url).startsWith('https://sketchfab.com/oembed?')
      ? new Response(JSON.stringify({html:`<iframe src="${model}"></iframe>`})) : originalFetch(url,options);
    const base = `http://127.0.0.1:${server.address().port}/embeds/sketchfab?url=`;
    const resolved = await originalFetch(base+encodeURIComponent('https://skfb.ly/6xyAT'));
    assert.equal(resolved.status,200); assert.deepEqual(await resolved.json(),{url:model});
    const invalid = await originalFetch(base+encodeURIComponent('https://example.com/private'));
    assert.equal(invalid.status,400); assert.match((await invalid.json()).message,/tidak sah/);
  } finally {
    globalThis.fetch = originalFetch;
    await new Promise(resolve=>server.close(resolve)); api.db.close();
    if(!path.basename(directory).startsWith('atlas-embed-test-')) throw new Error('Unexpected test path');
    fs.rmSync(directory,{recursive:true,force:true});
  }
});
