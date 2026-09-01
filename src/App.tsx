import React, { useState, useEffect } from 'react';
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
import { Organ, Pin, UserRole, UserProfile } from './types';
import { INITIAL_ORGANS } from './data';
import { AnatomyDatabaseService } from './services/db';
import Navbar from './components/Navbar';
import TreeNavigation from './components/TreeNavigation';
import AnatomyCanvas from './components/AnatomyCanvas';
import InfoPanel from './components/InfoPanel';
import AddOrganModal from './components/AddOrganModal';
import AddPinModal from './components/AddPinModal';
import LoginModal from './components/LoginModal';
import SecretAdminModal from './components/SecretAdminModal';
import SuperadminDashboard from './components/SuperadminDashboard';
import InstitutionClusterView from './components/InstitutionClusterView';
import AboutModal from './components/AboutModal';

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
  const [role, setRole] = useState<UserRole>(() => {
    const savedRole = localStorage.getItem('anatoverse_user_role');
    return (savedRole as UserRole) || 'GUEST';
  });

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const savedUser = localStorage.getItem('anatoverse_user_profile');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {
        console.error('Failed to parse user profile', e);
      }
    }
    return null;
  });

  // 3. Organs list with IndexedDB asynchronous persistence
  const [organs, setOrgans] = useState<Organ[]>(INITIAL_ORGANS);

  // Initial Database bootstrap from IndexedDB
  useEffect(() => {
    async function bootstrapDatabase() {
      try {
        const stored = await AnatomyDatabaseService.initDB();
        if (stored && stored.length > 0) {
          setOrgans(stored);
        }
      } catch (err) {
        console.warn('Database initialization warning, continuing with in-memory state:', err);
      }
    }
    bootstrapDatabase();
  }, []);

  const handleLoginSuccess = async (user: UserProfile) => {
    setCurrentUser(user);
    setRole(user.role);
    localStorage.setItem('anatoverse_user_role', user.role);
    localStorage.setItem('anatoverse_user_profile', JSON.stringify(user));
    setShowLoginModal(false);
    setShowSecretAdminModal(false);

    try {
      await AnatomyDatabaseService.saveUser(user);
    } catch (e) {
      console.error('Failed to persist user to database', e);
    }

    // If currently locked organ was requested, unlock and show it
    if (lockedOrganAttempt) {
      setSelectedOrgan(lockedOrganAttempt);
      setLockedOrganAttempt(null);
      setShowLockedModal(false);
    }
  };

  const handleLogout = () => {
    setRole('GUEST');
    setCurrentUser(null);
    localStorage.setItem('anatoverse_user_role', 'GUEST');
    localStorage.removeItem('anatoverse_user_profile');
    setShowSuperadminDashboard(false);
  };

  // 4. Selection states
  const [selectedOrgan, setSelectedOrgan] = useState<Organ | null>(null);
  const [selectedPin, setSelectedPin] = useState<Pin | null>(null);

  // Default to the first available organ on initial load
  useEffect(() => {
    if (organs.length > 0 && !selectedOrgan) {
      setSelectedOrgan(organs[0]);
    }
  }, [organs, selectedOrgan]);

  // 5. Search State
  const [searchQuery, setSearchQuery] = useState('');

  // 6. Modal States
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSecretAdminModal, setShowSecretAdminModal] = useState(false);
  const [showSuperadminDashboard, setShowSuperadminDashboard] = useState(false);
  const [showClusterModal, setShowClusterModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showAddOrganModal, setShowAddOrganModal] = useState(false);
  const [editingOrgan, setEditingOrgan] = useState<Organ | null>(null);

  // Pin Placing States
  const [pendingPin2D, setPendingPin2D] = useState<{ x: number; y: number } | null>(null);
  const [pendingPin3D, setPendingPin3D] = useState<{ x: number; y: number; z: number } | null>(null);
  const [editingPin, setEditingPin] = useState<Pin | null>(null);

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
      setSelectedOrgan(organ);
      setSelectedPin(null);
    }
  };

  // Add or Edit Organ Save Handler (Dosen & Superadmin)
  const handleSaveOrgan = async (organData: Organ) => {
    const existingIndex = organs.findIndex(o => o.id === organData.id);
    let updated: Organ[];
    if (existingIndex >= 0) {
      updated = [...organs];
      updated[existingIndex] = organData;
    } else {
      updated = [...organs, organData];
    }

    setOrgans(updated);
    setSelectedOrgan(organData);
    setSelectedPin(null);
    setShowAddOrganModal(false);
    setEditingOrgan(null);

    try {
      await AnatomyDatabaseService.saveOrgan(organData);
    } catch (e) {
      console.error('Failed to save organ to database', e);
    }
  };

  // Delete Organ Handler (Superadmin)
  const handleDeleteOrgan = async (organId: string) => {
    const updated = organs.filter(o => o.id !== organId);
    setOrgans(updated);
    if (selectedOrgan?.id === organId) {
      setSelectedOrgan(updated[0] || null);
      setSelectedPin(null);
    }

    try {
      await AnatomyDatabaseService.deleteOrgan(organId);
    } catch (e) {
      console.error('Failed to delete organ from database', e);
    }
  };

  // Import Master Data (Superadmin)
  const handleImportMasterData = async (imported: Organ[]) => {
    setOrgans(imported);
    if (imported.length > 0) {
      setSelectedOrgan(imported[0]);
    }
    setShowSuperadminDashboard(false);

    try {
      await AnatomyDatabaseService.bulkSaveOrgans(imported);
    } catch (e) {
      console.error('Failed to import organs into database', e);
    }
  };

  // Reset Master Data (Superadmin & Navbar)
  const handleResetMasterData = async () => {
    try {
      const resetOrgans = await AnatomyDatabaseService.resetToDefault();
      setOrgans(resetOrgans);
      setSelectedOrgan(resetOrgans[0]);
      setSelectedPin(null);
      setSearchQuery('');
      setShowSuperadminDashboard(false);
    } catch (e) {
      console.error('Failed to reset organs in database', e);
      setOrgans(INITIAL_ORGANS);
      setSelectedOrgan(INITIAL_ORGANS[0]);
      setSelectedPin(null);
    }
  };

  // Pin Placement Handler (2D & 3D)
  const handleSavePin = async (pinData: { title: string; description: string; x: number; y: number; z?: number; is3d?: boolean }) => {
    if (!selectedOrgan) return;

    if (editingPin) {
      // Update existing pin
      const updatedPin: Pin = {
        ...editingPin,
        title: pinData.title,
        description: pinData.description,
        x: pinData.x,
        y: pinData.y,
        z: pinData.z,
        is3d: pinData.is3d
      };

      const updatedOrgans = organs.map(org => {
        if (org.id === selectedOrgan.id) {
          return {
            ...org,
            pins: (org.pins || []).map(p => p.id === editingPin.id ? updatedPin : p)
          };
        }
        return org;
      });

      setOrgans(updatedOrgans);
      const refreshed = updatedOrgans.find(o => o.id === selectedOrgan.id) || null;
      setSelectedOrgan(refreshed);
      setSelectedPin(updatedPin);
      setEditingPin(null);

      if (refreshed) {
        AnatomyDatabaseService.saveOrgan(refreshed);
      }
    } else {
      // Create new pin
      const newPin: Pin = {
        id: `pin-${Date.now()}`,
        title: pinData.title,
        description: pinData.description,
        x: pinData.x,
        y: pinData.y,
        z: pinData.z,
        is3d: pinData.is3d
      };

      const updatedOrgans = organs.map(org => {
        if (org.id === selectedOrgan.id) {
          return {
            ...org,
            pins: [...(org.pins || []), newPin]
          };
        }
        return org;
      });

      setOrgans(updatedOrgans);
      const refreshed = updatedOrgans.find(o => o.id === selectedOrgan.id) || null;
      setSelectedOrgan(refreshed);
      setSelectedPin(newPin);

      if (refreshed) {
        AnatomyDatabaseService.saveOrgan(refreshed);
      }
    }

    setPendingPin2D(null);
    setPendingPin3D(null);
  };

  // Delete Pin Handler
  const handleDeletePin = (pinId: string) => {
    if (!selectedOrgan) return;
    const updatedOrgans = organs.map(org => {
      if (org.id === selectedOrgan.id) {
        return {
          ...org,
          pins: (org.pins || []).filter(p => p.id !== pinId)
        };
      }
      return org;
    });

    setOrgans(updatedOrgans);
    const refreshed = updatedOrgans.find(o => o.id === selectedOrgan.id) || null;
    setSelectedOrgan(refreshed);
    setSelectedPin(null);
    setEditingPin(null);

    if (refreshed) {
      AnatomyDatabaseService.saveOrgan(refreshed);
    }
  };

  const isDark = theme === 'dark';

  return (
    <div className={`flex h-screen flex-col font-sans antialiased overflow-hidden ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`} id="app-root-container">
      
      {/* 1. Header Navigation Bar */}
      <Navbar
        currentRole={role}
        currentUser={currentUser}
        onOpenLoginModal={() => setShowLoginModal(true)}
        onOpenSuperadminModal={() => setShowSuperadminDashboard(true)}
        onOpenSecretAdmin={() => setShowSecretAdminModal(true)}
        onOpenClusterModal={() => setShowClusterModal(true)}
        onOpenAboutModal={() => setShowAboutModal(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onResetData={handleResetMasterData}
        onToggleSidebar={() => setShowSidebarMobile(prev => !prev)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* 2. Primary 3-Column Dashboard Area */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Column A: Left Sidebar Tree Navigation (25%) */}
        <aside className="hidden md:block w-64 lg:w-72 shrink-0 h-full">
          <TreeNavigation
            organs={filteredOrgans}
            selectedOrgan={selectedOrgan}
            onSelectOrgan={handleSelectOrgan}
            currentRole={role}
            onAddOrganClick={() => {
              setEditingOrgan(null);
              setShowAddOrganModal(true);
            }}
            onOpenSuperadmin={role === 'SUPERADMIN' ? () => setShowSuperadminDashboard(true) : undefined}
            theme={theme}
          />
        </aside>

        {/* Column B: Center Visualizer Stage (50%) */}
        <main className={`flex-1 flex flex-col h-full overflow-hidden border-r ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}>
          <AnatomyCanvas
            selectedOrgan={selectedOrgan}
            selectedPin={selectedPin}
            onSelectPin={setSelectedPin}
            currentRole={role}
            onCanvas2DClick={(x, y) => {
              if (role === 'DOSEN' || role === 'SUPERADMIN') {
                setPendingPin2D({ x, y });
              }
            }}
            onPinPlaced3D={(coords) => {
              if (role === 'DOSEN' || role === 'SUPERADMIN') {
                setPendingPin3D(coords);
              }
            }}
            onUnlockRequest={() => {
              setLockedOrganAttempt(selectedOrgan);
              setShowLockedModal(true);
            }}
            theme={theme}
          />
        </main>

        {/* Column C: Right Sidebar Information Panel (25%) */}
        <aside className="hidden w-72 shrink-0 lg:block xl:w-80 h-full">
          <InfoPanel
            selectedOrgan={selectedOrgan}
            selectedPin={selectedPin}
            currentRole={role}
            onEditPin={(pin) => setEditingPin(pin)}
            onDeletePin={handleDeletePin}
            theme={theme}
          />
        </aside>

      </div>

      {/* Mobile Drawer/Overlay for Information Panel on smaller devices */}
      <div className={`block lg:hidden border-t ${
        isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-white'
      }`}>
        <div className="max-h-60 overflow-y-auto">
          <InfoPanel
            selectedOrgan={selectedOrgan}
            selectedPin={selectedPin}
            currentRole={role}
            onEditPin={(pin) => setEditingPin(pin)}
            onDeletePin={handleDeletePin}
            theme={theme}
          />
        </div>
      </div>

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
      {showSuperadminDashboard && (
        <SuperadminDashboard
          organs={organs}
          onClose={() => setShowSuperadminDashboard(false)}
          onAddOrgan={() => {
            setEditingOrgan(null);
            setShowAddOrganModal(true);
          }}
          onEditOrgan={(organ) => {
            setEditingOrgan(organ);
            setShowAddOrganModal(true);
          }}
          onDeleteOrgan={handleDeleteOrgan}
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
      {showAddOrganModal && (
        <AddOrganModal
          initialOrgan={editingOrgan}
          currentUser={currentUser}
          onClose={() => {
            setShowAddOrganModal(false);
            setEditingOrgan(null);
          }}
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
          onDelete={handleDeletePin}
          theme={theme}
        />
      )}

      {/* MODAL 8: About & Dr. Penggalih Credit Modal */}
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
                Buka Halaman Login / Pilih Role
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
              id="close-mobile-sidebar-btn"
            >
              <X className="h-4.5 w-4.5" />
            </button>
            
            <div className="h-full overflow-hidden">
              <TreeNavigation
                organs={filteredOrgans}
                selectedOrgan={selectedOrgan}
                onSelectOrgan={(organ) => {
                  handleSelectOrgan(organ);
                  setShowSidebarMobile(false);
                }}
                currentRole={role}
                onAddOrganClick={() => {
                  setEditingOrgan(null);
                  setShowAddOrganModal(true);
                  setShowSidebarMobile(false);
                }}
                onOpenSuperadmin={role === 'SUPERADMIN' ? () => {
                  setShowSuperadminDashboard(true);
                  setShowSidebarMobile(false);
                } : undefined}
                theme={theme}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
