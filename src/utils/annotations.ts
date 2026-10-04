import type { OrganMediaItem, Pin } from '../types';

export type AnnotationPosition = Pick<Pin, 'x' | 'y' | 'z' | 'coordinateSpace' | 'normal' | 'mediaId'>;

export function annotationShortcut(event: Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey' | 'shiftKey' | 'repeat'>, typing: boolean) {
  if (typing || event.repeat) return null;
  if (event.key === 'Delete' || event.key === 'Backspace') return 'delete';
  if ((event.ctrlKey || event.metaKey) && !event.shiftKey && event.key.toLowerCase() === 'z') return 'undo';
  if (event.key === 'F2' || event.key === 'Enter') return 'edit';
  return null;
}

export function pinMediaId(pin: Pin, media: OrganMediaItem[]): string | undefined {
  if (pin.mediaId) return pin.mediaId;
  const type = pin.is3d || pin.z !== undefined ? '3d_model' : '2d_image';
  return (media.find(item => item.type === type && item.isDefault) || media.find(item => item.type === type))?.id;
}

export function pinsForMedia(pins: Pin[], media: OrganMediaItem[], active?: OrganMediaItem): Pin[] {
  if (!active || active.type === '3d_embed') return [];
  return pins.filter(pin => pinMediaId(pin, media) === active.id && Boolean(pin.is3d || pin.z !== undefined) === (active.type === '3d_model'));
}

export function imagePoint(clientX: number, clientY: number, rect: Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>) {
  if (rect.width <= 0 || rect.height <= 0) return null;
  const x = (clientX - rect.left) / rect.width * 100;
  const y = (clientY - rect.top) / rect.height * 100;
  return x >= 0 && x <= 100 && y >= 0 && y <= 100 ? { x: Number(x.toFixed(4)), y: Number(y.toFixed(4)) } : null;
}
