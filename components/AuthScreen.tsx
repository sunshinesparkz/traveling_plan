import React, { useState } from 'react';
import { Mail, Lock, LogIn, UserPlus, Loader2, ArrowRight } from 'lucide-react';
import { signIn, signUp } from '../services/supabaseService';

interface AuthScreenProps {
  onAuthSuccess: () => void;
  onSkip: () => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess, onSkip }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
      onAuthSuccess();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-teal-500 to-indigo-600 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 animate-fade-in-up">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            {isLogin ? 'เข้าสู่ระบบ' : 'สร้างบัญชีใหม่'}
          </h1>
          <p className="text-slate-500">
            {isLogin 
              ? 'เพื่อเข้าถึงข้อมูลทริปของคุณจากทุกอุปกรณ์' 
              : 'สมัครสมาชิกเพื่อบันทึกข้อมูลทริปบน Cloud'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 text-sm p-3 rounded-lg mb-4 border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">อีเมล</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                placeholder="name@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">รหัสผ่าน</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                placeholder="••••••••"
                minLength={6}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-lg shadow-lg hover:shadow-teal-500/30 transition-all flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : isLogin ? (
              <> <LogIn size={20} /> เข้าสู่ระบบ </>
            ) : (
              <> <UserPlus size={20} /> สมัครสมาชิก </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-600">
          {isLogin ? 'ยังไม่มีบัญชี?' : 'มีบัญชีอยู่แล้ว?'}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            className="text-teal-600 font-bold ml-1 hover:underline"
          >
            {isLogin ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}
          </button>
        </div>
        
        <div className="relative flex py-5 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-4 text-slate-400 text-xs">หรือ</span>
            <div className="flex-grow border-t border-slate-200"></div>
        </div>

        <button 
          onClick={onSkip}
          className="w-full text-slate-500 hover:text-slate-700 font-medium text-sm flex items-center justify-center gap-1 hover:bg-slate-50 py-2 rounded-lg transition-colors"
        >
          ใช้งานแบบไม่ล็อกอิน (Guest) <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};

export default AuthScreen;