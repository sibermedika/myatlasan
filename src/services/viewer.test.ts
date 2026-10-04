import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToString } from 'react-dom/server';
import ThreeDCanvas from '../components/ThreeDCanvas';
import type { Organ } from '../types';

test('3D viewer mounts with React hooks for every supported package format', () => {
  for (const format of ['glb','gltf','obj','stl','fbx','3ds'] as const) {
    const organ = { id:'package-test',name:'Kidney',latinName:'Ren',system:'Kemih',subSystem:'Organ',description:'Test',functionMain:'',vascularization:'',innervation:'',clinicalNotes:'',imageUrl:'',isFree:false,pins:[],model3dData:'/api/media/test-model',model3dFormat:format,mediaType:'3d_model' } satisfies Organ;
    const markup=renderToString(React.createElement(ThreeDCanvas,{organ,pins:[],selectedPin:null,onSelectPin:()=>{},currentRole:'ADMIN',isPinModeActive:false,onPinPlaced:()=>{},theme:'light'}));
    assert.ok(markup.length>0,format+' viewer must mount');
  }
});
