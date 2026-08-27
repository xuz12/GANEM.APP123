import { useState, useEffect } from 'react';
import { Smartphone, Nfc, QrCode, CheckCircle, AlertCircle, Loader, Download, ShieldCheck, Zap } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { UserQRCode } from './UserQRCode';
import logo from '../../assets/logo1.svg'; 

interface NFCIdentifier {
  id: string;
  nfc_uid: string;
  wallet_type: 'apple' | 'android';
  pass_id: string;
  is_active: boolean;
  created_at: string;
}

export default function GhanemDigitalCardPage() {
  const { user, profile } = useAuth();
  const [nfcIdentifier, setNfcIdentifier] = useState<NFCIdentifier | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNFCIdentifier();
    }
  }, [user]);

  // دالة تحديد مظهر البطاقة بناءً على النقاط مع نصوص بيضاء صريحة ✅
  const getCardTheme = (points: number) => {
    if (points >= 5000) return { 
      name: 'غانم إيليت', 
      gradient: 'from-[#05E59F] via-[#003837] to-black', 
      text: 'text-white', 
      label: 'text-white/60',
      icon: 'text-[#05E59F]' 
    };
    if (points >= 2000) return { 
      name: 'غانم بلس', 
      gradient: 'from-orange-500 via-red-600 to-[#003837]', 
      text: 'text-white', 
      label: 'text-white/60',
      icon: 'text-orange-400' 
    };
    if (points >= 500) return { 
      name: 'غانم', 
      gradient: 'from-blue-600 via-indigo-800 to-[#003837]', 
      text: 'text-white', 
      label: 'text-white/60',
      icon: 'text-blue-400' 
    };
    return { 
      name: 'مبتدئ', 
      gradient: 'from-gray-700 via-gray-900 to-[#003837]', 
      text: 'text-white', 
      label: 'text-white/50',
      icon: 'text-gray-500' 
    };
  };

  const cardTheme = getCardTheme(profile?.points || 0);

  const fetchNFCIdentifier = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('nfc_identifiers')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (!error) setNfcIdentifier(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAppleWalletPass = async () => {
    if (!user) return;
    setIsGenerating(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/issue-apple-pass`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: user.id }),
      });
      const result = await response.json();
      if (result.success) {
        setMessage({ type: 'success', text: 'تم إنشاء البطاقة بنجاح' });
        await fetchNFCIdentifier();
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'فشل إنشاء البطاقة' });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateAndroidNFC = async () => {
    if (!user) return;
    setIsGenerating(true);
    try {
      const { error } = await supabase.from('nfc_identifiers').insert({
        user_id: user.id,
        nfc_uid: crypto.randomUUID(),
        wallet_type: 'android',
        pass_id: `android.ghanem.${user.id}`,
        is_active: true,
      });
      if (!error) {
        setMessage({ type: 'success', text: 'تم تفعيل NFC بنجاح' });
        await fetchNFCIdentifier();
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'فشل التفعيل' });
    } finally {
      setIsGenerating(false);
    }
  };

  const platform = /iPad|iPhone|iPod/.test(navigator.userAgent) ? 'ios' : 'android';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#003837]">
        <Loader className="w-10 h-10 animate-spin text-[#05E59F]" />
      </div>
    );
  }

  return (
    <div className="pb-24 p-6 bg-[#003837] min-h-screen font-almarai text-right" dir="rtl">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-white">بطاقتي الرقمية</h2>
        <p className="text-[#05E59F] text-xs mt-1 uppercase tracking-widest font-black">Ghanem Digital ID</p>
      </div>

      {/* 💳 بطاقة غانم الذكية */}
      <div className={`relative overflow-hidden bg-gradient-to-br ${cardTheme.gradient} rounded-[2.5rem] p-8 mb-8 shadow-[0_20px_60px_rgba(0,0,0,0.5)] border border-white/10 group`}>
        {/* علامة مائية خلفية */}
        <div className="absolute -left-10 -bottom-10 opacity-10 rotate-12 pointer-events-none transition-transform duration-700 group-hover:scale-110">
           <img src={logo} className="w-64 h-64 object-contain" alt="" />
        </div>

        <div className="relative z-10">
          <div className="flex items-start justify-between mb-12">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl p-2 border border-white/20">
              <img src={logo} className="w-full h-full object-contain" alt="Ghanem Logo" />
            </div>
            <div className="text-left">
               <Nfc className={`w-10 h-10 ${cardTheme.icon} animate-pulse`} />
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${cardTheme.label}`}>
                اسم المشجع
              </p>
              <h3 className={`text-2xl font-black ${cardTheme.text}`}>
                {profile?.full_name || 'abdullah'}
              </h3>
            </div>

            <div className="flex justify-between items-end">
              <div>
                <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${cardTheme.label}`}>
                  المستوى الحالي
                </p>
                <div className={`px-4 py-1.5 bg-black/40 backdrop-blur-sm rounded-full inline-block border border-white/10`}>
                   <span className={`text-xs font-black ${cardTheme.text}`}>{cardTheme.name}</span>
                </div>
              </div>
              <div className="text-left">
                 <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${cardTheme.label}`}>
                   رصيد الغنائم
                 </p>
                 <p className={`text-xl font-black ${cardTheme.text}`}>
                    {profile?.points?.toLocaleString() || 0} <span className="text-xs mr-1 opacity-60">🏆</span>
                 </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 🔍 الباركود الرقمي */}
      <div className="mb-10 flex flex-col items-center bg-black/20 backdrop-blur-md border border-white/5 p-8 rounded-[3rem] shadow-inner relative">
        <div className="absolute top-4 right-6 flex items-center gap-2">
            <div className="w-2 h-2 bg-[#05E59F] rounded-full animate-ping"></div>
            <span className="text-[10px] text-gray-400 font-bold uppercase italic">Ready to Scan</span>
        </div>
        <UserQRCode 
          qrCode={user?.id || ''} 
          userName={profile?.full_name || 'abdullah'} 
        />
        <p className="mt-4 text-[10px] text-white/20 font-black font-mono">{user?.id.toUpperCase()}</p>
      </div>

      {/* تنبيهات الحالة */}
      {message && (
        <div className={`p-5 rounded-[2rem] mb-8 flex items-center gap-4 animate-in slide-in-from-top duration-300 ${
            message.type === 'success' ? 'bg-[#05E59F]/10 border border-[#05E59F]/20 text-[#05E59F]' : 'bg-red-500/10 border border-red-500/20 text-red-500'
          }`}>
          {message.type === 'success' ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
          <p className="text-sm font-black">{message.text}</p>
        </div>
      )}

      {/* أزرار الإضافة للمحفظة */}
      {!nfcIdentifier && (
        <div className="space-y-4 mb-10">
          {platform === 'ios' ? (
            <button
              onClick={generateAppleWalletPass}
              disabled={isGenerating}
              className="w-full bg-white text-black font-black py-5 px-8 rounded-3xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl"
            >
              {isGenerating ? <Loader className="animate-spin" /> : <Smartphone size={20} />}
              إضافة إلى Apple Wallet
            </button>
          ) : (
            <button
              onClick={generateAndroidNFC}
              disabled={isGenerating}
              className="w-full bg-[#05E59F] text-black font-black py-5 px-8 rounded-3xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl"
            >
              {isGenerating ? <Loader className="animate-spin" /> : <Zap size={20} />}
              تفعيل NFC على أندرويد
            </button>
          )}
        </div>
      )}

      {/* الأمان والخصوصية */}
      <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 shadow-lg">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-[#05E59F]/10 rounded-xl text-[#05E59F]"><ShieldCheck size={20} /></div>
          <h4 className="font-black text-white text-sm">الأمان والخصوصية</h4>
        </div>
        <p className="text-xs text-gray-400 leading-relaxed font-medium">
          تم تشفير بيانات البطاقة بتقنيات متقدمة لضمان أمان معلوماتك. تقنية الـ NFC تتيح لك دخول الملاعب بسرعة وسهولة دون تلامس.
        </p>
      </div>
    </div>
  );
}