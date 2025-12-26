import React, { useState, useEffect, useRef } from 'react';
import { Plus, MapPin, Anchor, Share2, CloudLightning, Loader2, Save, Settings, Sparkles, RotateCcw, X } from 'lucide-react';
import PlaceCard from './components/PlaceCard';
import AddForm from './components/AddForm';
import AiModal from './components/AiModal';
import WelcomeScreen from './components/WelcomeScreen';
import ShareModal from './components/ShareModal';
import DatabaseConfigScreen from './components/AuthScreen';
import PlaceDetailModal from './components/PlaceDetailModal';
import { Accommodation, AiSuggestionParams, TripDetails } from './types';
import { getAccommodationSuggestions } from './services/geminiService';
import { 
  getTrip, 
  updateTrip, 
  createTrip, 
  subscribeToTrip, 
  isSupabaseConfigured, 
  supabase,
  clearSupabaseConfig
} from './services/supabaseService';

const App: React.FC = () => {
  const [places, setPlaces] = useState<Accommodation[]>([]);
  const [tripDetails, setTripDetails] = useState<TripDetails | null>(null);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  
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

  // Ref to track if the last update came from the server to prevent echo loops
  const lastServerUpdate = useRef<number>(0);

  // Initialization Logic
  useEffect(() => {
    const init = async () => {
      const params = new URLSearchParams(window.location.search);
      let urlTripId = params.get('tripId');
      
      // AUTO-RESTORE LOGIC:
      // If no tripId in URL, try to find the last visited trip from LocalStorage
      if (!urlTripId && isSupabaseConfigured) {
        const lastVisitedId = localStorage.getItem('kohlarn_last_trip_id');
        if (lastVisitedId) {
            console.log("Restoring last visited trip:", lastVisitedId);
            urlTripId = lastVisitedId;
            // Silently update URL to include the ID so sharing works correctly
            const newUrl = `${window.location.pathname}?tripId=${lastVisitedId}`;
            window.history.replaceState(null, '', newUrl);
        }
      }

      if (urlTripId && isSupabaseConfigured) {
        setIsLoadingTrip(true);
        setTripId(urlTripId);
        setHasStarted(true); // Auto start if coming from link or restore
        
        try {
          const data = await getTrip(urlTripId);
          if (data) {
            if (data.places) setPlaces(data.places);
            if (data.trip_details) setTripDetails(data.trip_details);
            // Confirm this is the active trip in storage
            localStorage.setItem('kohlarn_last_trip_id', urlTripId);
          }
        } catch (error) {
          console.error("Error loading trip:", error);
          alert("ไม่สามารถโหลดข้อมูลทริปได้ หรือลิงก์ไม่ถูกต้อง");
          // If load fails (e.g. deleted), maybe clear the bad ID
          // localStorage.removeItem('kohlarn_last_trip_id'); 
        } finally {
          setIsLoadingTrip(false);
        }
      }
    };

    init();
  }, []);

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

  // Sync Logic (Push to Server)
  useEffect(() => {
    if (!tripId || !isSupabaseConfigured) return;

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
  }, [places, tripDetails, tripId]);

  // Function to create trip if it doesn't exist yet
  const ensureTripExists = async () => {
    if (!tripId && isSupabaseConfigured) {
       setIsSyncing(true);
       try {
         const newTrip = await createTrip(places, tripDetails);
         if (newTrip) {
            setTripId(newTrip.id);
            // Update URL and LocalStorage
            const newUrl = `${window.location.pathname}?tripId=${newTrip.id}`;
            window.history.pushState({ path: newUrl }, '', newUrl);
            localStorage.setItem('kohlarn_last_trip_id', newTrip.id);
            return newTrip.id;
         }
       } catch (e) {
         console.error("Error creating trip", e);
         alert("ไม่สามารถสร้างทริปบน Cloud ได้ กรุณาเช็คการเชื่อมต่อ");
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

    // If this is the first item, create the cloud trip
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
    // 1. Find the item
    const itemToDelete = places.find(p => p.id === id);
    if (!itemToDelete) return;

    // 2. Save for undo and show toast
    setLastDeleted(itemToDelete);
    setShowUndoToast(true);

    // 3. Delete from list
    setPlaces(prev => prev.filter(p => p.id !== id));

    // 4. Set timer to clear undo capability (5 seconds)
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    undoTimeoutRef.current = window.setTimeout(() => {
        setShowUndoToast(false);
        setLastDeleted(null);
    }, 5000);
  };

  const handleUndoDelete = () => {
    if (!lastDeleted) return;

    // Add back to list (put it back at the top for visibility)
    setPlaces(prev => [lastDeleted, ...prev]);
    
    // Clear undo state
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
    await ensureTripExists(); // Make sure trip exists to save details
    
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

  // REMOVED: handleClearAll button logic from UI, but function kept if needed internally
  const handleClearAll = async () => {
    if (window.confirm('ต้องการสร้างทริปใหม่? (ลิงก์เดิมจะยังใช้งานได้ แต่หน้าจอจะถูกเคลียร์)')) {
      setPlaces([]);
      setTripDetails(null);
      setTripId(null);
      localStorage.removeItem('kohlarn_last_trip_id'); // Clear last trip
      window.history.pushState({ path: '/' }, '', '/');
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
      alert("การบันทึกข้อมูลล้มเหลว กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsSyncing(false);
    }
  };

  if (!isSupabaseConfigured) {
      return <DatabaseConfigScreen onConfigured={() => window.location.reload()} />;
  }

  if (isLoadingTrip) {
    return (
      <div className="fixed inset-0 bg-slate-50 flex flex-col items-center justify-center z-50">
        <Loader2 className="animate-spin text-teal-600 mb-4" size={48} />
        <p className="text-slate-600 font-medium">กำลังโหลดทริปจาก Cloud...</p>
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
                    <span className={`text-xs font-medium flex items-center gap-1 ${isSyncing ? 'text-amber-500' : 'text-teal-500'}`}>
                      <CloudLightning size={12} /> {isSyncing ? 'กำลังบันทึก...' : 'บันทึกออนไลน์'}
                    </span>
                    {!isSyncing && (
                      <button onClick={handleManualSave} title="บันทึกทันที" className="text-slate-400 hover:text-teal-600">
                        <Save size={14} />
                      </button>
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
                <Share2 size={18} /> <span className="hidden sm:inline">แชร์ทริป</span>
              </button>

            {/* REMOVED: Create New Trip Button as requested */}

            <button 
                onClick={() => {
                   if(confirm('ต้องการรีเซ็ตการตั้งค่า Database หรือไม่?')) {
                       clearSupabaseConfig();
                   }
                }}
                className="text-slate-300 hover:text-slate-500 p-2"
                title="ตั้งค่า Database"
            >
                <Settings size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        
        {/* Intro / Empty State */}
        {places.length === 0 && !showAddForm && (
          <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-slate-100 mb-8">
            <div className="inline-block p-4 rounded-full bg-teal-50 mb-4">
              <MapPin size={48} className="text-teal-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-700 mb-2">
               เริ่มวางแผนทริปกันเถอะ
            </h2>
            <p className="text-slate-500 mb-6">ข้อมูลจะถูกบันทึกออนไลน์อัตโนมัติ แชร์ลิงก์ให้เพื่อนได้ทันที</p>
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

        {/* Action Buttons (Visible when there are items) */}
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

        {/* Add Form Area */}
        {showAddForm && (
          <AddForm onAdd={(p) => handleAddPlace(p, 'user')} onCancel={() => setShowAddForm(false)} />
        )}

        {/* Edit Form Area */}
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
    </div>
  );
};

export default App;