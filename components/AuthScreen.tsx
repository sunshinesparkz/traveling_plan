import React, { useState } from 'react';
import { Database, Save, AlertCircle } from 'lucide-react';
import { configureSupabase } from '../services/supabaseService';

interface DatabaseConfigScreenProps {
  onConfigured: () => void;
}

const DatabaseConfigScreen: React.FC<DatabaseConfigScreenProps> = ({ onConfigured }) => {
  const [configUrl, setConfigUrl] = useState('');
  const [configKey, setConfigKey] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!configUrl || !configKey) {
        setError("กรุณากรอกข้อมูลให้ครบถ้วน");
        return;
    }
    configureSupabase(configUrl.trim(), configKey.trim());
    onConfigured();
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-teal-500 to-indigo-600 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 animate-fade-in-up relative">
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-amber-100">
             <Database size={32} className="text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">
            ตั้งค่า Database
          </h1>
          <p className="text-slate-500 text-sm">
            ระบบต้องการ Supabase URL และ API Key เพื่อบันทึกข้อมูลทริปออนไลน์
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4 border border-red-200 flex items-start gap-2">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSaveConfig} className="space-y-4">
            <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 text-xs text-amber-800 mb-4">
                1. สมัคร Supabase ฟรี <br/>
                2. สร้าง Project ใหม่ <br/>
                3. ไปที่ Project Settings &gt; API <br/>
                4. คัดลอกค่า <b>URL</b> และ <b>anon public key</b> มาใส่ที่นี่
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Project URL</label>
                <input
                    type="text"
                    required
                    value={configUrl}
                    onChange={(e) => setConfigUrl(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none transition-all text-sm font-mono"
                    placeholder="https://your-project.supabase.co"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Anon / Public Key</label>
                <input
                    type="password"
                    required
                    value={configKey}
                    onChange={(e) => setConfigKey(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500 outline-none transition-all text-sm font-mono"
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5..."
                />
            </div>
            <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-lg shadow-lg hover:shadow-amber-500/30 transition-all flex items-center justify-center gap-2 mt-4"
            >
                <Save size={20} /> บันทึกและเริ่มใช้งาน
            </button>
        </form>
      </div>
    </div>
  );
};

export default DatabaseConfigScreen;