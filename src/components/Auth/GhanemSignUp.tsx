import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { User, Mail, Lock, UserPlus, Loader2, ArrowRight, Gift, Phone, Calendar, ShieldCheck } from 'lucide-react';
import logo1 from '../../assets/logo3.svg';

interface GhanemSignUpProps {
  onSwitch: () => void;
}

export function GhanemSignUp({ onSwitch }: GhanemSignUpProps) {
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // ✅ حالة الموافقة على سياسة الخصوصية
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  const privacyPolicyUrl = "https://dodnjkqtqzxepzmdrdou.supabase.co/storage/v1/object/public/public-docs/privacy_policy.pdf";

  // ✅ دالة التحقق من العمر (18+)
  const validateAge = (date: string) => {
    if (!date) return false;
    const today = new Date();
    const birth = new Date(date);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age >= 18;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!privacyAccepted) {
      setError('يرجى الموافقة على سياسة الخصوصية للمتابعة');
      return;
    }

    if (!validateAge(birthDate)) {
      setError('عذراً، يجب أن يكون عمرك 18 سنة أو أكثر للتسجيل');
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password, fullName, referralCode);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const formattedPhone = phone.startsWith('+') ? phone : `+966${phone.replace(/^0/, '')}`;
        
        await supabase
          .from('user_profiles')
          .update({
            phone: formattedPhone,
            birth_date: birthDate,
            is_phone_verified: false 
          })
          .eq('user_id', user.id);
      }

    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء التسجيل');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#003837] flex flex-col items-center justify-center p-6 font-almarai" dir="rtl">
      <div className="w-full max-w-md py-10">
        
        <div className="text-center mb-10 relative group">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[#05E59F]/10 blur-[60px] rounded-full"></div>
          <img src={logo1} className="w-48 h-auto object-contain relative z-10 mx-auto transition-transform duration-700 group-hover:scale-110" alt="Ghanem Logo" />
          <div className="mt-6 relative z-10">
            <h1 className="text-4xl font-black text-white mb-2 tracking-tight">انضم للغانمين</h1>
            <p className="text-[#05E59F] text-xs font-bold uppercase tracking-[0.3em] opacity-80">Start Your Legend Today</p>
          </div>
        </div>

        <div className="bg-white/[0.03] backdrop-blur-xl rounded-[3rem] p-8 border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-2xl mb-6 text-right text-xs font-bold animate-shake">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest pr-2">الاسم الكامل</p>
              <div className="relative group">
                <User className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-[#05E59F] transition-colors" />
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full px-12 py-4 bg-[#002b2a] border border-white/5 rounded-2xl focus:border-[#05E59F]/50 outline-none text-white font-bold transition-all placeholder-gray-600 shadow-inner" placeholder="أدخل اسمك الكامل" required />
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest pr-2">البريد الإلكتروني</p>
              <div className="relative group">
                <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-[#05E59F] transition-colors" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-12 py-4 bg-[#002b2a] border border-white/5 rounded-2xl focus:border-[#05E59F]/50 outline-none text-white font-bold transition-all placeholder-gray-600 shadow-inner dir-ltr" placeholder="example@email.com" required />
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest pr-2">رقم الجوال</p>
              <div className="relative group">
                <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-[#05E59F] transition-colors" />
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-12 py-4 bg-[#002b2a] border border-white/5 rounded-2xl focus:border-[#05E59F]/50 outline-none text-white font-bold transition-all placeholder-gray-600 shadow-inner dir-ltr" placeholder="05xxxxxxxx" required />
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest pr-2">تاريخ الميلاد</p>
              <div className="relative group">
                <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-[#05E59F] transition-colors" />
                <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className="w-full px-12 py-4 bg-[#002b2a] border border-white/5 rounded-2xl focus:border-[#05E59F]/50 outline-none text-white font-bold transition-all shadow-inner dir-ltr" required />
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest pr-2">كلمة المرور</p>
              <div className="relative group">
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-[#05E59F] transition-colors" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-12 py-4 bg-[#002b2a] border border-white/5 rounded-2xl focus:border-[#05E59F]/50 outline-none text-white font-bold transition-all placeholder-gray-600 shadow-inner" placeholder="••••••••" required minLength={6} />
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-[#05E59F] text-[10px] font-black uppercase tracking-widest pr-2">كود الإحالة (اختياري)</p>
              <div className="relative group">
                <Gift className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#05E59F]/50 group-focus-within:text-[#05E59F] transition-colors" />
                <input type="text" value={referralCode} onChange={(e) => setReferralCode(e.target.value.toUpperCase())} className="w-full px-12 py-4 bg-[#05E59F]/5 border border-[#05E59F]/20 rounded-2xl focus:border-[#05E59F]/50 outline-none text-[#05E59F] font-black transition-all placeholder-[#05E59F]/20 font-mono tracking-widest" placeholder="CODE2026" />
              </div>
            </div>

            {/* ✅ سياسة الخصوصية */}
            <div 
              className="flex items-center gap-3 px-2 py-2 cursor-pointer group" 
              onClick={() => setPrivacyAccepted(!privacyAccepted)}
            >
              <div className={`w-5 h-5 rounded-lg border transition-all flex items-center justify-center ${privacyAccepted ? 'bg-[#05E59F] border-[#05E59F]' : 'bg-white/5 border-white/10 group-hover:border-[#05E59F]/50'}`}>
                {privacyAccepted && <ShieldCheck className="w-3.5 h-3.5 text-black" />}
              </div>
              <p className="text-[10px] text-gray-400 font-bold leading-tight">
                أوافق على <a href={privacyPolicyUrl} target="_blank" rel="noopener noreferrer" className="text-[#05E59F] hover:underline" onClick={(e) => e.stopPropagation()}>سياسة الخصوصية</a> وشروط استخدام نظام غانم
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !privacyAccepted}
              className={`w-full bg-[#05E59F] text-black font-black py-5 rounded-2xl transition-all flex items-center justify-center gap-3 active:scale-[0.97] mt-2 ${(!privacyAccepted || loading) ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:shadow-[0_0_25px_rgba(5,229,159,0.3)]'}`}
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <><UserPlus className="w-6 h-6" /> إنشاء حساب جديد </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center border-t border-white/5 pt-6">
            <button onClick={onSwitch} className="text-gray-400 hover:text-white text-sm font-bold flex items-center justify-center gap-2 mx-auto transition-colors group">
              لديك حساب بالفعل؟ <span className="text-[#05E59F] font-black group-hover:underline decoration-2 underline-offset-4">سجل دخولك</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}