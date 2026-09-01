import { Organ, OrganMediaItem, UserProfile, StoredMediaFile, InstitutionCluster, Supported2DFormat, Supported3DFormat } from '../types';
import { INITIAL_ORGANS } from '../data';

const DB_NAME = 'AnatoVerse_Anatomy_DB';
const DB_VERSION = 3;

// Production Superadmin Account (Official single administrator credential)
export const DEFAULT_SUPERADMIN_PASSWORD = 'Sup3r@dm1n';

export const OFFICIAL_SUPERADMIN: UserProfile = {
  id: 'superadmin-master',
  name: 'Superadmin Sistem',
  email: 'superadmin',
  password: DEFAULT_SUPERADMIN_PASSWORD,
  role: 'SUPERADMIN',
  identifierNumber: 'superadmin',
  institution: 'Konsorsium Anatomi Nasional',
  specialization: 'Master Administrator Kurikulum Anatomi PAAI 2019',
  dosenCode: 'SUPERADMIN-MASTER'
};

// Standard Curriculum References (Standards !== Institutions)
export const KNOWN_STANDARDS: string[] = [
  'Standar Kurikulum Nasional PAAI 2019',
  'Standar Kompetensi Dokter Indonesia (SKDI 2019 / KKI)',
  'Terminologia Anatomica (IFAA Internasional)'
];

export const DEFAULT_STANDARD = 'Standar Kurikulum Nasional PAAI 2019';

// Common Indonesian Medical Faculty / Teaching Hospital Suggestions (Institutions)
export const KNOWN_INSTITUTIONS: string[] = [
  'Koleksi Mandiri / Terbuka',
  'Universitas Islam Sultan Agung (FK UNISSULA)',
  'Universitas Indonesia (FK UI)',
  'Universitas Gadjah Mada (FK-KMK UGM)',
  'Universitas Airlangga (FK UNAIR)',
  'Universitas Padjadjaran (FK UNPAD)',
  'Universitas Diponegoro (FK UNDIP)',
  'Universitas Brawijaya (FK UB)',
  'Universitas Sebelas Maret (FK UNS)',
  'Universitas Hasanuddin (FK UNHAS)',
  'Universitas Udayana (FK UNUD)',
  'Universitas Andalas (FK UNAND)',
  'Universitas Sumatera Utara (FK USU)',
  'RSUPN Dr. Cipto Mangunkusumo (RSCM)',
  'RSUP Dr. Kariadi Semarang',
  'RSUP Dr. Sardjito Yogyakarta',
  'RSUD Dr. Soetomo Surabaya'
];

// In-Memory Blob URL registry to reuse created Object URLs and avoid memory leaks
const blobUrlRegistry = new Map<string, string>();

/**
 * Open or upgrade IndexedDB
 */
function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this browser/environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 1. Organ Object Store (Stores metadata, pins, systems)
      if (!db.objectStoreNames.contains('organs')) {
        const organStore = db.createObjectStore('organs', { keyPath: 'id' });
        organStore.createIndex('system', 'system', { unique: false });
        organStore.createIndex('institution', 'institution', { unique: false });
        organStore.createIndex('dosenCode', 'dosenCode', { unique: false });
      }

      // 2. Media Files (Stores large binary Blobs for GLB, GLTF, FBX, OBJ, STL, Images)
      if (!db.objectStoreNames.contains('media_files')) {
        const mediaStore = db.createObjectStore('media_files', { keyPath: 'id' });
        mediaStore.createIndex('category', 'category', { unique: false });
        mediaStore.createIndex('extension', 'extension', { unique: false });
        mediaStore.createIndex('institution', 'institution', { unique: false });
      }

      // 3. User Accounts (Superadmin + Registered Lecturers/Students)
      if (!db.objectStoreNames.contains('users')) {
        const userStore = db.createObjectStore('users', { keyPath: 'id' });
        userStore.createIndex('email', 'email', { unique: true });
        userStore.createIndex('role', 'role', { unique: false });
        userStore.createIndex('institution', 'institution', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB'));
  });
}

