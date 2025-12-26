import React, { useState } from 'react';
import { X, Cloud, Link as LinkIcon, Download, Check, AlertTriangle } from 'lucide-react';
import { Accommodation, TripDetails } from '../types';
import { isSupabaseConfigured, createTrip } from '../services/supabaseService';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  places: Accommodation[];
  tripDetails: TripDetails | null;
  currentTripId: string | null;
  onTripCreated: (id: string) => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, places, tripDetails, currentTripId, onTripCreated }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreateCloudLink = async () => {
    setIsCreating(true);
    setError(null);
    try {
      if (!isSupabaseConfigured) {
        throw new Error("ยังไม่ได้ตั้งค่า Database (Supabase Keys)");
      }
      
      const data = await createTrip(places, tripDetails);
      if (data && data.id) {
        onTripCreated(data.id);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "เกิดข้อผิดพลาดในการสร้างลิงก์");
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  const handleDownloadJson = () => {
    const exportData = {
      places,
      details: tripDetails,
      exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kohlarn-plan-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in-up">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
          <X size={24} />
        </button>

        <div className="p-6">
          <h2 className="text-2xl font-bold text-slate-800 mb-2 flex items-center gap-2">
            <Cloud className="text-teal-500" /> แชร์ทริป
          </h2>
          <p className="text-slate-500 mb-6 text-sm">เลือกวิธีที่คุณต้องการเก็บข้อมูลหรือแชร์ให้เพื่อน</p>

          <div className="space-y-4">
            {/* Option 1: Cloud Link */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h3 className="font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <LinkIcon size={18} /> ลิงก์ออนไลน์ (Cloud)
              </h3>
              
              {currentTripId ? (
                <div className="space-y-2">
                  <div className="text-xs text-green-600 font-medium flex items-center gap-1">
                    <Check size={14} /> ข้อมูลอยู่บน Cloud แล้ว
                  </div>
                  <div className="flex gap-2">
                    <input 
                      readOnly 
                      value={window.location.href} 
                      className="w-full text-xs bg-white border border-slate-300 rounded px-2 py-2 text-slate-600 truncate"
                    />
                    <button 
                      onClick={handleCopyLink}
                      className={`px-3 py-1 rounded text-xs font-bold transition-colors ${copySuccess ? 'bg-green-500 text-white' : 'bg-slate-800 text-white hover:bg-slate-900'}`}
                    >
                      {copySuccess ? 'คัดลอกแล้ว' : 'คัดลอก'}
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    *ส่งลิงก์นี้ให้เพื่อนเพื่อแก้ไขข้อมูลร่วมกัน
                  </p>
                </div>
              ) : (
                <div>
                   {error && (
                    <div className="text-xs text-red-500 bg-red-50 p-2 rounded mb-2 flex items-center gap-1">
                      <AlertTriangle size={14} /> {error}
                    </div>
                  )}
                  {!isSupabaseConfigured && (
                     <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded mb-2">
                       ต้องตั้งค่า Supabase API Key ในไฟล์ .env ก่อนใช้งานฟีเจอร์นี้
                     </div>
                  )}
                  <button
                    onClick={handleCreateCloudLink}
                    disabled={isCreating || !isSupabaseConfigured}
                    className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white py-2 rounded-lg font-medium text-sm transition-colors flex justify-center items-center gap-2"
                  >
                    {isCreating ? 'กำลังสร้าง...' : 'สร้างลิงก์สำหรับแชร์'}
                  </button>
                </div>
              )}
            </div>

            <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-4 text-slate-400 text-xs">หรือ</span>
                <div className="flex-grow border-t border-slate-200"></div>
            </div>

            {/* Option 2: File Download */}
            <button 
              onClick={handleDownloadJson}
              className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 py-3 rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2"
            >
              <Download size={18} /> ดาวน์โหลดไฟล์ (Backup)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;