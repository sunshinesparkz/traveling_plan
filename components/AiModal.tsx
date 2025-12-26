import React, { useState } from 'react';
import { Sparkles, X, Loader2 } from 'lucide-react';
import { AiSuggestionParams } from '../types';

interface AiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (params: AiSuggestionParams) => void;
  isLoading: boolean;
}

const AiModal: React.FC<AiModalProps> = ({ isOpen, onClose, onSearch, isLoading }) => {
  const [budget, setBudget] = useState('2000');
  const [people, setPeople] = useState('4');
  const [style, setStyle] = useState('ติดทะเล, ชิลๆ, ปิ้งย่างได้');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="fill-yellow-300 text-yellow-300" /> AI ผู้ช่วยหาที่พัก
            </h2>
            <p className="text-purple-100 text-sm mt-1">บอกความต้องการของคุณ ให้ Gemini ช่วยแนะนำ</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">งบประมาณต่อคืน (บาท)</label>
            <input
              type="text"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">จำนวนคน</label>
            <input
              type="text"
              value={people}
              onChange={(e) => setPeople(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">สไตล์ที่พัก / ความต้องการพิเศษ</label>
            <textarea
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none h-24 resize-none"
            />
          </div>

          <button
            onClick={() => onSearch({ budget, people, style })}
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" /> กำลังคิด...
              </>
            ) : (
              <>
                <Sparkles size={18} /> แนะนำที่พักให้หน่อย
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiModal;
