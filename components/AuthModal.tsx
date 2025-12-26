import React, { useState } from 'react';
import { X, Mail, Lock, LogIn, UserPlus, Loader2, AlertCircle, User, KeyRound, ArrowLeft } from 'lucide-react';
import { signIn, signUp, resetPasswordForEmail } from '../services/supabaseService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: () => void;
}

type AuthView = 'login' | 'signup' | 'forgot_password';

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [view, setView] = useState<AuthView>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (view === 'login') {
        await signIn(email, password);
        onAuthSuccess();
        onClose();
      } else if (view === 'signup') {
        if (!username.trim()) {
            setError('กรุณาระบุชื่อผู้ใช้ (Display Name)');
            setIsLoading(false);
            return;
        }
        await signUp(email, password, username);
        setSuccessMsg('สมัครสมาชิกสำเร็จ! กรุณาตรวจสอบอีเมลเพื่อยืนยันตัวตน (ถ้ามี) หรือล็อกอินได้เลย');
        setTimeout(() => {
            setView('login');
            setSuccessMsg(null);
        }, 2000);
      } else if (view === 'forgot_password') {
        await resetPasswordForEmail(email);
        setSuccessMsg('ระบบได้ส่งลิงก์รีเซ็ตรหัสผ่านไปที่อีเมลของคุณแล้ว');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setIsLoading(false);
    }
  };

  const switchView = (newView: AuthView) => {
      setView(newView);
      setError(null);
      setSuccessMsg(null);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in-up">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 z-10">
          <X size={24} />
        </button>

        <div className="p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-slate-800">
              {view === 'login' && 'เข้าสู่ระบบ'}
              {view === 'signup' && 'สมัครสมาชิก'}
              {view === 'forgot_password' && 'กู้คืนรหัสผ่าน'}
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              {view === 'login' && 'เข้าถึงข้อมูลทริปของคุณได้ตลอดไป'}
              {view === 'signup' && 'สร้างบัญชีเพื่อเก็บข้อมูลถาวร'}
              {view === 'forgot_password' && 'กรอกอีเมลเพื่อรับลิงก์ตั้งรหัสใหม่'}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg mb-4 flex gap-2 items-start">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          {successMsg && (
            <div className="bg-green-50 text-green-700 text-xs p-3 rounded-lg mb-4 flex gap-2 items-start">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {view === 'signup' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">ชื่อผู้ใช้ (สำหรับแสดงผล)</label>
                  <div className="relative">
                    <User size={18} className="absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none"
                      placeholder="เช่น น้องมาร์ค เกาะล้าน"
                    />
                  </div>
                </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                  อีเมล {view === 'login' && <span className="text-xs text-slate-400 font-normal">(ใช้สำหรับ Login)</span>}
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            {view !== 'forgot_password' && (
                <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">รหัสผ่าน</label>
                <div className="relative">
                    <Lock size={18} className="absolute left-3 top-3 text-slate-400" />
                    <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none"
                    placeholder="••••••••"
                    minLength={6}
                    />
                </div>
                </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-lg shadow-lg transition-all flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : view === 'login' ? (
                <><LogIn size={20} /> เข้าสู่ระบบ</>
              ) : view === 'signup' ? (
                <><UserPlus size={20} /> สมัครสมาชิก</>
              ) : (
                <><KeyRound size={20} /> ส่งลิงก์กู้คืนรหัสผ่าน</>
              )}
            </button>
          </form>

          <div className="mt-6 flex flex-col gap-2 text-center text-sm">
            {view === 'login' && (
                <>
                    <button
                        onClick={() => switchView('forgot_password')}
                        className="text-slate-400 hover:text-slate-600"
                    >
                        ลืมรหัสผ่าน?
                    </button>
                    <div className="border-t border-slate-100 pt-3 mt-1">
                        <span className="text-slate-500">ยังไม่มีบัญชี? </span>
                        <button
                            onClick={() => switchView('signup')}
                            className="text-teal-600 hover:text-teal-800 font-bold hover:underline"
                        >
                            สมัครสมาชิกเลย
                        </button>
                    </div>
                </>
            )}

            {view === 'signup' && (
                <div className="border-t border-slate-100 pt-3 mt-1">
                    <span className="text-slate-500">มีบัญชีแล้ว? </span>
                    <button
                        onClick={() => switchView('login')}
                        className="text-teal-600 hover:text-teal-800 font-bold hover:underline"
                    >
                        เข้าสู่ระบบ
                    </button>
                </div>
            )}

            {view === 'forgot_password' && (
                <button
                    onClick={() => switchView('login')}
                    className="text-slate-500 hover:text-slate-700 flex items-center justify-center gap-1"
                >
                    <ArrowLeft size={14} /> กลับไปหน้าเข้าสู่ระบบ
                </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;