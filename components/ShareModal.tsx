import React, { useState, useEffect } from 'react';
import { X, Cloud, Link as LinkIcon, Check, Settings, ShieldAlert } from 'lucide-react';
import { Accommodation, TripDetails } from '../types';
import { configDetails } from '../services/supabaseService';

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
  const [includeConfig, setIncludeConfig] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  // Determine if we can share keys (Only if source is 'local')
  const canShareKeys = configDetails.source === 'local';

  useEffect(() => {
    if (isOpen) {
        generateUrl();
    }
  }, [isOpen, includeConfig, currentTripId]);

  const generateUrl = () => {
    let url = window.location.href.split('?')[0]; // Base URL
    const params = new URLSearchParams();

    if (currentTripId) {
        params.set('tripId', currentTripId);
    }

    if (includeConfig && canShareKeys && configDetails.url && configDetails.key) {
        // Create a simple Base64 encoded JSON string of the credentials
        const configString = JSON.stringify({
            url: configDetails.url,
            key: configDetails.key
        });
        params.set('ConnectConfig', btoa(configString));
    }

    // Reconstruct URL
    const finalUrl = `${url}?${params.toString()}`;
    setShareUrl(finalUrl);
  };

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
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
            ส่งลิงก์นี้ให้เพื่อนเพื่อดูและแก้ไขรายการที่พักร่วมกัน
          </p>

          <div className="space-y-4">
            
            {/* Database Config Option */}
            {canShareKeys && currentTripId && (
                <div className={`p-3 rounded-lg border transition-all ${includeConfig ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
                    <label className="flex items-start gap-3 cursor-pointer">
                        <div className="relative flex items-center mt-1">
                            <input 
                                type="checkbox" 
                                checked={includeConfig} 
                                onChange={(e) => setIncludeConfig(e.target.checked)}
                                className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                            />
                        </div>
                        <div>
                            <span className="font-semibold text-sm text-slate-700 block">แนบการตั้งค่า Database ไปด้วย</span>
                            <span className="text-xs text-slate-500 block mt-1">
                                เพื่อนที่เปิดลิงก์นี้จะเชื่อมต่อ Database เดียวกับคุณอัตโนมัติ โดยไม่ต้องตั้งค่าเอง
                            </span>
                        </div>
                    </label>
                    {includeConfig && (
                        <div className="mt-2 flex items-start gap-2 text-xs text-amber-700 bg-amber-100 p-2 rounded">
                            <ShieldAlert size={14} className="shrink-0 mt-0.5" />
                            <span>คำเตือน: ลิงก์นี้จะมี Key ของ Database คุณอยู่ ห้ามแชร์ในที่สาธารณะ ส่งให้เพื่อนที่ไว้ใจเท่านั้น</span>
                        </div>
                    )}
                </div>
            )}

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h3 className="font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <LinkIcon size={18} /> ลิงก์สำหรับแชร์
              </h3>
              
              {currentTripId ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input 
                      readOnly 
                      value={shareUrl} 
                      className="w-full text-sm bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-600 truncate focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                    />
                    <button 
                      onClick={handleCopyLink}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${copySuccess ? 'bg-green-500 text-white shadow-green-200' : 'bg-slate-800 text-white hover:bg-slate-900 shadow-lg'}`}
                    >
                      {copySuccess ? 'คัดลอกแล้ว' : 'คัดลอก'}
                    </button>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-green-600 mt-2">
                     <Check size={12} /> {includeConfig ? 'ลิงก์พร้อมตั้งค่า Database อัตโนมัติ' : 'ลิงก์สำหรับดูข้อมูลทริป'}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-slate-500 text-sm">
                    กรุณาเพิ่มที่พักอย่างน้อย 1 รายการเพื่อเริ่มสร้างทริป
                </div>
              )}
            </div>
            
             <div className="text-center text-xs text-slate-400">
                * ข้อมูลทั้งหมดจะถูก Sync แบบ Real-time
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;