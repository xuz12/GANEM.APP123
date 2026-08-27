import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  User, Mail, Phone, ShieldCheck, Save, Loader2, 
  ChevronDown, CreditCard, UserRoundX, AlertTriangle, Clock, CheckCircle2
} from 'lucide-react';

export function GhanemSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clubs, setClubs] = useState<{ id: string; name_ar: string }[]>([]);
  
  // حالات التحقق من الجوال
  const [isVerified, setIsVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    favorite_club_id: ''
  });

  useEffect(() => {
    async function loadInitialData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: clubsData } = await supabase
        .from('clubs')
        .select('id, name_ar')
        .order('name_ar');
      
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileData) {
        setFormData({
          full_name: profileData.full_name || '',
          email: user.email || '',
          phone: profileData.phone || '',
          favorite_club_id: profileData.favorite_club_id || ''
        });
        setIsVerified(profileData.is_phone_verified || false);
      }
      
      if (clubsData) setClubs(clubsData);
      setLoading(false);
    }
    loadInitialData();
  }, []);

  // ✅ إرسال كود التحقق
  const handleSendOtp = async () => {
    if (!formData.phone) return alert('يرجى إدخال رقم الجوال أولاً');
    setSaving(true);
    try {
      const formattedPhone = formData.phone.startsWith('+') ? formData.phone : `+966${formData.phone.replace(/^0/, '')}`;
      const { error } = await supabase.auth.signInWithOtp({ phone: formattedPhone });
      if (error) throw error;
      setOtpSent(true);
      alert('تم إرسال رمز التحقق إلى جوالك');
    } catch (err) {
      alert('حدث خطأ أثناء إرسال الرمز');
    } finally {
      setSaving(false);
    }
  };

  // ✅ تأكيد كود التحقق
  const handleVerifyOtp = async () => {
    setSaving(true);
    try {
      const formattedPhone = formData.phone.startsWith('+') ? formData.phone : `+966${formData.phone.replace(/^0/, '')}`;
      const { error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: otpCode,
        type: 'sms'
      });
      if (error) throw error;

      // تحديث الحالة في قاعدة البيانات
      await supabase
        .from('user_profiles')
        .update({ is_phone_verified: true, phone: formattedPhone })
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      setIsVerified(true);
      setOtpSent(false);
      alert('تم توثيق الجوال بنجاح ✅');
    } catch (err) {
      alert('رمز التحقق غير صحيح');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('user_profiles')
      .update({
        full_name: formData.full_name,
        phone: formData.phone,
        favorite_club_id: formData.favorite_club_id || null
      })
      .eq('user_id', user.id);

    if (!error) {
      alert('تم حفظ التغييرات بنجاح ✅');
    } else {
      alert('حدث خطأ أثناء الحفظ');
      console.error(error);
    }
    setSaving(false);
  };

  const handleCancelCard = async () => {
    if (window.confirm('هل أنت متأكد من إلغاء بطاقة المشجع؟ سيتم تعطيل رقم البطاقة الحالي ولن تتمكن من استخدام مميزاتها.')) {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('user_profiles')
        .update({ card_status: 'cancelled' })
        .eq('user_id', user?.id);

      if (!error) alert('تم إلغاء البطاقة بنجاح');
    }
  };

  const handleRequestDeletion = async () => {
    const confirmMessage = `تنبيه هام: سيتم تعطيل حسابك فوراً لمدة 30 يوماً قبل الحذف النهائي. هل أنت متأكد؟`;
    if (window.confirm(confirmMessage)) {
      setSaving(true);
      try {
        const { error } = await supabase.rpc('request_user_deletion');
        if (error) throw error;
        await supabase.auth.signOut();
        window.location.href = '/login';
      } catch (err) {
        alert('حدث خطأ أثناء معالجة الطلب');
      } finally {
        setSaving(false);
      }
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20 bg-[#003837] min-h-screen">
      <Loader2 className="w-10 h-10 text-[#05E59F] animate-spin" />
    </div>
  );

  return (
    <div className="p-6 bg-[#003837] min-h-screen font-almarai text-right pb-24" dir="rtl">
      <div className="flex flex-col items-center mb-10">
        <div className="w-12 h-12 rounded-2xl bg-[#05E59F]/10 flex items-center justify-center mb-4 border border-[#05E59F]/20">
            <User className="w-6 h-6 text-[#05E59F]" />
        </div>
        <h2 className="text-2xl font-black text-white leading-tight">إعدادات الحساب</h2>
        <p className="text-[#05E59F]/60 text-[10px] font-bold uppercase tracking-[4px] mt-1">Ghanem Settings</p>
      </div>
      
      <div className="space-y-6">
        {/* الاسم الكامل */}
        <div className="space-y-2">
          <label className="text-gray-400 text-xs font-bold pr-1">الاسم الكامل</label>
          <div className="relative group">
            <User className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-[#05E59F] transition-colors" />
            <input 
              className="w-full bg-[#002b2a] border border-white/5 rounded-2xl p-4 pr-12 text-white outline-none focus:border-[#05E59F]/50 transition-all font-bold shadow-inner"
              value={formData.full_name}
              onChange={(e) => setFormData({...formData, full_name: e.target.value})}
            />
          </div>
        </div>

        {/* رقم الجوال والتحقق */}
        <div className="space-y-2">
          <div className="flex justify-between items-center pr-1">
            <label className="text-gray-400 text-xs font-bold">رقم الجوال</label>
            {isVerified ? (
              <span className="flex items-center gap-1 text-[#05E59F] text-[10px] font-bold">
                <CheckCircle2 className="w-3 h-3" /> موثق
              </span>
            ) : (
              <button 
                onClick={handleSendOtp}
                className="text-orange-400 text-[10px] font-bold hover:underline"
              >
                تحقق الآن؟
              </button>
            )}
          </div>
          <div className="relative group">
            <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-[#05E59F] transition-colors" />
            <input 
              disabled={isVerified}
              className={`w-full bg-[#002b2a] border border-white/5 rounded-2xl p-4 pr-12 text-white outline-none focus:border-[#05E59F]/50 transition-all font-bold shadow-inner text-left ${isVerified ? 'opacity-60' : ''}`}
              dir="ltr"
              placeholder="05xxxxxxxx"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
            />
          </div>

          {/* حقل إدخال الـ OTP */}
          {otpSent && !isVerified && (
            <div className="mt-3 flex gap-2 animate-in fade-in slide-in-from-top-2">
              <input 
                className="flex-1 bg-[#05E59F]/5 border border-[#05E59F]/20 rounded-xl p-3 text-white text-center font-black tracking-widest outline-none focus:border-[#05E59F]"
                placeholder="رمز OTP"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                maxLength={6}
              />
              <button 
                onClick={handleVerifyOtp}
                className="bg-[#05E59F] text-black px-6 rounded-xl font-black text-xs active:scale-95 transition-all"
              >
                تأكيد
              </button>
            </div>
          )}
        </div>

        {/* النادي المفضل */}
        <div className="space-y-2">
          <label className="text-gray-400 text-xs font-bold pr-1">النادي المفضل</label>
          <div className="relative group">
            <ShieldCheck className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-[#05E59F] transition-colors" />
            <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
            <select 
              className="w-full bg-[#002b2a] border border-white/5 rounded-2xl p-4 pr-12 pl-10 text-white outline-none focus:border-[#05E59F]/50 transition-all appearance-none font-bold shadow-inner"
              value={formData.favorite_club_id}
              onChange={(e) => setFormData({...formData, favorite_club_id: e.target.value})}
            >
              <option value="" className="bg-[#003837]">اختر ناديك المفضل</option>
              {clubs.map(club => (
                <option key={club.id} value={club.id} className="bg-[#003837]">{club.name_ar}</option>
              ))}
            </select>
          </div>
        </div>

        {/* زر الحفظ */}
        <button 
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-[#05E59F] text-black font-black py-5 rounded-2xl flex items-center justify-center gap-3 mt-4 shadow-lg shadow-[#05E59F]/20 active:scale-[0.98] transition-all"
        >
          {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
          حفظ التغييرات
        </button>

        {/* قسم الإدارة المتقدمة */}
        <div className="mt-12 pt-8 border-t border-white/5 space-y-4">
          <div className="flex items-center gap-2 mb-2 pr-2">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <h3 className="text-white/40 text-[11px] font-black uppercase tracking-[3px]">إدارة الحساب</h3>
          </div>
          
          <button onClick={handleCancelCard} className="w-full flex items-center justify-between p-4 bg-orange-500/5 border border-orange-500/10 rounded-2xl text-orange-400/80 hover:bg-orange-500/10 transition-all group active:scale-95">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
              <span className="font-bold text-sm">إلغاء بطاقة المشجع</span>
            </div>
            <AlertTriangle className="w-4 h-4 opacity-30" />
          </button>

          <button onClick={handleRequestDeletion} className="w-full flex items-center justify-between p-4 bg-red-500/5 border border-red-500/10 rounded-2xl text-red-500/70 hover:bg-red-500/10 hover:text-red-500 transition-all group active:scale-95">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center">
                <UserRoundX className="w-4 h-4" />
              </div>
              <div className="text-right">
                <span className="font-bold text-sm block">حذف الحساب نهائياً</span>
                <div className="flex items-center gap-1 mt-0.5">
                   <Clock className="w-3 h-3 opacity-50" />
                   <span className="text-[9px] font-bold opacity-60">فترة سماح 30 يوم</span>
                </div>
              </div>
            </div>
          </button>
        </div>

        <p className="text-center text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-10 opacity-30">
            Ghanem Security & Privacy Protected
        </p>
      </div>
    </div>
  );
}