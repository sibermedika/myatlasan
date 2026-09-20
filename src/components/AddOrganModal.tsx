import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Image as ImageIcon, 
  Box, 
  Link as LinkIcon, 
  Upload, 
  Layers, 
  Tag, 
  Calendar, 
  User, 
  Check, 
  FileCode,
  Eye,
  Building2,
  Database,
  CheckCircle2,
  FileCheck,
  Plus,
  Trash2,
  Star,
  ExternalLink,
  Folder,
  FolderArchive,
  Archive,
  FileText
} from 'lucide-react';
import * as fflate from 'fflate';
import { normalizeEmbedUrl } from '../utils/embedHelper';
import { Organ, MediaType, Model3DPreset, UserProfile, Supported3DFormat, OrganMediaItem, StoredBundleFile } from '../types';
import { KNOWN_INSTITUTIONS, KNOWN_STANDARDS, DEFAULT_STANDARD, AnatomyDatabaseService } from '../services/db';

interface AddOrganModalProps {
  initialOrgan?: Organ | null;
  currentUser?: UserProfile | null;
  onClose: () => void;
  onSave: (organ: Organ) => void;
  theme: 'dark' | 'light';
}

const PRESET_ILLUSTRATIONS_2D = [
  {
    name: 'Jantung (Cor - Anatomi Miokardium)',
    url: 'https://images.unsplash.com/photo-1628595351029-c2bf1751143e?auto=format&fit=crop&w=1200&q=80',
    system: '3. Sistem Kardiovaskular (Systema Cardiovasculare)',
    subSystem: '3.1 Jantung (Cor)'
  },
  {
    name: 'Korteks Otak (Cerebrum & Hemisferium)',
    url: 'https://images.unsplash.com/photo-1559757175-73677c29b50c?auto=format&fit=crop&w=1200&q=80',
    system: '2. Sistem Saraf (Systema Nervosum)',
    subSystem: '2.2 Otak Besar (Cerebrum)'
  },
  {
    name: 'Pulmo & Alveoli (Sistem Respirasi)',
    url: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=1200&q=80',
    system: '4. Sistem Respirasi (Systema Respiratorium)',
    subSystem: '4.2 Paru-paru (Pulmo)'
  },
  {
    name: 'Gaster & Saluran Cerna Atas',
    url: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&w=1200&q=80',
    system: '5. Sistem Pencernaan (Systema Digestorium)',
    subSystem: '5.1 Saluran Cerna Atas'
  }
];

const PRESET_EMBED_3D = [
  {
    name: 'Human Heart 3D (Sketchfab Medical)',
    url: 'https://sketchfab.com/models/e5d79634e2c943be8dc79581977f6b9a/embed?autostart=1&preload=1&camera=0&ui_controls=1&ui_infos=0&ui_watermark=0'
  },
  {
    name: 'Human Brain 3D (Sketchfab Anatomy)',
    url: 'https://sketchfab.com/models/97e2ea3c4b00424bb9a38ff13a1a6b0c/embed?autostart=1&preload=1&ui_controls=1&ui_infos=0&ui_watermark=0'
  },
  {
    name: 'Respiratory Lungs & Trachea 3D',
    url: 'https://sketchfab.com/models/fb5e32b8eb304218ac89f66cc04fbf1d/embed?autostart=1&preload=1&ui_controls=1&ui_infos=0&ui_watermark=0'
  },
  {
    name: 'Human Skull Anatomy 3D',
    url: 'https://sketchfab.com/models/9d311394f4c9472e90cce75c74fb9017/embed?autostart=1&preload=1&camera=0&ui_controls=1&ui_infos=0&ui_watermark=0'
  }
];

