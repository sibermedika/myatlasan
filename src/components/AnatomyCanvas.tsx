import React, { useState, useRef, useEffect, useCallback, useMemo, Suspense } from 'react';
import { 
  ChevronRight, 
  MapPin, 
  Box, 
  Image as ImageIcon,
  Lock,
  Loader2,
  RotateCw,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Layers,
  Sparkles,
  Info,
  Hand,
  Move
} from 'lucide-react';
import { Organ, Pin, UserRole, OrganMediaItem } from '../types';
import { canManageContent } from '../permissions';
import { AnatomyDatabaseService } from '../services/db';
import { imagePoint, pinMediaId, pinsForMedia, annotationShortcut, type AnnotationPosition } from '../utils/annotations';
const ThreeDCanvas = React.lazy(() => import('./ThreeDCanvas'));
import { ThreeDErrorBoundary } from './ThreeDErrorBoundary';
import EmbedCanvas from './EmbedCanvas';

interface AnatomyCanvasProps {
  selectedOrgan: Organ | null;
  selectedPin: Pin | null;
  onSelectPin: (pin: Pin | null) => void;
  currentRole: UserRole;
  onCanvas2DClick: (x: number, y: number, mediaId?: string) => void;
  onPinPlaced3D: (coords: { x: number; y: number; z: number; mediaId?: string; coordinateSpace?: 'model'; normal?: Pin['normal'] }) => void;
  onActiveMediaChange?: (media: OrganMediaItem) => void;
  repositionPin?: Pin | null;
  onCancelReposition?: () => void;
  onMovePin?: (pin: Pin, position: AnnotationPosition) => Promise<void>;
  onDeletePin?: (id: string) => Promise<void>;
  onEditPin?: (pin: Pin) => void;
  onUndoDelete?: () => Promise<void>;
  canUndoDelete?: boolean;
  onUnlockRequest: () => void;
  theme: 'dark' | 'light';
}

function ThreeDLoadingFallback({ theme }: { theme: 'dark' | 'light' }) {
  const isDark = theme === 'dark';
  return (
    <div className={`w-full h-full flex flex-col items-center justify-center p-6 ${
      isDark ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-800'
    }`}>
      <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-2xl backdrop-blur-md">
        <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
        <div className="text-center">
          <p className="text-xs font-bold text-slate-100">Menyiapkan Engine 3D Anatomi...</p>
          <p className="text-[10px] text-slate-400 font-mono mt-0.5">Menginisialisasi WebGL, DRACO & Shaders</p>
        </div>
      </div>
    </div>
  );
}

