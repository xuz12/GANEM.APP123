import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Users, Copy, CheckCircle, Gift, Loader } from 'lucide-react';
// ✅ استيراد الشعار المفرغ المعتمد
import logo1 from '../../assets/logo1.svg';

export function GhanemReferralsPage() {
  const { profile } = useAuth();
  const [copied, setCopied] = useState(false);
  const [referralCount, setReferralCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const referralCode = profile?.referral_code || '';
  const referralLink = `https://ghanem.app/signup?ref=${referralCode}`;

  useEffect(() => {
    if (!profile?.referral_code) return;

    const fetchReferralStats = async () => {
      setLoading(true);
      const { count, error } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('referred_by', referralCode);

      if (!error) {
        setReferralCount(count || 0);
      }
      setLoading(false);
    };

    fetchReferralStats();
  }, [profile]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    /* ✅ تطبيق الخلفية الداكنة المعتمدة #003837 */
    <div className="pb-24 bg-[#003837] min-h-screen font-almarai text-right" dir="rtl">
      <div className="p-6">
        
        {/* الهيدر مع اللوجو واللون الجديد */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#05E59F] flex items-center justify-center shadow-lg shadow-[#05E59F]/20">
              <Users className="w-6 h-6 text-black" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">شارك واربح</h1>
              <p className="text-[#05E59F] text-[10px] mt-0.5 uppercase font-bold tracking-wider">Bring your friends, get prizes</p>
            </div>
          </div>

          <div className="w-14 h-14 flex items-center justify-center">
            <img src={logo1} className="w-full h-full object-contain" alt="Ghanem Logo" />
          </div>
        </div>

        {/* بطاقة الكود الشخصي - تصميم زجاجي فاخر */}
        <div className="bg-[#002b2a] rounded-[2.5rem] p-8 border border-white/5 mb-8 shadow-2xl relative overflow-hidden text-center transition-transform active:scale-[0.99]">
          <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-[#05E59F]/5 blur-3xl rounded-full"></div>
          
          <div className="relative z-10">
            <p className="text-gray-300 text-sm mb-6 leading-relaxed">
              احصل على <span className="text-[#05E59F] font-black underline decoration-2 underline-offset-4">100 غنيمة</span> فورية عن كل صديق ينضم لغانم
            </p>
            
            <div className="bg-black/30 rounded-3xl p-6 border border-white/5 mb-8">
              <p className="text-[10px] text-gray-500 uppercase tracking-[0.3em] mb-3 font-black">كود الإحالة الخاص بك</p>
              <p className="text-4xl font-black text-[#05E59F] tracking-[0.2em] font-mono">
                {referralCode || '------'}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => handleCopy(referralCode)}
                className="w-full bg-[#05E59F] text-black font-black py-5 rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-[#05E59F]/20 active:scale-95 transition-all"
              >
                {copied ? <><CheckCircle className="w-5 h-5" /> تم النسخ!</> : <><Copy className="w-5 h-5" /> نسخ الكود</>}
              </button>

              <button
                onClick={() => handleCopy(referralLink)}
                className="w-full bg-white/5 border border-white/10 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all"
              >
                <Copy className="w-5 h-5 text-[#05E59F]" /> نسخ رابط التسجيل
              </button>
            </div>
          </div>
        </div>

        {/* الإحصائيات الفورية */}
        <div className="grid grid-cols-2 gap-4 mb-10">
          <div className="bg-[#002b2a] rounded-3xl p-6 border border-white/5 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-[#05E59F]/10 rounded-lg text-[#05E59F]"><Users size={18} /></div>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">الإحالات</p>
            </div>
            <p className="text-4xl font-black text-white">{referralCount}</p>
          </div>

          <div className="bg-[#002b2a] rounded-3xl p-6 border border-white/5 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-500"><Gift size={18} /></div>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">المكافآت</p>
            </div>
            <p className="text-4xl font-black text-[#05E59F]">{referralCount * 100}</p>
          </div>
        </div>

        {/* قائمة الأصدقاء المنضمين */}
        <div className="bg-[#002b2a] rounded-[2rem] p-6 border border-white/5 shadow-inner">
          <h3 className="text-base font-black text-white mb-6 flex items-center gap-3">
            <div className="w-1.5 h-1.5 bg-[#05E59F] rounded-full"></div>
            أحدث المنضمين عن طريقك
          </h3>

          {loading ? (
            <div className="py-8 flex flex-col items-center gap-3">
                <Loader className="w-6 h-6 animate-spin text-[#05E59F]" />
                <p className="text-xs text-gray-500 font-bold">جاري المزامنة...</p>
            </div>
          ) : referralCount === 0 ? (
            <div className="text-center py-12 bg-white/5 rounded-[1.5rem] border border-dashed border-white/10">
              <Users className="w-12 h-12 mx-auto mb-4 text-white/5" />
              <p className="text-gray-500 font-bold text-sm">لا يوجد مدعوون بعد</p>
            </div>
          ) : (
            <div className="bg-white/5 rounded-2xl p-5 text-center border border-[#05E59F]/10">
                <p className="text-sm text-[#05E59F] font-black">تم تسجيل {referralCount} صديق بنجاح ✅</p>
                <p className="text-[10px] text-gray-500 mt-1 uppercase font-bold">Thank you for sharing the passion</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}