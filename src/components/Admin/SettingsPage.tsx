import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Settings, Save, RefreshCw, Coins, Zap, UserPlus, Gift, ShieldCheck } from 'lucide-react';

type SystemSettings = {
  attendance_points: number;
  referral_points: number;
  welcome_bonus: number;
  min_redeem_points: number;
};

export function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>({
    attendance_points: 0,
    referral_points: 0,
    welcome_bonus: 0,
    min_redeem_points: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setSettings({
          attendance_points: Number(data.attendance_points),
          referral_points: Number(data.referral_points),
          welcome_bonus: Number(data.welcome_bonus),
          min_redeem_points: Number(data.min_redeem_points),
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const { data: existingData } = await supabase
        .from('system_settings')
        .select('id')
        .limit(1)
        .maybeSingle();

      let resultError;

      if (existingData) {
        const { error: updateError } = await supabase
          .from('system_settings')
          .update({
            attendance_points: Number(settings.attendance_points),
            referral_points: Number(settings.referral_points),
            welcome_bonus: Number(settings.welcome_bonus),
            min_redeem_points: Number(settings.min_redeem_points),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingData.id);
        resultError = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('system_settings')
          .insert([{
            attendance_points: Number(settings.attendance_points),
            referral_points: Number(settings.referral_points),
            welcome_bonus: Number(settings.welcome_bonus),
            min_redeem_points: Number(settings.min_redeem_points)
          }]);
        resultError = insertError;
      }

      if (resultError) throw resultError;

      setMessage({ type: 'success', text: 'تم تحديث بروتوكولات النظام بنجاح ✅' });
      setTimeout(() => setMessage(null), 5000);
      
    } catch (error: any) {
      setMessage({ type: 'error', text: `فشل الحفظ: ${error.message}` });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 bg-[#003837] min-h-[60vh]">
      <RefreshCw className="w-12 h-12 text-[#05E59F] animate-spin mb-4" />
      <p className="font-almarai font-black text-white uppercase tracking-widest text-sm">Accessing System Core...</p>
    </div>
  );

  const inputFields = [
    { id: 'attendance_points', label: 'نقاط حضور المباريات', icon: Zap, color: 'text-[#05E59F]' },
    { id: 'referral_points', label: 'نقاط دعوة الأصدقاء', icon: UserPlus, color: 'text-blue-400' },
    { id: 'welcome_bonus', label: 'مكافأة التسجيل الأول', icon: Gift, color: 'text-orange-400' },
    { id: 'min_redeem_points', label: 'الحد الأدنى للاستبدال', icon: ShieldCheck, color: 'text-purple-400' },
  ];

  return (
    <div dir="rtl" className="max-w-4xl mx-auto pb-12 font-almarai text-right px-4">
      {/* هيدر الصفحة */}
      <div className="mb-10 flex items-center justify-between">
        <div>
            <h2 className="text-4xl font-black text-white tracking-tight">إعدادات النظام</h2>
            <div className="flex items-center gap-2 mt-2">
                <Settings className="w-4 h-4 text-[#05E59F] animate-spin-slow" />
                <p className="text-[#05E59F] text-[10px] font-black uppercase tracking-[0.2em] opacity-70">Core Economic Control</p>
            </div>
        </div>
        <div className="p-4 bg-white/5 rounded-3xl border border-white/5">
            <Coins className="w-10 h-10 text-[#05E59F]" />
        </div>
      </div>

      {/* رسائل التنبيه */}
      {message && (
        <div className={`mb-10 p-6 rounded-[2rem] border animate-in fade-in slide-in-from-top-4 ${
          message.type === 'success' ? 'bg-[#05E59F]/10 text-[#05E59F] border-[#05E59F]/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
        }`}>
          <div className="flex items-center gap-3">
             <div className={`w-2 h-2 rounded-full ${message.type === 'success' ? 'bg-[#05E59F]' : 'bg-red-500'} animate-ping`} />
             <span className="font-black text-sm uppercase tracking-tighter">{message.text}</span>
          </div>
        </div>
      )}

      {/* قسم الإعدادات المحدث */}
      <section className="bg-[#002b2a] border border-white/5 rounded-[3rem] p-10 shadow-3xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#05E59F]/20 to-transparent"></div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
          {inputFields.map((field) => {
            const Icon = field.icon;
            return (
              <div key={field.id} className="space-y-4 group">
                <div className="flex items-center gap-3 pr-2">
                   <div className={`p-2 rounded-lg bg-white/5 ${field.color}`}>
                     <Icon size={16} />
                   </div>
                   <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">
                     {field.label}
                   </label>
                </div>
                <div className="relative">
                    <input
                    type="number"
                    value={settings[field.id as keyof SystemSettings]}
                    onChange={(e) => setSettings({...settings, [field.id]: parseInt(e.target.value) || 0})}
                    className="w-full px-8 py-6 bg-[#003837] border-2 border-white/5 rounded-[2rem] text-white font-black text-2xl focus:border-[#05E59F]/50 outline-none transition-all shadow-inner group-hover:bg-[#003c3b]"
                    />
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-600 uppercase tracking-widest">Points</div>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full mt-16 py-6 bg-[#05E59F] text-black rounded-[2rem] font-black text-xl transition-all hover:shadow-[0_0_30px_rgba(5,229,159,0.3)] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-4 group"
        >
          {saving ? (
            <RefreshCw className="animate-spin" />
          ) : (
            <>
              <div className="bg-black/10 p-2 rounded-xl group-hover:rotate-12 transition-transform">
                <Save size={24} />
              </div>
              <span>حفظ البروتوكولات الجديدة</span>
            </>
          )}
        </button>
        
        <div className="mt-8 flex justify-center items-center gap-2 opacity-20">
            <div className="h-[1px] w-12 bg-white/20"></div>
            <p className="text-[8px] text-gray-400 font-black uppercase tracking-[0.5em]">Ghanem Security Protocols Active</p>
            <div className="h-[1px] w-12 bg-white/20"></div>
        </div>
      </section>

      <style>{`
        .animate-spin-slow {
          animation: spin 8s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}