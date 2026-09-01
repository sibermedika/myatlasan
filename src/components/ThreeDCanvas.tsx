import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import * as fflate from 'fflate';

import { Organ, Pin, UserRole, Model3DPreset } from '../types';
import { AnatomyDatabaseService } from '../services/db';
import { 
  RotateCw, 
  ZoomIn, 
  ZoomOut, 
  Layers, 
  Sparkles, 
  MapPin, 
  Loader2, 
  AlertCircle, 
  Maximize2,
  Box
} from 'lucide-react';

interface ThreeDCanvasProps {
  organ: Organ;
  pins: Pin[];
  selectedPin: Pin | null;
  onSelectPin: (pin: Pin) => void;
  currentRole: UserRole;
  isPinModeActive: boolean;
  onPinPlaced: (coords: { x: number; y: number; z: number }) => void;
  theme: 'dark' | 'light';
  onSwitchTo2D?: () => void;
}

// Singleton DRACO Loader instance with official Google CDN decoder
let dracoLoaderInstance: DRACOLoader | null = null;
function getDracoLoader(): DRACOLoader {
  if (!dracoLoaderInstance) {
    dracoLoaderInstance = new DRACOLoader();
    dracoLoaderInstance.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    dracoLoaderInstance.setWorkerLimit(2);
  }
  return dracoLoaderInstance;
}

