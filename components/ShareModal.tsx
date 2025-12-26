import React, { useState } from 'react';
import { X, Cloud, Link as LinkIcon, Check, QrCode } from 'lucide-react';
import { Accommodation, TripDetails } from '../types';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  places: Accommodation[];
  tripDetails: TripDetails | null;
  currentTripId: string | null;
  onTripCreated: (id: string) => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, currentTripId }) => {
  const [copySuccess, setCopySuccess] = useState(false);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in-up">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
          <X size={24} />
        </button>

        <div className="p-6">
          <h2 className="text-2xl font-bold text-slate-800 mb-2 flex items-center gap-2">
            <Cloud className="text-teal-500" /> แชร์ทริปให้เพื่อน
          </h2>
          <p className="text-slate-500 mb-6 text-sm">
            ส่งลิงก์นี้ให้เพื่อนเพื่อดูและแก้ไขรายการที่พักร่วมกัน (Real-time)
          </p>

          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h3 className="font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <LinkIcon size={18} /> ลิงก์สำหรับแชร์
              </h3>
              
              {currentTripId ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input 
                      readOnly 
                      value={window.location.href} 
                      className="w-full text-sm bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-600 truncate focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <button 
                      onClick={handleCopyLink}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${copySuccess ? 'bg-green-500 text-white shadow-green-200' : 'bg-slate-800 text-white hover:bg-slate-900 shadow-lg'}`}
                    >
                      {copySuccess ? 'คัดลอกแล้ว' : 'คัดลอก'}
                    </button>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-green-600 mt-2">
                     <Check size={12} /> ข้อมูลถูกบันทึกบน Cloud เรียบร้อยแล้ว
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-slate-500 text-sm">
                    กรุณาเพิ่มที่พักอย่างน้อย 1 รายการเพื่อเริ่มสร้างทริป
                </div>
              )}
            </div>
            
             <div className="text-center text-xs text-slate-400">
                * ใครที่มีลิงก์นี้สามารถแก้ไขข้อมูลได้
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;