import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { LogIn, Mail, Lock, Loader2, ShieldCheck } from 'lucide-react';
import logo1 from '../../assets/logo3.svg';

export function StaffSignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. تسجيل الدخول عبر Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // 2. التحقق هل المستخدم موجود في جدول الـ admins ونشط؟
      const { data: adminData, error: adminError } = await supabase
        .from('admins')
        .select('is_active')
        .eq('id', authData.user.id)
        .eq('is_active', true)
        .single();

      if (adminError || !adminData) {
        // إذا لم يكن مسؤولاً، نسجل خروجه فوراً ونظهر خطأ
        await supabase.auth.signOut();
        throw new Error('عفواً، لا تملك صلاحيات الوصول لمنظومة الستاف.');
      }

      // 3. إذا كل شيء تمام، نحدث الصفحة ليدخل على المود
      window.location.reload(); 

    } catch (err: any) {
      setError(err.message || 'خطأ في عملية تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-[#003837] flex flex-col items-center justify-center p-6 font-almarai">
      {/* هالة توهج خلفية */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#05E59F]/5 via-transparent to-transparent opacity-40"></div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <img src={logo1} className="w-32 h-auto mx-auto mb-6 animate-ghanem-reveal" alt="Ghanem" />
          <h1 className="text-2xl font-black text-white tracking-tight">بوابة المنظمين</h1>
          <p className="text-[#05E59F] text-[10px] font-black uppercase tracking-[0.3em] mt-2 opacity-60">Staff Authentication Node</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl text-red-500 text-sm font-bold text-center animate-shake">
              {error}
            </div>
          )}

          <div className="relative group">
            <Mail className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-[#05E59F] transition-colors" />
            <input
              type="email"
              placeholder="البريد الإلكتروني للستاف"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full pr-14 pl-6 py-5 bg-[#002b2a] border border-white/5 rounded-2xl text-white outline-none focus:border-[#05E59F]/30 transition-all font-bold placeholder:text-gray-700 shadow-inner"
            />
          </div>

          <div className="relative group">
            <Lock className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-[#05E59F] transition-colors" />
            <input
              type="password"
              placeholder="كلمة المرور"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full pr-14 pl-6 py-5 bg-[#002b2a] border border-white/5 rounded-2xl text-white outline-none focus:border-[#05E59F]/30 transition-all font-bold placeholder:text-gray-700 shadow-inner"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#05E59F] text-black py-5 rounded-[1.5rem] font-black text-lg transition-all hover:shadow-[0_0_20px_rgba(5,229,159,0.3)] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {loading ? <Loader2 className="animate-spin" /> : <ShieldCheck size={20} />}
            {loading ? 'جاري التحقق...' : 'تسجيل الدخول للنظام'}
          </button>
        </form>

        <p className="mt-10 text-center text-[10px] text-gray-600 font-bold uppercase tracking-widest">
          Ghanem Intelligence System • Secure Access
        </p>
      </div>

      <style>{`
        @keyframes ghanem-reveal { 0%, 100% { transform: scale(1); opacity: 0.8; } 50% { transform: scale(1.05); opacity: 1; } }
        .animate-ghanem-reveal { animation: ghanem-reveal 3s ease-in-out infinite; }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
        .animate-shake { animation: shake 0.2s ease-in-out; }
      `}</style>
    </div>
  );
}
