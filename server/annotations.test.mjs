import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import express from 'express';
import { createApi } from './api.mjs';

test('annotation validation, media binding and persistence across restart', async () => {
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'atlas-annotations-test-'));
  let api=createApi({directory,adminPassword:'test-admin-password'});
  const outer=express(); outer.use('/api',api.app); const server=outer.listen(0,'127.0.0.1'); await new Promise(resolve=>server.once('listening',resolve));
  const base='http://127.0.0.1:'+server.address().port+'/api'; let cookie='';
  const request=async(url,method='GET',body)=>{const response=await fetch(base+url,{method,headers:{'content-type':'application/json','X-Atlas-Request':'1',Cookie:cookie},body:body===undefined?undefined:JSON.stringify(body)}); const data=await response.json();return {status:response.status,data,cookie:response.headers.get('set-cookie')?.split(';')[0]};};
  try {
    cookie=(await request('/auth/login','POST',{identifier:'admin',password:'test-admin-password'})).cookie;
    const organ={id:'annotation-topic',name:'Test',latinName:'Test',system:'Test',subSystem:'Test',description:'Test',isFree:true,imageUrl:'/anatomy/system-1.svg',mediaItems:[{id:'image-a',type:'2d_image',url:'/anatomy/system-1.svg',isDefault:true},{id:'image-b',type:'2d_image',url:'/anatomy/system-2.jpg'},{id:'model',type:'3d_model',url:'',model3dType:'heart'}],pins:[]};
    const pin={id:'note',title:'Structure',description:'Description',x:30,y:50,mediaId:'image-a',is3d:false};
    for(const invalid of [{...pin,x:101},{...pin,mediaId:'missing'},{...pin,is3d:true,z:1},{...pin,description:''},{...pin,mediaId:'model',is3d:true},{...pin,mediaId:'model',is3d:true,z:1,normal:{x:0,y:0,z:0}}]) assert.equal((await request('/organs/annotation-topic','PUT',{...organ,pins:[invalid]})).status,400);
    assert.equal((await request('/organs/annotation-topic','PUT',{...organ,pins:[pin,pin]})).status,400);
    const localPin={...pin,id:'model-note',mediaId:'model',is3d:true,x:0.1,y:0.2,z:0.3,coordinateSpace:'model',normal:{x:0,y:0,z:1}};
    const saved=await request('/organs/annotation-topic','PUT',{...organ,pins:[pin,localPin]}); assert.equal(saved.status,200);
    assert.equal((await request('/organs/annotation-topic','PUT',{...saved.data,mediaItems:organ.mediaItems.filter(item=>item.id!=='image-a')})).status,400);
    assert.equal((await request('/organs/annotation-topic','PUT',{...saved.data,pins:[{...pin,mediaId:'image-b'},localPin]})).status,200);
    assert.equal((await request('/organs/annotation-topic','PUT',saved.data)).status,409);
    const latest=(await request('/organs')).data.find(item=>item.id===organ.id);
    const movedPin={...localPin,x:-0.8,y:0.4,z:1.2,normal:{x:0,y:1,z:0}};
    const moved=await request('/organs/annotation-topic','PUT',{...latest,pins:[{...latest.pins[0],x:72,y:18},movedPin]});
    assert.equal(moved.status,200); assert.equal(moved.data.pins[0].x,72); assert.deepEqual(moved.data.pins[1],movedPin);
    const deleted=await request('/organs/annotation-topic','PUT',{...moved.data,pins:[moved.data.pins[0]]});
    assert.equal(deleted.status,200); assert.equal(deleted.data.pins.length,1);
    const restored=await request('/organs/annotation-topic','PUT',{...deleted.data,pins:moved.data.pins});
    assert.equal(restored.status,200); assert.deepEqual(restored.data.pins,moved.data.pins);
    await new Promise(resolve=>server.close(resolve)); api.db.close(); api=createApi({directory});
    const persisted=JSON.parse(api.db.prepare('SELECT data FROM organs WHERE id=?').get(organ.id).data);
    assert.equal(persisted.pins[0].mediaId,'image-b'); assert.equal(persisted.pins[0].x,72); assert.deepEqual(persisted.pins[1],movedPin);
  } finally {
    if(server.listening) await new Promise(resolve=>server.close(resolve)); api.db.close();
    const resolved=path.resolve(directory); assert.ok(resolved.startsWith(path.resolve(os.tmpdir())+path.sep+'atlas-annotations-test-')); fs.rmSync(resolved,{recursive:true,force:true});
  }
});