export class AnatomyDatabaseService {
  private static isInitialized = false;

  /**
   * Initialize Database and seed default curriculum if empty
   */
  static async init(): Promise<Organ[]> {
    return this.initDB();
  }

  /**
   * Initialize Database and seed default curriculum if empty
   */
  static async initDB(): Promise<Organ[]> {
    try {
      const existingOrgans = await this.getAllOrgans();

      if (existingOrgans.length === 0) {
        // Seed initial organs with standard "Standar Kurikulum Nasional PAAI 2019" and institution "Koleksi Mandiri / Terbuka"
        const seededOrgans: Organ[] = INITIAL_ORGANS.map(o => ({
          ...o,
          standard: o.standard || DEFAULT_STANDARD,
          institution: o.institution || 'Koleksi Mandiri / Terbuka'
        }));

        await this.saveAllOrgans(seededOrgans);
        this.isInitialized = true;
        return seededOrgans;
      }

      this.isInitialized = true;
      return existingOrgans;
    } catch (err) {
      console.warn('IndexedDB init warning, returning default in-memory state:', err);
      return INITIAL_ORGANS;
    }
  }

  static async bulkSaveOrgans(organs: Organ[]): Promise<void> {
    return this.saveAllOrgans(organs);
  }

  /**
   * Retrieve all anatomical organs from IndexedDB
   */
  static async getAllOrgans(): Promise<Organ[]> {
    try {
      const db = await openIndexedDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('organs', 'readonly');
        const store = tx.objectStore('organs');
        const request = store.getAll();

        request.onsuccess = () => {
          const list = request.result || [];
          resolve(list);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.error('Failed to get organs from IndexedDB:', e);
      return INITIAL_ORGANS;
    }
  }

  /**
   * Save a single organ to IndexedDB
   */
  static async saveOrgan(organ: Organ): Promise<void> {
    try {
      const db = await openIndexedDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('organs', 'readwrite');
        const store = tx.objectStore('organs');
        const request = store.put(organ);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.error('Failed to save organ in IndexedDB:', e);
    }
  }

  /**
   * Save multiple organs (batch update / import)
   */
  static async saveAllOrgans(organs: Organ[]): Promise<void> {
    try {
      const db = await openIndexedDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('organs', 'readwrite');
        const store = tx.objectStore('organs');
        store.clear();
        for (const organ of organs) {
          store.put(organ);
        }
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) {
      console.error('Failed to save all organs in IndexedDB:', e);
    }
  }

  /**
   * Delete an organ by ID
   */
  static async deleteOrgan(organId: string): Promise<void> {
    try {
      const db = await openIndexedDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('organs', 'readwrite');
        const store = tx.objectStore('organs');
        const request = store.delete(organId);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.error('Failed to delete organ from IndexedDB:', e);
    }
  }

  /**
   * Reset database back to default initial curriculum
   */
  static async resetToDefault(): Promise<Organ[]> {
    const defaultOrgans: Organ[] = INITIAL_ORGANS.map(o => ({
      ...o,
      standard: o.standard || DEFAULT_STANDARD,
      institution: o.institution || 'Koleksi Mandiri / Terbuka'
    }));

    await this.saveAllOrgans(defaultOrgans);
    return defaultOrgans;
  }

  /**
   * Save a binary file (GLB, GLTF, FBX, OBJ, STL, JPG, PNG) directly as a Blob in IndexedDB.
   * Creates and returns a temporary Object URL (blob:...) for instant zero-lag rendering.
   */
  static async storeMediaFile(
    file: File | Blob, 
    fileName: string, 
    category: '2d_image' | '3d_model',
    uploadedBy?: string,
    institution?: string,
    standard?: string
  ): Promise<{ id: string; fileName: string; blobUrl: string; extension: string; sizeBytes: number }> {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    const fileId = `media-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    // Create immediate Blob URL without converting to huge base64 string
    const blobUrl = URL.createObjectURL(file);
    blobUrlRegistry.set(fileId, blobUrl);

    const mediaRecord: StoredMediaFile = {
      id: fileId,
      fileName,
      mimeType: file.type || (category === '3d_model' ? 'model/gltf-binary' : 'image/jpeg'),
      extension: ext,
      category,
      sizeBytes: file.size,
      blob: file, // Store binary blob directly in IndexedDB
      uploadedBy: uploadedBy || 'Superadmin',
      institution: institution || 'Koleksi Mandiri / Terbuka',
      createdAt: new Date().toISOString()
    };

    try {
      const db = await openIndexedDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('media_files', 'readwrite');
        const store = tx.objectStore('media_files');
        const request = store.put(mediaRecord);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.warn('Could not store binary in IndexedDB media_files:', e);
    }

    return {
      id: fileId,
      fileName,
      blobUrl,
      extension: ext,
      sizeBytes: file.size
    };
  }

  /**
   * Retrieve a Blob URL from stored media by mediaFileId
   */
  static async getMediaBlobUrl(mediaId: string): Promise<string | null> {
    if (!mediaId) return null;

    // Return cached URL if valid
    if (blobUrlRegistry.has(mediaId)) {
      return blobUrlRegistry.get(mediaId)!;
    }

    try {
      const db = await openIndexedDB();
      return new Promise((resolve) => {
        const tx = db.transaction('media_files', 'readonly');
        const store = tx.objectStore('media_files');
        const request = store.get(mediaId);

        request.onsuccess = () => {
          const record = request.result as StoredMediaFile | undefined;
          if (record && record.blob) {
            const url = URL.createObjectURL(record.blob);
            blobUrlRegistry.set(mediaId, url);
            resolve(url);
          } else if (record && record.dataUrl) {
            resolve(record.dataUrl);
          } else {
            resolve(null);
          }
        };
        request.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }

  /**
   * Resolves the 3D model source URL for an organ (Blob URL, external URL, or IndexedDB binary)
   */
  static async resolve3DModelSource(organ: Organ): Promise<string | null> {
    if (organ.mediaFileId) {
      const blobUrl = await this.getMediaBlobUrl(organ.mediaFileId);
      if (blobUrl) return blobUrl;
    }

    if (organ.model3dData) {
      return organ.model3dData;
    }

    return null;
  }

  /**
   * Get all registered users from database
   */
  static async getAllUsers(): Promise<UserProfile[]> {
    try {
      const db = await openIndexedDB();
      return new Promise((resolve) => {
        const tx = db.transaction('users', 'readonly');
        const store = tx.objectStore('users');
        const request = store.getAll();
        request.onsuccess = () => {
          const users: UserProfile[] = request.result || [];
          const superadminIndex = users.findIndex((u: UserProfile) => u.role === 'SUPERADMIN' || u.id === OFFICIAL_SUPERADMIN.id);
          if (superadminIndex === -1) {
            users.unshift(OFFICIAL_SUPERADMIN);
          } else if (!users[superadminIndex].password) {
            users[superadminIndex].password = DEFAULT_SUPERADMIN_PASSWORD;
          }
          resolve(users);
        };
        request.onerror = () => resolve([OFFICIAL_SUPERADMIN]);
      });
    } catch {
      return [OFFICIAL_SUPERADMIN];
    }
  }

  /**
   * Get a single user by ID
   */
  static async getUserById(userId: string): Promise<UserProfile | null> {
    if (userId === OFFICIAL_SUPERADMIN.id) {
      const all = await this.getAllUsers();
      return all.find(u => u.id === userId) || OFFICIAL_SUPERADMIN;
    }
    try {
      const db = await openIndexedDB();
      return new Promise((resolve) => {
        const tx = db.transaction('users', 'readonly');
        const store = tx.objectStore('users');
        const request = store.get(userId);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }

  /**
   * Register or save user profile in database
   */
  static async saveUser(user: UserProfile): Promise<void> {
    try {
      const db = await openIndexedDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('users', 'readwrite');
        const store = tx.objectStore('users');
        const request = store.put(user);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.error('Failed to save user in IndexedDB:', e);
    }
  }

  /**
   * Reset user password by userId (Superadmin Feature)
   */
  static async resetUserPassword(userId: string, newPassword: string): Promise<boolean> {
    try {
      const users = await this.getAllUsers();
      const targetUser = users.find(u => u.id === userId);
      if (!targetUser) {
        return false;
      }

      const updatedUser: UserProfile = {
        ...targetUser,
        password: newPassword.trim(),
        updatedAt: new Date().toISOString()
      };

      await this.saveUser(updatedUser);
      return true;
    } catch (err) {
      console.error('Failed to reset user password in IndexedDB:', err);
      return false;
    }
  }

  /**
   * Authenticate user with Email / Username / NIM / NIP and Password
   */
  static async authenticateUser(
    identifierInput: string,
    passwordInput: string
  ): Promise<{ success: boolean; user?: UserProfile; message?: string }> {
    const cleanId = identifierInput.trim().toLowerCase();
    const cleanPass = passwordInput.trim();

    if (!cleanId) {
      return { success: false, message: 'Silakan masukkan Email, NIP, NIM, atau Kode Pengguna.' };
    }
    if (!cleanPass) {
      return { success: false, message: 'Silakan masukkan kata sandi.' };
    }

    try {
      const users = await this.getAllUsers();

      // Check Superadmin match
      const isSuperadminIdentifier = 
        cleanId === 'superadmin' ||
        cleanId === OFFICIAL_SUPERADMIN.email.toLowerCase() ||
        cleanId === 'superadmin.anatomi@med.id' ||
        cleanId === OFFICIAL_SUPERADMIN.identifierNumber?.toLowerCase() ||
        cleanId === OFFICIAL_SUPERADMIN.dosenCode?.toLowerCase();

      if (isSuperadminIdentifier) {
        const storedAdmin = users.find(u => u.role === 'SUPERADMIN' || u.id === OFFICIAL_SUPERADMIN.id);
        const adminPass = storedAdmin?.password || DEFAULT_SUPERADMIN_PASSWORD;

        if (cleanPass === DEFAULT_SUPERADMIN_PASSWORD || cleanPass === adminPass) {
          const authUser = storedAdmin ? { ...storedAdmin, role: 'SUPERADMIN' as const } : OFFICIAL_SUPERADMIN;
          return { success: true, user: authUser };
        } else {
          return { success: false, message: 'Kredensial tidak valid.' };
        }
      }

      // Check regular users (Dosen, Mahasiswa, etc.) by email, identifierNumber (NIP/NIDN/NIM), dosenCode, or name
      const matchedUser = users.find(u => {
        const emailMatch = u.email.toLowerCase() === cleanId;
        const idNumberMatch = u.identifierNumber && u.identifierNumber.toLowerCase() === cleanId;
        const dosenCodeMatch = u.dosenCode && u.dosenCode.toLowerCase() === cleanId;
        const nameMatch = u.name.toLowerCase() === cleanId;
        return emailMatch || idNumberMatch || dosenCodeMatch || nameMatch;
      });

      if (!matchedUser) {
        return { 
          success: false, 
          message: 'Akun dengan kredensial tersebut tidak ditemukan. Silakan periksa kembali atau lakukan pendaftaran.' 
        };
      }

      // If user has password set, verify it
      if (matchedUser.password) {
        if (matchedUser.password === cleanPass) {
          return { success: true, user: matchedUser };
        } else {
          return { success: false, message: 'Kata sandi tidak sesuai. Silakan hubungi Superadmin untuk reset kata sandi jika lupa.' };
        }
      }

      // For legacy user without password, assign input password and authenticate
      matchedUser.password = cleanPass;
      await this.saveUser(matchedUser);
      return { success: true, user: matchedUser };

    } catch (err) {
      console.error('Authentication error:', err);
      return { success: false, message: 'Terjadi kesalahan sistem saat otentikasi.' };
    }
  }

  /**
   * Delete a user profile from database
   */
  static async deleteUser(userId: string): Promise<void> {
    try {
      const db = await openIndexedDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('users', 'readwrite');
        const store = tx.objectStore('users');
        const request = store.delete(userId);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.error('Failed to delete user from IndexedDB:', e);
    }
  }

  /**
   * Batch save/update users
   */
  static async bulkSaveUsers(users: UserProfile[]): Promise<void> {
    try {
      const db = await openIndexedDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('users', 'readwrite');
        const store = tx.objectStore('users');
        for (const user of users) {
          store.put(user);
        }
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (e) {
      console.error('Failed to bulk save users in IndexedDB:', e);
    }
  }

  /**
   * Resolve all available media objects for an organ (2D images, 3D models, and 3D embeds)
   */
  static resolveOrganMediaItems(organ: Organ): OrganMediaItem[] {
    if (organ.mediaItems && organ.mediaItems.length > 0) {
      return organ.mediaItems;
    }

    const items: OrganMediaItem[] = [];

    // 1. Primary 2D Image Diagram
    if (organ.imageUrl) {
      items.push({
        id: `media-2d-${organ.id}`,
        title: 'Diagram 2D Anatomi',
        type: '2d_image',
        url: organ.imageUrl,
        format: 'jpg',
        isDefault: organ.mediaType === '2d_image' || !organ.mediaType
      });
    }

    // 2. 3D Interactive Model (WebGL)
    if (organ.model3dData || organ.model3dType || organ.mediaType === '3d_model') {
      const formatLabel = organ.model3dFormat?.toUpperCase() || (organ.model3dData ? 'GLB' : 'WebGL 3D');
      items.push({
        id: `media-3d-${organ.id}`,
        title: `Model 3D Interaktif (${formatLabel})`,
        type: '3d_model',
        url: organ.model3dData || organ.imageUrl,
        format: organ.model3dFormat || 'glb',
        model3dType: organ.model3dType || 'heart',
        isDefault: organ.mediaType === '3d_model'
      });
    }

    // 3. 3D Embed (Sketchfab / External Iframe)
    if (organ.embed3dUrl) {
      items.push({
        id: `media-embed-${organ.id}`,
        title: 'Embed 3D Interaktif (Web Viewer)',
        type: '3d_embed',
        url: organ.embed3dUrl,
        isDefault: organ.mediaType === '3d_embed'
      });
    }

    // Fallback if none created
    if (items.length === 0) {
      items.push({
        id: `media-fallback-${organ.id}`,
        title: 'Diagram 2D Anatomi',
        type: '2d_image',
        url: organ.imageUrl || 'https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?auto=format&fit=crop&w=1200&q=80',
        format: 'jpg',
        isDefault: true
      });
    }

    return items;
  }

  /**
   * Compute clusters grouped by medical institutions
   */
  static computeInstitutionClusters(organs: Organ[]): InstitutionCluster[] {
    const clusterMap: Record<string, {
      name: string;
      organs: Organ[];
      lecturers: Set<string>;
      threeDCount: number;
      pinsCount: number;
    }> = {};

    for (const organ of organs) {
      const instName = organ.institution?.trim() || 'Koleksi Mandiri / Terbuka';
      
      if (!clusterMap[instName]) {
        clusterMap[instName] = {
          name: instName,
          organs: [],
          lecturers: new Set<string>(),
          threeDCount: 0,
          pinsCount: 0
        };
      }

      clusterMap[instName].organs.push(organ);
      if (organ.dosenName) {
        clusterMap[instName].lecturers.add(organ.dosenName);
      }
      if (organ.mediaType?.includes('3d') || organ.embed3dUrl || organ.model3dData || organ.mediaFileId) {
        clusterMap[instName].threeDCount++;
      }
      clusterMap[instName].pinsCount += (organ.pins?.length || 0);
    }

    return Object.values(clusterMap).map(c => {
      let shortName = c.name;
      if (c.name.includes('UNISSULA')) shortName = 'FK UNISSULA';
      else if (c.name.includes('UI')) shortName = 'FK UI';
      else if (c.name.includes('UGM')) shortName = 'FK UGM';
      else if (c.name.includes('UNAIR')) shortName = 'FK UNAIR';
      else if (c.name.includes('UNDIP')) shortName = 'FK UNDIP';
      else if (c.name.includes('UNPAD')) shortName = 'FK UNPAD';
      else if (c.name.includes('UB')) shortName = 'FK UB';
      else if (c.name.includes('Mandiri') || c.name.includes('Terbuka')) shortName = 'Koleksi Mandiri';

      return {
        id: `cluster-${c.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`,
        name: c.name,
        shortName,
        organCount: c.organs.length,
        threeDCount: c.threeDCount,
        pinsCount: c.pinsCount,
        lecturers: Array.from(c.lecturers)
      };
    }).sort((a, b) => b.organCount - a.organCount);
  }

  /**
   * Generate SQLite/MySQL compatible schema and insert statements for Production backup
   */
  static generateSQLiteDump(organs: Organ[], users: UserProfile[] = []): string {
    const timestamp = new Date().toISOString();
    let sql = `-- =========================================================================\n`;
    sql += `-- AnatoVerse Medical Anatomy Database Dump (SQLite / MySQL Compatible)\n`;
    sql += `-- Platform: AnatoVerse - Atlas Anatomi Medis 2D/3D (PAAI 2019)\n`;
    sql += `-- Developed by: dr. Penggalih\n`;
    sql += `-- Generated on: ${timestamp}\n`;
    sql += `-- Total Organs: ${organs.length}\n`;
    sql += `-- =========================================================================\n\n`;

    sql += `-- 1. Table: institutions\n`;
    sql += `CREATE TABLE IF NOT EXISTS institutions (\n`;
    sql += `    id VARCHAR(64) PRIMARY KEY,\n`;
    sql += `    name VARCHAR(255) NOT NULL,\n`;
    sql += `    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n`;
    sql += `);\n\n`;

    sql += `-- 2. Table: users\n`;
    sql += `CREATE TABLE IF NOT EXISTS users (\n`;
    sql += `    id VARCHAR(64) PRIMARY KEY,\n`;
    sql += `    name VARCHAR(255) NOT NULL,\n`;
    sql += `    email VARCHAR(255) UNIQUE NOT NULL,\n`;
    sql += `    password VARCHAR(255),\n`;
    sql += `    role VARCHAR(32) NOT NULL,\n`;
    sql += `    identifier_number VARCHAR(128),\n`;
    sql += `    institution VARCHAR(255),\n`;
    sql += `    specialization VARCHAR(255),\n`;
    sql += `    dosen_code VARCHAR(64),\n`;
    sql += `    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n`;
    sql += `);\n\n`;

    sql += `-- 3. Table: organs\n`;
    sql += `CREATE TABLE IF NOT EXISTS organs (\n`;
    sql += `    id VARCHAR(128) PRIMARY KEY,\n`;
    sql += `    name VARCHAR(255) NOT NULL,\n`;
    sql += `    latin_name VARCHAR(255) NOT NULL,\n`;
    sql += `    system_name VARCHAR(255) NOT NULL,\n`;
    sql += `    sub_system VARCHAR(255) NOT NULL,\n`;
    sql += `    standard VARCHAR(255) DEFAULT 'Standar Kurikulum Nasional PAAI 2019',\n`;
    sql += `    institution VARCHAR(255) DEFAULT 'Koleksi Mandiri / Terbuka',\n`;
    sql += `    dosen_name VARCHAR(255),\n`;
    sql += `    dosen_code VARCHAR(64),\n`;
    sql += `    media_type VARCHAR(32) DEFAULT '2d_image',\n`;
    sql += `    image_url TEXT,\n`;
    sql += `    model_3d_type VARCHAR(64),\n`;
    sql += `    model_3d_format VARCHAR(16),\n`;
    sql += `    embed_3d_url TEXT,\n`;
    sql += `    media_items_json TEXT,\n`;
    sql += `    description TEXT,\n`;
    sql += `    function_main TEXT,\n`;
    sql += `    vascularization TEXT,\n`;
    sql += `    innervation TEXT,\n`;
    sql += `    clinical_notes TEXT,\n`;
    sql += `    is_free INTEGER DEFAULT 0,\n`;
    sql += `    pins_json TEXT,\n`;
    sql += `    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n`;
    sql += `);\n\n`;

    sql += `-- 4. Table: media_files (Binary 2D JPG/PNG & 3D GLB/OBJ/STL/FBX Blobs)\n`;
    sql += `CREATE TABLE IF NOT EXISTS media_files (\n`;
    sql += `    id VARCHAR(128) PRIMARY KEY,\n`;
    sql += `    file_name VARCHAR(255) NOT NULL,\n`;
    sql += `    mime_type VARCHAR(128) NOT NULL,\n`;
    sql += `    extension VARCHAR(16) NOT NULL,\n`;
    sql += `    category VARCHAR(32) NOT NULL,\n`;
    sql += `    size_bytes INTEGER NOT NULL,\n`;
    sql += `    uploaded_by VARCHAR(255),\n`;
    sql += `    institution VARCHAR(255),\n`;
    sql += `    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n`;
    sql += `);\n\n`;

    // Insert Users
    sql += `-- Insert Users\n`;
    const allUsersList = users.length > 0 ? users : [OFFICIAL_SUPERADMIN];
    if (!allUsersList.some(u => u.role === 'SUPERADMIN')) {
      allUsersList.unshift(OFFICIAL_SUPERADMIN);
    }

    for (const u of allUsersList) {
      const escape = (str: string | undefined) => (str || '').replace(/'/g, "''");
      sql += `INSERT OR REPLACE INTO users (id, name, email, password, role, identifier_number, institution, specialization, dosen_code)\n`;
      sql += `VALUES ('${escape(u.id)}', '${escape(u.name)}', '${escape(u.email)}', '${escape(u.password)}', '${escape(u.role)}', '${escape(u.identifierNumber)}', '${escape(u.institution)}', '${escape(u.specialization)}', '${escape(u.dosenCode)}');\n`;
    }
    sql += `\n`;

    // Insert Organs
    sql += `-- Insert Organs Data\n`;
    for (const organ of organs) {
      const escape = (str: string | undefined) => (str || '').replace(/'/g, "''");
      const pinsJson = JSON.stringify(organ.pins || []).replace(/'/g, "''");
      const mediaItems = this.resolveOrganMediaItems(organ);
      const mediaItemsJson = JSON.stringify(mediaItems).replace(/'/g, "''");
      
      sql += `INSERT OR REPLACE INTO organs (id, name, latin_name, system_name, sub_system, standard, institution, dosen_name, dosen_code, media_type, image_url, model_3d_type, model_3d_format, embed_3d_url, media_items_json, description, function_main, vascularization, innervation, clinical_notes, is_free, pins_json)\n`;
      sql += `VALUES ('${escape(organ.id)}', '${escape(organ.name)}', '${escape(organ.latinName)}', '${escape(organ.system)}', '${escape(organ.subSystem)}', '${escape(organ.standard || DEFAULT_STANDARD)}', '${escape(organ.institution || 'Koleksi Mandiri / Terbuka')}', '${escape(organ.dosenName)}', '${escape(organ.dosenCode)}', '${escape(organ.mediaType || '2d_image')}', '${escape(organ.imageUrl)}', '${escape(organ.model3dType)}', '${escape(organ.model3dFormat)}', '${escape(organ.embed3dUrl)}', '${mediaItemsJson}', '${escape(organ.description)}', '${escape(organ.functionMain)}', '${escape(organ.vascularization)}', '${escape(organ.innervation)}', '${escape(organ.clinicalNotes)}', ${organ.isFree ? 1 : 0}, '${pinsJson}');\n`;
    }

    return sql;
  }
}
