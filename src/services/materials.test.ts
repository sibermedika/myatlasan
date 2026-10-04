import test from 'node:test';
import assert from 'node:assert/strict';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Color, LinearSRGBColorSpace, MeshPhysicalMaterial, ShaderLib, SRGBColorSpace, Texture } from 'three';
import { SpecularGlossinessMaterial, specularGlossinessPlugin } from '../utils/specularGlossiness';
import { bundleResources } from '../utils/modelResources';

const legacyName = 'KHR_materials_pbrSpecularGlossiness';
const model = (materials: unknown[]) => ({ asset:{version:'2.0'}, extensionsUsed:[legacyName,'KHR_texture_transform'], extensionsRequired:[legacyName], scene:0, scenes:[{nodes:[]}], materials,
  images:[{uri:'textures/diffuse.jpeg'},{uri:'textures/specularGlossiness.png'},{uri:'textures/normal.png'}], textures:[{source:0},{source:1},{source:2}] });

test('legacy GLTF materials load diffuse, specular, glossiness, alpha and UV transforms from ZIP sidecars', async () => {
  const files = ['diffuse.jpeg','specularGlossiness.png','normal.png'].map(name => ({name,path:'textures/'+name,blob:new Blob([name])}));
  const resources=bundleResources(files);
  const requests:string[]=[];
  // The fixture decodes no pixels; exercise the real GLTF material and URL loaders.
  resources.manager.addHandler(/\.(jpeg|png)$/i, {
    load(url:string,onLoad:(texture:Texture)=>void,_progress:unknown,onError:(error:unknown)=>void) {
      const texture=new Texture(); const resolved=resources.manager.resolveURL(url);
      resources.manager.itemStart(resolved);
      fetch(resolved).then(response=>response.text()).then(name=>{
        requests.push(name); texture.name=name; onLoad(texture);
      },error=>{resources.manager.itemError(resolved);onError(error);}).finally(()=>resources.manager.itemEnd(resolved));
      return texture;
    }
  } as never);
  const previousSelf = globalThis.self;
  globalThis.self = globalThis as never;
  const definition = {name:'Kidney',alphaMode:'BLEND',doubleSided:true,normalTexture:{index:2,scale:0.33},
    pbrMetallicRoughness:{baseColorTexture:{index:2},metallicFactor:1},
    extensions:{[legacyName]:{diffuseFactor:[0.8,0.6,0.4,0.5],diffuseTexture:{index:0,texCoord:1,extensions:{KHR_texture_transform:{offset:[0.2,0.1],scale:[1.4,0.6]}}},
      specularFactor:[0.12,0.11,0.1],glossinessFactor:0.94,specularGlossinessTexture:{index:1,extensions:{KHR_texture_transform:{scale:[-2,1]}}}}}};
  try {
    const loader=new GLTFLoader(resources.manager).register(specularGlossinessPlugin);
    const loaded=await loader.parseAsync(JSON.stringify(model([definition,{pbrMetallicRoughness:{baseColorFactor:[0.2,0.3,0.4,1],metallicFactor:0.5,roughnessFactor:0.7}}])),'');
    const materials=await loaded.parser.getDependencies('material'); await resources.ready();
    const material=materials[0] as SpecularGlossinessMaterial;
    assert.ok(material instanceof SpecularGlossinessMaterial);
    assert.equal(material.map?.name,'textures/diffuse.jpeg'); assert.equal(material.map?.colorSpace,SRGBColorSpace);
    assert.equal(material.map?.channel,1); assert.deepEqual(material.map?.offset.toArray(),[0.2,0.1]); assert.deepEqual(material.map?.repeat.toArray(),[1.4,0.6]);
    assert.equal(material.specularColorMap?.name,'textures/specularGlossiness.png'); assert.equal(material.roughnessMap?.name,'textures/specularGlossiness.png');
    assert.deepEqual(material.roughnessMap?.repeat.toArray(),[-2,1]); assert.equal(material.normalMap?.name,'textures/normal.png');
    assert.equal(material.metalness,0); assert.ok(Math.abs(material.roughness-0.06)<1e-10); assert.equal(material.opacity,0.5); assert.equal(material.transparent,true);
    assert.ok(material.color.equals(new Color().setRGB(0.8,0.6,0.4,LinearSRGBColorSpace)));
    assert.deepEqual(material.specularColor.toArray(),[0.12,0.11,0.1]);
    assert.deepEqual(requests.sort(),['diffuse.jpeg','normal.png','specularGlossiness.png']);
    const standard=materials[1]; assert.ok(!(standard instanceof SpecularGlossinessMaterial)); assert.equal(standard.metalness,0.5); assert.equal(standard.roughness,0.7);
    for(const candidate of [material,material.clone(),new SpecularGlossinessMaterial().copy(material)]) {
      const shader={fragmentShader:ShaderLib.physical.fragmentShader,vertexShader:ShaderLib.physical.vertexShader,uniforms:{}};
      candidate.onBeforeCompile(shader as Parameters<MeshPhysicalMaterial['onBeforeCompile']>[0],{} as never);
      assert.match(shader.fragmentShader,/roughnessMap, vRoughnessMapUv\)\.a/);
      assert.match(shader.fragmentShader,/material\.specularColorBlended = specularColorFactor/);
      assert.equal(candidate.map,material.map); candidate.dispose();
    }
  } finally { globalThis.self=previousSelf; resources.dispose(); }
});

test('legacy material defaults and factors work without image maps', async () => {
  const loaded=await new GLTFLoader().register(specularGlossinessPlugin).parseAsync(JSON.stringify(model([{extensions:{[legacyName]:{}}}])),'');
  const material=await loaded.parser.getDependency('material',0) as MeshPhysicalMaterial;
  assert.equal(material.metalness,0); assert.equal(material.roughness,0); assert.deepEqual(material.specularColor.toArray(),[1,1,1]); assert.equal(material.opacity,1); assert.equal(material.map,null);
  material.dispose();
});
