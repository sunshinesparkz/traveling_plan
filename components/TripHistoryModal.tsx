import React, { useEffect, useState, useRef } from 'react';
import { X, Calendar, MapPin, ArrowRight, HardDrive, Download, Upload, Trash2, FileJson, Clock, Cloud, LogIn } from 'lucide-react';
import { getUserTrips } from '../services/supabaseService';

interface HistoryItem {
  id: string;
  title: string;
  date: string;
  placeCount: number;
}

interface TripHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTrip: (tripId: string) => void;
  currentTripId: string | null;
  onExport: () => void;
  onImport: (file: File) => void;
  isLoggedIn: boolean;
  onLoginRequest: () => void;
}

const TripHistoryModal: React.FC<TripHistoryModalProps> = ({ 
  isOpen, 
  onClose, 
  onSelectTrip,
  currentTripId,
  onExport,
  onImport,
  isLoggedIn,
  onLoginRequest
}) => {
  const [localHistory, setLocalHistory] = useState<HistoryItem[]>([]);
  const [cloudTrips, setCloudTrips] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'local' | 'cloud'>('local');
  const [isLoadingCloud, setIsLoadingCloud] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadLocalHistory();
      if (isLoggedIn) {
        setActiveTab('cloud'); // Auto switch to cloud if logged in
        loadCloudTrips();
      }
    }
  }, [isOpen, isLoggedIn]);

  const loadLocalHistory = () => {
    try {
      const stored = localStorage.getItem('kohlarn_trip_history');
      if (stored) {
        setLocalHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Error loading history", e);
    }
  };

  const loadCloudTrips = async () => {
    setIsLoadingCloud(true);
    try {
      const trips = await getUserTrips();
      setCloudTrips(trips || []);
    } catch (e) {
      console.error("Error loading cloud trips", e);
    } finally {
      setIsLoadingCloud(false);
    }
  };

  const clearHistory = () => {
    if (confirm('ต้องการล้างประวัติการเข้าชมในเครื่องนี้ทั้งหมดหรือไม่?')) {
      localStorage.removeItem('kohlarn_trip_history');
      setLocalHistory([]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onImport(e.target.files[0]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in-up">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden relative">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <HardDrive className="text-teal-500" /> จัดการข้อมูลทริป
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="overflow-y-auto bg-slate-50 p-6 space-y-6">
            
            {/* Tabs */}
            <div className="flex p-1 bg-slate-200 rounded-lg">
                <button 
                    onClick={() => setActiveTab('local')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-all flex items-center justify-center gap-2 ${activeTab === 'local' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Clock size={16} /> ประวัติในเครื่อง
                </button>
                <button 
                    onClick={() => setActiveTab('cloud')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-all flex items-center justify-center gap-2 ${activeTab === 'cloud' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Cloud size={16} /> ทริปของฉัน (ถาวร)
                </button>
            </div>

            {/* List Content */}
            <div className="min-h-[200px]">
                {activeTab === 'local' ? (
                    <>
                         <div className="flex justify-between items-center mb-2">
                            <span className="text-xs text-slate-400">บันทึกเฉพาะใน Browser นี้</span>
                            {localHistory.length > 0 && (
                                <button onClick={clearHistory} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
                                    <Trash2 size={12} /> ล้างประวัติ
                                </button>
                            )}
                        </div>
                        {localHistory.length === 0 ? (
                             <div className="text-center py-8 text-slate-400 bg-white rounded-xl border border-slate-100">
                                <Clock size={32} className="mx-auto mb-2 opacity-50" />
                                <p>ยังไม่มีประวัติการเข้าชม</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {localHistory.map((item) => {
                                    const isCurrent = item.id === currentTripId;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => { if (!isCurrent) onSelectTrip(item.id); onClose(); }}
                                            className={`w-full text-left p-4 rounded-xl border transition-all hover:shadow-md flex justify-between items-center bg-white ${isCurrent ? 'border-teal-500 ring-1 ring-teal-500' : 'border-slate-200 hover:border-teal-300'}`}
                                        >
                                            <div>
                                                <div className="font-semibold text-slate-800 mb-1">{item.title}</div>
                                                <div className="text-xs text-slate-500 flex items-center gap-3">
                                                    <span>{item.placeCount} รายการ</span>
                                                    <span>{new Date(item.date).toLocaleDateString('th-TH')}</span>
                                                </div>
                                            </div>
                                            <ArrowRight size={18} className="text-slate-300" />
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        {!isLoggedIn ? (
                             <div className="text-center py-12 bg-white rounded-xl border border-slate-100 flex flex-col items-center">
                                <div className="p-3 bg-indigo-50 rounded-full mb-3 text-indigo-500"><Cloud size={32} /></div>
                                <h3 className="text-slate-800 font-bold text-lg mb-2">เข้าสู่ระบบเพื่อเก็บข้อมูลถาวร</h3>
                                <p className="text-slate-500 text-sm mb-6 max-w-xs">ข้อมูลจะถูกผูกกับบัญชีของคุณ ไม่หายแม้เปลี่ยนเครื่อง</p>
                                <button 
                                    onClick={onLoginRequest}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-semibold flex items-center gap-2 shadow-lg shadow-indigo-200"
                                >
                                    <LogIn size={18} /> เข้าสู่ระบบ / สมัครสมาชิก
                                </button>
                            </div>
                        ) : (
                            <>
                                {isLoadingCloud ? (
                                    <div className="text-center py-8 text-slate-400"><span className="animate-pulse">กำลังโหลดข้อมูล...</span></div>
                                ) : cloudTrips.length === 0 ? (
                                    <div className="text-center py-8 text-slate-400 bg-white rounded-xl border border-slate-100">
                                        <Cloud size={32} className="mx-auto mb-2 opacity-50" />
                                        <p>คุณยังไม่มีทริปที่บันทึกไว้</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {cloudTrips.map((trip) => {
                                            const title = trip.trip_details?.style ? `ทริป${trip.trip_details.style}` : `ทริป ${new Date(trip.created_at).toLocaleDateString('th-TH')}`;
                                            const count = trip.places?.length || 0;
                                            const isCurrent = trip.id === currentTripId;
                                            
                                            return (
                                                <button
                                                    key={trip.id}
                                                    onClick={() => { if (!isCurrent) onSelectTrip(trip.id); onClose(); }}
                                                    className={`w-full text-left p-4 rounded-xl border transition-all hover:shadow-md flex justify-between items-center bg-white ${isCurrent ? 'border-teal-500 ring-1 ring-teal-500' : 'border-indigo-100 hover:border-indigo-300'}`}
                                                >
                                                    <div>
                                                        <div className="font-semibold text-slate-800 mb-1">{title}</div>
                                                        <div className="text-xs text-indigo-500 flex items-center gap-3">
                                                            <span className="flex items-center gap-1"><Cloud size={10} /> Online Storage</span>
                                                            <span>{count} รายการ</span>
                                                        </div>
                                                    </div>
                                                    <ArrowRight size={18} className="text-slate-300" />
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}
            </div>

            {/* File Actions */}
            <div className="pt-4 border-t border-slate-200">
                <h3 className="text-xs font-bold text-slate-500 uppercase mb-3">เครื่องมือเพิ่มเติม</h3>
                <div className="flex gap-3">
                     <button 
                        onClick={onExport}
                        className="flex-1 py-2 px-3 bg-white border border-slate-300 hover:border-teal-500 hover:text-teal-600 rounded-lg text-sm text-slate-600 transition-colors flex items-center justify-center gap-2"
                    >
                        <Download size={16} /> โหลดไฟล์
                    </button>
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 py-2 px-3 bg-white border border-slate-300 hover:border-blue-500 hover:text-blue-600 rounded-lg text-sm text-slate-600 transition-colors flex items-center justify-center gap-2"
                    >
                        <Upload size={16} /> เปิดไฟล์
                    </button>
                     <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileChange} 
                            accept=".json" 
                            className="hidden" 
                        />
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default TripHistoryModal;