import React, { useEffect, useState } from 'react';
import { X, Calendar, MapPin, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { getUserTrips } from '../services/supabaseService';

interface TripHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onSelectTrip: (tripId: string) => void;
  currentTripId: string | null;
}

const TripHistoryModal: React.FC<TripHistoryModalProps> = ({ 
  isOpen, 
  onClose, 
  userId, 
  onSelectTrip,
  currentTripId
}) => {
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && userId) {
      loadTrips();
    }
  }, [isOpen, userId]);

  const loadTrips = async () => {
    setLoading(true);
    try {
      const data = await getUserTrips(userId);
      setTrips(data || []);
    } catch (error) {
      console.error("Error loading trips:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in-up">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col overflow-hidden relative">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Calendar className="text-teal-500" /> ประวัติทริปของฉัน
            </h2>
            <p className="text-slate-500 text-sm">เลือกทริปที่ต้องการจัดการ</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <Loader2 className="animate-spin mb-2" size={32} />
              <p>กำลังโหลดรายการทริป...</p>
            </div>
          ) : trips.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <div className="bg-slate-200 p-4 rounded-full mb-4">
                <MapPin size={32} className="text-slate-400" />
              </div>
              <p className="text-lg font-medium text-slate-600">ยังไม่มีประวัติทริป</p>
              <p className="text-sm">เริ่มสร้างทริปแรกของคุณได้เลย!</p>
              <button 
                onClick={onClose} 
                className="mt-4 text-teal-600 font-bold hover:underline"
              >
                กลับไปหน้าหลัก
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {trips.map((trip) => {
                const placeCount = trip.places?.length || 0;
                const lastUpdated = new Date(trip.updated_at).toLocaleDateString('th-TH', {
                  year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                });
                const style = trip.trip_details?.style || "ไม่ระบุสไตล์";
                const isCurrent = trip.id === currentTripId;

                return (
                  <button
                    key={trip.id}
                    onClick={() => {
                      if (!isCurrent) onSelectTrip(trip.id);
                      onClose();
                    }}
                    className={`group w-full text-left bg-white p-5 rounded-xl border-2 transition-all hover:shadow-md flex justify-between items-center
                      ${isCurrent 
                        ? 'border-teal-500 ring-2 ring-teal-500/10' 
                        : 'border-slate-100 hover:border-teal-200'
                      }`}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-lg text-slate-800">
                            ทริปเกาะล้าน
                        </span>
                        {isCurrent && (
                          <span className="bg-teal-100 text-teal-700 text-xs px-2 py-0.5 rounded-full font-bold">
                            กำลังใช้งาน
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-slate-500 flex items-center gap-3 mb-2">
                        <span className="flex items-center gap-1"><MapPin size={14}/> {placeCount} ที่พัก</span>
                        <span className="flex items-center gap-1"><Calendar size={14}/> {lastUpdated}</span>
                      </div>
                      {trip.trip_details && (
                         <div className="inline-flex items-center gap-1 text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded">
                           <Sparkles size={12}/> {style}
                         </div>
                      )}
                    </div>
                    
                    <div className={`p-2 rounded-full transition-colors ${isCurrent ? 'bg-teal-50 text-teal-600' : 'bg-slate-50 text-slate-300 group-hover:bg-teal-50 group-hover:text-teal-500'}`}>
                      <ArrowRight size={20} />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TripHistoryModal;