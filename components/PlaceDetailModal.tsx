import React, { useState } from 'react';
import { X, MapPin, ExternalLink, ImageOff, ChevronLeft, ChevronRight } from 'lucide-react';
import { Accommodation } from '../types';

interface PlaceDetailModalProps {
  place: Accommodation | null;
  onClose: () => void;
}

const PlaceDetailModal: React.FC<PlaceDetailModalProps> = ({ place, onClose }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!place) return null;

  const hasImages = place.images && place.images.length > 0;

  const nextImage = () => {
    if (hasImages) {
      setCurrentImageIndex((prev) => (prev + 1) % place.images.length);
    }
  };

  const prevImage = () => {
    if (hasImages) {
      setCurrentImageIndex((prev) => (prev - 1 + place.images.length) % place.images.length);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in-up">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden relative max-h-[90vh] flex flex-col">
        
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
        >
          <X size={24} />
        </button>

        {/* Image Gallery Section */}
        <div className="relative h-64 sm:h-80 bg-slate-900 flex items-center justify-center shrink-0">
          {hasImages ? (
            <>
              <img 
                src={place.images[currentImageIndex]} 
                alt={`${place.name} - ${currentImageIndex + 1}`}
                className="w-full h-full object-contain"
              />
              
              {place.images.length > 1 && (
                <>
                  <button 
                    onClick={(e) => { e.stopPropagation(); prevImage(); }}
                    className="absolute left-4 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-colors"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); nextImage(); }}
                    className="absolute right-4 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-colors"
                  >
                    <ChevronRight size={24} />
                  </button>
                  <div className="absolute bottom-4 bg-black/50 text-white text-xs px-3 py-1 rounded-full">
                    {currentImageIndex + 1} / {place.images.length}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center text-slate-500">
              <ImageOff size={48} />
              <span className="mt-2 text-sm">ไม่มีรูปภาพ</span>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-6 sm:p-8 overflow-y-auto">
          <div className="flex justify-between items-start mb-4">
            <div>
               <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 leading-tight mb-2">
                 {place.name}
               </h2>
               <div className="flex items-center gap-2 text-teal-600 font-semibold text-lg sm:text-xl">
                 <span>฿{place.price}</span>
                 <span className="text-slate-400 text-sm font-normal">/ คืน</span>
               </div>
            </div>
            {place.addedBy === 'ai' && (
               <span className="bg-purple-100 text-purple-700 text-xs px-3 py-1 rounded-full font-bold border border-purple-200">
                 AI Suggestion
               </span>
            )}
          </div>

          <div className="prose prose-slate max-w-none mb-8">
            <h3 className="text-lg font-semibold text-slate-700 mb-2">รายละเอียด / บันทึก</h3>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-slate-600 whitespace-pre-line leading-relaxed">
              {place.notes || "ไม่มีรายละเอียดเพิ่มเติม"}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <a 
              href={place.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-white border-2 border-slate-200 hover:border-teal-500 hover:text-teal-600 text-slate-700 font-semibold py-3 px-4 rounded-xl transition-all"
            >
              <ExternalLink size={20} /> เว็บไซต์ / เพจที่พัก
            </a>
            {place.locationLink && place.locationLink !== '#' && (
              <a 
                href={place.locationLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-blue-50 text-blue-600 hover:bg-blue-100 font-semibold py-3 px-4 rounded-xl transition-all border border-blue-100"
              >
                <MapPin size={20} /> ดูแผนที่ Google Maps
              </a>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default PlaceDetailModal;