export default function ThreeDCanvas({
  organ,
  pins,
  selectedPin,
  onSelectPin,
  currentRole,
  isPinModeActive,
  onPinPlaced,
  theme,
  onSwitchTo2D
}: ThreeDCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);
  const pinsGroupRef = useRef<THREE.Group | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const animationFrameIdRef = useRef<number | null>(null);
  const activeLoadControllerRef = useRef<AbortController | null>(null);

  // View & UI states
  const [autoRotate, setAutoRotate] = useState(false);
  const [wireframe, setWireframe] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isLoadingModel, setIsLoadingModel] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isUsingProceduralFallback, setIsUsingProceduralFallback] = useState(false);

  // Helper to create Procedural Anatomical Preset Mesh
  const createProceduralAnatomicalMesh = useCallback((type: Model3DPreset | undefined, organId: string) => {
    const group = new THREE.Group();
    const isDark = theme === 'dark';

    const resolvedType = type || (
      organId.includes('cor') || organId.includes('jantung') ? 'heart' :
      organId.includes('cerebr') || organId.includes('otak') || organId.includes('saraf') ? 'brain' :
      organId.includes('pulmo') || organId.includes('paru') || organId.includes('respirasi') ? 'lungs' :
      organId.includes('cranium') || organId.includes('tulang') || organId.includes('skelet') ? 'skull' : 'body'
    );

    if (resolvedType === 'heart') {
      // 3D Cardiac Ventricles & Aorta Structure
      const heartGeo = new THREE.DodecahedronGeometry(2.2, 3);
      const pos = heartGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        let vx = pos.getX(i);
        let vy = pos.getY(i);
        let vz = pos.getZ(i);
        if (vy < 0) {
          vx *= 0.65;
          vz *= 0.65;
        } else {
          vx *= 1.15;
          vy *= 1.1;
        }
        pos.setXYZ(i, vx, vy, vz);
      }
      heartGeo.computeVertexNormals();

      const heartMat = new THREE.MeshPhysicalMaterial({
        color: 0xd9383a,
        roughness: 0.35,
        metalness: 0.1,
        clearcoat: 0.4,
        clearcoatRoughness: 0.2,
        wireframe
      });
      const mainHeart = new THREE.Mesh(heartGeo, heartMat);
      mainHeart.name = 'organ-mesh';
      group.add(mainHeart);

      // Aorta Arch
      const aortaCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 1.6, 0),
        new THREE.Vector3(0.5, 3.2, 0.4),
        new THREE.Vector3(-0.8, 3.6, 0.2),
        new THREE.Vector3(-1.4, 2.2, -0.4),
        new THREE.Vector3(-1.2, 0.5, -0.6)
      ]);
      const aortaGeo = new THREE.TubeGeometry(aortaCurve, 32, 0.45, 16, false);
      const aortaMat = new THREE.MeshStandardMaterial({
        color: 0xef4444,
        roughness: 0.3,
        wireframe
      });
      const aortaMesh = new THREE.Mesh(aortaGeo, aortaMat);
      aortaMesh.name = 'organ-mesh';
      group.add(aortaMesh);

      // Vena Cava Superior
      const venaGeo = new THREE.CylinderGeometry(0.35, 0.35, 2.2, 16);
      const venaMat = new THREE.MeshStandardMaterial({
        color: 0x3b82f6,
        roughness: 0.3,
        wireframe
      });
      const venaMesh = new THREE.Mesh(venaGeo, venaMat);
      venaMesh.position.set(1.4, 2.0, -0.2);
      venaMesh.name = 'organ-mesh';
      group.add(venaMesh);

      // Pulmonary Artery
      const paCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.3, 1.8, 0.6),
        new THREE.Vector3(0.2, 2.4, 0.5),
        new THREE.Vector3(1.6, 2.3, 0.1)
      ]);
      const paGeo = new THREE.TubeGeometry(paCurve, 24, 0.38, 16, false);
      const paMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.3, wireframe });
      const paMesh = new THREE.Mesh(paGeo, paMat);
      paMesh.name = 'organ-mesh';
      group.add(paMesh);

    } else if (resolvedType === 'brain') {
      // 3D Brain Hemispheres
      const leftGeo = new THREE.SphereGeometry(1.9, 32, 32);
      leftGeo.scale(0.85, 1.1, 1.25);
      const posL = leftGeo.attributes.position;
      for (let i = 0; i < posL.count; i++) {
        let x = posL.getX(i);
        let y = posL.getY(i);
        let z = posL.getZ(i);
        const bump = Math.sin(x * 6) * Math.cos(y * 6) * Math.sin(z * 6) * 0.12;
        posL.setXYZ(i, x + bump, y + bump, z + bump);
      }
      leftGeo.computeVertexNormals();

      const brainMat = new THREE.MeshPhysicalMaterial({
        color: 0xf8a5c2,
        roughness: 0.45,
        clearcoat: 0.3,
        wireframe
      });
      const leftHemi = new THREE.Mesh(leftGeo, brainMat);
      leftHemi.position.set(-0.85, 0.4, 0);
      leftHemi.name = 'organ-mesh';
      group.add(leftHemi);

      const rightGeo = leftGeo.clone();
      const rightHemi = new THREE.Mesh(rightGeo, brainMat);
      rightHemi.position.set(0.85, 0.4, 0);
      rightHemi.name = 'organ-mesh';
      group.add(rightHemi);

      // Cerebellum
      const cereGeo = new THREE.SphereGeometry(1.1, 24, 24);
      cereGeo.scale(1.3, 0.75, 0.9);
      const cereMat = new THREE.MeshStandardMaterial({
        color: 0xe082a3,
        roughness: 0.5,
        wireframe
      });
      const cereMesh = new THREE.Mesh(cereGeo, cereMat);
      cereMesh.position.set(0, -1.1, -0.9);
      cereMesh.name = 'organ-mesh';
      group.add(cereMesh);

      // Brainstem
      const stemGeo = new THREE.CylinderGeometry(0.4, 0.3, 1.8, 16);
      const stemMat = new THREE.MeshStandardMaterial({
        color: 0xf3d9d9,
        roughness: 0.4,
        wireframe
      });
      const stemMesh = new THREE.Mesh(stemGeo, stemMat);
      stemMesh.position.set(0, -1.6, -0.1);
      stemMesh.name = 'organ-mesh';
      group.add(stemMesh);

    } else if (resolvedType === 'lungs') {
      // 3D Lungs
      const lungMat = new THREE.MeshPhysicalMaterial({
        color: 0xe07a7a,
        roughness: 0.5,
        clearcoat: 0.2,
        wireframe
      });

      const rLungGeo = new THREE.ConeGeometry(1.6, 3.4, 24);
      rLungGeo.scale(0.9, 1, 1.1);
      const rLung = new THREE.Mesh(rLungGeo, lungMat);
      rLung.position.set(-1.4, 0.2, 0);
      rLung.rotation.z = -0.15;
      rLung.name = 'organ-mesh';
      group.add(rLung);

      const lLungGeo = new THREE.ConeGeometry(1.5, 3.2, 24);
      lLungGeo.scale(0.8, 1, 1.05);
      const lLung = new THREE.Mesh(lLungGeo, lungMat);
      lLung.position.set(1.4, 0.2, 0);
      lLung.rotation.z = 0.15;
      lLung.name = 'organ-mesh';
      group.add(lLung);

      const trachGeo = new THREE.CylinderGeometry(0.3, 0.3, 2.2, 16);
      const trachMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.4, wireframe });
      const trach = new THREE.Mesh(trachGeo, trachMat);
      trach.position.set(0, 2.0, 0);
      trach.name = 'organ-mesh';
      group.add(trach);

    } else if (resolvedType === 'skull') {
      // 3D Cranium / Skull
      const craniumGeo = new THREE.SphereGeometry(1.9, 28, 28);
      craniumGeo.scale(0.9, 1.1, 1.1);
      const boneMat = new THREE.MeshStandardMaterial({
        color: 0xf1f5f9,
        roughness: 0.35,
        wireframe
      });
      const cranium = new THREE.Mesh(craniumGeo, boneMat);
      cranium.position.set(0, 0.8, 0);
      cranium.name = 'organ-mesh';
      group.add(cranium);

      const maxillaGeo = new THREE.BoxGeometry(1.6, 1.2, 1.4);
      const maxilla = new THREE.Mesh(maxillaGeo, boneMat);
      maxilla.position.set(0, -0.4, 0.7);
      maxilla.name = 'organ-mesh';
      group.add(maxilla);

      const mandibleGeo = new THREE.CylinderGeometry(0.9, 0.9, 0.7, 16, 1, false, 0, Math.PI);
      const mandible = new THREE.Mesh(mandibleGeo, boneMat);
      mandible.position.set(0, -1.3, 0.5);
      mandible.rotation.y = Math.PI;
      mandible.name = 'organ-mesh';
      group.add(mandible);

    } else {
      // General Human Torso Anatomy Model
      const torsoGeo = new THREE.CylinderGeometry(1.7, 1.2, 3.8, 24);
      torsoGeo.scale(1.2, 1, 0.7);
      const torsoMat = new THREE.MeshPhysicalMaterial({
        color: isDark ? 0x0ea5e9 : 0x0284c7,
        roughness: 0.4,
        transmission: 0.6,
        opacity: 0.85,
        transparent: true,
        wireframe
      });
      const torso = new THREE.Mesh(torsoGeo, torsoMat);
      torso.name = 'organ-mesh';
      group.add(torso);

      const spineGeo = new THREE.CylinderGeometry(0.2, 0.25, 4.0, 16);
      const spineMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
      const spine = new THREE.Mesh(spineGeo, spineMat);
      spine.position.set(0, 0, -0.4);
      group.add(spine);
    }

    return group;
  }, [theme, wireframe]);

  // Center and normalize bounding box of loaded 3D Object
  const normalizeAndCenterModel = (object: THREE.Object3D, targetSize: number = 4.2) => {
    const box = new THREE.Box3().setFromObject(object);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    // Center geometry at origin (0, 0, 0)
    object.position.x -= center.x;
    object.position.y -= center.y;
    object.position.z -= center.z;

    // Uniformly scale model so it fills viewport comfortably
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0) {
      const scaleFactor = targetSize / maxDim;
      object.scale.set(scaleFactor, scaleFactor, scaleFactor);
    }

    // Traverse and tag child meshes for raycasting & material properties
    object.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.name = mesh.name || 'organ-mesh';

        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((mat) => {
              mat.side = THREE.DoubleSide;
              if ('wireframe' in mat) (mat as THREE.MeshStandardMaterial).wireframe = wireframe;
            });
          } else {
            mesh.material.side = THREE.DoubleSide;
            if ('wireframe' in mesh.material) (mesh.material as THREE.MeshStandardMaterial).wireframe = wireframe;
          }
        }
      }
    });
  };

  // Load 3D model asynchronously based on format (.glb, .gltf, .fbx, .obj, .stl)
  const loadCustom3DModel = useCallback(async (sourceUrl: string, format: string): Promise<THREE.Group> => {
    const normalizedFormat = (format || 'glb').toLowerCase();
    const group = new THREE.Group();

    if (normalizedFormat === 'glb' || normalizedFormat === 'gltf' || sourceUrl.endsWith('.glb') || sourceUrl.endsWith('.gltf')) {
      const loader = new GLTFLoader();
      loader.setDRACOLoader(getDracoLoader());

      return new Promise<THREE.Group>((resolve, reject) => {
        loader.load(
          sourceUrl,
          (gltf) => {
            const loadedScene = gltf.scene || gltf.scenes[0];
            normalizeAndCenterModel(loadedScene);
            group.add(loadedScene);
            resolve(group);
          },
          (xhr) => {
            if (xhr.total > 0) {
              setLoadProgress(Math.round((xhr.loaded / xhr.total) * 100));
            }
          },
          (error: any) => {
            reject(new Error(`Gagal membaca GLTF/GLB: ${error?.message || String(error) || 'Format tidak valid'}`));
          }
        );
      });
    } else if (normalizedFormat === 'fbx' || sourceUrl.endsWith('.fbx')) {
      const fbxLoader = new FBXLoader();

      return new Promise<THREE.Group>((resolve, reject) => {
        fbxLoader.load(
          sourceUrl,
          (fbx) => {
            normalizeAndCenterModel(fbx);
            group.add(fbx);
            resolve(group);
          },
          (xhr) => {
            if (xhr.total > 0) {
              setLoadProgress(Math.round((xhr.loaded / xhr.total) * 100));
            }
          },
          (error: any) => {
            reject(new Error(`Gagal membaca FBX: ${error?.message || String(error) || 'Format FBX tidak valid'}`));
          }
        );
      });
    } else if (normalizedFormat === 'obj' || sourceUrl.endsWith('.obj')) {
      const objLoader = new OBJLoader();

      return new Promise<THREE.Group>((resolve, reject) => {
        objLoader.load(
          sourceUrl,
          (obj) => {
            normalizeAndCenterModel(obj);
            group.add(obj);
            resolve(group);
          },
          (xhr) => {
            if (xhr.total > 0) {
              setLoadProgress(Math.round((xhr.loaded / xhr.total) * 100));
            }
          },
          (error: any) => {
            reject(new Error(`Gagal membaca OBJ: ${error?.message || String(error) || 'Format OBJ tidak valid'}`));
          }
        );
      });
    } else if (normalizedFormat === 'stl' || sourceUrl.endsWith('.stl')) {
      const stlLoader = new STLLoader();

      return new Promise<THREE.Group>((resolve, reject) => {
        stlLoader.load(
          sourceUrl,
          (geometry) => {
            geometry.computeVertexNormals();
            const mat = new THREE.MeshStandardMaterial({
              color: 0x14b8a6,
              roughness: 0.35,
              metalness: 0.1,
              wireframe
            });
            const mesh = new THREE.Mesh(geometry, mat);
            normalizeAndCenterModel(mesh);
            group.add(mesh);
            resolve(group);
          },
          (xhr) => {
            if (xhr.total > 0) {
              setLoadProgress(Math.round((xhr.loaded / xhr.total) * 100));
            }
          },
          (error: any) => {
            reject(new Error(`Gagal membaca STL: ${error?.message || String(error) || 'Format STL tidak valid'}`));
          }
        );
      });
    } else {
      throw new Error(`Format 3D '${normalizedFormat}' belum didukung.`);
    }
  }, [wireframe]);

  // Update 3D Pins in the Scene
  const updatePinsInScene = useCallback(() => {
    if (!pinsGroupRef.current) return;
    const pinsGroup = pinsGroupRef.current;
    
    // Clear previous pin objects
    while (pinsGroup.children.length > 0) {
      pinsGroup.remove(pinsGroup.children[0]);
    }

    pins.forEach((pin) => {
      const px = pin.x !== undefined ? (pin.is3d ? pin.x : ((pin.x - 50) / 25) * 1.5) : 0;
      const py = pin.y !== undefined ? (pin.is3d ? pin.y : ((50 - pin.y) / 25) * 1.5) : 0;
      const pz = pin.z !== undefined ? pin.z : 1.8;

      const isSelected = selectedPin && selectedPin.id === pin.id;

      // Pin Container Group
      const pinObj = new THREE.Group();
      pinObj.position.set(px, py, pz);
      pinObj.userData = { pinData: pin };

      // Pin sphere beacon
      const sphereGeo = new THREE.SphereGeometry(0.22, 16, 16);
      const sphereMat = new THREE.MeshBasicMaterial({
        color: isSelected ? 0xf59e0b : 0x14b8a6,
      });
      const sphere = new THREE.Mesh(sphereGeo, sphereMat);
      pinObj.add(sphere);

      // Outer pulse ring
      const ringGeo = new THREE.RingGeometry(0.28, 0.38, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: isSelected ? 0xfbbf24 : 0x2dd4bf,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      pinObj.add(ring);

      // Connecting stalk
      const stalkGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.5, 8);
      const stalkMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const stalk = new THREE.Mesh(stalkGeo, stalkMat);
      stalk.position.set(0, -0.3, 0);
      pinObj.add(stalk);

      pinsGroup.add(pinObj);
    });
  }, [pins, selectedPin]);

  // Main Scene Setup & Asynchronous Model Loading
  useEffect(() => {
    if (!mountRef.current) return;

    let isMounted = true;
    const width = mountRef.current.clientWidth || 600;
    const height = mountRef.current.clientHeight || 450;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    const isDark = theme === 'dark';
    scene.background = new THREE.Color(isDark ? 0x020617 : 0xf8fafc);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 8.5);
    cameraRef.current = camera;

    // 3. Renderer with safe WebGL parameters
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true, 
      powerPreference: 'high-performance' 
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    rendererRef.current = renderer;

    mountRef.current.innerHTML = '';
    mountRef.current.appendChild(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, isDark ? 0.85 : 1.1);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.4);
    dirLight1.position.set(5, 8, 6);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 0.9);
    dirLight2.position.set(-5, -4, -5);
    scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0x2dd4bf, 1.2, 15);
    pointLight.position.set(0, 4, 3);
    scene.add(pointLight);

    // 5. Pins Group
    const pinsGroup = new THREE.Group();
    pinsGroupRef.current = pinsGroup;
    scene.add(pinsGroup);

    // 6. Asynchronous Model Resolution & Loading
    async function setupModel() {
      setLoadError(null);
      setIsLoadingModel(true);
      setLoadProgress(0);

      try {
        const sourceUrl = await AnatomyDatabaseService.resolve3DModelSource(organ);
        
        let loadedModel: THREE.Group;

        if (sourceUrl && (sourceUrl.startsWith('blob:') || sourceUrl.startsWith('http') || sourceUrl.startsWith('data:'))) {
          // Attempt to load the real 3D file (.glb, .gltf, .fbx, .obj, .stl)
          const format = organ.model3dFormat || 'glb';
          loadedModel = await loadCustom3DModel(sourceUrl, format);
          setIsUsingProceduralFallback(false);
        } else {
          // Use Procedural Anatomical Preset
          loadedModel = createProceduralAnatomicalMesh(organ.model3dType, organ.id);
          setIsUsingProceduralFallback(false);
        }

        if (!isMounted) return;

        // Clear any previous model in scene
        if (modelGroupRef.current) {
          scene.remove(modelGroupRef.current);
        }

        modelGroupRef.current = loadedModel;
        scene.add(loadedModel);
        updatePinsInScene();

      } catch (err: any) {
        console.warn('Failed to load custom 3D model, falling back to procedural preset:', err);
        if (!isMounted) return;

        setLoadError(err?.message || 'Gagal memuat berkas 3D');
        setIsUsingProceduralFallback(true);

        // Gracefully fallback to procedural anatomical mesh without crashing
        const fallbackMesh = createProceduralAnatomicalMesh(organ.model3dType, organ.id);
        if (modelGroupRef.current) {
          scene.remove(modelGroupRef.current);
        }
        modelGroupRef.current = fallbackMesh;
        scene.add(fallbackMesh);
        updatePinsInScene();

      } finally {
        if (isMounted) {
          setIsLoadingModel(false);
        }
      }
    }

    setupModel();

    // 7. Animation Loop
    const animate = () => {
      animationFrameIdRef.current = requestAnimationFrame(animate);

      if (modelGroupRef.current && autoRotate) {
        modelGroupRef.current.rotation.y += 0.006;
        if (pinsGroupRef.current) {
          pinsGroupRef.current.rotation.y += 0.006;
        }
      }

      // Billboard pins to face camera
      if (pinsGroupRef.current && cameraRef.current) {
        pinsGroupRef.current.children.forEach(child => {
          child.quaternion.copy(cameraRef.current!.quaternion);
        });
      }

      renderer.render(scene, camera);
    };
    animate();

    // 8. Resize Observer
    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      if (w > 0 && h > 0) {
        cameraRef.current.aspect = w / h;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(w, h);
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(mountRef.current);

    return () => {
      isMounted = false;
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
      resizeObserver.disconnect();

      // Dispose WebGL Geometries and Materials
      if (sceneRef.current) {
        sceneRef.current.traverse((object) => {
          if ((object as THREE.Mesh).isMesh) {
            const mesh = object as THREE.Mesh;
            mesh.geometry?.dispose();
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach(m => m.dispose());
            } else {
              mesh.material?.dispose();
            }
          }
        });
      }
      renderer.dispose();
    };
  }, [organ, theme, createProceduralAnatomicalMesh, loadCustom3DModel, updatePinsInScene]);

  // Update Pins whenever pins change
  useEffect(() => {
    updatePinsInScene();
  }, [updatePinsInScene]);

  // Mouse Interaction: Orbit Rotation & Pin Placement
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !modelGroupRef.current) return;

    const deltaX = e.clientX - previousMousePositionRef.current.x;
    const deltaY = e.clientY - previousMousePositionRef.current.y;

    modelGroupRef.current.rotation.y += deltaX * 0.008;
    modelGroupRef.current.rotation.x += deltaY * 0.008;

    if (pinsGroupRef.current) {
      pinsGroupRef.current.rotation.y += deltaX * 0.008;
      pinsGroupRef.current.rotation.x += deltaY * 0.008;
    }

    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mountRef.current || !cameraRef.current || !sceneRef.current) return;

    const rect = mountRef.current.getBoundingClientRect();
    mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);

    // 1. Check if user clicked an existing 3D pin
    if (pinsGroupRef.current) {
      const pinIntersects = raycasterRef.current.intersectObjects(pinsGroupRef.current.children, true);
      if (pinIntersects.length > 0) {
        let curr: THREE.Object3D | null = pinIntersects[0].object;
        while (curr && !curr.userData.pinData) {
          curr = curr.parent;
        }
        if (curr && curr.userData.pinData) {
          onSelectPin(curr.userData.pinData);
          return;
        }
      }
    }

    // 2. Pin Placement Mode for Lecturers & Superadmin
    if (isPinModeActive && (currentRole === 'DOSEN' || currentRole === 'SUPERADMIN')) {
      if (modelGroupRef.current) {
        const intersects = raycasterRef.current.intersectObjects(modelGroupRef.current.children, true);
        if (intersects.length > 0) {
          const point = intersects[0].point;
          onPinPlaced({
            x: parseFloat(point.x.toFixed(2)),
            y: parseFloat(point.y.toFixed(2)),
            z: parseFloat(point.z.toFixed(2))
          });
        }
      }
    }
  };

  const handleZoom = (direction: 'in' | 'out') => {
    if (!cameraRef.current) return;
    const factor = direction === 'in' ? 0.8 : 1.25;
    cameraRef.current.position.multiplyScalar(factor);
    setZoomLevel(prev => (direction === 'in' ? prev * 1.2 : prev * 0.8));
  };

  const handleResetCamera = () => {
    if (!cameraRef.current || !modelGroupRef.current || !pinsGroupRef.current) return;
    cameraRef.current.position.set(0, 0, 8.5);
    modelGroupRef.current.rotation.set(0, 0, 0);
    pinsGroupRef.current.rotation.set(0, 0, 0);
    setZoomLevel(1);
  };

  const isDark = theme === 'dark';

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden" id="three-d-canvas-wrapper">
      
      {/* 3D WebGL Viewport */}
      <div
        ref={mountRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleCanvasClick}
        className={`w-full h-full ${
          isPinModeActive ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'
        }`}
        id="webgl-3d-viewport"
      />

      {/* Loading Overlay Indicator with Progress */}
      {isLoadingModel && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/75 backdrop-blur-sm animate-fade-in pointer-events-none">
          <div className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl">
            <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
            <div className="text-center">
              <p className="text-xs font-bold text-slate-100">Memuat Model 3D Anatomi...</p>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                GLTF/DRACO Engine • {loadProgress > 0 ? `${loadProgress}%` : 'Parsing Geometry & Textures'}
              </p>
            </div>
            {loadProgress > 0 && (
              <div className="w-36 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-teal-400 transition-all duration-200"
                  style={{ width: `${loadProgress}%` }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Warning Notice if Procedural Fallback is active due to invalid file */}
      {loadError && isUsingProceduralFallback && (
        <div className="absolute top-4 left-4 z-20 max-w-sm p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs shadow-lg backdrop-blur-md flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-[11px]">Beralih ke Model Prosedural</p>
            <p className="text-[10px] text-amber-200/80 mt-0.5">{loadError}</p>
            {onSwitchTo2D && (
              <button
                onClick={onSwitchTo2D}
                className="mt-2 text-[10px] underline font-bold text-amber-300 hover:text-white cursor-pointer"
              >
                Beralih ke Diagram 2D
              </button>
            )}
          </div>
        </div>
      )}

      {/* Floating 3D Interaction Toolbar */}
      <div className={`absolute top-4 right-4 flex flex-col gap-1.5 backdrop-blur-md p-1.5 rounded-xl border shadow-xl z-20 ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-200'
      }`}>
        
        {/* Reset Camera */}
        <button
          onClick={handleResetCamera}
          className="p-2 rounded-lg text-slate-400 hover:text-teal-400 hover:bg-slate-800 transition-colors cursor-pointer"
          title="Reset Orientasi Kamera"
        >
          <RotateCw className="w-4 h-4" />
        </button>

        {/* Zoom In */}
        <button
          onClick={() => handleZoom('in')}
          className="p-2 rounded-lg text-slate-400 hover:text-teal-400 hover:bg-slate-800 transition-colors cursor-pointer"
          title="Zoom In (+)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        {/* Zoom Out */}
        <button
          onClick={() => handleZoom('out')}
          className="p-2 rounded-lg text-slate-400 hover:text-teal-400 hover:bg-slate-800 transition-colors cursor-pointer"
          title="Zoom Out (-)"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        {/* Auto-Rotate */}
        <button
          onClick={() => setAutoRotate(prev => !prev)}
          className={`p-2 rounded-lg transition-colors cursor-pointer ${
            autoRotate ? 'bg-teal-500 text-slate-950 font-bold' : 'text-slate-400 hover:bg-slate-800'
          }`}
          title="Auto Rotasi 3D"
        >
          <Sparkles className="w-4 h-4" />
        </button>

        {/* Wireframe toggle */}
        <button
          onClick={() => setWireframe(prev => !prev)}
          className={`p-2 rounded-lg transition-colors cursor-pointer ${
            wireframe ? 'bg-teal-500 text-slate-950 font-bold' : 'text-slate-400 hover:bg-slate-800'
          }`}
          title="Mode Struktur Wireframe"
        >
          <Layers className="w-4 h-4" />
        </button>
      </div>

      {/* 3D Pin Mode Instruction Banner */}
      {isPinModeActive && (
        <div className="absolute top-4 left-4 bg-amber-500 text-slate-950 px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-lg backdrop-blur flex items-center gap-2 animate-bounce z-20">
          <MapPin className="w-4 h-4" />
          <span>Klik langsung pada permukaan objek 3D untuk menandai koordinat (X, Y, Z)</span>
        </div>
      )}

      {/* Canvas bottom format indicator */}
      <div className={`absolute bottom-3 right-4 border px-3 py-1 rounded-lg text-[10px] pointer-events-none z-10 ${
        isDark ? 'bg-slate-900/80 border-slate-800 text-slate-400' : 'bg-white/80 border-slate-200 text-slate-600'
      }`}>
        Three.js Engine • GLTF/DRACO & FBX Loader • Drag to rotate • Scroll to zoom
      </div>

    </div>
  );
}