export default function AnatomyCanvas({
  selectedOrgan,
  selectedPin,
  onSelectPin,
  currentRole,
  onCanvas2DClick,
  onPinPlaced3D,
  onUnlockRequest,
  theme, onActiveMediaChange, repositionPin, onCancelReposition, onMovePin, onDeletePin, onEditPin, onUndoDelete, canUndoDelete
}: AnatomyCanvasProps) {
  const [imageLoad, setImageLoad] = useState<{ key: string; status: 'ready' | 'error'; width: number; height: number } | null>(null);
  const [imageAttempt, setImageAttempt] = useState(0);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [addPinToggle, setAddPinToggle] = useState(false);
  const [showLabels, setShowLabels] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [interactionError, setInteractionError] = useState('');
  const [movingPin2D, setMovingPin2D] = useState<Pin | null>(null);
  const dragPin2DRef = useRef<{ pin: Pin; pointer: number; target: HTMLButtonElement; startX: number; startY: number; moved: boolean; position: AnnotationPosition | null } | null>(null);
  const suppressPinClick = useRef(false);

  // 2D Touchscreen Pan & Pinch-to-Zoom States
  const [zoom2D, setZoom2D] = useState(1);
  const [pan2D, setPan2D] = useState({ x: 0, y: 0 });
  const [isDragging2D, setIsDragging2D] = useState(false);

  const container2DRef = useRef<HTMLDivElement>(null);
  const imageElementRef = useRef<HTMLImageElement>(null);
  const touchStateRef = useRef<{
    isPinching: boolean;
    isPanning: boolean;
    startDist: number;
    startZoom: number;
    startPan: { x: number; y: number };
    lastTouchPos: { x: number; y: number };
    startMidpoint: { x: number; y: number };
    lastTapTime: number;
    hasMoved: boolean;
  }>({
    isPinching: false,
    isPanning: false,
    startDist: 0,
    startZoom: 1,
    startPan: { x: 0, y: 0 },
    lastTouchPos: { x: 0, y: 0 },
    startMidpoint: { x: 0, y: 0 },
    lastTapTime: 0,
    hasMoved: false
  });

  const mouseDragRef = useRef<{ isDown: boolean; startX: number; startY: number; panStart: { x: number; y: number }; hasMoved: boolean }>({
    isDown: false,
    startX: 0,
    startY: 0,
    panStart: { x: 0, y: 0 },
    hasMoved: false
  });

  const isDark = theme === 'dark';
  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      const dialogs = document.querySelectorAll('[role="dialog"], [role="alertdialog"]');
      if (dialogs.length && !dialogs[dialogs.length - 1].contains(canvasRef.current)) return;
      const drag = dragPin2DRef.current; dragPin2DRef.current = null; setMovingPin2D(null);
      if (drag) { suppressPinClick.current = drag.moved; if (drag.target.hasPointerCapture(drag.pointer)) drag.target.releasePointerCapture(drag.pointer); }
      setAddPinToggle(false); onCancelReposition?.(); onSelectPin(null);
    };
    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, [onCancelReposition, onSelectPin]);

  // Compute all available media items for this organ
  const mediaItems: OrganMediaItem[] = selectedOrgan 
    ? AnatomyDatabaseService.resolveOrganMediaItems(selectedOrgan)
    : [];

  // Reset active index & zoom when organ changes
  useEffect(() => {
    if (selectedOrgan) {
      const items = AnatomyDatabaseService.resolveOrganMediaItems(selectedOrgan);
      const defaultIdx = items.findIndex(item => item.isDefault);
      setActiveMediaIndex(defaultIdx >= 0 ? defaultIdx : 0);
      setAddPinToggle(false);
      setZoom2D(1);
      setPan2D({ x: 0, y: 0 });
    }
  }, [selectedOrgan?.id]);

  // Reset zoom & pan when switching media tab
  useEffect(() => {
    setZoom2D(1);
    setPan2D({ x: 0, y: 0 });
  }, [activeMediaIndex]);

  const currentMedia: OrganMediaItem | undefined = mediaItems[activeMediaIndex] || mediaItems[0];
  const visiblePins = pinsForMedia(selectedOrgan?.pins || [], mediaItems, currentMedia);
  const placingPin = addPinToggle || Boolean(repositionPin && pinMediaId(repositionPin, mediaItems) === currentMedia?.id);
  const editableSelection = canManageContent(currentRole) && selectedPin && pinMediaId(selectedPin, mediaItems) === currentMedia?.id ? selectedPin : null;
  const selectPin = (pin: Pin | null) => { setAddPinToggle(false); onCancelReposition?.(); setInteractionError(''); onSelectPin(pin); };
  const movePin = async (pin: Pin, position: AnnotationPosition) => {
    setInteractionError('');
    try { await onMovePin?.(pin, { ...position, mediaId: currentMedia?.id }); }
    catch (error) { setInteractionError((error as Error).message); }
  };
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      const scope = canvasRef.current;
      if (!canManageContent(currentRole) || !scope?.getClientRects().length || event.defaultPrevented) return;
      const dialogs = document.querySelectorAll('[role="dialog"], [role="alertdialog"]');
      if (dialogs.length && !dialogs[dialogs.length - 1].contains(scope)) return;
      const typing = event.target instanceof HTMLElement && (event.target.isContentEditable || Boolean(event.target.closest('input:not([type="checkbox"]):not([type="radio"]):not([type="range"]), textarea, select, [role="textbox"]')));
      const action = annotationShortcut(event, typing);
      if (!action || (action === 'undo' ? !canUndoDelete : !editableSelection)) return;
      if (action === 'edit' && (!onEditPin || (event.key === 'Enter' && !(event.target instanceof HTMLElement && event.target.closest('[data-annotation-pin]'))))) return;
      event.preventDefault();
      if (action === 'edit') onEditPin?.(editableSelection!);
      else { setInteractionError(''); void (action === 'undo' ? onUndoDelete?.() : onDeletePin?.(editableSelection!.id))?.catch(error => setInteractionError(error.message)); }
    };
    window.addEventListener('keydown', shortcut);
    return () => window.removeEventListener('keydown', shortcut);
  }, [currentRole, editableSelection, onEditPin, onDeletePin, onUndoDelete, canUndoDelete]);
  useEffect(() => { setMovingPin2D(null); dragPin2DRef.current = null; setInteractionError(''); }, [selectedOrgan?.id, currentMedia?.id, currentRole]);
  const modelOrgan = useMemo(() => selectedOrgan ? {
    ...selectedOrgan,
    mediaFileId: currentMedia?.mediaFileId,
    mediaItems: currentMedia ? [currentMedia] : [],
    model3dData: currentMedia ? currentMedia.url || undefined : selectedOrgan.model3dData,
    model3dFormat: currentMedia ? currentMedia.format as Organ['model3dFormat'] : selectedOrgan.model3dFormat,
    model3dType: currentMedia ? currentMedia.model3dType : selectedOrgan.model3dType
  } : null, [selectedOrgan?.id, currentMedia?.id, currentMedia?.url, currentMedia?.format, currentMedia?.mediaFileId, currentMedia?.model3dType, selectedOrgan?.model3dData, selectedOrgan?.model3dFormat, selectedOrgan?.model3dType]);
  useEffect(() => { if (currentMedia) onActiveMediaChange?.(currentMedia); }, [currentMedia?.id, selectedOrgan?.id, onActiveMediaChange]);
  useEffect(() => {
    if (!selectedPin) return;
    const index = mediaItems.findIndex(item => item.id === pinMediaId(selectedPin, mediaItems));
    if (index >= 0) setActiveMediaIndex(index);
  }, [selectedPin?.id, selectedPin?.mediaId]);
  const imageSource = currentMedia?.url || selectedOrgan?.imageUrl || '';
  const imageKey = JSON.stringify([imageSource, imageAttempt]);
  const imageStatus = imageLoad?.key === imageKey ? imageLoad.status : 'loading';
  const setImageStatus = useCallback((status: 'ready' | 'error') => {
    const image = imageElementRef.current;
    setImageLoad({ key: imageKey, status, width: image?.naturalWidth || 0, height: image?.naturalHeight || 0 });
  }, [imageKey]);

  useEffect(() => {
    const image = imageElementRef.current;
    if (!image) return;
    // Cached images may complete before the effect, or stay mounted across topics.
    if (image.complete) {
      setImageStatus(image.naturalWidth > 0 ? 'ready' : 'error');
      return;
    }
    const timeout = window.setTimeout(() => {
      setImageStatus(image.complete && image.naturalWidth > 0 ? 'ready' : 'error');
    }, 15000);
    return () => window.clearTimeout(timeout);
  }, [imageKey, setImageStatus, selectedOrgan?.id, currentMedia?.type, currentRole]);

  const [imageViewport, setImageViewport] = useState({ width: 300, height: 300 });
  const imageAspectRatio = imageLoad?.key === imageKey && imageLoad.width > 0 && imageLoad.height > 0
    ? imageLoad.width / imageLoad.height : 1;
  // Explicit dimensions also support SVGs that only declare a viewBox or percentage sizes.
  const imageWidth = Math.min(672, imageViewport.width, imageViewport.height * imageAspectRatio);
  useEffect(() => {
    const container = container2DRef.current;
    if (!container) return;
    const fit = () => setImageViewport({
      width: Math.max(1, container.clientWidth - 50),
      height: Math.max(1, Math.min(container.clientHeight - 80, window.innerHeight * 0.65))
    });
    const observer = new ResizeObserver(fit);
    observer.observe(container); fit();
    return () => observer.disconnect();
  }, [selectedOrgan?.id, currentMedia?.type, currentRole]);

  // Helper for 2D Zoom adjustment
  const handleZoom2D = (direction: 'in' | 'out') => {
    setZoom2D(prev => {
      const next = direction === 'in' ? prev * 1.25 : prev * 0.8;
      return Math.min(Math.max(parseFloat(next.toFixed(2)), 0.6), 5.0);
    });
  };

  const handleResetZoom2D = () => {
    setZoom2D(1);
    setPan2D({ x: 0, y: 0 });
  };

  // 2D Touchscreen Multitouch Gestures (Pinch to Zoom, 1/2 Finger Pan & Double-tap)
  const handleTouchStart2D = (e: React.TouchEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    const touches = e.touches;
    const now = Date.now();

    if (touches.length === 1) {
      // 1 Finger: Pan or Tap
      const touch = touches[0];
      const timeSinceLastTap = now - touchStateRef.current.lastTapTime;

      // Double tap to quick zoom in/out
      if (timeSinceLastTap < 300 && !placingPin) {
        if (zoom2D > 1.2) {
          handleResetZoom2D();
        } else {
          setZoom2D(2.2);
        }
        touchStateRef.current.lastTapTime = 0;
        return;
      }

      touchStateRef.current.lastTapTime = now;
      touchStateRef.current.isPanning = true;
      touchStateRef.current.isPinching = false;
      touchStateRef.current.hasMoved = false;
      touchStateRef.current.lastTouchPos = { x: touch.clientX, y: touch.clientY };
      touchStateRef.current.startPan = { ...pan2D };

    } else if (touches.length >= 2) {
      // 2 Fingers: Multitouch Pinch-to-Zoom & Dual Finger Pan
      const t0 = touches[0];
      const t1 = touches[1];
      const dist = Math.hypot(t0.clientX - t1.clientX, t0.clientY - t1.clientY);
      const midX = (t0.clientX + t1.clientX) / 2;
      const midY = (t0.clientY + t1.clientY) / 2;

      touchStateRef.current.isPinching = true;
      touchStateRef.current.isPanning = false;
      touchStateRef.current.hasMoved = true;
      touchStateRef.current.startDist = dist;
      touchStateRef.current.startZoom = zoom2D;
      touchStateRef.current.startPan = { ...pan2D };
      touchStateRef.current.startMidpoint = { x: midX, y: midY };
    }
  };

  const handleTouchMove2D = (e: React.TouchEvent<HTMLDivElement>) => {
    const touches = e.touches;

    if (touchStateRef.current.isPinching && touches.length >= 2) {
      // Handle pinch zoom & two-finger pan
      const t0 = touches[0];
      const t1 = touches[1];
      const dist = Math.hypot(t0.clientX - t1.clientX, t0.clientY - t1.clientY);
      const midX = (t0.clientX + t1.clientX) / 2;
      const midY = (t0.clientY + t1.clientY) / 2;

      if (touchStateRef.current.startDist > 0) {
        const factor = dist / touchStateRef.current.startDist;
        const newZoom = Math.min(Math.max(touchStateRef.current.startZoom * factor, 0.6), 5.0);
        setZoom2D(parseFloat(newZoom.toFixed(2)));

        // Dual-finger pan displacement
        const dx = midX - touchStateRef.current.startMidpoint.x;
        const dy = midY - touchStateRef.current.startMidpoint.y;
        setPan2D({
          x: touchStateRef.current.startPan.x + dx,
          y: touchStateRef.current.startPan.y + dy
        });
      }
    } else if (touchStateRef.current.isPanning && touches.length === 1) {
      // 1 Finger Pan
      const touch = touches[0];
      const dx = touch.clientX - touchStateRef.current.lastTouchPos.x;
      const dy = touch.clientY - touchStateRef.current.lastTouchPos.y;

      if (Math.hypot(dx, dy) > 5) {
        touchStateRef.current.hasMoved = true;
      }

      // If not placing pin or already zoomed in, allow panning
      if (!placingPin || zoom2D > 1.05) {
        setPan2D(prev => ({
          x: prev.x + dx,
          y: prev.y + dy
        }));
      }

      touchStateRef.current.lastTouchPos = { x: touch.clientX, y: touch.clientY };
    }
  };

  const handleTouchEnd2D = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 0) {
      touchStateRef.current.isPinching = false;
      touchStateRef.current.isPanning = false;
    }
  };

  // Mouse wheel zoom
  const handleWheel2D = (e: React.WheelEvent<HTMLDivElement>) => {
    const delta = e.deltaY < 0 ? 1.15 : 0.87;
    const next = Math.min(Math.max(parseFloat((zoom2D * delta).toFixed(2)), 0.6), 5.0);
    const rect = imageElementRef.current?.getBoundingClientRect();
    if (rect) {
      const factor = next / zoom2D;
      setPan2D(previous => ({ x: previous.x + (e.clientX - rect.x - rect.width / 2) * (1 - factor), y: previous.y + (e.clientY - rect.y - rect.height / 2) * (1 - factor) }));
    }
    setZoom2D(next);
  };

  // Mouse drag panning for desktop
  const handleMouseDown2D = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;

    // If middle click or if not adding pin, start drag
    if (e.button === 0 || e.button === 1) {
      mouseDragRef.current = {
        isDown: true,
        startX: e.clientX,
        startY: e.clientY,
        panStart: { ...pan2D },
        hasMoved: false
      };
      setIsDragging2D(true);
    }
  };

  const handleMouseMove2D = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mouseDragRef.current.isDown) return;

    const dx = e.clientX - mouseDragRef.current.startX;
    const dy = e.clientY - mouseDragRef.current.startY;

    if (Math.hypot(dx, dy) > 5) {
      mouseDragRef.current.hasMoved = true;
    }

    if (!placingPin || zoom2D > 1.05) {
      setPan2D({
        x: mouseDragRef.current.panStart.x + dx,
        y: mouseDragRef.current.panStart.y + dy
      });
    }
  };

  const handleMouseUp2D = () => {
    mouseDragRef.current.isDown = false;
    setIsDragging2D(false);
  };

  const startPinDrag2D = (event: React.PointerEvent<HTMLButtonElement>, pin: Pin) => {
    if (!canManageContent(currentRole) || !onMovePin || !event.isPrimary || event.button !== 0) return;
    event.preventDefault(); event.stopPropagation(); selectPin(pin); event.currentTarget.focus({preventScroll:true});
    event.currentTarget.setPointerCapture(event.pointerId);
    suppressPinClick.current = false;
    dragPin2DRef.current = { pin, pointer: event.pointerId, target: event.currentTarget, startX: event.clientX, startY: event.clientY, moved: false, position: null };
  };
  const movePinDrag2D = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragPin2DRef.current;
    if (!drag || drag.pointer !== event.pointerId || !imageElementRef.current) return;
    event.preventDefault(); event.stopPropagation();
    if (Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > 4) drag.moved = true;
    if (!drag.moved) return;
    drag.position = imagePoint(event.clientX, event.clientY, imageElementRef.current.getBoundingClientRect());
    if (drag.position) setMovingPin2D({ ...drag.pin, ...drag.position });
  };
  const endPinDrag2D = (event: React.PointerEvent<HTMLButtonElement>, cancel = false) => {
    const drag = dragPin2DRef.current;
    if (!drag || drag.pointer !== event.pointerId) return;
    event.stopPropagation(); dragPin2DRef.current = null;
    if (drag.target.hasPointerCapture(drag.pointer)) drag.target.releasePointerCapture(drag.pointer);
    suppressPinClick.current = drag.moved;
    const position = !cancel && drag.moved && imageElementRef.current ? imagePoint(event.clientX, event.clientY, imageElementRef.current.getBoundingClientRect()) : null;
    if (position) void movePin(drag.pin, position).finally(() => setMovingPin2D(null));
    else setMovingPin2D(null);
  };

  // Handle tap / click on 2D image diagram for Pin Placement
  const handleContainer2DClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canManageContent(currentRole) || (!placingPin && !editableSelection) || imageStatus !== 'ready') return;
    
    // Prevent trigger if existing pin button is clicked or if it was a drag gesture
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;
    if (mouseDragRef.current.hasMoved || touchStateRef.current.hasMoved) return;

    if (!imageElementRef.current) return;
    const rect = imageElementRef.current.getBoundingClientRect();
    
    // Calculate relative percentage relative to actual image boundaries
    const point = imagePoint(e.clientX, e.clientY, rect);
    if (point) {
      if (!placingPin && editableSelection && onMovePin) { void movePin(editableSelection, point); return; }
      onCanvas2DClick(point.x, point.y, currentMedia?.id);
      setAddPinToggle(false);
    }
  };

  // If no organ selected
  if (!selectedOrgan) {
    return (
      <div className={`flex h-full flex-col items-center justify-center p-8 text-center ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
      }`} id="empty-canvas">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-500/15 text-teal-400 border border-teal-500/30 shadow-md">
          <Box className="h-8 w-8 animate-pulse" />
        </div>
        <h3 className="mt-6 text-lg font-bold">
          Pilih Organ Anatomi
        </h3>
        <p className="mt-2 max-w-sm text-xs leading-relaxed text-slate-400">
          Pilih salah satu sistem tubuh dan struktur organ di panel taksonomi sebelah kiri untuk memuat visualisasi interaktif multi-objek (2D, 3D Berkas & 3D Embed) di sini.
        </p>
      </div>
    );
  }

  // Check if organ is locked for Guest
  const isLocked = currentRole === 'GUEST' && !selectedOrgan.isFree;

  if (isLocked) {
    return (
      <div className={`flex h-full flex-col items-center justify-center px-6 py-12 text-center relative overflow-hidden ${
        isDark ? 'bg-slate-900 text-slate-200' : 'bg-slate-100 text-slate-800'
      }`} id="locked-canvas">
        <div className="relative z-10 max-w-md">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 mb-4 shadow-lg">
            <Lock className="h-8 w-8" />
          </div>
          
          <h3 className="text-base font-bold mb-1 text-white dark:text-white light:text-slate-900">
            Akses Terkunci (Guest Mode)
          </h3>
          
          <p className="mt-3 text-xs leading-relaxed text-slate-400">
            Organ <strong className="text-teal-400 font-bold">"{selectedOrgan.name}"</strong> ({selectedOrgan.latinName}) adalah bagian kurikulum terakreditasi PAAI. Silakan login akun Mahasiswa, Dosen, atau Superadmin untuk membuka seluruh modul 2D/3D.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row justify-center">
            <button type="button"
              onClick={onUnlockRequest}
              className="rounded-xl bg-teal-500 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-teal-500/20 hover:bg-teal-400 transition-all cursor-pointer"
              id="unlock-canvas-btn"
            >
              Buka Kunci Akses Sekarang
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isDosenOrAdmin = canManageContent(currentRole);
  const currentType = currentMedia?.type || '2d_image';

  return (
    <div ref={canvasRef} className={`flex h-full flex-col relative select-none ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-100/60 text-slate-900'
    }`} id="visualizer-canvas-container">
      
      {/* Canvas Top Header Toolbar */}
      <div className={`px-4 py-2.5 flex flex-wrap gap-2 justify-between items-center z-10 shrink-0 border-b backdrop-blur-md ${
        isDark ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-slate-200 shadow-sm'
      }`}>
        
        {/* Left: Organ title & Regio breadcrumbs */}
        <div className="flex items-center space-x-2 min-w-0">
          <span className={`text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full font-medium truncate max-w-[140px] sm:max-w-none border ${
            isDark ? 'bg-slate-800 text-teal-300 border-slate-700' : 'bg-teal-50 text-teal-700 border-teal-200'
          }`}>
            {selectedOrgan.subSystem}
          </span>

          <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />

          <h2 className="font-bold text-lg sm:text-xl whitespace-normal">
            {selectedOrgan.name}
          </h2>

          <span className="text-[10px] sm:text-xs text-teal-400 italic font-mono hidden md:inline-block">
            ({selectedOrgan.latinName})
          </span>
        </div>

        {/* Right: Multi-Media Switcher & Pin Controls */}
        <div className="flex w-full min-w-0 max-w-full items-center gap-2 flex-wrap">
          
          {/* Multi-Object / Multi-Media Switcher Tabs */}
          <div className={`flex w-full sm:w-auto min-w-0 items-center gap-1 rounded-xl p-1 border overflow-x-auto max-w-full ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-200/80 border-slate-300'
          }`}>
            {mediaItems.map((item, idx) => {
              const isActive = idx === activeMediaIndex;
              const IconComponent = item.type === '3d_model' ? Box : item.type === '3d_embed' ? Layers : ImageIcon;
              
              return (
                <button type="button"
                  key={item.id || idx}
                  onClick={() => {
                    onCancelReposition?.();
                    if (selectedPin) onSelectPin(null);
                    setActiveMediaIndex(idx);
                    setAddPinToggle(false);
                  }}
                  className={`px-2.5 py-1 text-[10px] sm:text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    isActive 
                      ? 'bg-teal-500 text-slate-950 shadow-md ring-1 ring-teal-300' 
                      : isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-900' : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                  }`}
                  title={`${item.title} (${item.type})`}
                  id={`btn-media-tab-${idx}`}
                >
                  <IconComponent className="w-3.5 h-3.5" />
                  <span>
                    {item.type === '2d_image' ? '2D' : item.type === '3d_model' ? '3D File' : '3D Embed'}
                    {mediaItems.filter(m => m.type === item.type).length > 1 ? ` #${idx + 1}` : ''}
                  </span>
                  {item.format && (
                    <span className={`text-[8px] px-1 py-0.2 rounded font-mono uppercase ${
                      isActive ? 'bg-slate-950/20 text-slate-900' : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-300 text-slate-700'
                    }`}>
                      {item.format}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Dosen & Superadmin Pin Tool Switch */}
          {currentType === '2d_image' && visiblePins.length > 0 && <label className="flex min-h-11 sm:min-h-0 items-center gap-2 text-xs"><input type="checkbox" checked={showLabels} onChange={event => setShowLabels(event.target.checked)} />Nama notasi</label>}
          {isDosenOrAdmin && (currentType === '2d_image' || currentType === '3d_model') && (
            <div className={`flex items-center rounded-xl px-2.5 py-1 border transition-all ${
              addPinToggle 
                ? 'bg-amber-500/20 border-amber-500 text-amber-300' 
                : isDark ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600'
            }`}>
              <label className="text-[10px] sm:text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={addPinToggle}
                  onChange={(e) => { onCancelReposition?.(); setAddPinToggle(e.target.checked); }}
                  className="accent-amber-500 rounded" 
                />
                <MapPin className={`w-3.5 h-3.5 ${addPinToggle ? 'text-amber-400 animate-bounce' : 'text-slate-400'}`} />
                <span>{currentType === '3d_model' ? 'Tambah notasi 3D' : 'Tambah notasi 2D'}</span>
              </label>
            </div>
          )}

        </div>
        {canManageContent(currentRole) && <div className="w-full flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <span className="flex-1 min-w-[200px]">Klik penanda, lalu seret atau klik tujuan. Delete: hapus • Ctrl+Z: urungkan.</span>
          <div className="flex gap-2">
            <button type="button" disabled={!editableSelection} onClick={() => editableSelection && onEditPin?.(editableSelection)} className="rounded-lg border border-teal-500/50 px-3 py-2 text-teal-500 disabled:opacity-40">Edit notasi</button>
            <button type="button" disabled={!editableSelection} onClick={() => { if (editableSelection) void onDeletePin?.(editableSelection.id)?.catch(error => setInteractionError(error.message)); }} className="rounded-lg border border-rose-500/40 px-3 py-2 text-rose-500 disabled:opacity-40">Hapus</button>
            <button type="button" disabled={!canUndoDelete} onClick={() => { void onUndoDelete?.()?.catch(error => setInteractionError(error.message)); }} title="Urungkan hapus (Ctrl+Z)" className="rounded-lg border border-slate-500/40 px-3 py-2 disabled:opacity-40">Urungkan hapus</button>
          </div>
        </div>}
        {interactionError && <p role="alert" className="w-full text-sm text-rose-500">{interactionError}</p>}
      </div>

      {/* Center Stage: Render based on active media item type */}
      <div 
        id="visualizerStage" 
        className="flex-1 relative flex items-center justify-center overflow-hidden touch-none"
        style={{ touchAction: 'none' }}
      >
        {placingPin && isDosenOrAdmin && <div role="status" className="absolute top-3 left-3 right-16 z-30 rounded-xl bg-amber-100 border border-amber-400 p-3 text-sm text-amber-950 shadow-lg">
          {repositionPin ? `Pilih posisi baru untuk “${repositionPin.title}”.` : currentType === '3d_model' ? 'Klik permukaan model untuk memberi nama dan deskripsi.' : 'Klik bagian gambar untuk memberi nama dan deskripsi.'}
          <button type="button" className="ml-3 underline font-semibold" onClick={() => { setAddPinToggle(false); onCancelReposition?.(); }}>Batal</button>
        </div>}
        {!currentMedia ? <div className="flex flex-1 items-center justify-center p-8 text-center text-slate-400"><div><p className="font-semibold">Belum ada media</p><p className="mt-2 text-sm">Unggah gambar 2D atau model 3D melalui editor materi untuk mengisi topik ini.</p></div></div> : currentType === '3d_model' ? (
          /* 1. 3D WebGL Model Visualizer with Multitouch OrbitControls */
          <div className="w-full h-full relative touch-none" style={{ touchAction: 'none' }}>
            <ThreeDErrorBoundary
              key={currentMedia?.id}
              organName={`${selectedOrgan.name} (${selectedOrgan.latinName})`}
              onFallbackTo2D={() => {
                const imgIdx = mediaItems.findIndex(m => m.type === '2d_image');
                if (imgIdx >= 0) setActiveMediaIndex(imgIdx);
              }}
              theme={theme}
            >
              <Suspense fallback={<ThreeDLoadingFallback theme={theme} />}>
                <ThreeDCanvas
                  key={currentMedia?.id}
                  organ={modelOrgan!}
                  pins={visiblePins}
                  selectedPin={selectedPin}
                  onSelectPin={selectPin}
                  onMovePin={onMovePin ? movePin : undefined}
                  onEditPin={onEditPin}
                  currentRole={currentRole}
                  isPinModeActive={placingPin && isDosenOrAdmin}
                  onPinPlaced={(coords) => {
                    onPinPlaced3D({ ...coords, mediaId: currentMedia?.id });
                    setAddPinToggle(false);
                  }}
                  theme={theme}
                  onSwitchTo2D={() => {
                    const imgIdx = mediaItems.findIndex(m => m.type === '2d_image');
                    if (imgIdx >= 0) setActiveMediaIndex(imgIdx);
                  }}
                />
              </Suspense>
            </ThreeDErrorBoundary>
          </div>
        ) : currentType === '3d_embed' ? (
          <EmbedCanvas
            key={selectedOrgan.id + ':' + currentMedia?.id + ':' + (currentMedia?.url || selectedOrgan.embed3dUrl)}
            source={currentMedia?.url || selectedOrgan.embed3dUrl || ''}
            title={currentMedia?.title || selectedOrgan.name}
          />
        ) : (
          /* 3. 2D Image Diagram with Multitouch Pinch-to-Zoom, Pan & 44x44px Touch Pins */
          <div 
            ref={container2DRef}
            onTouchStart={handleTouchStart2D}
            onTouchMove={handleTouchMove2D}
            onTouchEnd={handleTouchEnd2D}
            onWheel={handleWheel2D}
            onMouseDown={handleMouseDown2D}
            onMouseMove={handleMouseMove2D}
            onMouseUp={handleMouseUp2D}
            onMouseLeave={handleMouseUp2D}
            onClick={handleContainer2DClick}
            style={{ touchAction: 'none' }}
            className={`flex-1 w-full h-full relative flex items-center justify-center p-4 overflow-hidden touch-none select-none ${
              isDark ? 'bg-[radial-gradient(#1e293b_1px,transparent_1px)]' : 'bg-[radial-gradient(#cbd5e1_1px,transparent_1px)]'
            } [background-size:20px_20px] ${
              isDosenOrAdmin && (placingPin || editableSelection) ? 'cursor-crosshair' : isDragging2D ? 'cursor-grabbing' : 'cursor-grab'
            }`}
          >
            {/* Pannable & Zoomable Image Container with Locked Pin Coordinate Alignment */}
            <div 
              style={{
                transform: `translate3d(${pan2D.x}px, ${pan2D.y}px, 0px) scale(${zoom2D})`,
                transformOrigin: 'center center',
                transition: touchStateRef.current.isPinching || isDragging2D ? 'none' : 'transform 0.15s ease-out'
              }}
              className={`relative max-w-full max-h-[75vh] flex items-center justify-center pointer-events-auto ${imageStatus !== 'ready' ? 'invisible' : ''}`}
            >
              <div className={`relative min-w-0 max-w-full rounded-2xl shadow-2xl border p-2 overflow-hidden flex items-center justify-center ${
                isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <div className="relative" style={{ width: imageWidth, height: imageWidth / imageAspectRatio }}>
                <img 
                  key={imageKey}
                  onLoad={() => setImageStatus('ready')}
                  onError={() => setImageStatus('error')}
                  ref={imageElementRef}
                  src={imageSource}
                  alt={currentMedia?.title || selectedOrgan.name} 
                  referrerPolicy="no-referrer"
                  draggable={false}
                  style={{ width: imageWidth, height: imageWidth / imageAspectRatio }}
                  className={`${imageStatus === "error" ? "hidden" : ""} shrink-0 bg-white object-contain rounded-xl pointer-events-none select-none`}
                />
                
                {/* Overlay Hotspot Pins with 44x44px Touch Target Area */}
                <div className={`absolute inset-0 pointer-events-auto ${imageStatus !== "ready" ? "hidden" : ""}`}>
                  {imageStatus === 'ready' && visiblePins.map((pin, idx) => {
                    const isSelected = selectedPin && selectedPin.id === pin.id;
                    const position = movingPin2D?.id === pin.id ? movingPin2D : pin;
                    const leftPos = position.x;
                    const topPos = position.y;
                    
                    return (
                      <button type="button"
                        key={pin.id}
                        data-annotation-pin={pin.id}
                        onPointerDown={event => startPinDrag2D(event, pin)}
                        onPointerMove={movePinDrag2D}
                        onPointerUp={event => endPinDrag2D(event)}
                        onPointerCancel={event => endPinDrag2D(event, true)}
                        onLostPointerCapture={event => endPinDrag2D(event, true)}
                        onDoubleClick={event => { event.stopPropagation(); if (canManageContent(currentRole)) onEditPin?.(pin); }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (suppressPinClick.current) { suppressPinClick.current = false; return; }
                          selectPin(pin);
                        }}
                        style={{ left: `${leftPos}%`, top: `${topPos}%`, transform: `translate(-50%, -50%) scale(${(isSelected ? 1.15 : 1) / zoom2D})` }}
                        className={`anatomy-pin-btn absolute -translate-x-1/2 -translate-y-1/2 group z-20 ${canManageContent(currentRole) ? 'cursor-move touch-none' : 'cursor-pointer'} min-w-[44px] min-h-[44px] flex items-center justify-center p-0 ${
                          isSelected ? 'z-30' : ''
                        }`}
                        title={`${idx + 1}. ${pin.title}`}
                        aria-label={`${idx + 1}. ${pin.title}`}
                      >
                        {/* Pin Visual Anchor & Pulse Animation */}
                        <span className="relative flex h-8 w-8 items-center justify-center pointer-events-none">
                          <span className={`${isSelected ? 'animate-ping-slow' : 'hidden'} absolute inline-flex h-full w-full rounded-full opacity-75 ${
                            isSelected ? 'bg-amber-400' : 'bg-teal-400'
                          }`}></span>
                          
                          <span className={`relative inline-flex rounded-full h-7 w-7 text-xs items-center justify-center shadow-xl font-bold transition-colors ${
                            isSelected 
                              ? 'bg-amber-500 text-slate-950 font-black ring-2 ring-amber-300 ring-offset-2 ring-offset-slate-900' 
                              : 'bg-slate-950 text-teal-300 border-2 border-teal-400 hover:bg-teal-950'
                          }`}>
                            {idx + 1}
                          </span>
                        </span>

                        {/* Hover / Tap Tooltip Name */}
                        <span style={{ left: pin.x > 65 ? undefined : '50%', right: pin.x > 65 ? 0 : undefined }} className={`absolute ${pin.y > 80 ? 'bottom-9' : 'top-9'} w-max max-w-[160px] whitespace-normal text-xs font-semibold px-2 py-1 rounded-lg border ${showLabels || isSelected ? '' : 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100'} transition-opacity pointer-events-none z-40 shadow-xl ${
                          isDark ? 'bg-slate-900 text-slate-100 border-slate-700' : 'bg-slate-900 text-white border-slate-800'
                        }`}>
                          {pin.title}
                        </span>
                      </button>
                    );
                  })}
                </div>
                </div>
              </div>
            </div>

            {imageStatus !== 'ready' && (
              <div role="status" className="absolute inset-0 flex items-center justify-center p-6" onMouseDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()} onClick={e => e.stopPropagation()}>
                <div className={`w-full max-w-sm rounded-2xl border p-6 text-center shadow-xl ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                  {imageStatus === 'loading' && <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin text-teal-500" />}
                  <p className="text-base font-semibold">{imageStatus === 'error' ? 'Gambar belum dapat dimuat' : 'Memuat gambar…'}</p>
                  {imageStatus === 'error' && <>
                    <p className="text-sm mt-2 text-slate-400">Periksa koneksi atau sumber media. Deskripsi materi tetap bisa dibaca.</p>
                    <button type="button" className="mt-4 bg-teal-500 text-slate-950 rounded-lg px-4 py-2" onClick={() => setImageAttempt(n => n + 1)}>Coba lagi</button>
                  </>}
                </div>
              </div>
            )}

            {/* Floating 2D Zoom & Touch Controls Toolbar */}
            <div className={`absolute top-4 right-4 flex flex-col gap-1.5 backdrop-blur-md p-1.5 rounded-xl border shadow-xl z-20 ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-200'
            }`}>
              {/* Reset View */}
              <button type="button"
                onClick={handleResetZoom2D}
                className="p-2 rounded-lg text-slate-400 hover:text-teal-400 hover:bg-slate-800 transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
                title="Reset Zoom & Posisi Diagram"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              {/* Zoom In */}
              <button type="button"
                onClick={() => handleZoom2D('in')}
                className="p-2 rounded-lg text-slate-400 hover:text-teal-400 hover:bg-slate-800 transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
                title="Zoom In 2D (+)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              {/* Zoom Out */}
              <button type="button"
                onClick={() => handleZoom2D('out')}
                className="p-2 rounded-lg text-slate-400 hover:text-teal-400 hover:bg-slate-800 transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
                title="Zoom Out 2D (-)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              {/* Current Zoom Indicator */}
              <div className="px-1.5 py-0.5 text-center text-[9px] font-mono font-bold text-teal-400">
                {Math.round(zoom2D * 100)}%
              </div>
            </div>

            {/* 2D Touch Navigation Hint */}
            <div className={`absolute bottom-3 right-4 border px-3 py-1.5 rounded-xl text-[10px] pointer-events-none z-10 backdrop-blur-md flex items-center gap-2 ${
              isDark ? 'bg-slate-900/85 border-slate-800 text-slate-300' : 'bg-white/85 border-slate-200 text-slate-700'
            }`}>
              <Hand className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <span className="hidden sm:inline">1 Jari: Geser / Ketuk Pin • 2 Jari: Pinch Zoom • Double Tap: Zoom Cepat</span>
              <span className="sm:hidden">1 Jari: Geser • 2 Jari: Pinch Zoom</span>
            </div>

          </div>
        )}
      </div>

      {/* Floating Bottom Status & Media Object Counter */}
      <div className={`absolute bottom-3 left-4 px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-3 shadow-lg z-10 border backdrop-blur-md ${
        isDark ? 'bg-slate-900/90 border-slate-800 text-slate-300' : 'bg-white/90 border-slate-200 text-slate-700'
      }`}>
        <span className="flex items-center gap-1.5 font-medium">
          <span className="w-2.5 h-2.5 rounded-full bg-teal-400 inline-block animate-pulse"></span> 
          Notasi: <strong className="text-teal-400">{visiblePins.length}</strong>
        </span>
        <span className="text-slate-600">|</span>
        <span className="text-[11px] text-teal-400 font-mono font-semibold flex items-center gap-1">
          {currentMedia?.title || (currentType === '3d_model' ? 'Model 3D WebGL' : currentType === '3d_embed' ? '3D Embed' : 'Diagram 2D')}
        </span>
        <span className="text-slate-600 hidden sm:inline">|</span>
        <span className="text-[10px] text-slate-400 hidden sm:inline">
          {mediaItems.length} Objek Media Terlampir
        </span>
      </div>

    </div>
  );
}
