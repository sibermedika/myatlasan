import React, { useState, useEffect, useRef } from 'react';
import { 
  Lock, 
  Unlock, 
  Users, 
  BookOpen, 
  ShieldAlert, 
  Sparkles, 
  X, 
  Activity,
  Compass,
  AlertCircle,
  Crown,
  Building2
} from 'lucide-react';
import { Organ, Pin, UserRole, UserProfile, OrganMediaItem } from './types';
import { pinMediaId } from './utils/annotations';
import { INITIAL_ORGANS } from './data';
import { AnatomyDatabaseService } from './services/db';
import { isAdmin, canManageContent, canEditOrgan } from './permissions';
import { api } from './services/api';
import LecturerWorkspace from './components/LecturerWorkspace';
import BrandingSettings from './components/BrandingSettings';
import Navbar from './components/AppHeader';
import Catalog from './components/Catalog';
import AnatomyCanvas from './components/AnatomyCanvas';
import InfoPanel from './components/InfoPanel';
import AddOrganModal from './components/AddOrganModal';
import AddPinModal from './components/AddPinModal';
import LoginModal from './components/AccountDialog';
import SecretAdminModal from './components/SecretAdminModal';
import SuperadminDashboard from './components/SuperadminDashboard';
import InstitutionClusterView from './components/InstitutionClusterView';
import AboutModal from './components/AboutModal';
import WindowsInstallModal from './components/WindowsInstallModal';

const ADMIN_PATHS: Record<string,string> = {USERS:'pengguna',ORGANS:'materi',SUBCATEGORIES:'kurikulum',CLUSTERS:'institusi',DATA_TOOLS:'cadangan',SETTINGS:'pengaturan'};

