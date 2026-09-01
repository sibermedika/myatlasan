import React, { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { 
  ChevronRight, 
  MapPin, 
  Box, 
  Image as ImageIcon,
  Lock,
  Loader2,
  ExternalLink,
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
import { AnatomyDatabaseService } from '../services/db';
import ThreeDCanvas from './ThreeDCanvas';
import { ThreeDErrorBoundary } from './ThreeDErrorBoundary';

interface AnatomyCanvasProps {
  selectedOrgan: Organ | null;
  selectedPin: Pin | null;
  onSelectPin: (pin: Pin) => void;
  currentRole: UserRole;
  onCanvas2DClick: (x: number, y: number) => void;
  onPinPlaced3D: (coords: { x: number; y: number; z: number }) => void;
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
  theme
}: AnatomyCanvasProps) {
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [addPinToggle, setAddPinToggle] = useState(false);
  const [embedIframeKey, setEmbedIframeKey] = useState(0);
  const [isEmbedLoading, setIsEmbedLoading] = useState(true);

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
      setIsEmbedLoading(true);
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
    const touches = e.touches;
    const now = Date.now();

    if (touches.length === 1) {
      // 1 Finger: Pan or Tap
      const touch = touches[0];
      const timeSinceLastTap = now - touchStateRef.current.lastTapTime;

      // Double tap to quick zoom in/out
      if (timeSinceLastTap < 300 && !addPinToggle) {
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
      if (!addPinToggle || zoom2D > 1.05) {
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
    e.preventDefault();
    const delta = e.deltaY < 0 ? 1.15 : 0.87;
    setZoom2D(prev => Math.min(Math.max(parseFloat((prev * delta).toFixed(2)), 0.6), 5.0));
  };

  // Mouse drag panning for desktop
  const handleMouseDown2D = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('.anatomy-pin-btn')) return;

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

    if (!addPinToggle || zoom2D > 1.05) {
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

  // Handle tap / click on 2D image diagram for Pin Placement
  const handleContainer2DClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((currentRole !== 'DOSEN' && currentRole !== 'SUPERADMIN') || !addPinToggle) return;
    
    // Prevent trigger if existing pin button is clicked or if it was a drag gesture
    const target = e.target as HTMLElement;
    if (target.closest('.anatomy-pin-btn')) return;
    if (mouseDragRef.current.hasMoved || touchStateRef.current.hasMoved) return;

    if (!imageElementRef.current) return;
    const rect = imageElementRef.current.getBoundingClientRect();
    
    // Calculate relative percentage relative to actual image boundaries
    const relX = ((e.clientX - rect.left) / rect.width) * 100;
    const relY = ((e.clientY - rect.top) / rect.height) * 100;

    if (relX >= 0 && relX <= 100 && relY >= 0 && relY <= 100) {
      onCanvas2DClick(parseFloat(relX.toFixed(2)), parseFloat(relY.toFixed(2)));
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
            <button
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

  const isDosenOrAdmin = currentRole === 'DOSEN' || currentRole === 'SUPERADMIN';
  const currentType = currentMedia?.type || '2d_image';

  return (
    <div className={`flex h-full flex-col relative select-none ${
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

          <h2 className="font-bold text-xs sm:text-sm truncate">
            {selectedOrgan.name}
          </h2>

          <span className="text-[10px] sm:text-xs text-teal-400 italic font-mono hidden md:inline-block">
            ({selectedOrgan.latinName})
          </span>
        </div>

        {/* Right: Multi-Media Switcher & Pin Controls */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          
          {/* Multi-Object / Multi-Media Switcher Tabs */}
          <div className={`flex items-center gap-1 rounded-xl p-1 border overflow-x-auto max-w-full ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-200/80 border-slate-300'
          }`}>
            {mediaItems.map((item, idx) => {
              const isActive = idx === activeMediaIndex;
              const IconComponent = item.type === '3d_model' ? Box : item.type === '3d_embed' ? Layers : ImageIcon;
              
              return (
                <button
                  key={item.id || idx}
                  onClick={() => {
                    setActiveMediaIndex(idx);
                    setAddPinToggle(false);
                    setIsEmbedLoading(true);
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
                  onChange={(e) => setAddPinToggle(e.target.checked)}
                  className="accent-amber-500 rounded" 
                />
                <MapPin className={`w-3.5 h-3.5 ${addPinToggle ? 'text-amber-400 animate-bounce' : 'text-slate-400'}`} />
                <span>{currentType === '3d_model' ? 'Mode Pin 3D' : 'Mode Pin 2D'}</span>
              </label>
            </div>
          )}

        </div>
      </div>

      {/* Center Stage: Render based on active media item type */}
      <div 
        id="visualizerStage" 
        className="flex-1 relative flex items-center justify-center overflow-hidden touch-none"
        style={{ touchAction: 'none' }}
      >
        {currentType === '3d_model' ? (
          /* 1. 3D WebGL Model Visualizer with Multitouch OrbitControls */
          <div className="w-full h-full relative touch-none" style={{ touchAction: 'none' }}>
            <ThreeDErrorBoundary
              organName={`${selectedOrgan.name} (${selectedOrgan.latinName})`}
              onFallbackTo2D={() => {
                const imgIdx = mediaItems.findIndex(m => m.type === '2d_image');
                if (imgIdx >= 0) setActiveMediaIndex(imgIdx);
              }}
              theme={theme}
            >
              <Suspense fallback={<ThreeDLoadingFallback theme={theme} />}>
                <ThreeDCanvas
                  organ={{
                    ...selectedOrgan,
                    model3dData: currentMedia?.url || selectedOrgan.model3dData,
                    model3dFormat: (currentMedia?.format as any) || selectedOrgan.model3dFormat,
                    model3dType: currentMedia?.model3dType || selectedOrgan.model3dType
                  }}
                  pins={selectedOrgan.pins || []}
                  selectedPin={selectedPin}
                  onSelectPin={onSelectPin}
                  currentRole={currentRole}
                  isPinModeActive={addPinToggle && isDosenOrAdmin}
                  onPinPlaced={(coords) => {
                    onPinPlaced3D(coords);
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
          /* 2. 3D Embed Interactive Iframe (Sketchfab / BioDigital / Medical 3D Viewer) */
          <div className="w-full h-full relative flex flex-col items-center justify-center bg-slate-950">
            {isEmbedLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-slate-950/80 backdrop-blur-sm pointer-events-none">
                <Loader2 className="w-8 h-8 text-teal-400 animate-spin mb-2" />
                <p className="text-xs font-bold text-slate-200">Memuat Visualizer 3D Embed...</p>
                <p className="text-[10px] text-slate-400 font-mono">Menghubungkan ke server visualisasi interaktif</p>
              </div>
            )}

            <iframe
              key={embedIframeKey}
              src={currentMedia?.url || selectedOrgan.embed3dUrl}
              title={currentMedia?.title || selectedOrgan.name}
              onLoad={() => setIsEmbedLoading(false)}
              allow="autoplay; fullscreen; xr-spatial-tracking; execution-while-out-of-viewport; execution-while-not-rendered"
              className="w-full h-full border-0 relative z-0"
            />

            {/* Floating Top Controls for Embed */}
            <div className="absolute top-4 right-4 flex items-center gap-1.5 z-20 bg-slate-900/90 border border-slate-800 backdrop-blur-md p-1.5 rounded-xl shadow-xl">
              <button
                onClick={() => {
                  setIsEmbedLoading(true);
                  setEmbedIframeKey(k => k + 1);
                }}
                className="p-1.5 rounded-lg text-slate-300 hover:text-teal-400 hover:bg-slate-800 transition-colors cursor-pointer text-xs flex items-center gap-1 min-w-[36px] min-h-[36px] justify-center"
                title="Muat Ulang Iframe"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
              
              <a
                href={currentMedia?.url || selectedOrgan.embed3dUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg text-slate-300 hover:text-teal-400 hover:bg-slate-800 transition-colors cursor-pointer text-xs flex items-center gap-1 min-w-[36px] min-h-[36px] justify-center"
                title="Buka Viewer di Tab Baru"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
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
            onClick={handleContainer2DClick}
            style={{ touchAction: 'none' }}
            className={`flex-1 w-full h-full relative flex items-center justify-center p-4 overflow-hidden touch-none select-none ${
              isDark ? 'bg-[radial-gradient(#1e293b_1px,transparent_1px)]' : 'bg-[radial-gradient(#cbd5e1_1px,transparent_1px)]'
            } [background-size:20px_20px] ${
              isDosenOrAdmin && addPinToggle ? 'cursor-crosshair' : isDragging2D ? 'cursor-grabbing' : 'cursor-grab'
            }`}
          >
            {/* Pannable & Zoomable Image Container with Locked Pin Coordinate Alignment */}
            <div 
              style={{
                transform: `translate3d(${pan2D.x}px, ${pan2D.y}px, 0px) scale(${zoom2D})`,
                transformOrigin: 'center center',
                transition: touchStateRef.current.isPinching || isDragging2D ? 'none' : 'transform 0.15s ease-out'
              }}
              className="relative max-w-2xl max-h-[75vh] flex items-center justify-center pointer-events-auto"
            >
              <div className={`relative rounded-2xl shadow-2xl border p-2 overflow-hidden flex items-center justify-center ${
                isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <img 
                  ref={imageElementRef}
                  src={currentMedia?.url || selectedOrgan.imageUrl} 
                  alt={currentMedia?.title || selectedOrgan.name} 
                  referrerPolicy="no-referrer"
                  draggable={false}
                  className="max-w-full max-h-[65vh] object-contain rounded-xl pointer-events-none select-none"
                />
                
                {/* Overlay Hotspot Pins with 44x44px Touch Target Area */}
                <div className="absolute inset-0 pointer-events-auto">
                  {selectedOrgan.pins?.map((pin, idx) => {
                    const isSelected = selectedPin && selectedPin.id === pin.id;
                    const leftPos = pin.x !== undefined ? (pin.is3d ? 50 + pin.x * 15 : pin.x) : 50;
                    const topPos = pin.y !== undefined ? (pin.is3d ? 50 - pin.y * 15 : pin.y) : 50;
                    
                    return (
                      <button
                        key={pin.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectPin(pin);
                        }}
                        style={{ left: `${leftPos}%`, top: `${topPos}%` }}
                        className={`anatomy-pin-btn absolute -translate-x-1/2 -translate-y-1/2 group z-20 cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center p-0 transition-transform active:scale-90 ${
                          isSelected ? 'scale-125 z-30' : 'hover:scale-110'
                        }`}
                        title={`${idx + 1}. ${pin.title}`}
                      >
                        {/* Pin Visual Anchor & Pulse Animation */}
                        <span className="relative flex h-8 w-8 items-center justify-center pointer-events-none">
                          <span className={`animate-ping-slow absolute inline-flex h-full w-full rounded-full opacity-75 ${
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
                        <span className={`absolute top-9 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold px-2 py-0.5 rounded-lg border opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-40 shadow-xl ${
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

            {/* Floating 2D Zoom & Touch Controls Toolbar */}
            <div className={`absolute top-4 right-4 flex flex-col gap-1.5 backdrop-blur-md p-1.5 rounded-xl border shadow-xl z-20 ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white/90 border-slate-200'
            }`}>
              {/* Reset View */}
              <button
                onClick={handleResetZoom2D}
                className="p-2 rounded-lg text-slate-400 hover:text-teal-400 hover:bg-slate-800 transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
                title="Reset Zoom & Posisi Diagram"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              {/* Zoom In */}
              <button
                onClick={() => handleZoom2D('in')}
                className="p-2 rounded-lg text-slate-400 hover:text-teal-400 hover:bg-slate-800 transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
                title="Zoom In 2D (+)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              {/* Zoom Out */}
              <button
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
          Pin: <strong className="text-teal-400">{selectedOrgan.pins?.length || 0}</strong>
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