export default function AddOrganModal({
  initialOrgan,
  currentUser,
  onClose,
  onSave,
  theme
}: AddOrganModalProps) {
  // Generate default lecturer code based on Lecturer Name & Today's Date
  const generateLecturerCode = (nameToUse: string) => {
    const cleanName = (nameToUse || 'DR-PENGGALIH')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 10);
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = new Date().toTimeString().slice(0, 5).replace(/:/g, '');
    return `DSN-${cleanName}-${dateStr}-${timeStr}`;
  };

  const isDark = theme === 'dark';

  // Basic Info
  const [name, setName] = useState(initialOrgan?.name || '');
  const [latinName, setLatinName] = useState(initialOrgan?.latinName || '');
  const [system, setSystem] = useState(initialOrgan?.system || '2. Sistem Saraf (Systema Nervosum)');
  const [subSystem, setSubSystem] = useState(initialOrgan?.subSystem || '');
  
  // Attribution Info
  const [standard, setStandard] = useState(
    initialOrgan?.standard || DEFAULT_STANDARD
  );
  const [dosenName, setDosenName] = useState(
    initialOrgan?.dosenName || currentUser?.name || ''
  );
  const [dosenCode, setDosenCode] = useState(
    initialOrgan?.dosenCode || (currentUser?.name ? generateLecturerCode(currentUser.name) : '')
  );
  const [institution, setInstitution] = useState(
    initialOrgan?.institution || currentUser?.institution || 'Koleksi Mandiri / Terbuka'
  );
  const [customInstitution, setCustomInstitution] = useState('');

  // 1. Primary 2D Setup
  const [imageUrl, setImageUrl] = useState(initialOrgan?.imageUrl || '');
  const [image2DFileName, setImage2DFileName] = useState('');
  
  // 2. Primary 3D Setup
  const [model3dType, setModel3dType] = useState<Model3DPreset>(
    initialOrgan?.model3dType || 'heart'
  );
  const [model3dFormat, setModel3dFormat] = useState<Supported3DFormat | undefined>(
    initialOrgan?.model3dFormat || 'glb'
  );
  const [model3dData, setModel3dData] = useState<string | undefined>(
    initialOrgan?.model3dData
  );
  const [model3dFileName, setModel3dFileName] = useState('');
  const [upload3DMode, setUpload3DMode] = useState<'single' | 'folder' | 'zip'>('single');
  const [model3dFileId, setModel3dFileId] = useState<string | undefined>(
    initialOrgan?.mediaFileId || 
    initialOrgan?.mediaItems?.find(m => m.type === '3d_model')?.mediaFileId
  );
  const [bundleSummary, setBundleSummary] = useState<{
    objName?: string;
    mtlName?: string;
    textureCount: number;
    totalSizeMB?: string;
  } | null>(null);

  // 3. Primary Embed Setup
  const [embed3dUrl, setEmbed3dUrl] = useState(initialOrgan?.embed3dUrl || '');

  // 4. Multi-Media List (All attached visual items)
  const [attachedMediaList, setAttachedMediaList] = useState<OrganMediaItem[]>(() => {
    if (initialOrgan) {
      return AnatomyDatabaseService.resolveOrganMediaItems(initialOrgan);
    }
    // Default initial slots
    return [
      {
        id: `media-2d-init`,
        title: 'Diagram 2D Anatomi',
        type: '2d_image',
        url: PRESET_ILLUSTRATIONS_2D[0].url,
        format: 'jpg',
        isDefault: true
      },
      {
        id: `media-3d-init`,
        title: 'Model 3D Interaktif (WebGL)',
        type: '3d_model',
        url: '',
        format: 'glb',
        model3dType: 'heart',
        isDefault: false
      },
      {
        id: `media-embed-init`,
        title: 'Embed 3D Interaktif (Sketchfab)',
        type: '3d_embed',
        url: PRESET_EMBED_3D[0].url,
        isDefault: false
      }
    ];
  });

  // State for adding additional custom object
  const [isAddingExtraMedia, setIsAddingExtraMedia] = useState(false);
  const [extraMediaType, setExtraMediaType] = useState<MediaType>('2d_image');
  const [extraMediaTitle, setExtraMediaTitle] = useState('');
  const [extraMediaUrl, setExtraMediaUrl] = useState('');
  const [extraMediaFormat, setExtraMediaFormat] = useState('glb');
  const [isUploadingExtra, setIsUploadingExtra] = useState(false);

  // General processing state
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [fileFeedback, setFileFeedback] = useState('');

  // Medical Descriptions
  const [description, setDescription] = useState(initialOrgan?.description || '');
  const [functionMain, setFunctionMain] = useState(initialOrgan?.functionMain || '');
  const [vascularization, setVascularization] = useState(initialOrgan?.vascularization || '');
  const [innervation, setInnervation] = useState(initialOrgan?.innervation || '');
  const [clinicalNotes, setClinicalNotes] = useState(initialOrgan?.clinicalNotes || '');
  const [isFree, setIsFree] = useState(initialOrgan?.isFree ?? false);

  // Handle 2D File Upload
  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImage2DFileName(file.name);
    setIsProcessingFile(true);
    setFileFeedback(`Menyimpan ${file.name} ke database lokal...`);

    try {
      const stored = await AnatomyDatabaseService.storeMediaFile(
        file, 
        file.name, 
        '2d_image', 
        dosenName, 
        customInstitution || institution
      );
      setImageUrl(stored.blobUrl);
      
      // Update or add to attachedMediaList
      setAttachedMediaList(prev => {
        const copy = [...prev];
        const existingIdx = copy.findIndex(m => m.type === '2d_image');
        const newItem: OrganMediaItem = {
          id: existingIdx >= 0 ? copy[existingIdx].id : `media-2d-${Date.now()}`,
          title: `Diagram 2D (${file.name})`,
          type: '2d_image',
          url: stored.blobUrl,
          format: file.name.split('.').pop()?.toLowerCase() || 'png',
          fileName: file.name,
          fileSize: `${(file.size / 1024).toFixed(1)} KB`,
          isDefault: existingIdx >= 0 ? copy[existingIdx].isDefault : true
        };
        if (existingIdx >= 0) copy[existingIdx] = newItem;
        else copy.unshift(newItem);
        return copy;
      });

      setFileFeedback(`Gambar 2D "${file.name}" berhasil disimpan.`);
    } catch (err) {
      console.error('Failed to store 2D file in database:', err);
      const blobUrl = URL.createObjectURL(file);
      setImageUrl(blobUrl);
    } finally {
      setIsProcessingFile(false);
    }
  };

  // Handle 3D File Upload (GLB, OBJ, STL, FBX, GLTF) - Single File
  const handle3DFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = (file.name.split('.').pop()?.toLowerCase() || 'glb') as Supported3DFormat;
    setModel3dFileName(file.name);
    setModel3dType('custom_upload');
    setModel3dFormat(ext);
    setBundleSummary(null);
    setIsProcessingFile(true);
    setFileFeedback(`Menyimpan berkas 3D ${file.name} ke database...`);

    try {
      const stored = await AnatomyDatabaseService.storeMediaFile(
        file, 
        file.name, 
        '3d_model', 
        dosenName, 
        customInstitution || institution,
        undefined,
        undefined,
        initialOrgan?.id
      );
      setModel3dFileId(stored.id);
      setModel3dData(stored.blobUrl);

      // Update or add to attachedMediaList
      setAttachedMediaList(prev => {
        const copy = [...prev];
        const existingIdx = copy.findIndex(m => m.type === '3d_model');
        const newItem: OrganMediaItem = {
          id: existingIdx >= 0 ? copy[existingIdx].id : `media-3d-${Date.now()}`,
          title: `Model 3D (${file.name})`,
          type: '3d_model',
          url: stored.blobUrl,
          format: ext,
          model3dType: 'custom_upload',
          mediaFileId: stored.id,
          fileName: file.name,
          fileSize: `${(file.size / 1024).toFixed(1)} KB`,
          isDefault: existingIdx >= 0 ? copy[existingIdx].isDefault : false
        };
        if (existingIdx >= 0) copy[existingIdx] = newItem;
        else copy.push(newItem);
        return copy;
      });

      setFileFeedback(`Berkas 3D "${file.name}" (${ext.toUpperCase()}) siap di-render WebGL.`);
    } catch (err) {
      console.error('Failed to store 3D file in database:', err);
      const blobUrl = URL.createObjectURL(file);
      setModel3dData(blobUrl);
    } finally {
      setIsProcessingFile(false);
    }
  };

  // Handle 3D Folder Upload (Folder with .obj + .mtl + textures/contour)
  const handle3DFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    
    // Find .obj file
    const objFile = fileList.find(f => f.name.toLowerCase().endsWith('.obj'));
    if (!objFile) {
      alert('Tidak ditemukan berkas berekstensi .obj di dalam folder yang dipilih. Pastikan folder memuat file .obj!');
      return;
    }

    const mtlFile = fileList.find(f => f.name.toLowerCase().endsWith('.mtl'));
    const textureFiles = fileList.filter(f => {
      const ext = f.name.split('.').pop()?.toLowerCase();
      return ['png', 'jpg', 'jpeg', 'webp', 'tga', 'bmp'].includes(ext || '');
    });

    const folderName = objFile.webkitRelativePath 
      ? objFile.webkitRelativePath.split('/')[0] 
      : 'Folder_OBJ_Anatomi';

    setModel3dFileName(`${folderName} (${objFile.name} + ${textureFiles.length} tekstur/kontur)`);
    setModel3dType('custom_upload');
    setModel3dFormat('obj_bundle');
    setIsProcessingFile(true);
    setFileFeedback(`Membaca folder ${folderName}: ${fileList.length} berkas ditemukan...`);

    try {
      const bundleFiles: StoredBundleFile[] = [];

      if (mtlFile) {
        bundleFiles.push({
          name: mtlFile.name,
          blob: mtlFile,
          mimeType: 'text/plain',
          sizeBytes: mtlFile.size
        });
      }

      for (const tFile of textureFiles) {
        bundleFiles.push({
          name: tFile.name,
          blob: tFile,
          mimeType: tFile.type || 'image/jpeg',
          sizeBytes: tFile.size
        });
      }

      const stored = await AnatomyDatabaseService.storeMediaFile(
        objFile,
        objFile.name,
        '3d_model',
        dosenName,
        customInstitution || institution,
        undefined,
        bundleFiles,
        initialOrgan?.id
      );

      setModel3dFileId(stored.id);
      setModel3dData(stored.blobUrl);

      const totalSize = (objFile.size + bundleFiles.reduce((acc, b) => acc + (b.sizeBytes || 0), 0)) / (1024 * 1024);
      setBundleSummary({
        objName: objFile.name,
        mtlName: mtlFile?.name,
        textureCount: textureFiles.length,
        totalSizeMB: totalSize.toFixed(2)
      });

      // Update attachedMediaList
      setAttachedMediaList(prev => {
        const copy = [...prev];
        const existingIdx = copy.findIndex(m => m.type === '3d_model');
        const newItem: OrganMediaItem = {
          id: existingIdx >= 0 ? copy[existingIdx].id : `media-3d-${Date.now()}`,
          title: `Model 3D Folder OBJ (${folderName})`,
          type: '3d_model',
          url: stored.blobUrl,
          format: 'obj_bundle',
          model3dType: 'custom_upload',
          mediaFileId: stored.id,
          fileName: `${objFile.name} (+${bundleFiles.length} berkas pendukung)`,
          fileSize: `${totalSize.toFixed(2)} MB`,
          isDefault: existingIdx >= 0 ? copy[existingIdx].isDefault : false
        };
        if (existingIdx >= 0) copy[existingIdx] = newItem;
        else copy.push(newItem);
        return copy;
      });

      setFileFeedback(`✔ Folder OBJ "${folderName}" berhasil disimpan: ${objFile.name}, ${mtlFile ? mtlFile.name : 'tanpa .mtl'}, ${textureFiles.length} berkas kontur/tekstur.`);
    } catch (err: any) {
      console.error('Failed to store folder 3D files:', err);
      alert('Gagal menyimpan folder 3D: ' + (err?.message || String(err)));
    } finally {
      setIsProcessingFile(false);
    }
  };

  // Handle 3D ZIP Archive or Multi-File Upload (.zip containing .obj + .mtl + textures)
  const handle3DZipOrMultiUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    
    // Check if user uploaded a single ZIP archive
    if (fileList.length === 1 && fileList[0].name.toLowerCase().endsWith('.zip')) {
      const zipFile = fileList[0];
      setIsProcessingFile(true);
      setFileFeedback(`Mengekstrak arsip ZIP "${zipFile.name}"...`);

      try {
        const buffer = await zipFile.arrayBuffer();
        const uint8 = new Uint8Array(buffer);

        const unzipped = await new Promise<{ [key: string]: Uint8Array }>((resolve, reject) => {
          fflate.unzip(uint8, (err, data) => {
            if (err) reject(err);
            else resolve(data);
          });
        });

        // Scan unzipped files
        let objEntry: { name: string; data: Uint8Array } | null = null;
        let mtlEntry: { name: string; data: Uint8Array } | null = null;
        const textureEntries: { name: string; data: Uint8Array }[] = [];

        for (const [filePath, fileData] of Object.entries(unzipped)) {
          if (filePath.endsWith('/') || fileData.length === 0) continue; // skip folder entries
          const lower = filePath.toLowerCase();
          const fileName = filePath.split('/').pop() || filePath;
          
          if (lower.endsWith('.obj')) {
            if (!objEntry) objEntry = { name: fileName, data: fileData };
          } else if (lower.endsWith('.mtl')) {
            if (!mtlEntry) mtlEntry = { name: fileName, data: fileData };
          } else {
            const ext = fileName.split('.').pop()?.toLowerCase();
            if (['png', 'jpg', 'jpeg', 'webp', 'tga', 'bmp'].includes(ext || '')) {
              textureEntries.push({ name: fileName, data: fileData });
            }
          }
        }

        if (!objEntry) {
          alert('Arsip ZIP tidak memuat berkas .obj. Pastikan berkas 3D OBJ berada di dalam file ZIP.');
          setIsProcessingFile(false);
          return;
        }

        const objBlob = new Blob([objEntry.data], { type: 'text/plain' });
        const bundleFiles: StoredBundleFile[] = [];

        if (mtlEntry) {
          bundleFiles.push({
            name: mtlEntry.name,
            blob: new Blob([mtlEntry.data], { type: 'text/plain' }),
            mimeType: 'text/plain',
            sizeBytes: mtlEntry.data.length
          });
        }

        for (const t of textureEntries) {
          const ext = t.name.split('.').pop()?.toLowerCase();
          const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
          bundleFiles.push({
            name: t.name,
            blob: new Blob([t.data], { type: mime }),
            mimeType: mime,
            sizeBytes: t.data.length
          });
        }

        const stored = await AnatomyDatabaseService.storeMediaFile(
          objBlob,
          objEntry.name,
          '3d_model',
          dosenName,
          customInstitution || institution,
          undefined,
          bundleFiles,
          initialOrgan?.id
        );

        setModel3dFileName(`${zipFile.name} (${objEntry.name} + ${textureEntries.length} kontur)`);
        setModel3dType('custom_upload');
        setModel3dFormat('obj_bundle');
        setModel3dFileId(stored.id);
        setModel3dData(stored.blobUrl);

        const totalSize = zipFile.size / (1024 * 1024);
        setBundleSummary({
          objName: objEntry.name,
          mtlName: mtlEntry?.name,
          textureCount: textureEntries.length,
          totalSizeMB: totalSize.toFixed(2)
        });

        // Update attachedMediaList
        setAttachedMediaList(prev => {
          const copy = [...prev];
          const existingIdx = copy.findIndex(m => m.type === '3d_model');
          const newItem: OrganMediaItem = {
            id: existingIdx >= 0 ? copy[existingIdx].id : `media-3d-${Date.now()}`,
            title: `Model 3D ZIP OBJ (${zipFile.name})`,
            type: '3d_model',
            url: stored.blobUrl,
            format: 'obj_bundle',
            model3dType: 'custom_upload',
            mediaFileId: stored.id,
            fileName: `${objEntry!.name} (+${bundleFiles.length} berkas ZIP)`,
            fileSize: `${totalSize.toFixed(2)} MB`,
            isDefault: existingIdx >= 0 ? copy[existingIdx].isDefault : false
          };
          if (existingIdx >= 0) copy[existingIdx] = newItem;
          else copy.push(newItem);
          return copy;
        });

        setFileFeedback(`✔ Arsip ZIP diekstrak: ${objEntry.name}, ${mtlEntry ? mtlEntry.name : 'tanpa .mtl'}, ${textureEntries.length} kontur/tekstur.`);
      } catch (err: any) {
        console.error('Failed to extract ZIP:', err);
        alert('Gagal mengekstrak berkas ZIP: ' + (err?.message || String(err)));
      } finally {
        setIsProcessingFile(false);
      }
      return;
    }

    // Multi-File selection (.obj + .mtl + .png, etc.)
    const objFile = fileList.find(f => f.name.toLowerCase().endsWith('.obj'));
    if (!objFile) {
      alert('Harap sertakan setidaknya satu berkas .obj!');
      return;
    }

    const mtlFile = fileList.find(f => f.name.toLowerCase().endsWith('.mtl'));
    const textureFiles = fileList.filter(f => {
      const ext = f.name.split('.').pop()?.toLowerCase();
      return ['png', 'jpg', 'jpeg', 'webp', 'tga', 'bmp'].includes(ext || '');
    });

    setIsProcessingFile(true);
    setFileFeedback(`Menyimpan ${fileList.length} berkas paket OBJ...`);

    try {
      const bundleFiles: StoredBundleFile[] = [];
      if (mtlFile) {
        bundleFiles.push({
          name: mtlFile.name,
          blob: mtlFile,
          mimeType: 'text/plain',
          sizeBytes: mtlFile.size
        });
      }
      for (const t of textureFiles) {
        bundleFiles.push({
          name: t.name,
          blob: t,
          mimeType: t.type || 'image/jpeg',
          sizeBytes: t.size
        });
      }

      const stored = await AnatomyDatabaseService.storeMediaFile(
        objFile,
        objFile.name,
        '3d_model',
        dosenName,
        customInstitution || institution,
        undefined,
        bundleFiles,
        initialOrgan?.id
      );

      setModel3dFileName(`${objFile.name} (+${bundleFiles.length} berkas kontur)`);
      setModel3dType('custom_upload');
      setModel3dFormat('obj_bundle');
      setModel3dFileId(stored.id);
      setModel3dData(stored.blobUrl);

      const totalSize = (objFile.size + bundleFiles.reduce((a, b) => a + (b.sizeBytes || 0), 0)) / (1024 * 1024);
      setBundleSummary({
        objName: objFile.name,
        mtlName: mtlFile?.name,
        textureCount: textureFiles.length,
        totalSizeMB: totalSize.toFixed(2)
      });

      setAttachedMediaList(prev => {
        const copy = [...prev];
        const existingIdx = copy.findIndex(m => m.type === '3d_model');
        const newItem: OrganMediaItem = {
          id: existingIdx >= 0 ? copy[existingIdx].id : `media-3d-${Date.now()}`,
          title: `Model 3D Paket OBJ (${objFile.name})`,
          type: '3d_model',
          url: stored.blobUrl,
          format: 'obj_bundle',
          model3dType: 'custom_upload',
          mediaFileId: stored.id,
          fileName: `${objFile.name} (+${bundleFiles.length} berkas)`,
          fileSize: `${totalSize.toFixed(2)} MB`,
          isDefault: existingIdx >= 0 ? copy[existingIdx].isDefault : false
        };
        if (existingIdx >= 0) copy[existingIdx] = newItem;
        else copy.push(newItem);
        return copy;
      });

      setFileFeedback(`✔ Berkas paket OBJ disimpan: ${objFile.name}, ${mtlFile ? mtlFile.name : 'tanpa .mtl'}, ${textureFiles.length} kontur.`);
    } catch (err: any) {
      console.error('Failed to store OBJ bundle files:', err);
      alert('Gagal menyimpan berkas OBJ: ' + (err?.message || String(err)));
    } finally {
      setIsProcessingFile(false);
    }
  };

  // Handle setting Embed URL (Sketchfab & Google Drive)
  const handleEmbedUrlChange = (urlValue: string, customTitle?: string) => {
    const embedInfo = normalizeEmbedUrl(urlValue);
    const resolvedUrl = embedInfo.isValid ? embedInfo.normalizedEmbedUrl : urlValue;
    setEmbed3dUrl(resolvedUrl);
    if (!urlValue) return;

    const resolvedTitle = customTitle || (
      embedInfo.sourceType === 'sketchfab' ? 'Sketchfab 3D Embed' :
      embedInfo.sourceType === 'google_drive' ? 'Google Drive Embed Preview' :
      'Embed 2D/3D Interaktif'
    );

    setAttachedMediaList(prev => {
      const copy = [...prev];
      const existingIdx = copy.findIndex(m => m.type === '3d_embed');
      const newItem: OrganMediaItem = {
        id: existingIdx >= 0 ? copy[existingIdx].id : `media-embed-${Date.now()}`,
        title: resolvedTitle,
        type: '3d_embed',
        url: resolvedUrl,
        isDefault: existingIdx >= 0 ? copy[existingIdx].isDefault : false
      };
      if (existingIdx >= 0) copy[existingIdx] = newItem;
      else copy.push(newItem);
      return copy;
    });
  };

  // Add extra custom media object (e.g. 4th or 5th view/slice/model)
  const handleAddExtraMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extraMediaTitle.trim() || !extraMediaUrl.trim()) {
      alert('Mohon isi Judul dan URL/Berkas objek tambahan.');
      return;
    }

    const newItem: OrganMediaItem = {
      id: `media-extra-${Date.now()}`,
      title: extraMediaTitle.trim(),
      type: extraMediaType,
      url: extraMediaUrl.trim(),
      format: extraMediaFormat,
      isDefault: false
    };

    setAttachedMediaList(prev => [...prev, newItem]);
    setExtraMediaTitle('');
    setExtraMediaUrl('');
    setIsAddingExtraMedia(false);
  };

  // Set default view for this organ
  const setDefaultMedia = (id: string) => {
    setAttachedMediaList(prev => prev.map(m => ({
      ...m,
      isDefault: m.id === id
    })));
  };

  // Remove media item
  const removeMediaItem = (id: string) => {
    if (attachedMediaList.length <= 1) {
      alert('Setidaknya harus ada 1 objek media pada organ ini.');
      return;
    }
    setAttachedMediaList(prev => {
      const filtered = prev.filter(m => m.id !== id);
      if (!filtered.some(m => m.isDefault) && filtered.length > 0) {
        filtered[0].isDefault = true;
      }
      return filtered;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalInstitution = customInstitution.trim() || institution.trim() || 'Koleksi Mandiri / Terbuka';

    if (!name.trim() || !latinName.trim() || !subSystem.trim() || !description.trim()) {
      alert('Mohon lengkapi seluruh bidang bertanda bintang (*).');
      return;
    }

    // Determine primary media item
    const defaultMedia = attachedMediaList.find(m => m.isDefault) || attachedMediaList[0];
    const finalImageUrl = imageUrl || (
      attachedMediaList.find(m => m.type === '2d_image')?.url || PRESET_ILLUSTRATIONS_2D[0].url
    );

    const organData: Organ = {
      id: initialOrgan?.id || `custom-organ-${Date.now()}`,
      name: name.trim(),
      latinName: latinName.trim(),
      system,
      subSystem: subSystem.trim(),
      standard: standard || DEFAULT_STANDARD,
      dosenName: dosenName.trim(),
      dosenCode: dosenCode.trim(),
      institution: finalInstitution,
      mediaType: defaultMedia?.type || '2d_image',
      imageUrl: finalImageUrl,
      model3dType: model3dType,
      model3dData: model3dData,
      model3dFormat: model3dFormat,
      mediaFileId: model3dFileId,
      embed3dUrl: embed3dUrl || attachedMediaList.find(m => m.type === '3d_embed')?.url,
      mediaItems: attachedMediaList, // Full Multi-Media & Multi-Object Array
      description: description.trim(),
      functionMain: functionMain.trim() || 'Fungsi fisiologis terstandarisasi kurikulum.',
      vascularization: vascularization.trim() || 'Vaskularisasi arteri & vena terkait.',
      innervation: innervation.trim() || 'Inervasi saraf somatik/otonom.',
      clinicalNotes: clinicalNotes.trim() || 'Catatan korelasi klinis dan patofisiologi.',
      isFree,
      pins: initialOrgan?.pins || [],
      updatedAt: new Date().toISOString()
    };

    onSave(organData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className={`relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl shadow-2xl border overflow-hidden ${
        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        
        {/* Modal Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b shrink-0 ${
          isDark ? 'border-slate-800 bg-slate-900/90' : 'border-slate-200 bg-slate-50'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 shadow-sm">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold leading-tight">
                {initialOrgan ? 'Edit Materi & Objek Anatomi' : 'Tambah Organ Anatomi Baru'}
              </h2>
              <p className="text-xs text-slate-400">
                Mendukung unggah sekaligus: Berkas 2D, Model 3D (.GLB/.OBJ/.STL), dan Embed Interaktif dalam 1 Item
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Scroll Area */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {/* Section 1: Curriculum Standard & Institution Attribution */}
          <div className={`p-4 rounded-xl border space-y-3 ${
            isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-teal-400 flex items-center gap-1.5 uppercase font-mono tracking-wider">
                <FileCheck className="w-3.5 h-3.5 text-teal-400" /> Standar Acuan Kurikulum & Afiliasi Institusi
              </span>
              <span className="text-[10px] text-slate-400">
                Standar Kurikulum Nasional PAAI
              </span>
            </div>

            {/* Standar Acuan Kurikulum */}
            <div className="p-3 rounded-lg border border-teal-500/30 bg-teal-950/20 space-y-1.5">
              <label className="block text-xs font-bold text-teal-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                Standar Acuan Kurikulum & Nomenklatur Medis *
              </label>
              <select
                value={standard}
                onChange={(e) => setStandard(e.target.value)}
                className={`w-full rounded-lg border px-3 py-2 text-xs focus:outline-none focus:border-teal-500 font-medium ${
                  isDark ? 'bg-slate-950 border-slate-700 text-teal-200' : 'bg-white border-slate-300 text-teal-900'
                }`}
              >
                {KNOWN_STANDARDS.map((std) => (
                  <option key={std} value={std}>{std}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Nama Dosen Kontributor *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: dr. Paijo, Sp.A / dr. Nama Dosen"
                  value={dosenName}
                  onChange={(e) => {
                    setDosenName(e.target.value);
                    if (!initialOrgan) {
                      setDosenCode(generateLecturerCode(e.target.value));
                    }
                  }}
                  className={`w-full rounded-lg border px-3 py-2 text-xs focus:outline-none focus:border-amber-500 ${
                    isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Kode Unik Kontributor
                </label>
                <input
                  type="text"
                  value={dosenCode}
                  onChange={(e) => setDosenCode(e.target.value)}
                  className={`w-full rounded-lg border px-3 py-2 text-xs font-mono focus:outline-none focus:border-amber-500 ${
                    isDark ? 'bg-slate-950/80 border-slate-800 text-amber-400' : 'bg-white border-slate-300 text-amber-700'
                  }`}
                />
              </div>
            </div>

            {/* Asal Institusi */}
            <div className="space-y-1.5 pt-1">
              <label className="block text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                Asal Institusi / Fakultas Kedokteran Dosen *
              </label>
              
              <div className="space-y-2">
                <select
                  value={institution}
                  onChange={(e) => {
                    setInstitution(e.target.value);
                    if (e.target.value !== 'OTHER') {
                      setCustomInstitution('');
                    }
                  }}
                  className={`w-full rounded-lg border px-3 py-2 text-xs focus:outline-none focus:border-amber-500 ${
                    isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                >
                  {KNOWN_INSTITUTIONS.map((inst) => (
                    <option key={inst} value={inst}>{inst}</option>
                  ))}
                  <option value="OTHER">+ Tulis Nama Institusi Lain...</option>
                </select>

                {institution === 'OTHER' && (
                  <input
                    type="text"
                    required
                    placeholder="Tuliskan nama Fakultas Kedokteran / Universitas..."
                    value={customInstitution}
                    onChange={(e) => setCustomInstitution(e.target.value)}
                    className={`w-full rounded-lg border px-3 py-2 text-xs focus:outline-none focus:border-amber-500 ${
                      isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Basic Anatomy Taxonomy */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Nama Organ (Indonesia) *
              </label>
              <input
                type="text"
                required
                placeholder="Misal: Jantung, Korteks Serebri, Paru"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full rounded-lg border px-3 py-2 text-xs focus:outline-none focus:border-teal-500 ${
                  isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Nama Latin (Terminologia Anatomica) *
              </label>
              <input
                type="text"
                required
                placeholder="Misal: Cor, Cortex Cerebri, Pulmo"
                value={latinName}
                onChange={(e) => setLatinName(e.target.value)}
                className={`w-full rounded-lg border px-3 py-2 text-xs italic focus:outline-none focus:border-teal-500 ${
                  isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Sistem Organ Utama (PAAI) *
              </label>
              <select
                value={system}
                onChange={(e) => setSystem(e.target.value)}
                className={`w-full rounded-lg border px-3 py-2 text-xs focus:outline-none focus:border-teal-500 ${
                  isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-white border-slate-300 text-slate-900'
                }`}
              >
                <option value="1. Anatomi dan Embriologi Umum">1. Anatomi dan Embriologi Umum</option>
                <option value="2. Sistem Saraf (Systema Nervosum)">2. Sistem Saraf (Systema Nervosum)</option>
                <option value="3. Sistem Kardiovaskular (Systema Cardiovasculare)">3. Sistem Kardiovaskular (Systema Cardiovasculare)</option>
                <option value="4. Sistem Respirasi (Systema Respiratorium)">4. Sistem Respirasi (Systema Respiratorium)</option>
                <option value="5. Sistem Pencernaan (Systema Digestorium)">5. Sistem Pencernaan (Systema Digestorium)</option>
                <option value="6. Sistem Urogenital (Systema Urogenitale)">6. Sistem Urogenital (Systema Urogenitale)</option>
                <option value="7. Sistem Endokrin (Systema Endocrinum)">7. Sistem Endokrin (Systema Endocrinum)</option>
                <option value="8. Sistem Muskuloskeletal (Systema Musculoskeletale)">8. Sistem Muskuloskeletal (Systema Musculoskeletale)</option>
                <option value="9. Sistem Integumen (Integumentum Commune)">9. Sistem Integumen (Integumentum Commune)</option>
                <option value="10. Organa Sensuum (Panca Indera)">10. Organa Sensuum (Panca Indera)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Sub-Kategori / Regio Anatomi *
              </label>
              <input
                type="text"
                required
                placeholder="Misal: 2.2 Otak Besar (Cerebrum)"
                value={subSystem}
                onChange={(e) => setSubSystem(e.target.value)}
                className={`w-full rounded-lg border px-3 py-2 text-xs focus:outline-none focus:border-teal-500 ${
                  isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>
          </div>

          {/* Section 3: Multi-Media Upload & Configuration in 1 Item */}
          <div className={`p-4 rounded-xl border space-y-4 ${
            isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between border-b pb-2.5 border-slate-800">
              <div>
                <span className="text-xs font-bold text-teal-400 flex items-center gap-1.5">
                  <Database className="w-4 h-4" />
                  Media Objek Anatomi (2D, 3D File & 3D Embed)
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Anda dapat menyertakan berkas 2D, 3D, dan Embed sekaligus dalam 1 organ ini.
                </p>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-[10px] font-mono font-bold">
                {attachedMediaList.length} Objek Terlampir
              </span>
            </div>

            {/* Upload Slots Grid: 2D, 3D File, & 3D Embed */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              
              {/* Card 1: 2D Image Diagram */}
              <div className={`p-3 rounded-xl border flex flex-col justify-between space-y-2.5 ${
                isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-300 flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5" /> 1. Berkas 2D (JPG/PNG)
                  </span>
                  <span className="text-[9px] font-mono text-slate-400">Diagram</span>
                </div>

                <label className={`w-full flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-2.5 cursor-pointer transition-colors ${
                  isDark ? 'border-slate-800 hover:border-teal-500 bg-slate-950' : 'border-slate-300 hover:border-teal-500 bg-slate-50'
                }`}>
                  <Upload className="w-4 h-4 text-teal-400 mb-1" />
                  <span className="text-[11px] text-slate-300 font-medium text-center truncate max-w-[170px]">
                    {image2DFileName || 'Upload Berkas 2D'}
                  </span>
                  <span className="text-[9px] text-slate-500">.jpg, .png, .webp</span>
                  <input
                    type="file"
                    accept="image/jpeg, image/png, image/jpg, .jpg, .jpeg, .png, .webp"
                    onChange={handleImageFileUpload}
                    className="hidden"
                  />
                </label>

                {/* Quick 2D Preset Buttons */}
                <div>
                  <span className="text-[9px] font-mono text-slate-400 block mb-1">Preset Cepat:</span>
                  <div className="flex flex-wrap gap-1">
                    {PRESET_ILLUSTRATIONS_2D.slice(0, 2).map((p) => (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => {
                          setImageUrl(p.url);
                          setAttachedMediaList(prev => {
                            const copy = [...prev];
                            const idx = copy.findIndex(m => m.type === '2d_image');
                            if (idx >= 0) copy[idx].url = p.url;
                            return copy;
                          });
                        }}
                        className="text-[9px] px-1.5 py-0.5 rounded border border-slate-800 bg-slate-950 text-slate-300 hover:text-teal-300 cursor-pointer"
                      >
                        {p.name.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card 2: 3D Model File (GLB / OBJ / STL / FBX or Folder / ZIP) */}
              <div className={`p-3 rounded-xl border flex flex-col justify-between space-y-2.5 ${
                isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-300 flex items-center gap-1">
                    <Box className="w-3.5 h-3.5" /> 2. Objek 3D (WebGL)
                  </span>
                  <span className="text-[9px] font-mono text-slate-400">
                    {upload3DMode === 'folder' ? 'Folder OBJ' : upload3DMode === 'zip' ? 'Paket ZIP' : 'Berkas 3D'}
                  </span>
                </div>

                {/* Mode Selector Tabs */}
                <div className="flex p-0.5 rounded-lg bg-slate-950 border border-slate-800 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setUpload3DMode('single')}
                    className={`flex-1 py-1 px-1 rounded text-center font-medium transition-all ${
                      upload3DMode === 'single'
                        ? 'bg-teal-500 text-slate-950 font-bold shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Berkas
                  </button>
                  <button
                    type="button"
                    onClick={() => setUpload3DMode('folder')}
                    className={`flex-1 py-1 px-1 rounded text-center font-medium transition-all flex items-center justify-center gap-0.5 ${
                      upload3DMode === 'folder'
                        ? 'bg-teal-500 text-slate-950 font-bold shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Folder className="w-2.5 h-2.5" /> Folder OBJ
                  </button>
                  <button
                    type="button"
                    onClick={() => setUpload3DMode('zip')}
                    className={`flex-1 py-1 px-1 rounded text-center font-medium transition-all flex items-center justify-center gap-0.5 ${
                      upload3DMode === 'zip'
                        ? 'bg-teal-500 text-slate-950 font-bold shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Archive className="w-2.5 h-2.5" /> ZIP/Multi
                  </button>
                </div>

                {/* Upload Zone based on active mode */}
                {upload3DMode === 'single' && (
                  <label className={`w-full flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-2.5 cursor-pointer transition-colors ${
                    isDark ? 'border-slate-800 hover:border-teal-500 bg-slate-950' : 'border-slate-300 hover:border-teal-500 bg-slate-50'
                  }`}>
                    <Upload className="w-4 h-4 text-teal-400 mb-1" />
                    <span className="text-[11px] text-slate-300 font-medium text-center truncate max-w-[170px]">
                      {model3dFileName || 'Upload Berkas 3D Tunggal'}
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono">.fbx, .obj, .glb, .3ds</span>
                    <input
                      type="file"
                      accept=".glb, .gltf, .obj, .stl, .fbx, .3ds, model/gltf-binary"
                      onChange={handle3DFileUpload}
                      className="hidden"
                    />
                  </label>
                )}

                {upload3DMode === 'folder' && (
                  <label className={`w-full flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-2.5 cursor-pointer transition-colors ${
                    isDark ? 'border-teal-500/40 hover:border-teal-400 bg-teal-950/20' : 'border-teal-300 hover:border-teal-500 bg-teal-50/50'
                  }`}>
                    <Folder className="w-4 h-4 text-teal-400 mb-1" />
                    <span className="text-[11px] text-teal-300 font-medium text-center truncate max-w-[170px]">
                      {model3dFileName || 'Pilih Folder OBJ & Kontur'}
                    </span>
                    <span className="text-[9px] text-slate-400 text-center px-1">
                      Folder berisi .obj + .mtl + kontur/tekstur
                    </span>
                    <input
                      type="file"
                      {...({ webkitdirectory: '', directory: '' } as any)}
                      multiple
                      onChange={handle3DFolderUpload}
                      className="hidden"
                    />
                  </label>
                )}

                {upload3DMode === 'zip' && (
                  <label className={`w-full flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-2.5 cursor-pointer transition-colors ${
                    isDark ? 'border-teal-500/40 hover:border-teal-400 bg-teal-950/20' : 'border-teal-300 hover:border-teal-500 bg-teal-50/50'
                  }`}>
                    <Archive className="w-4 h-4 text-teal-400 mb-1" />
                    <span className="text-[11px] text-teal-300 font-medium text-center truncate max-w-[170px]">
                      {model3dFileName || 'Upload ZIP / Multi-Berkas'}
                    </span>
                    <span className="text-[9px] text-slate-400 text-center px-1">
                      Arsip .zip atau pilih .obj + .mtl + .png
                    </span>
                    <input
                      type="file"
                      accept=".zip, .obj, .mtl, .png, .jpg, .jpeg, .webp, .tga"
                      multiple
                      onChange={handle3DZipOrMultiUpload}
                      className="hidden"
                    />
                  </label>
                )}

                {/* Bundle summary if loaded */}
                {bundleSummary && (
                  <div className="p-1.5 rounded bg-teal-500/10 border border-teal-500/20 text-[10px] space-y-0.5">
                    <div className="flex items-center justify-between text-teal-300 font-semibold">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-teal-400" />
                        Paket OBJ Siap
                      </span>
                      <span>{bundleSummary.totalSizeMB} MB</span>
                    </div>
                    <p className="text-[9px] text-slate-400 truncate">
                      {bundleSummary.objName} • {bundleSummary.mtlName || 'No MTL'} • {bundleSummary.textureCount} kontur
                    </p>
                  </div>
                )}

                {/* 3D Preset Selection */}
                <div>
                  <span className="text-[9px] font-mono text-slate-400 block mb-1">Preset Fallback:</span>
                  <select
                    value={model3dType}
                    onChange={(e) => {
                      const val = e.target.value as Model3DPreset;
                      setModel3dType(val);
                      setAttachedMediaList(prev => {
                        const copy = [...prev];
                        const idx = copy.findIndex(m => m.type === '3d_model');
                        if (idx >= 0) copy[idx].model3dType = val;
                        return copy;
                      });
                    }}
                    className={`w-full rounded border px-1.5 py-0.5 text-[10px] ${
                      isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-300'
                    }`}
                  >
                    <option value="heart">Cor (Jantung 3D Prosedural)</option>
                    <option value="brain">Cerebrum (Otak 3D)</option>
                    <option value="lungs">Pulmo (Paru 3D)</option>
                    <option value="skull">Cranium (Tengkorak 3D)</option>
                    <option value="body">Truncus (Tubuh 3D)</option>
                  </select>
                </div>
              </div>

              {/* Card 3: 3D Embed Iframe URL */}
              <div className={`p-3 rounded-xl border flex flex-col justify-between space-y-2.5 ${
                isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-300 flex items-center gap-1">
                    <LinkIcon className="w-3.5 h-3.5" /> 3. Embed (Sketchfab / Google Drive)
                  </span>
                  <span className="text-[9px] font-mono text-slate-400">2D / 3D</span>
                </div>

                <div className="space-y-1">
                  <input
                    type="url"
                    placeholder="Tempel link Sketchfab atau Google Drive..."
                    value={embed3dUrl}
                    onChange={(e) => handleEmbedUrlChange(e.target.value)}
                    className={`w-full rounded border px-2 py-1.5 text-xs focus:outline-none focus:border-teal-500 ${
                      isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-300'
                    }`}
                  />
                  {embed3dUrl && (
                    <div className="text-[9px] font-mono text-teal-400 truncate">
                      {embed3dUrl.includes('sketchfab') ? '✓ Terdeteksi: Sketchfab 3D Embed' :
                       embed3dUrl.includes('drive.google.com') ? '✓ Terdeteksi: Google Drive Embed Preview' :
                       '✓ Embed Link Aktif'}
                    </div>
                  )}
                </div>

                {/* Preset Embed Buttons */}
                <div>
                  <span className="text-[9px] font-mono text-slate-400 block mb-1">Preset Cepat:</span>
                  <div className="flex flex-wrap gap-1">
                    {PRESET_EMBED_3D.slice(0, 2).map((p) => (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => handleEmbedUrlChange(p.url, p.name)}
                        className="text-[9px] px-1.5 py-0.5 rounded border border-slate-800 bg-slate-950 text-slate-300 hover:text-teal-300 cursor-pointer"
                        title="Model 3D Sketchfab"
                      >
                        {p.name.split(' ')[1] || p.name.split(' ')[0]}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => handleEmbedUrlChange('https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs/preview', 'Google Drive Sample Embed')}
                      className="text-[9px] px-1.5 py-0.5 rounded border border-slate-800 bg-slate-950 text-slate-300 hover:text-teal-300 cursor-pointer"
                      title="Google Drive Preview Embed"
                    >
                      GDrive Preview
                    </button>
                  </div>
                </div>
              </div>

            </div>

            {/* List of Attached Objects on this Organ */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-teal-400" />
                  Daftar Objek Media Terlampir ({attachedMediaList.length} Objek)
                </span>
                
                <button
                  type="button"
                  onClick={() => setIsAddingExtraMedia(prev => !prev)}
                  className="text-[11px] font-bold text-teal-400 hover:text-teal-300 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Objek / Irisan Lainnya</span>
                </button>
              </div>

              {/* Add Extra Media Inline Form */}
              {isAddingExtraMedia && (
                <div className={`p-3 mb-3 rounded-xl border space-y-2.5 ${
                  isDark ? 'bg-slate-900 border-teal-500/40' : 'bg-teal-50/50 border-teal-300'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-teal-400">Tambah Objek Visual Tambahan</span>
                    <button 
                      type="button" 
                      onClick={() => setIsAddingExtraMedia(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Tipe Objek</label>
                      <select
                        value={extraMediaType}
                        onChange={(e) => setExtraMediaType(e.target.value as MediaType)}
                        className={`w-full rounded border px-2 py-1 text-xs ${
                          isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-300'
                        }`}
                      >
                        <option value="2d_image">2D (Diagram / Irisan)</option>
                        <option value="3d_model">3D Model (Berkas WebGL)</option>
                        <option value="3d_embed">3D Embed (Iframe URL)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Judul Tampilan / Potongan</label>
                      <input
                        type="text"
                        placeholder="Misal: Irisan Sagital, Tampilan Posterior"
                        value={extraMediaTitle}
                        onChange={(e) => setExtraMediaTitle(e.target.value)}
                        className={`w-full rounded border px-2 py-1 text-xs ${
                          isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-300'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">URL / Tautan Media</label>
                      <input
                        type="url"
                        placeholder="https://..."
                        value={extraMediaUrl}
                        onChange={(e) => setExtraMediaUrl(e.target.value)}
                        className={`w-full rounded border px-2 py-1 text-xs ${
                          isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-300'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleAddExtraMedia}
                      className="px-3 py-1 bg-teal-500 text-slate-950 rounded-lg text-xs font-bold hover:bg-teal-400 cursor-pointer"
                    >
                      Tambahkan ke Organ Ini
                    </button>
                  </div>
                </div>
              )}

              {/* Cards for each attached media item */}
              <div className="space-y-1.5">
                {attachedMediaList.map((item, idx) => {
                  const Icon = item.type === '3d_model' ? Box : item.type === '3d_embed' ? Layers : ImageIcon;
                  return (
                    <div 
                      key={item.id || idx}
                      className={`flex items-center justify-between p-2.5 rounded-lg border text-xs ${
                        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`p-1.5 rounded-lg ${
                          item.type === '3d_model' 
                            ? 'bg-amber-500/15 text-amber-400' 
                            : item.type === '3d_embed' 
                            ? 'bg-indigo-500/15 text-indigo-400' 
                            : 'bg-teal-500/15 text-teal-400'
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold truncate text-slate-200">
                            {item.title}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono truncate max-w-xs sm:max-w-md">
                            {item.url || 'Menggunakan Preset Prosedural 3D'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setDefaultMedia(item.id)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer flex items-center gap-1 ${
                            item.isDefault 
                              ? 'bg-teal-500 text-slate-950 border-teal-400' 
                              : isDark ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white' : 'bg-slate-100 border-slate-300 text-slate-600'
                          }`}
                          title="Jadikan Tampilan Default Saat Organ Dibuka"
                        >
                          <Star className={`w-3 h-3 ${item.isDefault ? 'fill-slate-950' : ''}`} />
                          <span>{item.isDefault ? 'Default' : 'Set Default'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => removeMediaItem(item.id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 cursor-pointer"
                          title="Hapus Objek Ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {fileFeedback && (
                <p className="text-[11px] text-teal-400 mt-2 font-mono">
                  ✓ {fileFeedback}
                </p>
              )}
            </div>
          </div>

          {/* Section 4: Medical Descriptions & Correlations */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Deskripsi Morfologi & Struktur Makroskopis *
              </label>
              <textarea
                required
                rows={2}
                placeholder="Deskripsikan struktur anatomis, letak cavitas, dan orientasi..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={`w-full rounded-lg border px-3 py-2 text-xs focus:outline-none focus:border-teal-500 ${
                  isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Fungsi Fisiologis
                </label>
                <textarea
                  rows={2}
                  placeholder="Fungsi faal..."
                  value={functionMain}
                  onChange={(e) => setFunctionMain(e.target.value)}
                  className={`w-full rounded-lg border px-3 py-2 text-xs focus:outline-none focus:border-teal-500 ${
                    isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Vaskularisasi (Arteri & Vena)
                </label>
                <textarea
                  rows={2}
                  placeholder="Cabang arterial & venous..."
                  value={vascularization}
                  onChange={(e) => setVascularization(e.target.value)}
                  className={`w-full rounded-lg border px-3 py-2 text-xs focus:outline-none focus:border-teal-500 ${
                    isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Inervasi (Saraf)
                </label>
                <textarea
                  rows={2}
                  placeholder="Pleksus saraf & cabang..."
                  value={innervation}
                  onChange={(e) => setInnervation(e.target.value)}
                  className={`w-full rounded-lg border px-3 py-2 text-xs focus:outline-none focus:border-teal-500 ${
                    isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Korelasi Klinis & Patologi
              </label>
              <textarea
                rows={2}
                placeholder="Kasus klinis relevan (misal: Infark Miokard, Fraktur, dll)..."
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                className={`w-full rounded-lg border px-3 py-2 text-xs focus:outline-none focus:border-teal-500 ${
                  isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>
          </div>

          {/* Section 5: Access Level */}
          <div className={`p-3 rounded-xl border flex items-center justify-between ${
            isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div>
              <span className="text-xs font-bold text-slate-200 block">
                Hak Akses Publik (Guest Free Access)
              </span>
              <span className="text-[11px] text-slate-400">
                Jika diaktifkan, modul organ ini dapat diakses oleh pengunjung tanpa perlu login.
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isFree}
                onChange={(e) => setIsFree(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
            </label>
          </div>

          {/* Submit Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={isProcessingFile}
              className="px-5 py-2 rounded-xl bg-teal-500 text-slate-950 text-xs font-bold shadow-lg shadow-teal-500/20 hover:bg-teal-400 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Seluruh Objek Organ</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