export default function App() {
  // 1. Theme state ('dark' | 'light')
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const savedTheme = localStorage.getItem('anatoverse_theme');
    return (savedTheme === 'light' || savedTheme === 'dark') ? savedTheme : 'dark';
  });

  // Apply theme class to document
  useEffect(() => {
    localStorage.setItem('anatoverse_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // 2. Role & User Authentication State
  const [role, setRole] = useState<UserRole>('GUEST');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [organs, setOrgans] = useState<Organ[]>([]);
  const [branding, setBranding] = useState({name:'AnatoVerse', description:'Atlas anatomi interaktif', logoUrl:''});
  const [ready, setReady] = useState(false);
  const [path, setPath] = useState(location.pathname);
  const navigate = (url: string) => { history.pushState(null,'',url); setPath(url); };
  useEffect(() => { const pop=()=>setPath(location.pathname); window.addEventListener('popstate',pop); return ()=>window.removeEventListener('popstate',pop); },[]);
  useEffect(() => { document.title=branding.name; document.querySelector('meta[name=description]')?.setAttribute('content',branding.description); },[branding]);
  const refresh = async () => {
    const session = await api<{user: UserProfile | null}>('/auth/me');
    const collection = await AnatomyDatabaseService.initDB();
    setCurrentUser(session.user); setRole(session.user?.role || 'GUEST'); setOrgans(collection);
    setBranding(await api('/settings/branding')); setReady(true);
  };
  useEffect(() => { refresh().catch(e=>setNotice('Server belum tersambung: '+e.message)); },[]);
  const handleLoginSuccess = async (user: UserProfile) => {
    await refresh(); setShowLoginModal(false); setShowSecretAdminModal(false);
    navigate(canManageContent(user.role) ? (isAdmin(user.role) ? '/admin/materi' : '/kelola') : '/');
  };
  const handleLogout = async () => {
    try { await api('/auth/logout',{method:'POST'}); await refresh(); setSelectedOrgan(null); setEditingViewer(false); navigate('/'); }
    catch(e) { setNotice((e as Error).message); }
  };

  // 4. Selection states
  const [selectedOrgan, setSelectedOrgan] = useState<Organ | null>(null);
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null);
  const [activeMedia, setActiveMedia] = useState<OrganMediaItem | null>(null);
  const [repositionPin, setRepositionPin] = useState<Pin | null>(null);
  const pinsSaving = useRef(false);
  const [deletedPins, setDeletedPins] = useState<{ organId: string; pin: Pin; index: number }[]>([]);
  const selectionRef = useRef({organ:selectedOrgan,pin:selectedPin});
  selectionRef.current = {organ:selectedOrgan,pin:selectedPin};

  // Default to the first available organ on initial load
  useEffect(() => {
    if (path === '/' && organs.length > 0 && !selectedOrgan) {
      setSelectedOrgan(organs[0]);
    }
  }, [organs, selectedOrgan, path]);

  // 5. Search State
  const [searchQuery, setSearchQuery] = useState('');

  // 6. Modal States
  const [editingViewer, setEditingViewer] = useState(false);
  const [workspace, setWorkspace] = useState(false);
  const [notice, setNotice] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSecretAdminModal, setShowSecretAdminModal] = useState(false);
  const [showSuperadminDashboard, setShowSuperadminDashboard] = useState(false);
  const [showClusterModal, setShowClusterModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showWindowsModal, setShowWindowsModal] = useState(false);
  const [showAddOrganModal, setShowAddOrganModal] = useState(false);
  const [editingOrgan, setEditingOrgan] = useState<Organ | null>(null);

  useEffect(() => {
    if (!ready) return;
    const managing=path.startsWith('/admin') || path.startsWith('/kelola');
    setWorkspace(managing && canManageContent(role));
    setShowSuperadminDashboard(managing && isAdmin(role));
    const editorMatch=path.match(/^\/(?:admin|kelola)\/materi\/(new|[^/]+)\/edit$/);
    if(editorMatch && canManageContent(role)) {
      const organ=editorMatch[1]==='new' ? null : organs.find(o=>o.id===editorMatch[1]);
      if(editorMatch[1]==='new' || (organ && canEditOrgan(currentUser,organ))) {setEditingOrgan(organ || null);setShowAddOrganModal(true);}
    } else setShowAddOrganModal(false);
    const id=path.startsWith('/atlas/') ? decodeURIComponent(path.slice(7)) : '';
    if(id) { const found=organs.find(o=>o.id===id); setSelectedOrgan(found || null); if(!found) setNotice('Materi tidak tersedia atau Anda belum memiliki akses.'); }
  },[path,role,ready,organs]);

  // Pin Placing States
  const [pendingPin2D, setPendingPin2D] = useState<{ x: number; y: number; mediaId?: string } | null>(null);
  const [pendingPin3D, setPendingPin3D] = useState<{ x: number; y: number; z: number; mediaId?: string; coordinateSpace?: 'model'; normal?: Pin['normal'] } | null>(null);
  const [editingPin, setEditingPin] = useState<Pin | null>(null);
  useEffect(() => { setSelectedPin(null); setRepositionPin(null); setPendingPin2D(null); setPendingPin3D(null); setEditingPin(null); }, [selectedOrgan?.id]);

  // Locked Content Modal
  const [showLockedModal, setShowLockedModal] = useState(false);
  const [lockedOrganAttempt, setLockedOrganAttempt] = useState<Organ | null>(null);
  const [showSidebarMobile, setShowSidebarMobile] = useState(false);

  // 7. Filtering logic for Tree View
  const filteredOrgans = organs.filter((organ) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      organ.name.toLowerCase().includes(query) ||
      organ.latinName.toLowerCase().includes(query) ||
      organ.system.toLowerCase().includes(query) ||
      organ.subSystem.toLowerCase().includes(query) ||
      (organ.institution && organ.institution.toLowerCase().includes(query)) ||
      (organ.dosenCode && organ.dosenCode.toLowerCase().includes(query))
    );
  });

  // Handle organ click in Navigation Tree
  const handleSelectOrgan = (organ: Organ) => {
    if (role === 'GUEST' && !organ.isFree) {
      setLockedOrganAttempt(organ);
      setShowLockedModal(true);
    } else {
      setSelectedOrgan(organ); navigate(`/atlas/${encodeURIComponent(organ.id)}`);
      setSelectedPin(null);
      setRepositionPin(null);
    }
  };

  // Add or Edit Organ Save Handler (Dosen & Superadmin)
  const handleSaveOrgan = async (organData: Organ) => {
    if (!canManageContent(role) || (organData.ownerId && !canEditOrgan(currentUser,organData))) throw new Error('Anda tidak dapat mengedit materi ini.');
    const saved=await AnatomyDatabaseService.saveOrgan(organData);
    setOrgans(prev=>prev.some(o=>o.id===saved.id) ? prev.map(o=>o.id===saved.id?saved:o) : [...prev,saved]);
    setSelectedOrgan(saved); setSelectedPin(null); setShowAddOrganModal(false); setEditingOrgan(null); navigate(isAdmin(role)?'/admin/materi':'/kelola');
    setNotice('Materi berhasil disimpan di server.');
  };
  const handleDeleteOrgan = async (organId: string) => {
    const organ=organs.find(o=>o.id===organId);
    if(!organ || !canEditOrgan(currentUser,organ) || !confirm('Hapus materi ini?')) return;
    try { await AnatomyDatabaseService.deleteOrgan(organId,organ.version!); setOrgans(prev=>prev.filter(o=>o.id!==organId)); if(selectedOrgan?.id===organId) setSelectedOrgan(null); setNotice('Materi dihapus.'); }
    catch(e) { setNotice((e as Error).message); }
  };

  // Import Master Data (Superadmin)
  const handleImportMasterData = async (imported: Organ[]) => {
    if (!isAdmin(role)) return;
    try { await AnatomyDatabaseService.bulkSaveOrgans(imported); await refresh(); setNotice('Impor berhasil.'); }
    catch(e) { setNotice((e as Error).message); }
  };

  // Reset Master Data (Superadmin & Navbar)
  const handleResetMasterData = async () => {
    if (!isAdmin(role) || !confirm('Kembalikan seluruh koleksi di server ke data bawaan? Ekspor backup terlebih dahulu.')) return;
    try {
      const resetOrgans = await AnatomyDatabaseService.resetToDefault();
      setOrgans(resetOrgans);
      setSelectedOrgan(resetOrgans[0]);
      setSelectedPin(null);
      setSearchQuery('');
      setShowSuperadminDashboard(false);
    } catch (e) {
      console.error('Failed to reset organs in database', e);
      setNotice((e as Error).message);
    }
  };

  // Pin Placement Handler (2D & 3D)
  const persistPins = async (pins: Pin[]) => {
    if(!selectedOrgan || !canEditOrgan(currentUser,selectedOrgan)) throw new Error('Anda tidak dapat mengedit notasi materi ini.');
    if(pinsSaving.current) throw new Error('Notasi sedang disimpan. Tunggu hingga selesai.');
    pinsSaving.current = true;
    try {
      const saved=await AnatomyDatabaseService.saveOrgan({...selectedOrgan,pins});
      setOrgans(prev=>prev.map(o=>o.id===saved.id?saved:o)); setSelectedOrgan(previous => previous?.id === saved.id ? saved : previous); return saved;
    } finally { pinsSaving.current = false; }
  };
  const handleSavePin = async (data: {title:string;description:string;x:number;y:number;z?:number;is3d?:boolean}) => {
    if(!selectedOrgan) return;
    const source = editingPin || pendingPin3D || pendingPin2D;
    const pin: Pin={...editingPin,...data,id:editingPin?.id || 'pin-'+crypto.randomUUID(),mediaId:source?.mediaId || (editingPin ? pinMediaId(editingPin, AnatomyDatabaseService.resolveOrganMediaItems(selectedOrgan)) : activeMedia?.id),coordinateSpace:data.is3d ? (editingPin?.coordinateSpace || pendingPin3D?.coordinateSpace) : undefined,normal:data.is3d ? (editingPin?.normal || pendingPin3D?.normal) : undefined};
    const pins=editingPin ? (selectedOrgan.pins||[]).map(p=>p.id===pin.id?pin:p) : [...(selectedOrgan.pins||[]),pin];
    const saved = await persistPins(pins); setSelectedPin(saved.pins.find(p => p.id === pin.id) || pin); setEditingPin(null); setPendingPin2D(null); setPendingPin3D(null);
  };
  const placeAnnotation = async (position: { x:number; y:number; z?:number; mediaId?:string; coordinateSpace?:'model'; normal?:Pin['normal'] }, is3d:boolean) => {
    if(!selectedOrgan || !canEditOrgan(currentUser,selectedOrgan)) return;
    if(repositionPin) {
      const changed = { ...repositionPin, ...position, is3d };
      try { await persistPins(selectedOrgan.pins.map(pin => pin.id === changed.id ? changed : pin)); setSelectedPin(changed); setRepositionPin(null); }
      catch(error) { setNotice((error as Error).message); }
    } else if(is3d) setPendingPin3D(position as typeof pendingPin3D);
    else setPendingPin2D(position);
  };
  const handleDeletePin = async (id:string) => {
    if(!selectedOrgan) return;
    const index = selectedOrgan.pins.findIndex(pin => pin.id === id); if(index < 0) return;
    const removed = {organId:selectedOrgan.id,pin:selectedOrgan.pins[index],index};
    try { await persistPins(selectedOrgan.pins.filter(pin => pin.id !== id)); }
    catch(error) { setNotice((error as Error).message); throw error; }
    setDeletedPins(previous => [...previous.slice(-19),removed]);
    if (selectionRef.current.organ?.id === removed.organId && selectionRef.current.pin?.id === id) { setSelectedPin(null); setEditingPin(null); setRepositionPin(null); }
  };
  const handleMovePin = async (pin: Pin, position: Pick<Pin,'x'|'y'|'z'|'normal'|'coordinateSpace'|'mediaId'>) => {
    if (!selectedOrgan || !selectedOrgan.pins.some(item => item.id === pin.id)) return;
    const saved = await persistPins(selectedOrgan.pins.map(item => item.id === pin.id ? {...item,...position} : item));
    if (selectionRef.current.organ?.id === saved.id && selectionRef.current.pin?.id === pin.id) { setSelectedPin(saved.pins.find(item => item.id === pin.id) || null); setRepositionPin(null); }
  };
  const undoablePin = [...deletedPins].reverse().find(item => item.organId === selectedOrgan?.id && selectedOrgan && AnatomyDatabaseService.resolveOrganMediaItems(selectedOrgan).some(media => media.id === pinMediaId(item.pin,AnatomyDatabaseService.resolveOrganMediaItems(selectedOrgan))));
  const handleUndoDelete = async () => {
    if (!selectedOrgan || !undoablePin) return;
    const pins = [...selectedOrgan.pins]; pins.splice(Math.min(undoablePin.index,pins.length),0,undoablePin.pin);
    const saved = await persistPins(pins);
    setDeletedPins(previous => previous.filter(item => item !== undoablePin));
    if (selectionRef.current.organ?.id === saved.id) setSelectedPin(saved.pins.find(pin => pin.id === undoablePin.pin.id) || null);
  };

  const isDark = theme === 'dark';

  return (
    <div className={`flex h-screen flex-col font-sans antialiased overflow-hidden ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`} id="app-root-container">
      
      {/* 1. Header Navigation Bar */}
      <Navbar
        canEditSelected={!!selectedOrgan && canEditOrgan(currentUser,selectedOrgan)}
        branding={branding}
        currentRole={role}
        currentUser={currentUser}
        onOpenLoginModal={() => setShowLoginModal(true)}
        onOpenSuperadminModal={() => navigate(isAdmin(role) ? '/admin/materi' : '/kelola')}
        onOpenSecretAdmin={() => { navigate('/'); setEditingViewer(false); }}
        onOpenClusterModal={() => setShowClusterModal(true)}
        onOpenAboutModal={() => setShowAboutModal(true)}
        onOpenWindowsModal={() => setShowWindowsModal(true)}
        onAddOrgan={() => {
          navigate(isAdmin(role)?'/admin/materi/new/edit':'/kelola/materi/new/edit');
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onResetData={handleResetMasterData}
        workspace={workspace} editing={editingViewer} onToggleEditing={() => { setEditingViewer(v => !v); setRepositionPin(null); }}
        onShowAtlas={() => { navigate('/'); setEditingViewer(false); }}
        onToggleSidebar={() => setShowSidebarMobile(prev => !prev)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {!ready && <div role="alert" className="p-4">Menghubungkan server… <button onClick={()=>refresh().catch(e=>setNotice(e.message))}>Coba lagi</button></div>}
      {/* 2. Primary 3-Column Dashboard Area */}
      <div className={`${workspace ? "hidden" : "flex"} flex-1 overflow-hidden`}>
        
        {/* Column A: Left Sidebar Tree Navigation (25%) */}
        <aside className="hidden md:block w-64 lg:w-72 shrink-0 h-full">
          <Catalog organs={filteredOrgans} selectedOrgan={selectedOrgan} onSelectOrgan={handleSelectOrgan} currentRole={role === 'GUEST' ? 'GUEST' : 'MAHASISWA'} theme={theme} query={searchQuery} onQuery={setSearchQuery} />
        </aside>

        {/* Column B: Center Visualizer Stage (50%) */}
        <main className={`flex-1 flex flex-col h-full overflow-hidden border-r ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}>
          <AnatomyCanvas
            selectedOrgan={selectedOrgan}
            selectedPin={selectedPin}
            onSelectPin={setSelectedPin}
            onActiveMediaChange={setActiveMedia}
            onMovePin={handleMovePin}
            onDeletePin={handleDeletePin}
            onEditPin={setEditingPin}
            onUndoDelete={handleUndoDelete}
            canUndoDelete={Boolean(undoablePin)}
            repositionPin={repositionPin}
            onCancelReposition={() => setRepositionPin(null)}
            currentRole={editingViewer && selectedOrgan && canEditOrgan(currentUser,selectedOrgan) ? role : (role === 'GUEST' ? 'GUEST' : 'MAHASISWA')}
            onCanvas2DClick={(x, y, mediaId) => { void placeAnnotation({x,y,mediaId},false); }}
            onPinPlaced3D={coords => { void placeAnnotation(coords,true); }}
            onUnlockRequest={() => {
              setLockedOrganAttempt(selectedOrgan);
              setShowLockedModal(true);
            }}
            theme={theme}
          />
        </main>

        {/* Column C: Right Sidebar Information Panel (25%) */}
        <aside className="hidden w-72 shrink-0 lg:block xl:w-80 h-full">
          <InfoPanel appName={branding.name} appDescription={branding.description}             selectedOrgan={selectedOrgan}
            selectedPin={selectedPin}
            currentRole={editingViewer && selectedOrgan && canEditOrgan(currentUser,selectedOrgan) ? role : (role === 'GUEST' ? 'GUEST' : 'MAHASISWA')}
            activeMediaId={activeMedia?.id}
            onSelectPin={setSelectedPin}
            onRepositionPin={pin => { setSelectedPin(pin); setRepositionPin(pin); }}
            onEditPin={(pin) => setEditingPin(pin)}
            onDeletePin={handleDeletePin}
            onEditOrgan={(organ) => {
              navigate((isAdmin(role)?'/admin/materi/':'/kelola/materi/')+organ.id+'/edit');
            }}
            onDeleteOrgan={handleDeleteOrgan}
            theme={theme}
          />
        </aside>

      </div>

      {/* Mobile Drawer/Overlay for Information Panel on smaller devices */}
      <div className={`${workspace ? "hidden" : "block lg:hidden"} border-t ${
        isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-white'
      }`}>
        <div className="max-h-60 overflow-y-auto">
          <InfoPanel appName={branding.name} appDescription={branding.description}             selectedOrgan={selectedOrgan}
            selectedPin={selectedPin}
            currentRole={editingViewer && selectedOrgan && canEditOrgan(currentUser,selectedOrgan) ? role : (role === 'GUEST' ? 'GUEST' : 'MAHASISWA')}
            activeMediaId={activeMedia?.id}
            onSelectPin={setSelectedPin}
            onRepositionPin={pin => { setSelectedPin(pin); setRepositionPin(pin); }}
            onEditPin={(pin) => setEditingPin(pin)}
            onDeletePin={handleDeletePin}
            onEditOrgan={(organ) => {
              setEditingOrgan(organ);
              setShowAddOrganModal(true);
            }}
            onDeleteOrgan={handleDeleteOrgan}
            theme={theme}
          />
        </div>
      </div>

      {workspace && role === 'DOSEN' && <LecturerWorkspace user={currentUser} organs={organs} onAdd={()=>navigate('/kelola/materi/new/edit')} onEdit={organ=>navigate('/kelola/materi/'+organ.id+'/edit')} onView={handleSelectOrgan} onDelete={handleDeleteOrgan}/>}
      {notice && <div role="status" className="fixed bottom-4 left-4 z-[100] bg-slate-800 text-white rounded-xl p-4"><span>{notice}</span><button className="ml-4" onClick={() => setNotice('')}>Tutup</button></div>}
      {/* MODAL: Windows Localhost 3030 Installation Guide */}
      {showWindowsModal && (
        <WindowsInstallModal
          onClose={() => setShowWindowsModal(false)}
          theme={theme}
        />
      )}

      {/* MODAL 1: Role-Based Authentication Modal */}
      {showLoginModal && (
        <LoginModal
          currentRole={role}
          currentUser={currentUser}
          onClose={() => setShowLoginModal(false)}
          onLoginSuccess={handleLoginSuccess}
          onLogout={handleLogout}
          theme={theme}
        />
      )}

      {/* SECRET MODAL: Secret Superadmin Login */}
      {showSecretAdminModal && (
        <SecretAdminModal
          onClose={() => setShowSecretAdminModal(false)}
          onLoginSuccess={handleLoginSuccess}
          theme={theme}
        />
      )}

      {/* MODAL 2: Superadmin Master Data & Cluster Console */}
      {workspace && showSuperadminDashboard && isAdmin(role) && (
        <SuperadminDashboard
          routeTab={path.split('/')[2]} onNavigateTab={tab=>navigate('/admin/'+(ADMIN_PATHS[tab] || 'materi'))}
          settings={<BrandingSettings branding={branding} onSaved={setBranding} theme={theme}/>}
          organs={organs}
          onClose={() => { navigate('/'); setEditingViewer(false); }}
          onAddOrgan={() => {
            navigate('/admin/materi/new/edit');
          }}
          onEditOrgan={(organ) => {
            navigate('/admin/materi/'+organ.id+'/edit');
          }}
          onDeleteOrgan={handleDeleteOrgan}
          onInstitutionsChanged={refresh}
          onCopyOrgan={async (organ, institution) => {
            try {
              const saved = await api<Organ>('/organs/'+encodeURIComponent(organ.id)+'/copy', {method:'POST',body:JSON.stringify({institution:institution || currentUser?.institution})});
              setOrgans(previous => [...previous,saved]); navigate('/admin/materi/'+saved.id+'/edit');
              setNotice('Salinan draf dibuat. Sesuaikan media dan notasi untuk instansi Anda.');
            } catch(error) { setNotice((error as Error).message); }
          }}
          onResetMasterData={handleResetMasterData}
          onImportMasterData={handleImportMasterData}
          onLogout={handleLogout}
          currentUser={currentUser}
          theme={theme}
        />
      )}

      {/* MODAL 3: Institution Cluster View */}
      {showClusterModal && (
        <InstitutionClusterView
          organs={organs}
          onSelectOrgan={(organ) => {
            setSelectedOrgan(organ);
            setSelectedPin(null);
          }}
          onClose={() => setShowClusterModal(false)}
          currentUser={currentUser}
          theme={theme}
        />
      )}

      {/* MODAL 4: Add / Edit Custom Organ (DOSEN & SUPERADMIN) */}
      {showAddOrganModal && canManageContent(role) && (
        <AddOrganModal
          key={(editingOrgan?.id || 'new')+'-'+(editingOrgan?.version || 0)}
          onReload={refresh}
          initialOrgan={editingOrgan}
          currentUser={currentUser}
          onClose={() => { setShowAddOrganModal(false); setEditingOrgan(null); navigate(isAdmin(role)?'/admin/materi':'/kelola'); }}
          onSave={handleSaveOrgan}
          theme={theme}
        />
      )}

      {/* MODAL 5: Add Hotspot Pin 2D */}
      {pendingPin2D && (
        <AddPinModal
          x={pendingPin2D.x}
          y={pendingPin2D.y}
          is3d={false}
          onClose={() => setPendingPin2D(null)}
          onSave={handleSavePin}
          mediaTitle={activeMedia?.title}
          theme={theme}
        />
      )}

      {/* MODAL 6: Add Hotspot Pin 3D (X, Y, Z Coordinates) */}
      {pendingPin3D && (
        <AddPinModal
          x={pendingPin3D.x}
          y={pendingPin3D.y}
          z={pendingPin3D.z}
          is3d={true}
          onClose={() => setPendingPin3D(null)}
          onSave={handleSavePin}
          mediaTitle={activeMedia?.title}
          theme={theme}
        />
      )}

      {/* MODAL 7: Edit Existing Pin */}
      {editingPin && (
        <AddPinModal
          x={editingPin.x}
          y={editingPin.y}
          z={editingPin.z}
          is3d={editingPin.is3d}
          initialPin={editingPin}
          onClose={() => setEditingPin(null)}
          onSave={handleSavePin}
          mediaTitle={activeMedia?.title}
          onDelete={handleDeletePin}
          theme={theme}
        />
      )}

      {/* MODAL 8: About & Multi-Institution Info Modal */}
      {showAboutModal && (
        <AboutModal
          onClose={() => setShowAboutModal(false)}
          theme={theme}
        />
      )}

      {/* MODAL 9: Locked Content Warning for Guest/Non-Login Mode */}
      {showLockedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-fade-in" id="locked-content-modal">
          <div className={`w-full max-w-md rounded-2xl p-6 shadow-2xl border relative ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <button
              onClick={() => {
                setShowLockedModal(false);
                setLockedOrganAttempt(null);
              }}
              className="absolute top-4 right-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-4.5 w-4.5" />
            </button>

            <div className="flex items-center gap-3 border-b pb-4 mb-4 border-slate-800 dark:border-slate-800 light:border-slate-200">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/25">
                <Lock className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-bold">
                  Akses Terkunci (Guest Mode)
                </h3>
                <p className="text-[10px] text-slate-400">
                  Silakan login untuk mengakses modul kurikulum medis ini.
                </p>
              </div>
            </div>

            <p className="text-xs leading-relaxed text-slate-300 dark:text-slate-300 light:text-slate-700 mb-6">
              Organ <span className="font-semibold text-teal-400">"{lockedOrganAttempt?.name || 'terpilih'}"</span> ({lockedOrganAttempt?.latinName || 'latin'}) adalah materi terakreditasi kurikulum anatomi.
            </p>

            {/* Role quick login buttons */}
            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => {
                  setShowLockedModal(false);
                  setShowLoginModal(true);
                }}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-teal-500 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-teal-500/10 hover:bg-teal-400 transition-all cursor-pointer"
                id="modal-open-login-dialog-btn"
              >
                <Users className="h-4 w-4" />
                Masuk akun
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Drawer Navigation Sidebar Overlay */}
      {showSidebarMobile && (
        <div className="fixed inset-0 z-50 flex md:hidden" id="mobile-sidebar-drawer">
          <div 
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setShowSidebarMobile(false)}
          ></div>
          
          <div className={`relative flex w-full max-w-[280px] sm:max-w-xs flex-1 flex-col border-r shadow-2xl animate-in slide-in-from-left duration-200 ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <button
              onClick={() => setShowSidebarMobile(false)}
              className="absolute top-3 right-3 z-10 rounded-xl p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-all cursor-pointer active:scale-95"
              aria-label="Tutup katalog" id="close-mobile-sidebar-btn"
            >
              <X className="h-4.5 w-4.5" />
            </button>
            
            <div className="h-full overflow-hidden pt-10">
              <Catalog organs={filteredOrgans} selectedOrgan={selectedOrgan} onSelectOrgan={(organ) => { handleSelectOrgan(organ); setShowSidebarMobile(false); }} currentRole={role === 'GUEST' ? 'GUEST' : 'MAHASISWA'} theme={theme} query={searchQuery} onQuery={setSearchQuery} />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
