import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Mail, Lock, LogIn, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import logo1 from '../../assets/logo3.svg';

interface GhanemSignInProps {
  onSwitch: () => void;
}

export function GhanemSignIn({ onSwitch }: GhanemSignInProps) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. تسجيل الدخول باستخدام الدالة الموجودة في الـ Context
      // ننتظر اكتمال عملية الـ Auth أولاً
      await signIn(email, password);

      // 2. بعد النجاح، نجلب بيانات اليوزر الحالي
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // 3. التحقق من حالة التعطيل في جدول البروفايلات
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('is_deactivated')
          .eq('user_id', user.id)
          .single();

        if (profile?.is_deactivated) {
          const confirmRestore = window.confirm(
            'حسابك حالياً في طور الحذف (معطل مؤقتاً). هل تريد إلغاء طلب الحذف واستعادة حسابك الآن؟'
          );

          if (confirmRestore) {
            // 4. استعادة الحساب
            const { error: restoreError } = await supabase
              .from('user_profiles')
              .update({
                is_deactivated: false,
                deletion_requested_at: null
              })
              .eq('user_id', user.id);

            if (restoreError) throw new Error('فشل في استعادة الحساب');
            
            alert('تم استعادة حسابك بنجاح! أهلاً بك مجدداً.');
            // هنا السيستم بيدخله تلقائياً لأن الـ Session نشطة
          } else {
            // إذا رفض، نسجل خروجه فوراً
            await supabase.auth.signOut();
            setError('الحساب معطل. يجب الموافقة على الاستعادة للدخول.');
            setLoading(false);
            return;
          }
        }
      }
      
      // توجيه يدوي احتياطي في حال علّق التطبيق
      window.location.href = '/'; 

    } catch (err: any) {
      console.error("Login Error:", err);
      setError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
      // تسجيل خروج احتياطي في حال حدوث خطأ أثناء التحقق
      await supabase.auth.signOut();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#003837] flex flex-col items-center justify-center p-6 font-almarai" dir="rtl">
      <div className="w-full max-w-md">
        
        {/* اللوجو والترحيب */}
        <div className="text-center mb-12 relative group">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[#05E59F]/10 blur-[60px] rounded-full"></div>
          <img src={logo1} className="w-48 h-auto object-contain relative z-10 mx-auto transition-transform duration-700 group-hover:scale-110" alt="Ghanem Logo" />
          <div className="mt-6 relative z-10">
            <h1 className="text-4xl font-black text-white mb-2 tracking-tight">دخول الغانمين</h1>
            <p className="text-[#05E59F] text-xs font-bold uppercase tracking-[0.3em] opacity-80">Welcome Back Warrior</p>
          </div>
        </div>

        {/* كرت تسجيل الدخول */}
        <div className="bg-white/[0.03] backdrop-blur-xl rounded-[3rem] p-8 border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-2xl mb-6 text-right text-xs font-bold flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-right text-[10px] font-black text-gray-400 uppercase tracking-widest pr-2">البريد الإلكتروني</label>
              <div className="relative group">
                <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-[#05E59F] transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-12 py-4 bg-[#002b2a] border border-white/5 rounded-2xl focus:border-[#05E59F]/50 outline-none text-white font-bold transition-all dir-ltr"
                  placeholder="example@email.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-right text-[10px] font-black text-gray-400 uppercase tracking-widest pr-2">كلمة المرور</label>
              <div className="relative group">
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-[#05E59F] transition-colors" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-12 py-4 bg-[#002b2a] border border-white/5 rounded-2xl focus:border-[#05E59F]/50 outline-none text-white font-bold transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#05E59F] hover:shadow-[0_0_25px_rgba(5,229,159,0.3)] text-black font-black py-5 rounded-2xl transition-all disabled:opacity-70 flex items-center justify-center gap-3 active:scale-[0.97] mt-6"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-6 h-6 animate-spin" />
                  <span>جاري الدخول...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-6 h-6" />
                  تسجيل الدخول
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center border-t border-white/5 pt-6">
            <button onClick={onSwitch} className="text-gray-400 hover:text-white text-sm font-bold flex items-center justify-center gap-2 mx-auto group">
              ليس لديك حساب؟
              <span className="text-[#05E59F] font-black group-hover:underline">سجل الآن</span>
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake { animation: shake 0.4s ease-in-out; }
      `}</style>
    </div>
  );
}