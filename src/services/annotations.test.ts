import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { pinsForMedia, imagePoint, annotationShortcut } from '../utils/annotations';
import { normalizeModel, anchorWorld, meshVisible, modelSurfaces, surfacePosition } from '../utils/modelGeometry';
import { bundleResources } from '../utils/modelResources';
import { prepareModelPackage } from '../utils/modelPackage';
import type { OrganMediaItem, Pin } from '../types';

test('annotations remain on their own media and legacy pins have one compatible view', () => {
  const media: OrganMediaItem[] = [{id:'front',title:'Front',type:'2d_image',url:'/front.png',isDefault:true},{id:'back',title:'Back',type:'2d_image',url:'/back.png'},{id:'model',title:'Model',type:'3d_model',url:'',model3dType:'heart'}];
  const base: Pin = {id:'pin',title:'Test',description:'Test',x:40,y:60};
  const pins = [base,{...base,id:'back-pin',mediaId:'back'},{...base,id:'3d-pin',mediaId:'model',is3d:true,z:1}];
  assert.deepEqual(pinsForMedia(pins,media,media[0]).map(pin=>pin.id),['pin']);
  assert.deepEqual(pinsForMedia(pins,media,media[1]).map(pin=>pin.id),['back-pin']);
  assert.deepEqual(pinsForMedia(pins,media,media[2]).map(pin=>pin.id),['3d-pin']);
  assert.deepEqual(imagePoint(260,320,{left:100,top:200,width:400,height:200}),{x:40,y:60});
  assert.deepEqual(imagePoint(440,390,{left:120,top:150,width:800,height:400}),{x:40,y:60});
  assert.equal(imagePoint(99,250,{left:100,top:200,width:400,height:200}),null);
});

test('offset and nonuniformly scaled models normalize correctly and local anchors follow rotation', () => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(2,2,2));
  mesh.position.set(100,-40,12); mesh.scale.set(3,2,1);
  normalizeModel(mesh);
  const box = new THREE.Box3().setFromObject(mesh);
  assert.ok(box.getCenter(new THREE.Vector3()).length()<1e-8);
  const size=box.getSize(new THREE.Vector3());
  assert.ok(Math.abs(size.x-4.2)<1e-8); assert.ok(Math.abs(size.y-2.8)<1e-8);
  const model=new THREE.Group();
  const pin: Pin={id:'test',title:'Test',description:'Test',x:1,y:0,z:0,is3d:true,coordinateSpace:'model'};
  model.rotation.y=Math.PI/2; model.position.set(4,0,2); model.updateMatrixWorld(true);
  const anchor=anchorWorld(model,pin);
  assert.ok(anchor.distanceTo(new THREE.Vector3(4,0,1))<1e-8);
  mesh.geometry.dispose(); (mesh.material as THREE.Material).dispose();
});

test('GLTF packages preserve nested resource paths and reject ambiguous main files', () => {
  const file=(name:string,path:string)=>({name,path,blob:new Blob(['test'])});
  const pack=prepareModelPackage([file('model.gltf','folder/model.gltf'),file('geometry.bin','folder/geometry.bin'),file('skin.png','folder/textures/skin.png')]);
  assert.equal(pack.format,'gltf'); assert.deepEqual(pack.bundleFiles.map(file=>file.path),['geometry.bin','textures/skin.png']);
  assert.throws(()=>prepareModelPackage([file('a.obj','a.obj'),file('b.obj','b.obj')]),/satu berkas model/);
});

test('occlusion uses model surfaces, excluding nail sprites and hidden structures', () => {
  const model = new THREE.Group();
  const surface = new THREE.Mesh(new THREE.BoxGeometry(2,2,2)); model.add(surface);
  const head = new THREE.Sprite(new THREE.SpriteMaterial()); head.position.z = 1.3; head.userData.pinData = {id:'pin'}; model.add(head);
  model.updateMatrixWorld(true);
  const ray = new THREE.Raycaster(new THREE.Vector3(0,0,8),new THREE.Vector3(0,0,-1));
  const hit = ray.intersectObjects(modelSurfaces(model).filter(meshVisible),false)[0];
  assert.ok(hit); assert.equal(hit.object,surface);
  assert.ok(hit.distance > 8-head.position.z);
  assert.ok(hit.distance < 8+head.position.z);
  model.visible=false; assert.equal(modelSurfaces(model).filter(meshVisible).length,0);
  surface.geometry.dispose(); (surface.material as THREE.Material).dispose(); head.material.dispose();
});

test('bundled textures resolve by path and finish before resource disposal', async () => {
  const resources=bundleResources([{name:'skin.png',path:'front/skin.png',blob:new Blob(['front'])},{name:'skin.png',path:'back/skin.png',blob:new Blob(['back'])}]);
  try {
    assert.notEqual(resources.manager.resolveURL('front/skin.png'),resources.manager.resolveURL('back/skin.png'));
    assert.throws(()=>resources.manager.resolveURL('skin.png'),/ambigu/);
    assert.throws(()=>resources.manager.resolveURL('missing.bin'),/tidak ditemukan/);
    resources.manager.itemStart('front/skin.png');
    let finished=false; const ready=resources.ready().then(()=>{finished=true;}); await Promise.resolve(); assert.equal(finished,false);
    resources.manager.itemEnd('front/skin.png'); await ready; assert.equal(finished,true);
  } finally { resources.dispose(); }
});

test('annotation shortcuts preserve text editing and ignore held Delete', () => {
  const event={key:'Delete',ctrlKey:false,metaKey:false,shiftKey:false,repeat:false};
  assert.equal(annotationShortcut(event,false),'delete');
  assert.equal(annotationShortcut(event,true),null);
  assert.equal(annotationShortcut({...event,repeat:true},false),null);
  assert.equal(annotationShortcut({...event,key:'z',ctrlKey:true},false),'undo');
  assert.equal(annotationShortcut({...event,key:'z',ctrlKey:true},true),null);
  assert.equal(annotationShortcut({...event,key:'z',ctrlKey:true,shiftKey:true},false),null);
});

test('3D relocation stores local surface coordinates and outward normals under transforms', () => {
  const model=new THREE.Group(); model.position.set(4,0,2); model.rotation.y=Math.PI/2; model.scale.set(2,1,3);
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(2,2,2)); model.add(mesh); model.updateMatrixWorld(true);
  const worldPoint=model.localToWorld(new THREE.Vector3(0,0,1));
  const direction=new THREE.Vector3(-1,0,0);
  const hit=new THREE.Raycaster(worldPoint.clone().add(new THREE.Vector3(3,0,0)),direction).intersectObject(mesh)[0];
  assert.ok(hit);
  const position=surfacePosition(model,hit,direction);
  assert.ok(new THREE.Vector3(position.x,position.y,position.z).distanceTo(new THREE.Vector3(0,0,1))<1e-8);
  assert.ok(new THREE.Vector3(position.normal.x,position.normal.y,position.normal.z).distanceTo(new THREE.Vector3(0,0,1))<1e-8);
  mesh.geometry.dispose(); (mesh.material as THREE.Material).dispose();
});
