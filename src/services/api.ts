export async function api<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch('/api' + url, { ...options, signal: options.signal || AbortSignal.timeout(30000), credentials: 'same-origin', headers: { 'Content-Type': 'application/json', 'X-Atlas-Request':'1', ...options.headers } });
  const data = await response.json().catch(() => {throw new Error('Respons server tidak valid. Periksa koneksi backend.');});
  if (!response.ok) throw new Error(data.message || 'Permintaan gagal.');
  return data as T;
}
export async function blobBase64(blob: Blob): Promise<string> {
  return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=()=>reject(new Error('Berkas gagal dibaca.'));reader.readAsDataURL(blob);});
}
export const decodeBlob = (base64: string, type?: string) => new Blob([Uint8Array.from(atob(base64),char=>char.charCodeAt(0))],{type});
