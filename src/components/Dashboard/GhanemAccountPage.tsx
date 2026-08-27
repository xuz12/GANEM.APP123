import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Trophy, Gift, TrendingUp, ChevronLeft, Users, CreditCard, History, BarChart3, Settings } from 'lucide-react';
import { GhanemPointsHistoryPage } from './GhanemPointsHistoryPage';
import { GhanemStatisticsPage } from './GhanemStatisticsPage';
import { GhanemRedemptionsPage } from './GhanemRedemptionsPage';
import { GhanemReferralsPage } from './GhanemReferralsPage';
import GhanemDigitalCardPage from './GhanemDigitalCardPage';
import { GhanemSettingsPage } from './GhanemSettingsPage';

// ✅ استيراد الشعار المفرغ
import logo1 from '../../assets/logo1.svg'; 

type SubPage = 'main' | 'history' | 'stats' | 'redemptions' | 'referrals' | 'digitalcard' | 'settings';

export function GhanemAccountPage() {
  const { profile, signOut } = useAuth();
  const [currentPage, setCurrentPage] = useState<SubPage>('main');
  
  // ✅ الحالة الجديدة لجلب عدد المباريات من جدولك match_attendance
  const [attendedCount, setAttendedCount] = useState<number>(0);

  // ✅ استعلام دقيق لحساب الحضور الفعلي
  useEffect(() => {
    async function fetchAttendance() {
      if (!profile?.id) return;
      
      const { count, error } = await supabase
        .from('match_attendance')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id);

      if (!error && count !== null) {
        setAttendedCount(count);
      }
    }

    if (currentPage === 'main') {
      fetchAttendance();
    }
  }, [profile?.id, currentPage]);

  const renderBackButton = () => (
    <button
      onClick={() => setCurrentPage('main')}
      className="absolute top-6 right-6 z-10 w-10 h-10 rounded-xl bg-white/5 border border-[#05E59F]/20 flex items-center justify-center shadow-lg"
    >
      <ChevronLeft className="w-5 h-5 text-[#05E59F] rotate-180" />
    </button>
  );

  if (currentPage === 'history') return (<div>{renderBackButton()}<GhanemPointsHistoryPage /></div>);
  if (currentPage === 'stats') return (<div>{renderBackButton()}<GhanemStatisticsPage /></div>);
  if (currentPage === 'redemptions') return (<div>{renderBackButton()}<GhanemRedemptionsPage /></div>);
  if (currentPage === 'referrals') return (<div>{renderBackButton()}<GhanemReferralsPage /></div>);
  if (currentPage === 'digitalcard') return (<div>{renderBackButton()}<GhanemDigitalCardPage /></div>);
  if (currentPage === 'settings') return (<div>{renderBackButton()}<GhanemSettingsPage /></div>);

  const getLevelInfo = (points: number) => {
    if (points < 500) return { name: 'مبتدئ', nameEn: 'Starter', nextLevel: 500 };
    if (points < 2000) return { name: 'غانم', nameEn: 'Ghanem', nextLevel: 2000 };
    if (points < 5000) return { name: 'غانم بلس', nameEn: 'Ghanem+', nextLevel: 5000 };
    return { name: 'غانم إيليت', nameEn: 'Ghanem Elite', nextLevel: null };
  };

  const currentPoints = profile?.points || 0;
  const levelInfo = getLevelInfo(currentPoints);
  const progressPercentage = levelInfo.nextLevel ? (currentPoints / levelInfo.nextLevel) * 100 : 100;
  const accountId = `GH-${String(profile?.id?.slice(0, 8) || '00000000').toUpperCase()}`;

  const menuItems = [
    { icon: CreditCard, label: 'بطاقتي الرقمية', action: () => setCurrentPage('digitalcard') },
    { icon: History, label: 'سجل الغنائم', action: () => setCurrentPage('history') },
    { icon: BarChart3, label: 'إحصائياتي', action: () => setCurrentPage('stats') },
    { icon: Gift, label: 'استبدالاتي', action: () => setCurrentPage('redemptions') },
    { icon: Users, label: 'كود الإحالة', action: () => setCurrentPage('referrals') },
    { icon: Settings, label: 'إعدادات الحساب', action: () => setCurrentPage('settings') },
  ];

  return (
    <div className="pb-24 bg-[#003837] min-h-screen font-almarai text-right" dir="rtl">
      <div className="p-6">
        
        {/* ملف التعريف العلوي */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-24 h-24 flex items-center justify-center mb-4">
            <img src={logo1} className="w-full h-full object-contain" alt="شعار غانم" />
          </div>
          <h1 className="text-2xl font-black text-white mb-1">{profile?.full_name || 'abdullah'}</h1>
          <p className="text-[#05E59F]/80 text-sm font-mono tracking-widest uppercase">{accountId}</p>
        </div>

        {/* شبكة الإحصائيات */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            // ✅ تم ربط القيمة بـ attendedCount من جدولك match_attendance
            { icon: Trophy, label: 'مباراة', value: attendedCount },
            { icon: TrendingUp, label: 'الغنائم', value: profile?.points || 0 },
            { icon: Gift, label: 'استبدال', value: (profile as any)?.redemptions_count ?? 0 }
          ].map((item, i) => (
            <div key={i} className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 text-center shadow-xl">
              <item.icon className="w-6 h-6 mx-auto mb-2 text-[#05E59F]" />
              <p className="text-2xl font-black text-white mb-1">{item.value}</p>
              <p className="text-[10px] font-bold text-gray-300 uppercase">{item.label}</p>
            </div>
          ))}
        </div>

        {/* بطاقة المستوى */}
        <div className="bg-white/5 backdrop-blur-md rounded-[2rem] p-6 border border-[#05E59F]/30 mb-8 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div>
              <h3 className="font-black text-[#05E59F] text-xl mb-1">{levelInfo.name}</h3>
              <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase italic">{levelInfo.nameEn}</p>
            </div>
            <div className="text-left">
              <p className="text-3xl font-black text-white">{currentPoints.toLocaleString('ar-SA')}</p>
              <p className="text-[10px] font-bold text-[#05E59F] uppercase">نقطة غنيمة</p>
            </div>
          </div>
          {levelInfo.nextLevel && (
            <div className="mt-6 relative z-10">
              <div className="w-full bg-black/40 rounded-full h-2.5 mb-3 overflow-hidden border border-white/5">
                <div 
                  className="bg-[#05E59F] h-full rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(5,229,159,0.5)]" 
                  style={{ width: `${Math.min(progressPercentage, 100)}%` }} 
                />
              </div>
              <p className="text-[10px] font-black text-gray-400 text-center">
                باقي {levelInfo.nextLevel - currentPoints} غنيمة للمستوى التالي
              </p>
            </div>
          )}
        </div>

        {/* القائمة */}
        <div className="bg-white/5 backdrop-blur-sm rounded-[1.5rem] border border-white/10 overflow-hidden mb-8 shadow-xl">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={item.action}
                className={`w-full flex items-center justify-between p-5 hover:bg-white/5 active:bg-white/10 transition-all ${index !== menuItems.length - 1 ? 'border-b border-white/5' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-[#05E59F]/10 rounded-lg">
                    <Icon className="w-5 h-5 text-[#05E59F]" />
                  </div>
                  <span className="text-white font-bold text-sm">{item.label}</span>
                </div>
                <ChevronLeft className="w-4 h-4 text-gray-500 opacity-40" />
              </button>
            );
          })}
        </div>

        {/* تسجيل الخروج */}
        <button 
          onClick={() => signOut()} 
          className="w-full bg-red-500/10 border border-red-500/20 text-red-500 py-5 rounded-2xl font-black hover:bg-red-500/20 transition-all text-sm uppercase tracking-widest shadow-lg"
        >
          تسجيل الخروج
        </button>

        {/* تذييل الصفحة */}
        <div className="flex flex-col items-center justify-center mt-12 mb-6 opacity-40">
          <img 
            src={logo1} 
            className="w-20 h-auto object-contain mb-3 grayscale brightness-200" 
            alt="شعار غانم المفرغ" 
          />
          <p className="text-[10px] text-gray-400 font-bold tracking-tight text-center">
            جميع الحقوق محفوظة لتطبيق غانم © ٢٠٢٦
          </p>
          <p className="text-[8px] text-gray-500 mt-1 uppercase tracking-[0.2em]">
            Ghanem App V1.0
          </p>
        </div>

      </div>
    </div>
  );
}