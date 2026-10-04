import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {scryptSync,timingSafeEqual} from 'node:crypto';
import {createApi} from './api.mjs';

test('fresh installations get admin/admin while configured and existing passwords are preserved',()=>{
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'atlas-bootstrap-test-'));
  let api;
  const matches=(database,password)=>{
    const [salt,hash]=database.prepare("SELECT hash FROM users WHERE id='admin-master'").get().hash.split(':');
    return timingSafeEqual(scryptSync(password,salt,64),Buffer.from(hash,'hex'));
  };
  try {
    api=createApi({directory});assert.ok(matches(api.db,'admin'));
    const profile=JSON.parse(api.db.prepare("SELECT profile FROM users WHERE id='admin-master'").get().profile);
    assert.equal(profile.email,'admin');assert.equal(profile.role,'ADMIN');
    api.db.close();api=null;
    api=createApi({directory,adminPassword:'new-override'});assert.ok(matches(api.db,'admin'));
    api.db.close();api=null;
    api=createApi({directory:path.join(directory,'custom'),adminPassword:'custom-password'});assert.ok(matches(api.db,'custom-password'));assert.equal(matches(api.db,'admin'),false);
  } finally {
    api?.db.close();
    if(!path.basename(directory).startsWith('atlas-bootstrap-test-'))throw Error('Unexpected test path');
    fs.rmSync(directory,{recursive:true,force:true});
  }
});
