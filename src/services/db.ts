import { Organ, OrganMediaItem, UserProfile, StoredMediaFile, StoredBundleFile, InstitutionCluster, Supported2DFormat, Supported3DFormat } from '../types';
import { INITIAL_ORGANS } from '../data';

const DB_NAME = 'AnatoVerse_Anatomy_DB';
const DB_VERSION = 4;
const KEY_USERS_LOCAL_STORAGE = 'anatoverse_all_registered_users_v2';

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
        userStore.createIndex('email', 'email', { unique: false });
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
   * Also supports associated package files (MTL and texture maps in bundleFiles).
   * Creates and returns a temporary Object URL (blob:...) for instant zero-lag rendering.
   */
  static async storeMediaFile(
    file: File | Blob, 
    fileName: string, 
    category: '2d_image' | '3d_model',
    uploadedBy?: string,
    institution?: string,
    standard?: string,
    bundleFiles?: StoredBundleFile[],
    organId?: string
  ): Promise<{ id: string; fileName: string; blobUrl: string; extension: string; sizeBytes: number; bundleFilesCount: number }> {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    const fileId = `media-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    // Create immediate Blob URL without converting to huge base64 string
    const blobUrl = URL.createObjectURL(file);
    blobUrlRegistry.set(fileId, blobUrl);

    const mediaRecord: StoredMediaFile = {
      id: fileId,
      fileName,
      mimeType: file.type || (category === '3d_model' ? (ext === 'fbx' ? 'application/octet-stream' : 'model/gltf-binary') : 'image/jpeg'),
      extension: ext,
      category,
      sizeBytes: file.size,
      blob: file, // Store binary blob directly in IndexedDB
      bundleFiles: bundleFiles || [],
      organId,
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
      sizeBytes: file.size,
      bundleFilesCount: bundleFiles?.length || 0
    };
  }

  /**
   * Retrieve the full StoredMediaFile record (Blob, dataUrl, bundleFiles, format) from IndexedDB
   */
  static async getStoredMediaRecord(mediaId: string): Promise<StoredMediaFile | null> {
    if (!mediaId) return null;

    try {
      const db = await openIndexedDB();
      return new Promise((resolve) => {
        const tx = db.transaction('media_files', 'readonly');
        const store = tx.objectStore('media_files');
        const request = store.get(mediaId);

        request.onsuccess = () => {
          resolve((request.result as StoredMediaFile) || null);
        };
        request.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
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
      const record = await this.getStoredMediaRecord(mediaId);
      if (record && record.blob) {
        const url = URL.createObjectURL(record.blob);
        blobUrlRegistry.set(mediaId, url);
        return url;
      } else if (record && record.dataUrl) {
        return record.dataUrl;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Find any stored 3D model in IndexedDB matching the organ
   */
  static async findMatchingStored3DRecord(organ: Organ): Promise<StoredMediaFile | null> {
    try {
      const db = await openIndexedDB();
      return new Promise<StoredMediaFile | null>((resolve) => {
        const tx = db.transaction('media_files', 'readonly');
        const store = tx.objectStore('media_files');
        const request = store.getAll();

        request.onsuccess = () => {
          const all = (request.result as StoredMediaFile[]) || [];
          const models = all.filter(f => f.category === '3d_model');
          if (models.length === 0) return resolve(null);

          // 1. Direct organId match
          if (organ.id) {
            const byOrganId = models.find(m => m.organId === organ.id);
            if (byOrganId) return resolve(byOrganId);
          }

          // 2. Check organ mediaItems
          if (organ.mediaItems && organ.mediaItems.length > 0) {
            for (const item of organ.mediaItems) {
              if (item.mediaFileId) {
                const byId = models.find(m => m.id === item.mediaFileId);
                if (byId) return resolve(byId);
              }
              if (item.fileName) {
                const byFileName = models.find(m => m.fileName.toLowerCase() === item.fileName!.toLowerCase());
                if (byFileName) return resolve(byFileName);
              }
            }
          }

          // 3. Match by extension (e.g. fbx, obj, glb)
          const targetExt = (organ.model3dFormat || '').toLowerCase();
          if (targetExt) {
            const byExt = models.filter(m => m.extension.toLowerCase() === targetExt);
            if (byExt.length > 0) {
              return resolve(byExt[byExt.length - 1]); // Most recent
            }
          }

          // 4. If this is a custom upload organ, return latest 3D file
          if (organ.model3dType === 'custom_upload') {
            return resolve(models[models.length - 1]);
          }

          resolve(null);
        };
        request.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }

  /**
   * Resolves the 3D model source (Binary Blob, ArrayBuffer, BundleFiles, or Source URL) for an organ.
   * Guarantees persistence across page refreshes by loading real binary Blobs from IndexedDB.
   */
  static async resolve3DModelData(organ: Organ): Promise<{
    sourceUrl?: string;
    blob?: Blob;
    format: string;
    mediaFileId?: string;
    bundleFiles?: StoredBundleFile[];
  } | null> {
    const defaultFormat = (organ.model3dFormat || 'glb').toLowerCase();

    // 1. Primary lookup by mediaFileId
    if (organ.mediaFileId) {
      const record = await this.getStoredMediaRecord(organ.mediaFileId);
      if (record) {
        const format = (record.extension || organ.model3dFormat || 'glb').toLowerCase();
        if (record.blob) {
          return {
            blob: record.blob,
            format,
            mediaFileId: organ.mediaFileId,
            bundleFiles: record.bundleFiles
          };
        }
        if (record.dataUrl) {
          return {
            sourceUrl: record.dataUrl,
            format,
            mediaFileId: organ.mediaFileId,
            bundleFiles: record.bundleFiles
          };
        }
      }
    }

    // 2. Secondary lookup via mediaItems
    if (organ.mediaItems && organ.mediaItems.length > 0) {
      for (const item of organ.mediaItems) {
        if (item.type === '3d_model' && item.mediaFileId) {
          const record = await this.getStoredMediaRecord(item.mediaFileId);
          if (record && record.blob) {
            return {
              blob: record.blob,
              format: (record.extension || item.format || defaultFormat).toLowerCase(),
              mediaFileId: item.mediaFileId,
              bundleFiles: record.bundleFiles
            };
          }
        }
      }
    }

    // 3. Intelligent recovery: Find matching 3D binary record from IndexedDB media_files
    const recovered = await this.findMatchingStored3DRecord(organ);
    if (recovered && recovered.blob) {
      // Auto-reconnect mediaFileId to avoid future lookup delays
      organ.mediaFileId = recovered.id;
      this.saveOrgan(organ).catch(() => {});
      return {
        blob: recovered.blob,
        format: (recovered.extension || organ.model3dFormat || 'glb').toLowerCase(),
        mediaFileId: recovered.id,
        bundleFiles: recovered.bundleFiles
      };
    }

    // 4. Fallback for static URLs (data: or http/https)
    if (organ.model3dData) {
      if (organ.model3dData.startsWith('data:') || organ.model3dData.startsWith('http')) {
        return {
          sourceUrl: organ.model3dData,
          format: defaultFormat
        };
      }
      // If it's a blob: URL and we didn't find binary, check if it's currently valid
      return {
        sourceUrl: organ.model3dData,
        format: defaultFormat
      };
    }

    return null;
  }

  /**
   * Resolves the 3D model source URL for an organ (Blob URL, external URL, or IndexedDB binary)
   */
  static async resolve3DModelSource(organ: Organ): Promise<string | null> {
    if (organ.mediaFileId) {
      const blobUrl = await this.getMediaBlobUrl(organ.mediaFileId);
      if (blobUrl) return blobUrl;
    }

    // Check recovered record
    const recovered = await this.findMatchingStored3DRecord(organ);
    if (recovered && recovered.blob) {
      const url = URL.createObjectURL(recovered.blob);
      blobUrlRegistry.set(recovered.id, url);
      return url;
    }

    if (organ.model3dData) {
      return organ.model3dData;
    }

    return null;
  }

  /**
   * Get all registered users from database
   */
  /**
   * Helper: Read backup users from localStorage
   */
  private static getLocalStorageUsers(): UserProfile[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(KEY_USERS_LOCAL_STORAGE);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  /**
   * Helper: Write backup users to localStorage
   */
  private static setLocalStorageUsers(users: UserProfile[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(KEY_USERS_LOCAL_STORAGE, JSON.stringify(users));
    } catch (err) {
      console.warn('Failed to backup users to localStorage:', err);
    }
  }

  /**
   * Get all registered users from database (IndexedDB + LocalStorage Dual-Sync)
   */
  static async getAllUsers(): Promise<UserProfile[]> {
    const localUsers = this.getLocalStorageUsers();

    try {
      const db = await openIndexedDB();
      
      // If users object store doesn't exist in active schema, fallback gracefully to LocalStorage
      if (!db.objectStoreNames.contains('users')) {
        const fallbackList = [...localUsers];
        if (!fallbackList.some(u => u.role === 'SUPERADMIN' || u.id === OFFICIAL_SUPERADMIN.id)) {
          fallbackList.unshift(OFFICIAL_SUPERADMIN);
        }
        return fallbackList;
      }

      const idbUsers = await new Promise<UserProfile[]>((resolve) => {
        const tx = db.transaction('users', 'readonly');
        const store = tx.objectStore('users');
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => resolve([]);
      });

      // Merge IDB users and LocalStorage users by ID / Email to ensure zero data loss
      const userMap = new Map<string, UserProfile>();

      // Seed Official Superadmin first
      userMap.set(OFFICIAL_SUPERADMIN.id, OFFICIAL_SUPERADMIN);

      // Add local users
      for (const u of localUsers) {
        if (u && u.id) userMap.set(u.id, u);
      }

      // Add & override with IndexedDB users
      for (const u of idbUsers) {
        if (u && u.id) userMap.set(u.id, u);
      }

      const mergedUsers = Array.from(userMap.values());

      // Ensure superadmin has correct password
      const adminIndex = mergedUsers.findIndex(u => u.role === 'SUPERADMIN' || u.id === OFFICIAL_SUPERADMIN.id);
      if (adminIndex !== -1 && !mergedUsers[adminIndex].password) {
        mergedUsers[adminIndex].password = DEFAULT_SUPERADMIN_PASSWORD;
      }

      // Sync back to LocalStorage to keep both stores identical
      this.setLocalStorageUsers(mergedUsers);

      return mergedUsers;
    } catch (e) {
      console.warn('IndexedDB getAllUsers warning, reading from LocalStorage fallback:', e);
      const fallbackList = [...localUsers];
      if (!fallbackList.some(u => u.role === 'SUPERADMIN' || u.id === OFFICIAL_SUPERADMIN.id)) {
        fallbackList.unshift(OFFICIAL_SUPERADMIN);
      }
      return fallbackList;
    }
  }

  /**
   * Get a single user by ID
   */
  static async getUserById(userId: string): Promise<UserProfile | null> {
    if (userId === OFFICIAL_SUPERADMIN.id) {
      return OFFICIAL_SUPERADMIN;
    }
    const all = await this.getAllUsers();
    return all.find(u => u.id === userId) || null;
  }

  /**
   * Register or save user profile in database (Dual-Persistence IndexedDB + LocalStorage)
   */
  static async saveUser(user: UserProfile): Promise<void> {
    const normalizedUser: UserProfile = {
      ...user,
      email: user.email.trim().toLowerCase(),
      name: user.name.trim(),
      updatedAt: new Date().toISOString()
    };

    // 1. Instantly save to LocalStorage (100% reliable synchronous backup)
    const localUsers = this.getLocalStorageUsers();
    const existingIndex = localUsers.findIndex(
      u => u.id === normalizedUser.id || u.email.toLowerCase() === normalizedUser.email.toLowerCase()
    );

    if (existingIndex >= 0) {
      localUsers[existingIndex] = { ...localUsers[existingIndex], ...normalizedUser };
    } else {
      localUsers.push(normalizedUser);
    }
    this.setLocalStorageUsers(localUsers);

    // 2. Persist to IndexedDB
    try {
      const db = await openIndexedDB();
      if (db.objectStoreNames.contains('users')) {
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction('users', 'readwrite');
          const store = tx.objectStore('users');
          const request = store.put(normalizedUser);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      }
    } catch (e) {
      console.error('Failed to save user in IndexedDB, retained in LocalStorage backup:', e);
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
      console.error('Failed to reset user password in database:', err);
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
    const cleanId = (identifierInput || '').trim().toLowerCase();
    const rawPass = passwordInput || '';
    const cleanPass = rawPass.trim();

    if (!cleanId) {
      return { success: false, message: 'Silakan masukkan Email, NIP, NIM, atau Nama Pengguna.' };
    }
    if (!cleanPass) {
      return { success: false, message: 'Silakan masukkan kata sandi akun.' };
    }

    try {
      const users = await this.getAllUsers();

      // 1. Direct match for Superadmin master credentials
      const isMasterSuperadmin = 
        cleanId === 'superadmin' ||
        cleanId === OFFICIAL_SUPERADMIN.email.toLowerCase() ||
        cleanId === 'superadmin.anatomi@med.id' ||
        cleanId === OFFICIAL_SUPERADMIN.identifierNumber?.toLowerCase() ||
        cleanId === OFFICIAL_SUPERADMIN.dosenCode?.toLowerCase();

      if (isMasterSuperadmin) {
        const storedAdmin = users.find(u => u.role === 'SUPERADMIN' || u.id === OFFICIAL_SUPERADMIN.id);
        const adminPass = storedAdmin?.password || DEFAULT_SUPERADMIN_PASSWORD;

        if (cleanPass === DEFAULT_SUPERADMIN_PASSWORD || cleanPass === adminPass) {
          const authUser = storedAdmin ? { ...storedAdmin, role: 'SUPERADMIN' as const } : OFFICIAL_SUPERADMIN;
          return { success: true, user: authUser };
        } else {
          return { success: false, message: 'Kata sandi Superadmin tidak sesuai.' };
        }
      }

      // 2. Comprehensive match for all registered users (Dosen, Mahasiswa, Superadmin kustom)
      const matchedUser = users.find(u => {
        if (!u) return false;
        const userEmail = (u.email || '').trim().toLowerCase();
        const userEmailPrefix = userEmail.split('@')[0];
        const userIdNum = (u.identifierNumber || '').trim().toLowerCase();
        const userDosenCode = (u.dosenCode || '').trim().toLowerCase();
        const userName = (u.name || '').trim().toLowerCase();
        const userId = (u.id || '').trim().toLowerCase();

        return (
          userEmail === cleanId ||
          userEmailPrefix === cleanId ||
          (userIdNum && userIdNum === cleanId) ||
          (userDosenCode && userDosenCode === cleanId) ||
          userName === cleanId ||
          userId === cleanId
        );
      });

      if (!matchedUser) {
        return { 
          success: false, 
          message: `Akun dengan identitas "${identifierInput}" tidak ditemukan dalam basis data. Silakan periksa kembali email atau hubungi Superadmin.` 
        };
      }

      // 3. Password Verification
      const targetPassword = matchedUser.password ? matchedUser.password.trim() : '';

      if (targetPassword) {
        if (targetPassword === cleanPass || targetPassword === rawPass) {
          return { success: true, user: matchedUser };
        } else {
          return { 
            success: false, 
            message: `Kata sandi tidak sesuai untuk akun "${matchedUser.name}". Silakan periksa huruf besar/kecil atau hubungi Superadmin untuk reset kata sandi.` 
          };
        }
      }

      // For accounts initialized without password, set input password and save
      matchedUser.password = cleanPass;
      await this.saveUser(matchedUser);
      return { success: true, user: matchedUser };

    } catch (err) {
      console.error('Authentication error:', err);
      return { success: false, message: 'Terjadi kendala sistem saat proses otentikasi akun.' };
    }
  }

  /**
   * Delete a user profile from database (IndexedDB + LocalStorage)
   */
  static async deleteUser(userId: string): Promise<void> {
    // 1. Remove from LocalStorage
    const localUsers = this.getLocalStorageUsers().filter(u => u.id !== userId);
    this.setLocalStorageUsers(localUsers);

    // 2. Remove from IndexedDB
    try {
      const db = await openIndexedDB();
      if (db.objectStoreNames.contains('users')) {
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction('users', 'readwrite');
          const store = tx.objectStore('users');
          const request = store.delete(userId);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      }
    } catch (e) {
      console.error('Failed to delete user from IndexedDB:', e);
    }
  }

  /**
   * Batch save/update users (IndexedDB + LocalStorage)
   */
  static async bulkSaveUsers(users: UserProfile[]): Promise<void> {
    // 1. Save to LocalStorage
    this.setLocalStorageUsers(users);

    // 2. Save to IndexedDB
    try {
      const db = await openIndexedDB();
      if (db.objectStoreNames.contains('users')) {
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction('users', 'readwrite');
          const store = tx.objectStore('users');
          for (const user of users) {
            store.put(user);
          }
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
      }
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
