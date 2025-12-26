import React, { useState, useEffect, useRef } from 'react';
import { Plus, MapPin, Anchor, Share2, CloudLightning, Loader2, Save, Settings, Sparkles, RotateCcw, X, WifiOff, FolderOpen, UserCircle, LogIn, LogOut } from 'lucide-react';
import PlaceCard from './components/PlaceCard';
import AddForm from './components/AddForm';
import AiModal from './components/AiModal';
import WelcomeScreen from './components/WelcomeScreen';
import ShareModal from './components/ShareModal';
import DatabaseConfigScreen from './components/AuthScreen';
import PlaceDetailModal from './components/PlaceDetailModal';
import TripHistoryModal from './components/TripHistoryModal';
import AuthModal from './components/AuthModal';
import { Accommodation, AiSuggestionParams, TripDetails } from './types';
import { getAccommodationSuggestions } from './services/geminiService';
import { 
  getTrip, 
  updateTrip, 
  createTrip, 
  subscribeToTrip, 
  isSupabaseConfigured, 
  supabase,
  clearSupabaseConfig,
  getCurrentUser,
  signOut
} from './services/supabaseService';

const App: React.FC = () => {
  const [places, setPlaces] = useState<Accommodation[]>([]);
  const [tripDetails, setTripDetails] = useState<TripDetails | null>(null);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  // State for Editing and Viewing
  const [editingPlace, setEditingPlace] = useState<Accommodation | null>(null);
  const [viewingPlace, setViewingPlace] = useState<Accommodation | null>(null);
  
  // State for Undo
  const [lastDeleted, setLastDeleted] = useState<Accommodation | null>(null);
  const [showUndoToast, setShowUndoToast] = useState(false);
  const undoTimeoutRef = useRef<number | null>(null);
  
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  
  const [tripId, setTripId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoadingTrip, setIsLoadingTrip] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  // Auth State
  const [user, setUser] = useState<any>(null);

  // Ref to track if the last update came from the server to prevent echo loops
  const lastServerUpdate = useRef<number>(0);

  // Network Status Listener
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auth & Init Logic
  useEffect(() => {
    const init = async () => {
      if (!isSupabaseConfigured) return;

      // Check User
      const currentUser = await getCurrentUser();
      setUser(currentUser);

      // Listen for auth changes
      supabase?.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
      });

      const params = new URLSearchParams(window.location.search);
      let urlTripId = params.get('tripId');
      
      // AUTO-RESTORE LOGIC:
      if (!urlTripId) {
        const lastVisitedId = localStorage.getItem('kohlarn_last_trip_id');
        if (lastVisitedId) {
            console.log("Restoring last visited trip:", lastVisitedId);
            urlTripId = lastVisitedId;
            const newUrl = `${window.location.pathname}?tripId=${lastVisitedId}`;
            window.history.replaceState(null, '', newUrl);
        }
      }

      if (urlTripId) {
        setIsLoadingTrip(true);
        setTripId(urlTripId);
        setHasStarted(true);
        
        // --- OFFLINE/CACHE FIRST STRATEGY ---
        const cachedData = localStorage.getItem(`kohlarn_trip_data_${urlTripId}`);
        if (cachedData) {
            try {
                const parsed = JSON.parse(cachedData);
                if (parsed.places) setPlaces(parsed.places);
                if (parsed.trip_details) setTripDetails(parsed.trip_details);
            } catch (e) {
                console.warn("Failed to parse cached data");
            }
        }

        try {
          const data = await getTrip(urlTripId);
          if (data) {
            if (data.places) setPlaces(data.places);
            if (data.trip_details) setTripDetails(data.trip_details);
            
            // Update Cache
            localStorage.setItem('kohlarn_last_trip_id', urlTripId);
            localStorage.setItem(`kohlarn_trip_data_${urlTripId}`, JSON.stringify({
                places: data.places,
                trip_details: data.trip_details
            }));
          }
        } catch (error) {
          console.error("Error loading trip from cloud:", error);
          if (!cachedData) {
              // Be silent if failure, maybe deleted or network
          }
        } finally {
          setIsLoadingTrip(false);
        }
      }
    };

    init();
  }, []);

  // History Tracker Effect
  useEffect(() => {
    if (tripId && places.length > 0) {
        try {
            const historyStr = localStorage.getItem('kohlarn_trip_history') || '[]';
            const history = JSON.parse(historyStr);
            
            // Determine Title
            let title = 'ทริปไม่มีชื่อ';
            if (tripDetails?.style) title = `ทริป${tripDetails.style}`;
            else if (places.length > 0) title = `ทริป ${places[0].name}`;

            const newItem = {
                id: tripId,
                title: title,
                date: new Date().toISOString(),
                placeCount: places.length
            };

            const filteredHistory = history.filter((h: any) => h.id !== tripId);
            const newHistory = [newItem, ...filteredHistory].slice(0, 10); 

            localStorage.setItem('kohlarn_trip_history', JSON.stringify(newHistory));
        } catch (e) {
            console.error("Failed to save history", e);
        }
    }
  }, [tripId, places, tripDetails]);

  // Realtime Subscription Effect
  useEffect(() => {
    if (!tripId || !isSupabaseConfigured) return;

    const channel = subscribeToTrip(tripId, (newData) => {
      lastServerUpdate.current = Date.now();
      
      console.log("Received realtime update:", newData);
      if (newData.places) setPlaces(newData.places);
      if (newData.trip_details) setTripDetails(newData.trip_details);
      
      localStorage.setItem(`kohlarn_trip_data_${tripId}`, JSON.stringify({
        places: newData.places,
        trip_details: newData.trip_details
      }));
    });

    return () => {
      if (channel) supabase?.removeChannel(channel);
    };
  }, [tripId]);

  // Sync Logic
  useEffect(() => {
    if (!tripId || !isSupabaseConfigured) return;

    localStorage.setItem(`kohlarn_trip_data_${tripId}`, JSON.stringify({
        places,
        trip_details: tripDetails
    }));

    if (Date.now() - lastServerUpdate.current < 1000) return;

    const timer = setTimeout(async () => {
      setIsSyncing(true);
      try {
        await updateTrip(tripId, places, tripDetails);
      } catch (error) {
        console.error("Sync failed:", error);
      } finally {
        setIsSyncing(false);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [places, tripDetails, tripId]);

  const ensureTripExists = async () => {
    if (!tripId && isSupabaseConfigured) {
       setIsSyncing(true);
       try {
         const newTrip = await createTrip(places, tripDetails);
         if (newTrip) {
            setTripId(newTrip.id);
            const newUrl = `${window.location.pathname}?tripId=${newTrip.id}`;
            window.history.pushState({ path: newUrl }, '', newUrl);
            
            localStorage.setItem('kohlarn_last_trip_id', newTrip.id);
            localStorage.setItem(`kohlarn_trip_data_${newTrip.id}`, JSON.stringify({
                places,
                trip_details: tripDetails
            }));

            return newTrip.id;
         }
       } catch (e) {
         console.error("Error creating trip", e);
         alert("ไม่สามารถสร้างทริปบน Cloud ได้");
       } finally {
         setIsSyncing(false);
       }
    }
    return tripId;
  };

  const handleAddPlace = async (newPlace: Omit<Accommodation, 'id' | 'votes' | 'addedBy'>, addedBy: 'user' | 'ai' = 'user') => {
    const place: Accommodation = {
      ...newPlace,
      id: crypto.randomUUID(),
      votes: 0,
      addedBy
    };
    
    setPlaces(prev => [place, ...prev]);
    if (addedBy === 'user') setShowAddForm(false);

    await ensureTripExists();
  };

  const handleUpdatePlace = (updatedData: Omit<Accommodation, 'id' | 'votes' | 'addedBy'>) => {
    if (!editingPlace) return;

    setPlaces(prev => prev.map(p => 
      p.id === editingPlace.id 
        ? { ...p, ...updatedData, images: updatedData.images } 
        : p
    ));
    
    setEditingPlace(null);
  };

  const handleDelete = (id: string) => {
    const itemToDelete = places.find(p => p.id === id);
    if (!itemToDelete) return;

    setLastDeleted(itemToDelete);
    setShowUndoToast(true);
    setPlaces(prev => prev.filter(p => p.id !== id));

    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    undoTimeoutRef.current = window.setTimeout(() => {
        setShowUndoToast(false);
        setLastDeleted(null);
    }, 5000);
  };

  const handleUndoDelete = () => {
    if (!lastDeleted) return;
    setPlaces(prev => [lastDeleted, ...prev]);
    setShowUndoToast(false);
    setLastDeleted(null);
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
  };

  const handleVote = (id: string) => {
    setPlaces(prev => prev.map(p => 
      p.id === id ? { ...p, votes: p.votes + 1 } : p
    ));
  };

  const handleAiSearch = async (params: AiSuggestionParams) => {
    setIsAiLoading(true);
    setTripDetails(params);
    await ensureTripExists(); 
    
    try {
      const suggestions = await getAccommodationSuggestions(params);
      suggestions.forEach(s => handleAddPlace(s, 'ai'));
      setShowAiModal(false);
      alert(`เพิ่ม ${suggestions.length} ที่พักแนะนำจาก AI เรียบร้อย!`);
    } catch (error) {
      alert("ขออภัย AI ต้องการอินเทอร์เน็ตในการทำงาน");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleManualSave = async () => {
    if (!tripId) {
        await ensureTripExists();
        return;
    }
    setIsSyncing(true);
    try {
      await updateTrip(tripId, places, tripDetails);
      alert("บันทึกข้อมูลเรียบร้อยแล้ว");
    } catch (error) {
      alert("การบันทึกออนไลน์ล้มเหลว (ข้อมูลถูกบันทึกในเครื่องแล้ว)");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExport = () => {
    const data = {
        tripId,
        tripDetails,
        places,
        exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kohlarn-trip-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const json = JSON.parse(e.target?.result as string);
            if (json.places && Array.isArray(json.places)) {
                if (confirm('ข้อมูลปัจจุบันจะถูกแทนที่ด้วยไฟล์นี้ ต้องการดำเนินการต่อหรือไม่?')) {
                    setPlaces(json.places);
                    setTripDetails(json.tripDetails || null);
                    if (json.tripId) {
                        setTripId(json.tripId);
                        const newUrl = `${window.location.pathname}?tripId=${json.tripId}`;
                        window.history.pushState({ path: newUrl }, '', newUrl);
                    } else {
                        setTripId(null);
                    }
                    setShowHistoryModal(false);
                    alert('โหลดข้อมูลเรียบร้อยแล้ว');
                }
            } else {
                alert('รูปแบบไฟล์ไม่ถูกต้อง');
            }
        } catch (err) {
            console.error(err);
            alert('ไม่สามารถอ่านไฟล์นี้ได้');
        }
    };
    reader.readAsText(file);
  };

  const handleSignOut = async () => {
    if(confirm('ต้องการออกจากระบบหรือไม่?')) {
        await signOut();
        setUser(null);
    }
  };
  
  const getUserDisplayName = () => {
    if (!user) return '';
    return user.user_metadata?.username || user.email?.split('@')[0] || 'นักเดินทาง';
  };
  
  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    alert("ยินดีต้อนรับกลับ!");
    // Sync current trip to account immediately
    if (tripId) {
        setIsSyncing(true);
        updateTrip(tripId, places, tripDetails)
            .then(() => console.log("Trip synced to user account"))
            .catch(err => console.error("Failed to sync trip on login", err))
            .finally(() => setIsSyncing(false));
    }
  };

  if (!isSupabaseConfigured) {
      return <DatabaseConfigScreen onConfigured={() => window.location.reload()} />;
  }

  if (isLoadingTrip && places.length === 0) {
    return (
      <div className="fixed inset-0 bg-slate-50 flex flex-col items-center justify-center z-50">
        <Loader2 className="animate-spin text-teal-600 mb-4" size={48} />
        <p className="text-slate-600 font-medium">กำลังโหลดทริป...</p>
      </div>
    );
  }

  if (!hasStarted) {
    return <WelcomeScreen onStart={() => setHasStarted(true)} />;
  }

  return (
    <div className="min-h-screen pb-20 animate-fade-in-up">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-teal-100 shadow-sm transition-all">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 text-teal-700">
            <Anchor className="fill-teal-700" size={28} />
            <div className="flex flex-col">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight leading-none">Koh Larn Planner</h1>
              {tripId ? (
                 <div className="flex items-center gap-2">
                    {isOffline ? (
                        <span className="text-xs font-bold text-slate-500 flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-full">
                           <WifiOff size={12} /> ออฟไลน์
                        </span>
                    ) : (
                        <span className={`text-xs font-medium flex items-center gap-1 ${isSyncing ? 'text-amber-500' : 'text-teal-500'}`}>
                        <CloudLightning size={12} /> {isSyncing ? 'กำลังบันทึก...' : 'ออนไลน์'}
                        </span>
                    )}
                 </div>
              ) : (
                <span className="text-xs text-slate-400">สร้างทริปใหม่</span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-3">
             <button
                onClick={() => setShowShareModal(true)}
                className="bg-teal-50 text-teal-600 hover:bg-teal-100 p-2 rounded-full transition-colors flex items-center gap-2 px-3 md:px-4 text-sm font-semibold border border-teal-100"
                title="แชร์ทริปนี้"
              >
                <Share2 size={18} /> <span className="hidden sm:inline">แชร์</span>
              </button>

             <button
                onClick={() => setShowHistoryModal(true)}
                className="bg-slate-100 text-slate-600 hover:bg-slate-200 p-2 rounded-full transition-colors border border-slate-200"
                title="ทริปของฉัน"
              >
                <FolderOpen size={18} />
             </button>

            {/* User Auth Button */}
            {user ? (
                <button 
                    onClick={handleSignOut}
                    className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 p-2 rounded-full border border-indigo-100"
                    title={`ออกจากระบบ (${getUserDisplayName()})`}
                >
                    <LogOut size={18} />
                </button>
            ) : (
                <button 
                    onClick={() => setShowAuthModal(true)}
                    className="bg-slate-800 text-white hover:bg-slate-900 p-2 rounded-full border border-slate-700"
                    title="เข้าสู่ระบบ"
                >
                    <LogIn size={18} />
                </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        
        {isOffline && (
            <div className="bg-slate-100 border border-slate-300 text-slate-600 px-4 py-2 rounded-lg mb-4 flex items-center gap-2 text-sm">
                <WifiOff size={16} /> โหมดออฟไลน์: ข้อมูลจะซิงค์เมื่อมีอินเทอร์เน็ต
            </div>
        )}

        {/* Intro / Empty State */}
        {places.length === 0 && !showAddForm && (
          <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-slate-100 mb-8">
            <div className="inline-block p-4 rounded-full bg-teal-50 mb-4">
              <MapPin size={48} className="text-teal-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-700 mb-2">
               เริ่มวางแผนทริปกันเถอะ
            </h2>
            <p className="text-slate-500 mb-6">
                {user ? `สวัสดี ${getUserDisplayName()}!` : 'ล็อกอินเพื่อเก็บข้อมูลทริปของคุณถาวร'}
            </p>
            <div className="flex justify-center gap-4 flex-wrap">
               <button 
                onClick={() => setShowAddForm(true)}
                className="bg-teal-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-teal-700 transition shadow-lg hover:shadow-teal-500/20 flex items-center gap-2"
              >
                <Plus size={20} /> เพิ่มที่พักเอง
              </button>
            </div>
          </div>
        )}

        {/* Info Banner when Trip Details exist */}
        {tripDetails && places.length > 0 && (
          <div className="mb-6 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 p-4 rounded-xl flex flex-wrap gap-4 items-center justify-between animate-fade-in-down">
            <div className="flex items-center gap-3 text-sm text-purple-900">
               <span className="flex items-center gap-1 bg-white px-2 py-1 rounded shadow-sm"><Sparkles size={14} className="text-yellow-500"/> สไตล์: {tripDetails.style}</span>
               <span className="flex items-center gap-1 bg-white px-2 py-1 rounded shadow-sm">👥 {tripDetails.people} คน</span>
               <span className="flex items-center gap-1 bg-white px-2 py-1 rounded shadow-sm">💰 ~{tripDetails.budget} บาท/คืน</span>
            </div>
            <button 
               onClick={() => setShowAiModal(true)}
               className="text-xs text-indigo-600 hover:text-indigo-800 underline font-medium"
            >
              แก้ไขความต้องการ
            </button>
          </div>
        )}

        {/* Action Buttons */}
        {places.length > 0 && !showAddForm && !editingPlace && (
          <div className="flex gap-3 mb-8 overflow-x-auto pb-2 scrollbar-hide">
            <button 
              onClick={() => setShowAddForm(true)}
              className="flex-1 sm:flex-none bg-teal-600 hover:bg-teal-700 text-white px-5 py-3 rounded-xl font-semibold shadow-md transition-all flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <Plus size={20} /> จดที่พักใหม่
            </button>
          </div>
        )}

        {/* Forms */}
        {showAddForm && (
          <AddForm onAdd={(p) => handleAddPlace(p, 'user')} onCancel={() => setShowAddForm(false)} />
        )}

        {editingPlace && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                    <AddForm 
                        onAdd={handleUpdatePlace} 
                        onCancel={() => setEditingPlace(null)}
                        initialData={editingPlace}
                    />
                </div>
            </div>
        )}

        {/* Grid List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {places.sort((a, b) => b.votes - a.votes).map((place) => (
            <div key={place.id} className="animate-fade-in-up">
              <PlaceCard 
                place={place} 
                onVote={handleVote} 
                onDelete={handleDelete}
                onEdit={setEditingPlace}
                onView={setViewingPlace}
              />
            </div>
          ))}
        </div>
      </main>

      {/* Undo Toast */}
      {showUndoToast && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-800/90 backdrop-blur-md text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-4 z-50 animate-fade-in-up border border-slate-700">
            <span className="text-sm">ลบรายการแล้ว</span>
            <div className="h-4 w-px bg-slate-600 mx-1"></div>
            <button 
            onClick={handleUndoDelete}
            className="text-teal-400 font-bold text-sm flex items-center gap-1 hover:text-teal-300 transition-colors"
            >
            <RotateCcw size={16} /> ย้อนกลับ
            </button>
            <button 
            onClick={() => setShowUndoToast(false)}
            className="text-slate-400 hover:text-white transition-colors ml-2"
            >
            <X size={16} />
            </button>
        </div>
      )}

      {/* Modals */}
      <AiModal 
        isOpen={showAiModal} 
        onClose={() => !isAiLoading && setShowAiModal(false)} 
        onSearch={handleAiSearch}
        isLoading={isAiLoading}
      />
      
      <ShareModal 
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        places={places}
        tripDetails={tripDetails}
        currentTripId={tripId}
        onTripCreated={() => {}} 
      />

      <PlaceDetailModal 
        place={viewingPlace} 
        onClose={() => setViewingPlace(null)} 
      />

      <TripHistoryModal 
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        onSelectTrip={(id) => {
            setTripId(id);
            const newUrl = `${window.location.pathname}?tripId=${id}`;
            window.history.pushState({ path: newUrl }, '', newUrl);
            window.location.reload();
        }}
        currentTripId={tripId}
        onExport={handleExport}
        onImport={handleImport}
        isLoggedIn={!!user}
        onLoginRequest={() => {
            setShowHistoryModal(false);
            setShowAuthModal(true);
        }}
      />

      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
};

export default App;