import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
test('all 87 seed topics use existing local illustration files with source labels',()=>{
 const seed=JSON.parse(fs.readFileSync('server/seed.json','utf8'));
 assert.equal(seed.length,87);
 for(const organ of seed){assert.ok(organ.imageUrl.startsWith('/anatomy/'));assert.ok(fs.existsSync('public'+organ.imageUrl),organ.id);assert.ok(organ.mediaOverview);assert.equal(organ.pins.length,0);if(!organ.imageUrl.endsWith('pending.svg')){assert.ok(organ.mediaSource?.startsWith('https://commons.wikimedia.org/'));assert.ok(organ.mediaLicense);}}
 const manifest=JSON.parse(fs.readFileSync('public/anatomy/sources.json','utf8'));
 assert.equal(manifest.length,15);
 for(const source of manifest){const bytes=fs.readFileSync('public/anatomy/'+source.file);assert.ok(bytes.length>1000);if(source.file.endsWith('.svg')){assert.match(bytes.toString(),/<svg/);assert.doesNotMatch(bytes.toString(),/<script/i);}else if(source.file.endsWith('.jpg'))assert.equal(bytes.readUInt16BE(0),0xffd8);else assert.equal(bytes.subarray(1,4).toString(),'PNG');}
});
