import React, { useState } from 'react';
import { X, Mail, Lock, LogIn, UserPlus, Loader2, AlertCircle, User } from 'lucide-react';
import { signIn, signUp } from '../services/supabaseService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isLogin) {
        await signIn(email, password);
        onAuthSuccess();
        onClose();
      } else {
        if (!username.trim()) {
            setError('กรุณาระบุชื่อผู้ใช้ (Display Name)');
            setIsLoading(false);
            return;
        }
        await signUp(email, password, username);
        alert('สมัครสมาชิกสำเร็จ! กรุณาล็อกอิน');
        setIsLogin(true);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in-up">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
          <X size={24} />
        </button>

        <div className="p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-slate-800">
              {isLogin ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              {isLogin ? 'เพื่อเข้าถึงข้อมูลทริปของคุณ' : 'สร้างบัญชีเพื่อเก็บข้อมูลถาวร'}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg mb-4 flex gap-2 items-start">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">ชื่อผู้ใช้ (Display Name)</label>
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
              <label className="block text-sm font-medium text-slate-700 mb-1">อีเมล</label>
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-lg shadow-lg transition-all flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : isLogin ? (
                <><LogIn size={20} /> เข้าสู่ระบบ</>
              ) : (
                <><UserPlus size={20} /> สมัครสมาชิก</>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => { setIsLogin(!isLogin); setError(null); }}
              className="text-sm text-teal-600 hover:text-teal-800 font-medium hover:underline"
            >
              {isLogin ? 'ยังไม่มีบัญชี? สมัครสมาชิก' : 'มีบัญชีแล้ว? เข้าสู่ระบบ'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;