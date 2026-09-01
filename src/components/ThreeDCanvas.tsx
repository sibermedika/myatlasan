import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
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
  Box,
  Hand,
  FolderTree,
  Eye,
  EyeOff,
  Focus,
  Search,
  X,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Cpu,
  ChevronRight,
  ChevronDown
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

export interface SubMeshItem {
  id: string;
  name: string;
  rawName: string;
  vertexCount: number;
  triangleCount: number;
  visible: boolean;
  isFocused: boolean;
  meshRef: THREE.Mesh;
  originalMaterials: THREE.Material | THREE.Material[];
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

// Deep memory disposal helper to prevent memory leaks and browser crashes
function deepDisposeObject(obj: THREE.Object3D | null) {
  if (!obj) return;
  obj.traverse((child: any) => {
    if (child.isMesh) {
      if (child.geometry) {
        child.geometry.dispose();
      }
      if (child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach((mat: any) => {
          [
            'map', 'alphaMap', 'aoMap', 'bumpMap', 'displacementMap',
            'emissiveMap', 'envMap', 'lightMap', 'metalnessMap',
            'normalMap', 'roughnessMap', 'specularMap', 'gradientMap'
          ].forEach((prop) => {
            if (mat[prop] && typeof mat[prop].dispose === 'function') {
              try { mat[prop].dispose(); } catch (e) { /* ignore */ }
            }
          });
          try { mat.dispose(); } catch (e) { /* ignore */ }
        });
      }
    }
  });
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
  const controlsRef = useRef<OrbitControls | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);
  const pinsGroupRef = useRef<THREE.Group | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const pointerStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  // View & UI states
  const [autoRotate, setAutoRotate] = useState(false);
  const [wireframe, setWireframe] = useState(false);
  const [isLoadingModel, setIsLoadingModel] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isUsingProceduralFallback, setIsUsingProceduralFallback] = useState(false);

  // Sub-Mesh Hierarchy & Parsing States
  const [subMeshes, setSubMeshes] = useState<SubMeshItem[]>([]);
  const [isTreeOpen, setIsTreeOpen] = useState(false);
  const [treeSearchQuery, setTreeSearchQuery] = useState('');
  const [focusedMeshId, setFocusedMeshId] = useState<string | null>(null);

  // Complexity & Safe Load Statistics
  const [modelStats, setModelStats] = useState<{
    totalTriangles: number;
    totalVertices: number;
    meshCount: number;
    isPerformanceMode: boolean;
  }>({
    totalTriangles: 0,
    totalVertices: 0,
    meshCount: 0,
    isPerformanceMode: false
  });

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
      mainHeart.name = 'Ventriculus & Atrium Cordis';
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
      aortaMesh.name = 'Arcus Aortae & Truncus';
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
      venaMesh.name = 'Vena Cava Superior';
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
      paMesh.name = 'Arteria Pulmonalis';
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
      leftHemi.name = 'Hemisphaerium Cerebri Sinistrum';
      group.add(leftHemi);

      const rightGeo = leftGeo.clone();
      const rightHemi = new THREE.Mesh(rightGeo, brainMat);
      rightHemi.position.set(0.85, 0.4, 0);
      rightHemi.name = 'Hemisphaerium Cerebri Dextrum';
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
      cereMesh.name = 'Cerebellum (Otak Kecil)';
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
      stemMesh.name = 'Truncus Encephali (Batang Otak)';
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
      rLung.name = 'Pulmo Dexter (Paru Kanan)';
      group.add(rLung);

      const lLungGeo = new THREE.ConeGeometry(1.5, 3.2, 24);
      lLungGeo.scale(0.8, 1, 1.05);
      const lLung = new THREE.Mesh(lLungGeo, lungMat);
      lLung.position.set(1.4, 0.2, 0);
      lLung.rotation.z = 0.15;
      lLung.name = 'Pulmo Sinister (Paru Kiri)';
      group.add(lLung);

      const trachGeo = new THREE.CylinderGeometry(0.3, 0.3, 2.2, 16);
      const trachMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.4, wireframe });
      const trach = new THREE.Mesh(trachGeo, trachMat);
      trach.position.set(0, 2.0, 0);
      trach.name = 'Trachea & Bifurcatio';
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
      cranium.name = 'Neurocranium / Calvaria';
      group.add(cranium);

      const maxillaGeo = new THREE.BoxGeometry(1.6, 1.2, 1.4);
      const maxilla = new THREE.Mesh(maxillaGeo, boneMat);
      maxilla.position.set(0, -0.4, 0.7);
      maxilla.name = 'Maxilla & Viscerocranium';
      group.add(maxilla);

      const mandibleGeo = new THREE.CylinderGeometry(0.9, 0.9, 0.7, 16, 1, false, 0, Math.PI);
      const mandible = new THREE.Mesh(mandibleGeo, boneMat);
      mandible.position.set(0, -1.3, 0.5);
      mandible.rotation.y = Math.PI;
      mandible.name = 'Mandibula (Rahang Bawah)';
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
      torso.name = 'Truncus & Cavitas Thoracis';
      group.add(torso);

      const spineGeo = new THREE.CylinderGeometry(0.2, 0.25, 4.0, 16);
      const spineMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });
      const spine = new THREE.Mesh(spineGeo, spineMat);
      spine.position.set(0, 0, -0.4);
      spine.name = 'Columna Vertebralis';
      group.add(spine);
    }

    return group;
  }, [theme, wireframe]);

  // Sub-Object Parsing & Scene Traversal Helper
  const parseSceneHierarchy = useCallback((rootObject: THREE.Object3D) => {
    const extractedList: SubMeshItem[] = [];
    let totalTriangles = 0;
    let totalVertices = 0;
    let meshIndex = 0;

    rootObject.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        meshIndex++;

        // Calculate geometry complexity
        let vCount = 0;
        let tCount = 0;

        if (mesh.geometry) {
          const geo = mesh.geometry;
          if (geo.attributes.position) {
            vCount = geo.attributes.position.count;
            totalVertices += vCount;
          }
          if (geo.index) {
            tCount = Math.round(geo.index.count / 3);
          } else if (geo.attributes.position) {
            tCount = Math.round(geo.attributes.position.count / 3);
          }
          totalTriangles += tCount;
        }

        // Clean & Format readable Sub-Organ name
        let readableName = mesh.name ? mesh.name.trim() : '';
        if (!readableName || readableName === 'organ-mesh' || readableName.toLowerCase().startsWith('mesh_')) {
          readableName = `Sub-Struktur #${meshIndex} ${mesh.name ? `(${mesh.name})` : ''}`;
        } else {
          // Format names with underscores to clean spaces
          readableName = readableName.replace(/_/g, ' ');
        }

        // Clone/Store original material references for clean opacity isolation
        const origMat = Array.isArray(mesh.material)
          ? mesh.material.map(m => m.clone())
          : mesh.material ? mesh.material.clone() : new THREE.MeshStandardMaterial();

        extractedList.push({
          id: mesh.uuid || `submesh-${meshIndex}`,
          name: readableName,
          rawName: mesh.name || `mesh-${meshIndex}`,
          vertexCount: vCount,
          triangleCount: tCount,
          visible: mesh.visible,
          isFocused: false,
          meshRef: mesh,
          originalMaterials: origMat
        });
      }
    });

    // Complexity threshold: > 300,000 triangles or vertices triggers Performance Mode
    const isPerformance = totalTriangles > 300000 || totalVertices > 300000;

    setModelStats({
      totalTriangles,
      totalVertices,
      meshCount: extractedList.length,
      isPerformanceMode: isPerformance
    });

    setSubMeshes(extractedList);
    setFocusedMeshId(null);
  }, []);

  // Center and normalize bounding box of loaded 3D Object
  const normalizeAndCenterModel = useCallback((object: THREE.Object3D, targetSize: number = 4.2) => {
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
  }, [wireframe]);

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
  }, [normalizeAndCenterModel, wireframe]);

  // Update 3D Pins in the Scene
  const updatePinsInScene = useCallback(() => {
    if (!pinsGroupRef.current) return;
    const pinsGroup = pinsGroupRef.current;
    
    // Clear previous pin objects with deep disposal
    while (pinsGroup.children.length > 0) {
      const child = pinsGroup.children[0];
      deepDisposeObject(child);
      pinsGroup.remove(child);
    }

    pins.forEach((pin, index) => {
      const px = pin.x !== undefined ? (pin.is3d ? pin.x : ((pin.x - 50) / 25) * 1.5) : 0;
      const py = pin.y !== undefined ? (pin.is3d ? pin.y : ((50 - pin.y) / 25) * 1.5) : 0;
      const pz = pin.z !== undefined ? pin.z : 1.8;

      const isSelected = selectedPin && selectedPin.id === pin.id;

      // Pin Container Group
      const pinObj = new THREE.Group();
      pinObj.position.set(px, py, pz);
      pinObj.userData = { pinData: pin, pinIndex: index };

      // 1. Visible Pin sphere beacon
      const sphereGeo = new THREE.SphereGeometry(0.24, 16, 16);
      const sphereMat = new THREE.MeshBasicMaterial({
        color: isSelected ? 0xf59e0b : 0x14b8a6,
      });
      const sphere = new THREE.Mesh(sphereGeo, sphereMat);
      sphere.userData = { pinData: pin };
      pinObj.add(sphere);

      // 2. Outer pulse ring
      const ringGeo = new THREE.RingGeometry(0.30, 0.42, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: isSelected ? 0xfbbf24 : 0x2dd4bf,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.userData = { pinData: pin };
      pinObj.add(ring);

      // 3. Connecting stalk
      const stalkGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.5, 8);
      const stalkMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const stalk = new THREE.Mesh(stalkGeo, stalkMat);
      stalk.position.set(0, -0.3, 0);
      stalk.userData = { pinData: pin };
      pinObj.add(stalk);

      // 4. Enlarged invisible touch hit-box sphere (ensures effortless 44px+ touch tapping on mobile/tablet)
      const touchHitGeo = new THREE.SphereGeometry(0.6, 10, 10);
      const touchHitMat = new THREE.MeshBasicMaterial({ 
        visible: false,
        transparent: true,
        opacity: 0 
      });
      const touchHitBox = new THREE.Mesh(touchHitGeo, touchHitMat);
      touchHitBox.name = 'pin-touch-hitbox';
      touchHitBox.userData = { pinData: pin };
      pinObj.add(touchHitBox);

      pinsGroup.add(pinObj);
    });
  }, [pins, selectedPin]);

  // Synchronize autoRotate with OrbitControls
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
    }
  }, [autoRotate]);

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

    // 3. Renderer with safe WebGL parameters and Touch Action styling
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true, 
      powerPreference: 'high-performance' 
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.style.touchAction = 'none'; // Prevent browser scroll interference during gestures
    rendererRef.current = renderer;

    mountRef.current.innerHTML = '';
    mountRef.current.appendChild(renderer.domElement);

    // 4. OrbitControls with smooth damping and Touchscreen Multitouch Gestures
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06; // Smooth deceleration damping
    controls.enableZoom = true;
    controls.enablePan = true;
    controls.enableRotate = true;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 2.0;
    controls.minDistance = 1.0;
    controls.maxDistance = 35.0;

    // Multitouch configuration:
    // 1 Finger (ONE): Rotate 360 degrees
    // 2 Fingers (TWO): Pinch to Zoom & Pan displacement
    controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN
    };

    controlsRef.current = controls;

    // 5. Lights
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

    // 6. Pins Group
    const pinsGroup = new THREE.Group();
    pinsGroupRef.current = pinsGroup;
    scene.add(pinsGroup);

    // 7. Asynchronous Model Resolution & Loading
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

        if (!isMounted) {
          deepDisposeObject(loadedModel);
          return;
        }

        // Deep dispose previous model before swapping
        if (modelGroupRef.current) {
          deepDisposeObject(modelGroupRef.current);
          scene.remove(modelGroupRef.current);
        }

        modelGroupRef.current = loadedModel;
        scene.add(loadedModel);

        // Parse Sub-Object Tree Hierarchy
        parseSceneHierarchy(loadedModel);
        updatePinsInScene();

      } catch (err: any) {
        console.warn('Failed to load custom 3D model, falling back to procedural preset:', err);
        if (!isMounted) return;

        setLoadError(err?.message || 'Gagal memuat berkas 3D');
        setIsUsingProceduralFallback(true);

        // Gracefully fallback to procedural anatomical mesh without crashing
        const fallbackMesh = createProceduralAnatomicalMesh(organ.model3dType, organ.id);
        if (modelGroupRef.current) {
          deepDisposeObject(modelGroupRef.current);
          scene.remove(modelGroupRef.current);
        }
        modelGroupRef.current = fallbackMesh;
        scene.add(fallbackMesh);

        // Parse Hierarchy on fallback
        parseSceneHierarchy(fallbackMesh);
        updatePinsInScene();

      } finally {
        if (isMounted) {
          setIsLoadingModel(false);
        }
      }
    }

    setupModel();

    // 8. Animation Loop with OrbitControls Update
    const animate = () => {
      animationFrameIdRef.current = requestAnimationFrame(animate);

      // Update OrbitControls damping & auto-rotation
      if (controlsRef.current) {
        controlsRef.current.update();
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

    // 9. Resize Observer
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
      controls.dispose();

      // Deep Memory Disposal of Scene objects & textures to prevent WebGL context leaks
      if (sceneRef.current) {
        deepDisposeObject(sceneRef.current);
      }
      renderer.dispose();
      try {
        renderer.forceContextLoss();
      } catch (e) {
        /* ignore */
      }
    };
  }, [organ, theme, createProceduralAnatomicalMesh, loadCustom3DModel, parseSceneHierarchy, updatePinsInScene]);

  // Update Pins whenever pins change
  useEffect(() => {
    updatePinsInScene();
  }, [updatePinsInScene]);

  // Toggle Single Sub-Mesh Visibility
  const handleToggleSubMeshVisibility = (subMeshId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    setSubMeshes(prev => prev.map(item => {
      if (item.id === subMeshId) {
        const nextVis = !item.visible;
        if (item.meshRef) {
          item.meshRef.visible = nextVis;
        }
        return { ...item, visible: nextVis };
      }
      return item;
    }));
  };

  // Bulk Show / Hide All Sub-Meshes
  const handleToggleAllSubMeshes = (makeVisible: boolean) => {
    setSubMeshes(prev => prev.map(item => {
      if (item.meshRef) {
        item.meshRef.visible = makeVisible;
      }
      return { ...item, visible: makeVisible };
    }));
  };

  // Focus / Highlight / Isolation Mode for Selected Sub-Mesh
  const handleFocusSubMesh = (item: SubMeshItem) => {
    if (!controlsRef.current || !cameraRef.current) return;

    if (focusedMeshId === item.id) {
      // If already focused, reset isolation mode
      handleResetIsolation();
      return;
    }

    setFocusedMeshId(item.id);

    // Apply Dimmed/Ghost Opacity to other sub-meshes and Full Opacity to focused sub-mesh
    subMeshes.forEach(sub => {
      const mesh = sub.meshRef;
      if (!mesh || !mesh.material) return;

      const isTarget = sub.id === item.id;
      mesh.visible = true; // Ensure focused target is visible

      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((mat) => {
          mat.transparent = true;
          mat.opacity = isTarget ? 1.0 : 0.12;
          mat.depthWrite = isTarget;
        });
      } else {
        mesh.material.transparent = true;
        mesh.material.opacity = isTarget ? 1.0 : 0.12;
        mesh.material.depthWrite = isTarget;
      }
    });

    // Smoothly reposition & center camera on target sub-mesh bounding box
    const targetMesh = item.meshRef;
    const box = new THREE.Box3().setFromObject(targetMesh);
    const center = new THREE.Vector3();
    box.getCenter(center);
    const size = new THREE.Vector3();
    box.getSize(size);

    const maxDim = Math.max(size.x, size.y, size.z, 0.5);
    const fov = cameraRef.current.fov * (Math.PI / 180);
    let cameraDistance = Math.abs(maxDim / Math.sin(fov / 2)) * 0.7;
    cameraDistance = Math.min(Math.max(cameraDistance, 2.5), 18.0);

    // Reposition camera gently
    const camera = cameraRef.current;
    const offset = new THREE.Vector3(0, maxDim * 0.3, cameraDistance);
    camera.position.copy(center).add(offset);
    controlsRef.current.target.copy(center);
    controlsRef.current.update();
  };

  // Reset Isolation and Restore Normal Opacities
  const handleResetIsolation = () => {
    setFocusedMeshId(null);

    subMeshes.forEach(sub => {
      const mesh = sub.meshRef;
      if (!mesh || !mesh.material) return;

      mesh.visible = sub.visible;

      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((mat) => {
          mat.transparent = false;
          mat.opacity = 1.0;
          mat.depthWrite = true;
        });
      } else {
        mesh.material.transparent = false;
        mesh.material.opacity = 1.0;
        mesh.material.depthWrite = true;
      }
    });

    // Reset camera target to center
    if (controlsRef.current && cameraRef.current) {
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  };

  // Filter sub-meshes by search query
  const filteredSubMeshes = useMemo(() => {
    if (!treeSearchQuery.trim()) return subMeshes;
    const q = treeSearchQuery.toLowerCase();
    return subMeshes.filter(m => 
      m.name.toLowerCase().includes(q) || 
      m.rawName.toLowerCase().includes(q)
    );
  }, [subMeshes, treeSearchQuery]);

  // Touch & Pointer Gesture Filtering: Distinguish between Orbit Rotation/Pinch vs Clean Tap/Click
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    pointerStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      time: Date.now()
    };
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointerStartRef.current || !mountRef.current || !cameraRef.current || !sceneRef.current) return;

    const dx = Math.abs(e.clientX - pointerStartRef.current.x);
    const dy = Math.abs(e.clientY - pointerStartRef.current.y);
    const duration = Date.now() - pointerStartRef.current.time;
    const distance = Math.hypot(dx, dy);

    pointerStartRef.current = null;

    // Only process as tap/click if movement was small (< 8px) and quick (< 350ms)
    // This strictly prevents OrbitControls rotate/pan/zoom gestures from triggering accidental pin selections!
    if (distance > 8 || duration > 350) {
      return;
    }

    const rect = mountRef.current.getBoundingClientRect();
    mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);

    // 1. Check if user tapped an existing 3D pin (using enlarged touch hitboxes)
    if (pinsGroupRef.current) {
      const pinIntersects = raycasterRef.current.intersectObjects(pinsGroupRef.current.children, true);
      if (pinIntersects.length > 0) {
        let curr: THREE.Object3D | null = pinIntersects[0].object;
        while (curr && !curr.userData?.pinData) {
          curr = curr.parent;
        }
        if (curr && curr.userData?.pinData) {
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

  // Zoom Button Controls
  const handleZoom = (direction: 'in' | 'out') => {
    if (!controlsRef.current) return;
    if (direction === 'in') {
      controlsRef.current.dollyIn(1.25);
    } else {
      controlsRef.current.dollyOut(1.25);
    }
    controlsRef.current.update();
  };

  // Reset Camera Orientation and Target
  const handleResetCamera = () => {
    if (!controlsRef.current || !cameraRef.current) return;
    controlsRef.current.reset();
    cameraRef.current.position.set(0, 0, 8.5);
    controlsRef.current.target.set(0, 0, 0);
    controlsRef.current.update();
    handleResetIsolation();
  };

  const isDark = theme === 'dark';

  return (
    <div 
      className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden touch-none select-none" 
      style={{ touchAction: 'none' }}
      id="three-d-canvas-wrapper"
    >
      
      {/* 3D WebGL Viewport with Touch-Action None */}
      <div
        ref={mountRef}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        style={{ touchAction: 'none' }}
        className={`w-full h-full touch-none select-none ${
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
                GLTF/DRACO Engine • {loadProgress > 0 ? `${loadProgress}%` : 'Parsing Geometry & Sub-Object Tree'}
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

      {/* Performance Safeguard Banner for Complex Models (>300K triangles) */}
      {modelStats.isPerformanceMode && !isLoadingModel && (
        <div className="absolute top-4 left-4 z-20 max-w-xs p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs shadow-xl backdrop-blur-md flex items-start gap-2 animate-fade-in">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-[11px] flex items-center gap-1.5">
              <span>Model 3D Kompleks</span>
              <span className="px-1.5 py-0.2 bg-amber-500 text-slate-950 text-[9px] font-black rounded">Mode Performa</span>
            </p>
            <p className="text-[10px] text-amber-200/90 mt-0.5">
              {modelStats.totalTriangles.toLocaleString()} Poligon • Proteksi Memori Aktif untuk kelancaran interaksi.
            </p>
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
        
        {/* Toggle Sub-Object Scene Hierarchy Tree Panel */}
        <button
          onClick={() => setIsTreeOpen(prev => !prev)}
          className={`p-2 rounded-lg transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center relative ${
            isTreeOpen 
              ? 'bg-teal-500 text-slate-950 font-bold shadow-md' 
              : 'text-slate-400 hover:text-teal-400 hover:bg-slate-800'
          }`}
          title="Struktur Sub-Organ / Mesh Tree"
        >
          <FolderTree className="w-4 h-4" />
          {subMeshes.length > 0 && (
            <span className={`absolute -top-1 -right-1 text-[8px] font-bold px-1 rounded-full ${
              isTreeOpen ? 'bg-slate-950 text-teal-300' : 'bg-teal-500 text-slate-950'
            }`}>
              {subMeshes.length}
            </span>
          )}
        </button>

        {/* Reset Camera */}
        <button
          onClick={handleResetCamera}
          className="p-2 rounded-lg text-slate-400 hover:text-teal-400 hover:bg-slate-800 transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
          title="Reset Orientasi Kamera"
        >
          <RotateCw className="w-4 h-4" />
        </button>

        {/* Zoom In */}
        <button
          onClick={() => handleZoom('in')}
          className="p-2 rounded-lg text-slate-400 hover:text-teal-400 hover:bg-slate-800 transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
          title="Zoom In (+)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        {/* Zoom Out */}
        <button
          onClick={() => handleZoom('out')}
          className="p-2 rounded-lg text-slate-400 hover:text-teal-400 hover:bg-slate-800 transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
          title="Zoom Out (-)"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        {/* Auto-Rotate */}
        <button
          onClick={() => setAutoRotate(prev => !prev)}
          className={`p-2 rounded-lg transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center ${
            autoRotate ? 'bg-teal-500 text-slate-950 font-bold' : 'text-slate-400 hover:bg-slate-800'
          }`}
          title="Auto Rotasi 3D"
        >
          <Sparkles className="w-4 h-4" />
        </button>

        {/* Wireframe toggle */}
        <button
          onClick={() => setWireframe(prev => !prev)}
          className={`p-2 rounded-lg transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center ${
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
          <span>Sentuh / Klik langsung pada permukaan objek 3D untuk menandai koordinat (X, Y, Z)</span>
        </div>
      )}

      {/* SUB-OBJECT SCENE HIERARCHY TREE DRAWER / PANEL */}
      {isTreeOpen && (
        <div 
          className={`absolute left-3 top-3 bottom-14 w-80 max-w-[calc(100vw-24px)] rounded-2xl border shadow-2xl backdrop-blur-xl flex flex-col z-30 overflow-hidden animate-fade-in ${
            isDark ? 'bg-slate-950/90 border-slate-800 text-slate-100' : 'bg-white/95 border-slate-200 text-slate-900'
          }`}
          id="sub-organ-tree-panel"
        >
          {/* Header */}
          <div className="p-3.5 border-b border-slate-800/80 dark:border-slate-800/80 light:border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
                <FolderTree className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold flex items-center gap-1.5">
                  <span>Struktur Sub-Organ 3D</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-slate-800 text-teal-300 font-mono">
                    {subMeshes.length}
                  </span>
                </h3>
                <p className="text-[9px] text-slate-400 font-medium">Hierarki Objek & Kontrol Lapisan</p>
              </div>
            </div>

            <button
              onClick={() => setIsTreeOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors cursor-pointer"
              title="Tutup Panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Model Statistics & Complexity Badge */}
          <div className={`px-3.5 py-2 border-b text-[10px] flex items-center justify-between ${
            isDark ? 'bg-slate-900/60 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
          }`}>
            <div className="flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-teal-400" />
              <span>{modelStats.totalTriangles.toLocaleString()} Tris</span>
              <span>•</span>
              <span>{modelStats.totalVertices.toLocaleString()} Verts</span>
            </div>

            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-1 ${
              modelStats.isPerformanceMode 
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' 
                : 'bg-teal-500/15 text-teal-400 border border-teal-500/30'
            }`}>
              <ShieldCheck className="w-2.5 h-2.5" />
              {modelStats.isPerformanceMode ? 'Mode Performa' : 'Safe Optimal'}
            </span>
          </div>

          {/* Search & Bulk Control Bar */}
          <div className="p-2.5 border-b border-slate-800/80 dark:border-slate-800/80 light:border-slate-200 space-y-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={treeSearchQuery}
                onChange={(e) => setTreeSearchQuery(e.target.value)}
                placeholder="Cari bagian / sub-mesh..."
                className={`w-full pl-8 pr-7 py-1.5 rounded-lg border text-xs outline-none ${
                  isDark 
                    ? 'bg-slate-900/80 border-slate-800 text-slate-200 focus:border-teal-500' 
                    : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-teal-500'
                }`}
              />
              {treeSearchQuery && (
                <button
                  onClick={() => setTreeSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Bulk Actions */}
            <div className="flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleToggleAllSubMeshes(true)}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer font-medium"
                >
                  Semua
                </button>
                <button
                  onClick={() => handleToggleAllSubMeshes(false)}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer font-medium"
                >
                  Sembunyikan
                </button>
              </div>

              {focusedMeshId && (
                <button
                  onClick={handleResetIsolation}
                  className="px-2 py-1 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30 font-bold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <RotateCw className="w-2.5 h-2.5" />
                  Reset Isolasi
                </button>
              )}
            </div>
          </div>

          {/* Sub-Meshes List View */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {filteredSubMeshes.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                <Box className="w-6 h-6 mx-auto mb-2 opacity-40" />
                <span>Tidak ada sub-objek yang cocok</span>
              </div>
            ) : (
              filteredSubMeshes.map((sub, index) => {
                const isFocused = focusedMeshId === sub.id;

                return (
                  <div
                    key={sub.id}
                    className={`group p-2 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                      isFocused
                        ? 'bg-amber-500/15 border-amber-500/50 shadow-md ring-1 ring-amber-400'
                        : sub.visible
                          ? isDark 
                            ? 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800/80' 
                            : 'bg-white hover:bg-slate-50 border-slate-200'
                          : 'opacity-50 bg-slate-900/30 border-dashed border-slate-800'
                    }`}
                  >
                    {/* Item Information & Focus Trigger */}
                    <div 
                      onClick={() => handleFocusSubMesh(sub)}
                      className="flex-1 min-w-0 cursor-pointer flex items-center gap-2"
                      title="Klik untuk fokus dan isolasi bagian ini"
                    >
                      <span className={`w-2 h-2 rounded-full shrink-0 ${
                        isFocused ? 'bg-amber-400 animate-pulse' : sub.visible ? 'bg-teal-400' : 'bg-slate-600'
                      }`} />
                      
                      <div className="min-w-0">
                        <p className={`text-xs font-semibold truncate ${
                          isFocused ? 'text-amber-300 font-bold' : isDark ? 'text-slate-200' : 'text-slate-800'
                        }`}>
                          {sub.name}
                        </p>
                        <p className="text-[9px] text-slate-400 font-mono truncate">
                          {sub.triangleCount.toLocaleString()} tris • {sub.rawName}
                        </p>
                      </div>
                    </div>

                    {/* Action Controls: Focus & Visibility Toggle */}
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Focus / Isolate Button */}
                      <button
                        onClick={() => handleFocusSubMesh(sub)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          isFocused
                            ? 'bg-amber-500 text-slate-950 font-bold'
                            : 'text-slate-400 hover:text-amber-400 hover:bg-slate-800'
                        }`}
                        title={isFocused ? 'Batalkan Isolasi' : 'Isolasi & Fokus Kamera'}
                      >
                        <Focus className="w-3.5 h-3.5" />
                      </button>

                      {/* Visibility Toggle Button */}
                      <button
                        onClick={(e) => handleToggleSubMeshVisibility(sub.id, e)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          sub.visible
                            ? 'text-teal-400 hover:bg-slate-800'
                            : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                        }`}
                        title={sub.visible ? 'Sembunyikan Sub-Objek' : 'Tampilkan Sub-Objek'}
                      >
                        {sub.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Panel Footer Instruction */}
          <div className={`p-2 border-t text-[9px] text-center text-slate-400 ${
            isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <span>Klik nama sub-organ untuk Isolasi Kamera • Tombol Mata untuk Tampilkan/Sembunyikan</span>
          </div>
        </div>
      )}

      {/* Touchscreen & Orbit Navigation Hint Badge */}
      <div className={`absolute bottom-3 right-4 border px-3 py-1.5 rounded-xl text-[10px] pointer-events-none z-10 backdrop-blur-md flex items-center gap-2 ${
        isDark ? 'bg-slate-900/85 border-slate-800 text-slate-300' : 'bg-white/85 border-slate-200 text-slate-700'
      }`}>
        <Hand className="w-3.5 h-3.5 text-teal-400 shrink-0" />
        <span className="hidden sm:inline">1 Jari: Rotasi 360° • 2 Jari: Pinch Zoom & Pan • Damping Halus</span>
        <span className="sm:hidden">1 Jari: Putar • 2 Jari: Zoom/Geser</span>
      </div>

    </div>
  );
}

