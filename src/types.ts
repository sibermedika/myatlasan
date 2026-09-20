export interface Pin {
  id: string;
  title: string;
  description: string;
  x: number; // 2D % (0-100) or 3D x-coordinate
  y: number; // 2D % (0-100) or 3D y-coordinate
  z?: number; // 3D z-coordinate
  is3d?: boolean;
  authorCode?: string;
  institution?: string;
}

export type MediaType = '2d_image' | '3d_model' | '3d_embed';
export type Model3DPreset = 'heart' | 'brain' | 'lungs' | 'skull' | 'body' | 'custom_upload';
export type Supported3DFormat = 'glb' | 'gltf' | 'obj' | 'stl' | 'fbx' | '3ds' | 'obj_bundle';
export type Supported2DFormat = 'jpg' | 'jpeg' | 'png' | 'webp';

export interface OrganMediaItem {
  id: string;
  title: string; // e.g. "Diagram 2D Anterior", "Model 3D (.GLB)", "Sketchfab 3D Embed", "Irisan Aksial 2D"
  type: MediaType;
  url: string; // Image URL, Blob URL, 3D data URL, or Embed iframe URL
  format?: string; // jpg, png, webp, glb, gltf, obj, stl, fbx
  model3dType?: Model3DPreset;
  mediaFileId?: string;
  fileName?: string;
  fileSize?: string;
  description?: string;
  isDefault?: boolean;
}

export interface Organ {
  id: string;
  name: string;
  latinName: string;
  system: string; // e.g. "2. Sistem Saraf (Systema Nervosum)"
  subSystem: string; // e.g. "2.1 Pengantar & Organisasi"
  standard?: string; // Standar Acuan Kurikulum (e.g. "Standar Kurikulum Nasional PAAI 2019")
  dosenCode?: string; // e.g. "DOSEN-001"
  dosenName?: string; // e.g. "dr. Nama Dosen, Sp.An"
  institution?: string; // Asal Institusi / Universitas / RS Pendidikan Dosen (e.g. "FK UI", "FK UNISSULA")
  mediaType?: MediaType;
  imageUrl: string; // 2D image URL or Data URL (JPG, JPEG, PNG)
  model3dType?: Model3DPreset;
  model3dData?: string; // Base64 or Blob URL for uploaded .glb/.gltf/.obj/.stl/.fbx
  model3dFormat?: Supported3DFormat;
  embed3dUrl?: string; // Sketchfab or web iframe URL
  mediaItems?: OrganMediaItem[]; // Multi-media objects (2D files, 3D models, embeds, multi-angle views)
  description: string;
  functionMain: string;
  vascularization: string;
  innervation: string;
  clinicalNotes: string;
  isFree: boolean; // Accessible for Non-Login / Guest
  pins: Pin[];
  mediaFileId?: string; // Reference to IndexedDB / Database media_files table
  createdAt?: string;
  updatedAt?: string;
}

// Role hak akses pengguna: Admin (Master Data) & Dosen (Konten 3D)
export type UserRole = 'ADMIN' | 'DOSEN' | 'SUPERADMIN' | 'MAHASISWA' | 'GUEST';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  password?: string; // Kata sandi otentikasi akun pengguna
  role: UserRole;
  identifierNumber?: string; // NIM / NIDN / NIP / Username
  institution?: string; // Asal Institusi Dosen / Mahasiswa (Wajib untuk Dosen)
  specialization?: string;
  dosenCode?: string;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SubCategoryMeta {
  systemName: string;
  subSystemName: string;
  dosenCode: string;
  dosenName: string;
  institution?: string;
  createdAt: string;
}

export interface StoredBundleFile {
  name: string;
  path?: string;
  blob: Blob;
  mimeType?: string;
  sizeBytes?: number;
}

export interface StoredMediaFile {
  id: string;
  fileName: string;
  mimeType: string;
  extension: string; // jpg, jpeg, png, glb, obj, stl, fbx, obj_bundle
  category: '2d_image' | '3d_model';
  sizeBytes: number;
  dataUrl?: string;
  blob?: Blob;
  bundleFiles?: StoredBundleFile[]; // Folder / package attachments (.mtl, texture maps: .png, .jpg, etc.)
  organId?: string;
  uploadedBy?: string;
  institution?: string;
  createdAt: string;
}

export interface InstitutionCluster {
  id: string;
  name: string;
  shortName: string;
  organCount: number;
  threeDCount: number;
  pinsCount: number;
  lecturers: string[];
}
