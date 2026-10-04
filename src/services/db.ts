import { pinMediaId } from '../utils/annotations';
import { api, blobBase64, decodeBlob } from './api';
import { Organ, OrganMediaItem, UserProfile, StoredMediaFile, StoredBundleFile, InstitutionCluster, Supported2DFormat, Supported3DFormat } from '../types';
import { INITIAL_ORGANS } from '../data';
import { institutionName } from '../../shared/institutions.mjs';

export const MASTER_ADMIN_ID = 'admin-master';

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
  'Fakultas Kedokteran (Institusi Mandiri)',
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
  'Universitas Islam Sultan Agung (FK UNISSULA)',
  'RSUPN Dr. Cipto Mangunkusumo (RSCM)',
  'RSUP Dr. Kariadi Semarang',
  'RSUP Dr. Sardjito Yogyakarta',
  'RSUD Dr. Soetomo Surabaya'
];

export class AnatomyDatabaseService {


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
    return api<Organ[]>('/organs');
  }

  static async bulkSaveOrgans(organs: Organ[]): Promise<void> {
    return this.saveAllOrgans(organs);
  }

  /**
   * Retrieve all anatomical organs from server
   */
  static async getAllOrgans(): Promise<Organ[]> {
    return api<Organ[]>('/organs');
  }

  /**
   * Save a single organ to server
   */
  static async saveOrgan(organ: Organ): Promise<Organ> {
    const media = this.resolveOrganMediaItems(organ);
    organ = { ...organ, pins: organ.pins.map(pin => ({ ...pin, title: pin.title.trim(), description: pin.description.trim(), mediaId: pinMediaId(pin, media), is3d: Boolean(pin.is3d || pin.z !== undefined) })) };
    const url = '/organs/' + encodeURIComponent(organ.id);
    try {
      return await api<Organ>(url, {method:'PUT',body:JSON.stringify(organ)});
    } catch (error) {
      // A lost response can occur after the server commits. Confirm the exact
      // intended revision before retrying, without overwriting another edit.
      try {
        const saved = await api<Organ>(url);
        const fields: (keyof Organ)[] = ['name','latinName','system','subSystem','description','functionMain','vascularization','innervation','clinicalNotes','isFree','status','imageUrl','model3dData','embed3dUrl','model3dType','model3dFormat','pins','mediaItems','mediaSource','mediaCredit','mediaLicense','mediaLicenseUrl','mediaOverview'];
        if (saved.version === (organ.version || 0) + 1 && fields.every(key => JSON.stringify(saved[key] ?? null) === JSON.stringify(organ[key] ?? null))) return saved;
      } catch { /* Preserve the original save error when confirmation is unavailable. */ }
      throw error;
    }
  }

  /**
   * Save multiple organs (batch update / import)
   */
  static async saveAllOrgans(organs: Organ[]): Promise<void> {
    await api('/organs/import',{method:'POST',body:JSON.stringify(organs)});
  }

  /**
   * Delete an organ by ID
   */
  static async deleteOrgan(organId: string, version: number): Promise<void> {
    await api('/organs/'+encodeURIComponent(organId)+'?version='+version,{method:'DELETE'});
  }

  /**
   * Reset database back to default initial curriculum
   */
  static async resetToDefault(): Promise<Organ[]> {
    return api<Organ[]>('/organs/reset',{method:'POST',body:JSON.stringify({confirm:'RESET'})});
  }

  /**
   * Save a binary file (GLB, GLTF, FBX, OBJ, STL, JPG, PNG) directly as a Blob in server.
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
    const result=await api<{id:string;fileName:string;blobUrl:string;extension:string;sizeBytes:number;bundleFilesCount:number}>('/media',{method:'POST',body:JSON.stringify({fileName,category,base64:await blobBase64(file),bundleFiles:await Promise.all((bundleFiles || []).map(async item=>({name:item.name,path:item.path,mimeType:item.mimeType,base64:await blobBase64(item.blob)})))})});return result;
  }

  /**
   * Retrieve the full StoredMediaFile record (Blob, dataUrl, bundleFiles, format) from server
   */
  static async getStoredMediaRecord(mediaId: string): Promise<StoredMediaFile | null> {
    if(!mediaId)return null;const data=await api<any>('/media/'+encodeURIComponent(mediaId)+'/record');return {...data,blob:decodeBlob(data.base64,data.mimeType),bundleFiles:(data.bundleFiles || []).map((item:any)=>({...item,blob:decodeBlob(item.base64,item.mimeType)}))};
  }

  /**
   * Retrieve a Blob URL from stored media by mediaFileId
   */
  static async getMediaBlobUrl(mediaId: string): Promise<string | null> {
    return mediaId ? '/api/media/'+encodeURIComponent(mediaId) : null;
  }

  /**
   * Find any stored 3D model in server matching the organ
   */
  static async findMatchingStored3DRecord(organ: Organ): Promise<StoredMediaFile | null> {
    return null;
  }

  /**
   * Resolves the 3D model source (Binary Blob, ArrayBuffer, BundleFiles, or Source URL) for an organ.
   * Guarantees persistence across page refreshes by loading real binary Blobs from server.
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

    // 3. Intelligent recovery: Find matching 3D binary record from server media_files
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
   * Resolves the 3D model source URL for an organ (Blob URL, external URL, or server binary)
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

      return url;
    }

    if (organ.model3dData) {
      return organ.model3dData;
    }

    return null;
  }

  /**
   * Get all registered users from database (server Dual-Sync)
   */
  static async getAllUsers(): Promise<UserProfile[]> {
    return api<UserProfile[]>('/users');
  }

  /**
   * Get a single user by ID
   */
  static async getUserById(userId: string): Promise<UserProfile | null> {
    return (await this.getAllUsers()).find(user=>user.id===userId) || null;
  }

  /**
   * Register or save user profile in database (Dual-Persistence server)
   */
  static async saveUser(user: UserProfile): Promise<void> {
    await api('/users/'+encodeURIComponent(user.id),{method:'PUT',body:JSON.stringify(user)});
  }

  /**
   * Reset user password by userId (Superadmin Feature)
   */
  static async resetUserPassword(userId: string, newPassword: string): Promise<boolean> {
    const user=await this.getUserById(userId);if(!user) return false;await this.saveUser({...user,password:newPassword});return true;
  }

  /**
   * Authenticate user with Email / Username / NIM / NIP and Password
   */
  static async authenticateUser(
    identifierInput: string,
    passwordInput: string
  ): Promise<{ success: boolean; user?: UserProfile; message?: string }> {
    try { return await api('/auth/login',{method:'POST',body:JSON.stringify({identifier:identifierInput,password:passwordInput})}); } catch(error) { return {success:false,message:error instanceof Error?error.message:'Masuk gagal.'}; }
  }

  /**
   * Delete a user profile from database (server)
   */
  static async deleteUser(userId: string): Promise<void> {
    await api('/users/'+encodeURIComponent(userId),{method:'DELETE'});
  }

  /**
   * Batch save/update users (server)
   */
  static async bulkSaveUsers(users: UserProfile[]): Promise<void> {
    for(const user of users) await this.saveUser(user);
  }

  /**
   * Resolve all available media objects for an organ (2D images, 3D models, and 3D embeds)
   */
  static resolveOrganMediaItems(organ: Organ): OrganMediaItem[] {
    if (Array.isArray(organ.mediaItems) && organ.mediaItems.length===0 && !organ.imageUrl && !organ.model3dData && !organ.model3dType && !organ.embed3dUrl) return [];
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
      const instName = institutionName(organ.institution);
      
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
      if (c.name==='Universitas Indonesia') shortName='UI';
      else if(c.name==='Universitas Gadjah Mada') shortName='UGM';
      else if(c.name==='Institut Teknologi Bandung') shortName='ITB';
      else if (c.name.includes('UNISSULA')) shortName = 'FK UNISSULA';
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
    sql += `-- Open Architecture for Medical Faculties & Teaching Institutions\n`;
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
    const allUsersList = [...users];

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
