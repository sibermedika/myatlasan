import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import express from 'express';
import {createApi} from '../../server/api.mjs';
import {AnatomyDatabaseService} from './db';
import type {Organ} from '../types';

test('client confirms committed saves after response loss and preserves genuine version conflicts',async()=>{
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'atlas-client-test-'));
  const {app,db}=createApi({directory,adminPassword:'test-admin-password',lecturerPassword:'test-lecturer-password'});
  const outer=express();outer.use('/api',app);
  const server=outer.listen(0,'127.0.0.1');
  await new Promise<void>(resolve=>server.once('listening',resolve));
  const address=server.address() as {port:number};
  const base=`http://127.0.0.1:${address.port}`;
  const actualFetch=globalThis.fetch;
  try {
    const login=await actualFetch(base+'/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json','X-Atlas-Request':'1'},body:JSON.stringify({identifier:'admin',password:'test-admin-password'})});
    const cookie=login.headers.get('set-cookie')!.split(';')[0];
    let dropNextResponse=true;
    globalThis.fetch=async(input,options)=>{
      const response=await actualFetch(base+input,{...options,headers:{...options?.headers,Cookie:cookie}});
      if(options?.method==='PUT' && response.ok && dropNextResponse){dropNextResponse=false;await response.arrayBuffer();throw new TypeError('Simulated connection loss after commit');}
      return response;
    };
    const newOrgan:Organ={id:'stable-new-id',name:'New',latinName:'New',system:'System',subSystem:'Sub',description:'Description',functionMain:'',vascularization:'',innervation:'',clinicalNotes:'',imageUrl:'/anatomy/system-1.svg',isFree:true,status:'published',pins:[],mediaItems:[{id:'image',title:'Image',type:'2d_image',url:'/anatomy/system-1.svg'}]};
    const created=await AnatomyDatabaseService.saveOrgan(newOrgan);
    assert.equal(created.version,1);
    assert.equal(db.prepare('SELECT count(*) AS n FROM organs').get().n,1);
    dropNextResponse=true;
    const edited=await AnatomyDatabaseService.saveOrgan({...created,name:'Edited'});
    assert.equal(edited.version,2);
    await AnatomyDatabaseService.saveOrgan({...edited,name:'Changed elsewhere'});
    await assert.rejects(()=>AnatomyDatabaseService.saveOrgan({...edited,name:'Stale edit'}),/diubah oleh pengguna lain/);
    assert.equal(JSON.parse(String(db.prepare('SELECT data FROM organs').get().data)).name,'Changed elsewhere');
  } finally {
    globalThis.fetch=actualFetch;
    await new Promise<void>(resolve=>server.close(()=>resolve()));db.close();
    const resolved=path.resolve(directory);assert.ok(resolved.startsWith(path.resolve(os.tmpdir())+path.sep+'atlas-client-test-'));fs.rmSync(resolved,{recursive:true,force:true});
  }
});
