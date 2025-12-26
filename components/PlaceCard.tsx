import React from 'react';
import { Trash2, ExternalLink, ThumbsUp, MapPin, ImageOff } from 'lucide-react';
import { Accommodation } from '../types';

interface PlaceCardProps {
  place: Accommodation;
  onVote: (id: string) => void;
  onDelete: (id: string) => void;
}

const PlaceCard: React.FC<PlaceCardProps> = ({ place, onVote, onDelete }) => {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 border border-slate-100 flex flex-col h-full group">
      
      {/* Image Section */}
      <div className="relative h-48 bg-slate-100 overflow-hidden group/image">
        {place.images && place.images.length > 0 ? (
           <div className="flex overflow-x-auto snap-x snap-mandatory h-full scrollbar-hide">
             {place.images.map((img, index) => (
               <img 
                 key={index}
                 src={img} 
                 alt={`${place.name} - ${index + 1}`}
                 className="w-full h-full object-cover shrink-0 snap-center"
                 onError={(e) => {
                   (e.target as HTMLImageElement).src = "https://via.placeholder.com/400x300?text=No+Image";
                 }}
               />
             ))}
             {place.images.length > 1 && (
               <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md backdrop-blur-sm">
                 +{place.images.length} รูป
               </div>
             )}
           </div>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400 flex-col gap-2">
            <ImageOff size={32} />
            <span className="text-sm">ไม่มีรูปภาพ</span>
          </div>
        )}
        
        {place.addedBy === 'ai' && (
            <span className="absolute top-2 right-2 bg-white/90 text-purple-600 text-xs px-2 py-1 rounded-full font-bold shadow-sm backdrop-blur-sm border border-purple-100">
              AI แนะนำ
            </span>
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-semibold text-slate-800 leading-tight">
            {place.name}
          </h3>
        </div>
        
        <div className="flex items-center text-teal-600 font-medium mb-3">
          <span className="text-lg">฿{place.price}</span>
          <span className="text-slate-400 text-sm ml-1">/ คืน</span>
        </div>

        <p className="text-slate-600 text-sm mb-4 line-clamp-3 bg-slate-50 p-3 rounded-lg border border-slate-100 flex-1">
          {place.notes || "ไม่มีบันทึกเพิ่มเติม"}
        </p>

        <div className="flex gap-2 flex-wrap mb-2">
          <a 
            href={place.link} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex-1 inline-flex justify-center items-center text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-800 text-sm py-2 px-3 rounded-lg transition-colors"
          >
            <ExternalLink size={16} className="mr-1" /> รายละเอียด
          </a>
          {place.locationLink && place.locationLink !== '#' && (
            <a 
              href={place.locationLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex-1 inline-flex justify-center items-center text-blue-600 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 text-sm py-2 px-3 rounded-lg transition-colors border border-blue-100"
            >
              <MapPin size={16} className="mr-1" /> แผนที่
            </a>
          )}
        </div>
      </div>

      <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex justify-between items-center">
        <button
          onClick={() => onVote(place.id)}
          className="flex items-center space-x-2 text-slate-600 hover:text-teal-600 transition-colors group/vote"
        >
          <div className="p-2 rounded-full bg-white border border-slate-200 group-hover/vote:border-teal-400 group-hover/vote:bg-teal-50 transition-all">
            <ThumbsUp size={18} className={place.votes > 0 ? "fill-teal-500 text-teal-500" : ""} />
          </div>
          <span className="font-semibold text-lg">{place.votes}</span>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(place.id);
          }}
          className="text-red-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-colors flex items-center gap-1"
          title="ลบรายการ"
        >
          <Trash2 size={18} />
          <span className="text-sm font-medium">ลบ</span>
        </button>
      </div>
    </div>
  );
};

export default PlaceCard;