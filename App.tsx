import React, { useState, useEffect, useRef } from 'react';
import { Plus, Sparkles, MapPin, Anchor, Trash2, Share2, CloudLightning, Loader2, Save, LogOut, User } from 'lucide-react';
import PlaceCard from './components/PlaceCard';
import AddForm from './components/AddForm';
import AiModal from './components/AiModal';
import WelcomeScreen from './components/WelcomeScreen';
import ShareModal from './components/ShareModal';
import AuthScreen from './components/AuthScreen';
import { Accommodation, AiSuggestionParams, TripDetails } from './types';
import { getAccommodationSuggestions } from './services/geminiService';
import { 
  getTrip, 
  updateTrip, 
  subscribeToTrip, 
  isSupabaseConfigured, 
  supabase, 
  getCurrentUser,
  getUserLatestTrip,
  createTrip,
  signOut
} from './services/supabaseService';

const App: React.FC = () => {
  const [places, setPlaces] = useState<Accommodation[]>([]);
  const [tripDetails, setTripDetails] = useState<TripDetails | null>(null);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showAuthScreen, setShowAuthScreen] = useState(false);
  
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  
  const [tripId, setTripId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCloudLoaded, setIsCloudLoaded] = useState(false); 
  const [isLoadingTrip, setIsLoadingTrip] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Ref to track if the last update came from the server to prevent echo loops
  const lastServerUpdate = useRef<number>(0);

  // Check Auth State on Mount
  useEffect(() => {
    const checkUser = async () => {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      
      // Listen for auth changes
      const { data: { subscription } } = supabase?.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
      }) || { data: { subscription: null } };

      return () => subscription?.unsubscribe();
    };
    
    if (isSupabaseConfigured) checkUser();
  }, []);

  // Initialization Logic
  useEffect(() => {
    const init = async () => {
      const params = new URLSearchParams(window.location.search);
      const urlTripId = params.get('tripId');
      
      // 1. If User is Logged In
      if (user) {
        setHasStarted(true);
        setIsLoadingTrip(true);
        
        try {
          // If URL has tripId, load that specific trip
          if (urlTripId) {
            setTripId(urlTripId);
            await loadCloudTrip(urlTripId);
          } else {
             // If no URL tripId, try to find user's latest trip
             const userTrip = await getUserLatestTrip(user.id);
             if (userTrip) {
               setTripId(userTrip.id);
               setPlaces(userTrip.places || []);
               setTripDetails(userTrip.trip_details || null);
               // Update URL without reload
               const newUrl = `${window.location.pathname}?tripId=${userTrip.id}`;
               window.history.pushState({ path: newUrl }, '', newUrl);
             } else {
               // User logged in but has no trips yet. 
               // Check if there is local data to migrate.
               const savedPlaces = localStorage.getItem('kohlarn-places');
               if (savedPlaces) {
                  // Migration Logic happens in handleAuthSuccess usually, 
                  // but handled here for persistent login state
                  loadLocalData();
               }
             }
          }
        } catch (e) {
          console.error("Error loading user data", e);
        } finally {
          setIsLoadingTrip(false);
          setIsCloudLoaded(true);
        }
      } 
      // 2. If Guest (No User)
      else {
        if (urlTripId) {
          setTripId(urlTripId);
          setHasStarted(true);
          loadCloudTrip(urlTripId);
        } else {
          // Load local data
          loadLocalData();
          setIsCloudLoaded(true);
        }
      }
    };

    init();
  }, [user]);

  const loadLocalData = () => {
    const savedPlaces = localStorage.getItem('kohlarn-places');
    const savedDetails = localStorage.getItem('kohlarn-details');
    
    if (savedPlaces) {
      try { setPlaces(JSON.parse(savedPlaces)); } catch (e) { console.error(e); }
    }
    if (savedDetails) {
      try { setTripDetails(JSON.parse(savedDetails)); } catch (e) { console.error(e); }
    }
  };

  // Realtime Subscription Effect
  useEffect(() => {
    if (!tripId || !isSupabaseConfigured) return;

    const channel = subscribeToTrip(tripId, (newData) => {
      // Mark that we just received an update from server
      lastServerUpdate.current = Date.now();
      
      console.log("Received realtime update:", newData);
      if (newData.places) setPlaces(newData.places);
      if (newData.trip_details) setTripDetails(newData.trip_details);
    });

    return () => {
      if (channel) supabase?.removeChannel(channel);
    };
  }, [tripId]);

  const loadCloudTrip = async (id: string) => {
    if (!isSupabaseConfigured) return;
    
    try {
      const data = await getTrip(id);
      if (data) {
        if (data.places) setPlaces(data.places);
        if (data.trip_details) setTripDetails(data.trip_details);
      }
    } catch (error) {
      console.error("Error loading trip:", error);
      alert("ไม่สามารถโหลดข้อมูลทริปได้ หรือลิงก์ไม่ถูกต้อง");
    }
  };

  // Sync Logic (Push to Server)
  useEffect(() => {
    // Only auto-sync if we have a tripId (User is owner or viewing cloud trip)
    if (tripId && isSupabaseConfigured && isCloudLoaded) {
      // Check if we recently received an update from server to avoid infinite loop
      if (Date.now() - lastServerUpdate.current < 1000) {
        return; 
      }

      const timer = setTimeout(async () => {
        setIsSyncing(true);
        try {
          await updateTrip(tripId, places, tripDetails);
        } catch (error) {
          console.error("Sync failed:", error);
        } finally {
          setIsSyncing(false);
        }
      }, 2000); // Debounce 2 seconds

      return () => clearTimeout(timer);
    } 
    
    // Local Storage Logic (Only if NOT in cloud mode)
    if (!tripId && isCloudLoaded && !user) {
      try {
        localStorage.setItem('kohlarn-places', JSON.stringify(places));
        if (tripDetails) {
          localStorage.setItem('kohlarn-details', JSON.stringify(tripDetails));
        }
      } catch (error) {}
    }
  }, [places, tripDetails, tripId, isCloudLoaded, user]);

  const handleTripCreated = (newId: string) => {
    setTripId(newId);
    setIsCloudLoaded(true); 
    const newUrl = `${window.location.pathname}?tripId=${newId}`;
    window.history.pushState({ path: newUrl }, '', newUrl);
  };

  const handleAuthSuccess = async () => {
    setShowAuthScreen(false);
    setHasStarted(true);
    const currentUser = await getCurrentUser();
    setUser(currentUser);

    // MIGRATION LOGIC:
    // If the user just logged in and has local data (places > 0) but no tripId yet,
    // we should create a new trip for them on the cloud with this data.
    if (places.length > 0 && !tripId) {
      setIsSyncing(true);
      try {
        const newTrip = await createTrip(places, tripDetails);
        if (newTrip) {
          setTripId(newTrip.id);
          const newUrl = `${window.location.pathname}?tripId=${newTrip.id}`;
          window.history.pushState({ path: newUrl }, '', newUrl);
          
          // Clear local storage after successful cloud sync
          localStorage.removeItem('kohlarn-places');
          localStorage.removeItem('kohlarn-details');
          alert("ข้อมูลของคุณถูกบันทึกขึ้น Cloud เรียบร้อยแล้ว!");
        }
      } catch (e) {
        console.error("Failed to migrate data", e);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  const handleLogout = async () => {
    await signOut();
    setUser(null);
    setTripId(null);
    setPlaces([]);
    setTripDetails(null);
    setHasStarted(false);
    // Clear URL query
    window.history.pushState({ path: '/' }, '', '/');
  };

  const handleAddPlace = (newPlace: Omit<Accommodation, 'id' | 'votes' | 'addedBy'>, addedBy: 'user' | 'ai' = 'user') => {
    const place: Accommodation = {
      ...newPlace,
      id: crypto.randomUUID(),
      votes: 0,
      addedBy
    };
    setPlaces(prev => [place, ...prev]);
    if (addedBy === 'user') setShowAddForm(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('ต้องการลบที่พักนี้ออกจากรายการใช่ไหม?')) {
      setPlaces(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleClearAll = () => {
    if (places.length === 0) return;
    if (window.confirm('⚠️ คำเตือน: คุณต้องการลบข้อมูลที่พัก "ทั้งหมด" ใช่หรือไม่?')) {
      setPlaces([]);
      setTripDetails(null);
      if (!tripId) {
        localStorage.removeItem('kohlarn-places');
        localStorage.removeItem('kohlarn-details');
      }
    }
  };

  const handleVote = (id: string) => {
    setPlaces(prev => prev.map(p => 
      p.id === id ? { ...p, votes: p.votes + 1 } : p
    ));
  };

  const handleAiSearch = async (params: AiSuggestionParams) => {
    setIsAiLoading(true);
    setTripDetails(params);
    
    try {
      const suggestions = await getAccommodationSuggestions(params);
      suggestions.forEach(s => handleAddPlace(s, 'ai'));
      setShowAiModal(false);
      alert(`เพิ่ม ${suggestions.length} ที่พักแนะนำจาก AI เรียบร้อย!`);
    } catch (error) {
      alert("ขออภัย เกิดข้อผิดพลาดในการเชื่อมต่อกับ AI");
    } finally {
      setIsAiLoading(false);
    }
  };

  // Manual Save Function
  const handleManualSave = async () => {
    if (!tripId || !isSupabaseConfigured) return;
    setIsSyncing(true);
    try {
      await updateTrip(tripId, places, tripDetails);
      alert("บันทึกข้อมูลเรียบร้อยแล้ว");
    } catch (error) {
      alert("การบันทึกข้อมูลล้มเหลว กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsSyncing(false);
    }
  };

  if (isLoadingTrip) {
    return (
      <div className="fixed inset-0 bg-slate-50 flex flex-col items-center justify-center z-50">
        <Loader2 className="animate-spin text-teal-600 mb-4" size={48} />
        <p className="text-slate-600 font-medium">กำลังดึงข้อมูลทริป...</p>
      </div>
    );
  }

  // Show Auth Screen if requested (or enforced)
  if (showAuthScreen) {
    return (
      <AuthScreen 
        onAuthSuccess={handleAuthSuccess}
        onSkip={() => {
          setShowAuthScreen(false);
          setHasStarted(true);
        }}
      />
    );
  }

  if (!hasStarted && !user) {
    return <WelcomeScreen onStart={() => setShowAuthScreen(true)} />;
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
              {tripId && (
                 <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium flex items-center gap-1 ${isSyncing ? 'text-amber-500' : 'text-teal-500'}`}>
                      <CloudLightning size={12} /> {isSyncing ? 'กำลังบันทึก...' : 'บันทึกแล้ว'}
                    </span>
                    {!isSyncing && (
                      <button onClick={handleManualSave} title="บันทึกทันที" className="text-slate-400 hover:text-teal-600">
                        <Save size={14} />
                      </button>
                    )}
                 </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-3">
             {/* User Profile / Login Status */}
             {user ? (
               <div className="flex items-center gap-2 bg-slate-100 rounded-full pl-3 pr-1 py-1">
                 <User size={16} className="text-slate-500" />
                 <span className="text-xs text-slate-600 font-medium hidden sm:inline max-w-[100px] truncate">{user.email}</span>
                 <button 
                  onClick={handleLogout}
                  className="bg-white p-1.5 rounded-full text-slate-400 hover:text-red-500 shadow-sm hover:shadow transition-all"
                  title="ออกจากระบบ"
                 >
                   <LogOut size={14} />
                 </button>
               </div>
             ) : (
               <button 
                onClick={() => setShowAuthScreen(true)}
                className="bg-teal-500 text-white px-3 py-2 rounded-lg text-sm font-bold shadow hover:bg-teal-600 transition-colors flex items-center gap-1"
               >
                 <User size={16} /> <span className="hidden sm:inline">เข้าสู่ระบบ</span>
               </button>
             )}

             <div className="w-px h-8 bg-slate-200 mx-1"></div>

             <button
                onClick={() => setShowShareModal(true)}
                className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 p-2 rounded-full transition-colors flex items-center gap-2 px-3 md:px-4 text-sm font-semibold border border-indigo-100"
              >
                <Share2 size={18} />
                <span className="hidden sm:inline">แชร์</span>
              </button>

            {places.length > 0 && (
              <button
                onClick={handleClearAll}
                className="text-red-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-colors"
                title="ล้างข้อมูลทั้งหมด"
              >
                <Trash2 size={20} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        
        {/* Guest Warning Banner */}
        {!user && places.length > 0 && (
           <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6 flex items-center justify-between gap-3 animate-fade-in-down">
             <div className="flex items-center gap-2 text-amber-800 text-sm">
               <CloudLightning size={16} className="text-amber-500" />
               <span>คุณกำลังใช้งานแบบ Guest ข้อมูลอาจหายได้หากเปลี่ยนเครื่อง</span>
             </div>
             <button 
               onClick={() => setShowAuthScreen(true)}
               className="text-amber-700 font-bold text-sm underline hover:text-amber-900 whitespace-nowrap"
             >
               ล็อกอินเพื่อบันทึก
             </button>
           </div>
        )}

        {/* Intro / Empty State */}
        {places.length === 0 && !showAddForm && (
          <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-slate-100 mb-8">
            <div className="inline-block p-4 rounded-full bg-teal-50 mb-4">
              <MapPin size={48} className="text-teal-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-700 mb-2">ยังไม่มีที่พักในรายการ</h2>
            <p className="text-slate-500 mb-6">เริ่มวางแผนทริปเกาะล้านของคุณด้วยการเพิ่มที่พักที่น่าสนใจ</p>
            <div className="flex justify-center gap-4 flex-wrap">
               <button 
                onClick={() => setShowAddForm(true)}
                className="bg-teal-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-teal-700 transition shadow-lg hover:shadow-teal-500/20 flex items-center gap-2"
              >
                <Plus size={20} /> เพิ่มเอง
              </button>
              <button 
                onClick={() => setShowAiModal(true)}
                className="bg-white text-indigo-600 border border-indigo-200 px-6 py-3 rounded-full font-semibold hover:bg-indigo-50 transition shadow-sm flex items-center gap-2"
              >
                <Sparkles size={20} /> ให้ AI ช่วยหา
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

        {/* Action Buttons (Visible when there are items) */}
        {places.length > 0 && !showAddForm && (
          <div className="flex gap-3 mb-8 overflow-x-auto pb-2 scrollbar-hide">
            <button 
              onClick={() => setShowAddForm(true)}
              className="flex-1 sm:flex-none bg-teal-600 hover:bg-teal-700 text-white px-5 py-3 rounded-xl font-semibold shadow-md transition-all flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <Plus size={20} /> จดที่พักใหม่
            </button>
            <button 
              onClick={() => setShowAiModal(true)}
              className="flex-1 sm:flex-none bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-5 py-3 rounded-xl font-semibold shadow-md transition-all flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <Sparkles size={18} className="text-yellow-200" /> ให้ AI ช่วยแนะนำเพิ่ม
            </button>
          </div>
        )}

        {/* Add Form Area */}
        {showAddForm && (
          <AddForm onAdd={(p) => handleAddPlace(p, 'user')} onCancel={() => setShowAddForm(false)} />
        )}

        {/* Grid List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {places.sort((a, b) => b.votes - a.votes).map((place) => (
            <div key={place.id} className="animate-fade-in-up">
              <PlaceCard 
                place={place} 
                onVote={handleVote} 
                onDelete={handleDelete} 
              />
            </div>
          ))}
        </div>
      </main>

      {/* AI Modal */}
      <AiModal 
        isOpen={showAiModal} 
        onClose={() => !isAiLoading && setShowAiModal(false)} 
        onSearch={handleAiSearch}
        isLoading={isAiLoading}
      />
      
      {/* Share Modal */}
      <ShareModal 
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        places={places}
        tripDetails={tripDetails}
        currentTripId={tripId}
        onTripCreated={handleTripCreated}
      />
    </div>
  );
};

export default App;