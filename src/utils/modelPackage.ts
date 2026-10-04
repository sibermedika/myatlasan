import type { StoredBundleFile } from '../types';

export interface PackageFile { name: string; path: string; blob: Blob }
export function prepareModelPackage(files: PackageFile[]) {
  const usable = files.filter(file => !file.path.startsWith('__MACOSX/') && !file.name.startsWith('.'));
  if (usable.length > 200 || usable.reduce((sum, file) => sum + file.blob.size, 0) > 60 * 1024 * 1024) throw new Error('Paket maksimal 60 MB dan 200 berkas.');
  const models = usable.filter(file => /\.(glb|gltf|obj|stl|fbx|3ds)$/i.test(file.name));
  if (models.length !== 1) throw new Error('Pilih satu berkas model utama beserta berkas pendukungnya.');
  const main = models[0];
  const directory = main.path.replace(/\\/g, '/').split('/').slice(0, -1).join('/');
  const bundleFiles: StoredBundleFile[] = usable.filter(file => file !== main).map(file => {
    const path = file.path.replace(/\\/g, '/');
    return { name: file.name, path: directory && path.startsWith(directory + '/') ? path.slice(directory.length + 1) : path, blob: file.blob, mimeType: file.blob.type, sizeBytes: file.blob.size };
  });
  return { main, format: main.name.split('.').pop()!.toLowerCase(), bundleFiles };
}
