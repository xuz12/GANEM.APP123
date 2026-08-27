import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Shield, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
// ✅ استيراد الشعار المفرغ المعتمد
import logo1 from '../../assets/logo3.svg';

export function AdminSignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      const { data: adminData, error: adminError } = await supabase
        .from('admins')
        .select('id, email, full_name, is_active')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (adminError || !adminData) {
        await supabase.auth.signOut();
        throw new Error('هذا الحساب ليس لديه صلاحيات الإدارة في نظام غانم');
      }

      if (!adminData.is_active) {
        await supabase.auth.signOut();
        throw new Error('حساب الإدارة الخاص بك معطل، يرجى التواصل مع الدعم');
      }

      await supabase
        .from('admins')
        .update({ last_login: new Date().toISOString() })
        .eq('id', authData.user.id);

      window.location.href = '?mode=admin';

    } catch (err: any) {
      console.error('Admin Sign-In Error:', err);
      setError(err.message || 'حدث خطأ أثناء الدخول للوحة الإدارة');
    } finally {
      setLoading(false);
    }
  };

  return (
    /* ✅ تطبيق الخلفية الخضراء الداكنة المعتمدة للإدارة #003837 */
    <div className="min-h-screen bg-[#003837] flex flex-col items-center justify-center p-6 font-almarai text-right" dir="rtl">
      
      {/* الجزء العلوي: شعار غانم الرسمي للإدارة */}
      <div className="text-center mb-10 relative group">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-green-500/10 blur-[60px] rounded-full"></div>
        <img src={logo1} className="w-40 h-auto object-contain relative z-10 mx-auto" alt="Ghanem Logo" />
        <div className="mt-4 relative z-10">
          <h1 className="text-3xl font-black text-white">لوحة الإدارة</h1>
          <p className="text-green-400 text-[10px] font-bold uppercase tracking-[0.3em] opacity-80 mt-1">Admin Management Portal</p>
        </div>
      </div>

      {/* كرت الدخول - تصميم زجاجي فاخر */}
      <div className="bg-white/10 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] w-full max-w-md">
        
        <div className="flex items-center justify-center gap-2 mb-8 bg-green-500/10 py-3 rounded-2xl border border-green-500/20">
            <Shield className="w-5 h-5 text-green-400" />
            <span className="text-sm font-bold text-white uppercase tracking-tighter">نظام الدخول الآمن للمسؤولين</span>
        </div>

        <form onSubmit={handleSignIn} className="space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-2xl mb-6 text-xs font-bold flex items-center gap-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest pr-2">البريد الإلكتروني للإدارة</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#002b2a] border border-white/5 rounded-2xl p-4 text-white outline-none focus:border-green-500/50 transition-all font-bold shadow-inner"
              placeholder="admin@ghanem.app"
              required
              dir="ltr"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest pr-2">كلمة المرور</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#002b2a] border border-white/5 rounded-2xl p-4 text-white outline-none focus:border-green-500/50 transition-all font-bold shadow-inner"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-500 hover:bg-green-400 text-black font-black py-4 rounded-2xl flex items-center justify-center gap-3 mt-6 shadow-lg shadow-green-500/20 active:scale-[0.98] transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>جاري التحقق...</span>
              </>
            ) : (
              'دخول المسؤولين'
            )}
          </button>
        </form>

        <div className="mt-10 pt-6 border-t border-white/5 text-center">
          <button
            onClick={() => window.location.href = '/'}
            className="text-gray-400 hover:text-white text-sm font-bold flex items-center justify-center gap-2 mx-auto transition-colors group"
          >
            العودة لتطبيق المشجعين <ArrowLeft className="w-4 h-4 rotate-180" />
          </button>
        </div>
      </div>

      <div className="mt-12 opacity-20 text-center">
        <p className="text-[9px] text-gray-400 font-black tracking-[0.4em] uppercase">Ghanem Management Core © 2026</p>
      </div>
    </div>
  );
}