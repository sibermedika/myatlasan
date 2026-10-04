import { Color, LinearSRGBColorSpace, MeshPhysicalMaterial, SRGBColorSpace } from 'three';
import type { MeshPhysicalMaterialParameters, WebGLRenderer } from 'three';
import type { GLTFLoaderPlugin, GLTFParser } from 'three/examples/jsm/loaders/GLTFLoader.js';

const extensionName = 'KHR_materials_pbrSpecularGlossiness';

/** Legacy glTF material, preserving diffuse RGB, specular RGB and glossiness alpha. */
export class SpecularGlossinessMaterial extends MeshPhysicalMaterial {
  constructor(parameters?: MeshPhysicalMaterialParameters) {
    super(parameters);
    this.metalness = 0;
  }

  override customProgramCacheKey() { return 'atlas-specular-glossiness-v1'; }

  override onBeforeCompile(shader: Parameters<MeshPhysicalMaterial['onBeforeCompile']>[0], _renderer: WebGLRenderer) {
    // A legacy glossiness map shares the specular texture, with glossiness in A.
    // Built-in map plumbing preserves UV channels, transforms and color spaces.
    shader.fragmentShader = shader.fragmentShader.replace('#include <roughnessmap_fragment>', `
      float roughnessFactor = roughness;
      #ifdef USE_ROUGHNESSMAP
        roughnessFactor = 1.0 - (1.0 - roughness) * texture2D(roughnessMap, vRoughnessMapUv).a;
      #endif
    `).replace('#include <lights_physical_fragment>', `
      #include <lights_physical_fragment>
      material.specularColor = specularColorFactor;
      material.specularColorBlended = specularColorFactor;
      material.specularF90 = 1.0;
      material.diffuseContribution = diffuseColor.rgb * (1.0 - max(specularColorFactor.r, max(specularColorFactor.g, specularColorFactor.b)));
    `);
  }
}

export function specularGlossinessPlugin(parser: GLTFParser): GLTFLoaderPlugin {
  const definition = (index: number) => parser.json.materials?.[index]?.extensions?.[extensionName];
  return {
    name: extensionName,
    loadMaterial(index) {
      if (!definition(index)) return null;
      // A metallic/roughness fallback must not race the legacy texture bindings.
      const original = parser.json.materials[index];
      parser.json.materials[index] = { ...original, pbrMetallicRoughness: {} };
      try { return parser.loadMaterial(index); }
      finally { parser.json.materials[index] = original; }
    },
    getMaterialType(index) { return definition(index) ? SpecularGlossinessMaterial : null; },
    extendMaterialParams(index, params) {
      const legacy = definition(index);
      if (!legacy) return null;
      const diffuse = legacy.diffuseFactor || [1, 1, 1, 1];
      const specular = legacy.specularFactor || [1, 1, 1];
      params.color = new Color().setRGB(diffuse[0], diffuse[1], diffuse[2], LinearSRGBColorSpace);
      params.opacity = diffuse[3];
      params.specularColor = new Color().setRGB(specular[0], specular[1], specular[2], LinearSRGBColorSpace);
      params.specularIntensity = 1;
      params.metalness = 0;
      params.roughness = 1 - (legacy.glossinessFactor ?? 1);
      params.map = null; params.metalnessMap = null; params.roughnessMap = null;
      const pending: Promise<unknown>[] = [];
      if (legacy.diffuseTexture) pending.push(parser.assignTexture(params, 'map', legacy.diffuseTexture, SRGBColorSpace));
      if (legacy.specularGlossinessTexture) {
        pending.push(parser.assignTexture(params, 'specularColorMap', legacy.specularGlossinessTexture, SRGBColorSpace));
        pending.push(parser.assignTexture(params, 'roughnessMap', legacy.specularGlossinessTexture, SRGBColorSpace));
      }
      return Promise.all(pending);
    }
  };
}
