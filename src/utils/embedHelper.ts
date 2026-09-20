/**
 * Helper utility for parsing and normalizing 2D and 3D embeds from Sketchfab and Google Drive
 */

export interface EmbedInfo {
  originalUrl: string;
  normalizedEmbedUrl: string;
  sourceType: 'sketchfab' | 'google_drive' | 'generic';
  mediaCategory: '3d' | '2d' | 'unknown';
  previewTitle: string;
  isValid: boolean;
}

/**
 * Normalizes user input URL (or iframe snippet) into a clean embeddable iframe URL
 * Supports:
 * 1. Sketchfab (3D Models)
 *    - Direct embed URL: https://sketchfab.com/models/{id}/embed
 *    - Model page URL: https://sketchfab.com/3d-models/human-heart-{id}
 *    - Iframe embed code: <iframe src="https://sketchfab.com/models/{id}/embed"></iframe>
 * 2. Google Drive (2D Images & 3D Previews)
 *    - Sharing link: https://drive.google.com/file/d/{id}/view?usp=sharing
 *    - Open link: https://drive.google.com/open?id={id}
 *    - Direct preview URL: https://drive.google.com/file/d/{id}/preview
 */
export function normalizeEmbedUrl(rawInput: string): EmbedInfo {
  if (!rawInput || typeof rawInput !== 'string') {
    return {
      originalUrl: '',
      normalizedEmbedUrl: '',
      sourceType: 'generic',
      mediaCategory: 'unknown',
      previewTitle: '',
      isValid: false
    };
  }

  let clean = rawInput.trim();

  // If user pasted an entire <iframe> code snippet, extract the src attribute
  if (clean.includes('<iframe') && clean.includes('src=')) {
    const srcMatch = clean.match(/src=["']([^"']+)["']/i);
    if (srcMatch && srcMatch[1]) {
      clean = srcMatch[1];
    }
  }

  // 1. Check Sketchfab
  if (clean.includes('sketchfab.com')) {
    // Check if it's already an embed URL
    if (clean.includes('/models/') && clean.includes('/embed')) {
      return {
        originalUrl: rawInput,
        normalizedEmbedUrl: clean,
        sourceType: 'sketchfab',
        mediaCategory: '3d',
        previewTitle: 'Sketchfab 3D Embed',
        isValid: true
      };
    }

    // Extract Sketchfab model ID from standard URL pattern
    // e.g. https://sketchfab.com/3d-models/human-heart-anatomy-e5d79634e2c943be8dc79581977f6b9a
    // or https://sketchfab.com/models/e5d79634e2c943be8dc79581977f6b9a
    const idMatches = clean.match(/[0-9a-fA-F]{32}/);
    if (idMatches && idMatches[0]) {
      const modelId = idMatches[0];
      const embedUrl = `https://sketchfab.com/models/${modelId}/embed?autostart=1&preload=1&camera=0&ui_controls=1&ui_infos=0&ui_watermark=0`;
      return {
        originalUrl: rawInput,
        normalizedEmbedUrl: embedUrl,
        sourceType: 'sketchfab',
        mediaCategory: '3d',
        previewTitle: `Sketchfab 3D (${modelId.slice(0, 8)}...)`,
        isValid: true
      };
    }

    return {
      originalUrl: rawInput,
      normalizedEmbedUrl: clean,
      sourceType: 'sketchfab',
      mediaCategory: '3d',
      previewTitle: 'Sketchfab 3D Model',
      isValid: true
    };
  }

  // 2. Check Google Drive
  if (clean.includes('drive.google.com')) {
    // Pattern 1: https://drive.google.com/file/d/{FILE_ID}/view...
    const fileIdMatch = clean.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileIdMatch && fileIdMatch[1]) {
      const fileId = fileIdMatch[1];
      const previewUrl = `https://drive.google.com/file/d/${fileId}/preview`;
      return {
        originalUrl: rawInput,
        normalizedEmbedUrl: previewUrl,
        sourceType: 'google_drive',
        mediaCategory: '2d', // Can preview 2D image or 3D/video
        previewTitle: `Google Drive Preview (${fileId.slice(0, 8)}...)`,
        isValid: true
      };
    }

    // Pattern 2: https://drive.google.com/open?id={FILE_ID} or ?id={FILE_ID}
    const idParamMatch = clean.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (idParamMatch && idParamMatch[1]) {
      const fileId = idParamMatch[1];
      const previewUrl = `https://drive.google.com/file/d/${fileId}/preview`;
      return {
        originalUrl: rawInput,
        normalizedEmbedUrl: previewUrl,
        sourceType: 'google_drive',
        mediaCategory: '2d',
        previewTitle: `Google Drive Preview (${fileId.slice(0, 8)}...)`,
        isValid: true
      };
    }

    // Already preview format: /preview
    if (clean.includes('/preview')) {
      return {
        originalUrl: rawInput,
        normalizedEmbedUrl: clean,
        sourceType: 'google_drive',
        mediaCategory: '2d',
        previewTitle: 'Google Drive Embed Preview',
        isValid: true
      };
    }
  }

  // Generic or other standard iframe URLs
  const isValidUrl = clean.startsWith('http://') || clean.startsWith('https://');
  return {
    originalUrl: rawInput,
    normalizedEmbedUrl: clean,
    sourceType: 'generic',
    mediaCategory: 'unknown',
    previewTitle: isValidUrl ? 'Eksternal Embed Iframe' : 'Format URL Tidak Dikenali',
    isValid: isValidUrl
  };
}
