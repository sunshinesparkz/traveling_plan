import React from 'react';
import { Anchor, MapPin, Sparkles, ArrowRight } from 'lucide-react';

interface WelcomeScreenProps {
  onStart: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart }) => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-teal-500 to-blue-600 flex flex-col items-center justify-center text-white z-50 overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl"></div>

      <div className="max-w-md w-full px-6 text-center animate-fade-in-up relative z-10">
        <div className="mb-8 flex justify-center">
            <div className="w-28 h-28 bg-white/20 backdrop-blur-md rounded-[2rem] flex items-center justify-center shadow-2xl border border-white/30 transform rotate-3 hover:rotate-6 transition-transform duration-500">
                <Anchor size={56} className="text-white drop-shadow-lg" />
            </div>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold mb-4 drop-shadow-md tracking-tight font-display">
          Koh Larn Planner
        </h1>
        <p className="text-lg text-teal-50 mb-12 font-light leading-relaxed opacity-90">
          วางแผนทริปเกาะล้านกับเพื่อนๆ ได้ง่ายกว่าที่เคย <br className="hidden sm:block"/>
          จดที่พัก โหวต และให้ AI ช่วยเลือกสิ่งที่ดีที่สุด
        </p>

        <button 
          onClick={onStart}
          className="group relative bg-white text-teal-600 font-bold py-4 px-12 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center gap-3 mx-auto overflow-hidden ring-4 ring-white/30"
        >
          <span className="relative z-10 text-lg">เริ่มต้นใช้งาน</span>
          <ArrowRight className="relative z-10 group-hover:translate-x-1 transition-transform" />
          <div className="absolute inset-0 bg-teal-50 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>

        <div className="mt-16 grid grid-cols-3 gap-6 text-center text-sm text-white/80">
          <div className="flex flex-col items-center gap-2">
            <div className="p-2 bg-white/10 rounded-lg">
              <MapPin size={20} />
            </div>
            <span>ปักหมุดที่พัก</span>
          </div>
           <div className="flex flex-col items-center gap-2">
            <div className="p-2 bg-white/10 rounded-lg">
              <Sparkles size={20} />
            </div>
            <span>AI แนะนำ</span>
          </div>
           <div className="flex flex-col items-center gap-2">
            <div className="p-2 bg-white/10 rounded-lg">
              <Anchor size={20} />
            </div>
            <span>โหวตเลือก</span>
          </div>
        </div>
        
        <div className="mt-12 text-xs text-white/40 font-light">
          พร้อมสำหรับการพักผ่อนหรือยัง?
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
