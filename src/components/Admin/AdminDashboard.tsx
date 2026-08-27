import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Users, Trophy, Calendar, Gift, TrendingUp, Coins } from 'lucide-react';
// ✅ استيراد الشعار المفرغ المعتمد
import logo1 from '../../assets/logo3.svg';

type Stats = {
  totalUsers: number;
  totalPointsIssued: number;
  totalClubs: number;
  upcomingMatches: number;
  totalOffers: number;
  redemptionsCount: number;
};

export function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalPointsIssued: 0,
    totalClubs: 0,
    upcomingMatches: 0,
    totalOffers: 0,
    redemptionsCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        
        const [
          profilesResult,
          clubsResult,
          matchesResult,
          offersResult,
          redemptionsResult,
        ] = await Promise.all([
          supabase.from('user_profiles').select('*'),
          supabase.from('clubs').select('id', { count: 'exact', head: true }),
          supabase.from('matches').select('id', { count: 'exact', head: true }).eq('status', 'upcoming'),
          supabase.from('partner_offers').select('id', { count: 'exact', head: true }).eq('is_active', true),
          supabase.from('redemptions').select('id', { count: 'exact', head: true }),
        ]);

        let totalPoints = 0;
        let totalRedemptionsFromProfiles = 0;

        if (profilesResult.data) {
          profilesResult.data.forEach(profile => {
            totalPoints += Number(profile.points) || 0;
            totalRedemptionsFromProfiles += Number(profile.redemptions_count || profile.total_redemptions || 0);
          });
        }

        setStats({
          totalUsers: profilesResult.data?.length || 0,
          totalPointsIssued: totalPoints,
          totalClubs: clubsResult.count || 0,
          upcomingMatches: matchesResult.count || 0,
          totalOffers: offersResult.count || 0,
          redemptionsCount: redemptionsResult.count || totalRedemptionsFromProfiles || 0,
        });

      } catch (error) {
        console.error('Dashboard Stats Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // ✅ تم حذف شاشة التحميل الكاملة لمنع "الحكة" المزعجة في الفيديو
  if (loading) {
    return null; // نترك App.tsx يتعامل مع شاشة التحميل الأساسية
  }

  const statCards = [
    { title: 'إجمالي المستخدمين', value: stats.totalUsers, icon: Users, color: 'text-blue-400' },
    { title: 'النقاط الصادرة', value: stats.totalPointsIssued.toLocaleString('ar-SA'), icon: Coins, color: 'text-[#05E59F]' },
    { title: 'الأندية المشاركة', value: stats.totalClubs, icon: Trophy, color: 'text-orange-400' },
    { title: 'المباريات القادمة', value: stats.upcomingMatches, icon: Calendar, color: 'text-purple-400' },
    { title: 'العروض النشطة', value: stats.totalOffers, icon: Gift, color: 'text-pink-400' },
    { title: 'عمليات الاستبدال', value: stats.redemptionsCount, icon: TrendingUp, color: 'text-[#05E59F]' },
  ];

  return (
    <div className="p-6 md:p-10 bg-[#003837] min-h-screen text-right font-almarai animate-in fade-in duration-700" dir="rtl">
      
      {/* رأس الصفحة مع الشعار */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tighter">لوحة تحكم غانم</h2>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-2 h-2 bg-[#05E59F] rounded-full animate-ping"></div>
            <p className="text-[#05E59F] text-xs font-bold uppercase tracking-[0.2em]">Live System Analytics</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 bg-white/5 p-3 pr-6 rounded-[2rem] border border-white/10 backdrop-blur-md shadow-xl">
            <div className="text-left">
                <p className="text-[10px] text-gray-400 font-bold leading-none mb-1 uppercase">Ghanem Core</p>
                <p className="text-sm text-white font-black leading-none uppercase tracking-tighter">V1.5.0-Admin</p>
            </div>
            <img src={logo1} className="w-12 h-12 object-contain" alt="Ghanem Logo" />
        </div>
      </div>

      {/* شبكة البطاقات الإحصائية */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="bg-[#002b2a] rounded-[2.5rem] shadow-2xl border border-white/5 p-8 transition-all hover:border-[#05E59F]/30 hover:scale-[1.02] relative overflow-hidden group"
            >
              <div className="absolute top-0 left-0 w-32 h-32 bg-[#05E59F]/5 blur-3xl -translate-x-1/2 -translate-y-1/2 group-hover:bg-[#05E59F]/10 transition-colors"></div>
              
              <div className="flex items-center justify-between mb-8 relative z-10">
                <div className={`p-4 rounded-2xl bg-white/5 ${card.color} shadow-inner border border-white/5`}>
                  <Icon className="w-8 h-8" />
                </div>
                <div className="bg-white/5 text-gray-500 text-[8px] font-black px-3 py-1.5 rounded-full border border-white/5 tracking-widest uppercase">
                  Statistical Node
                </div>
              </div>

              <div className="relative z-10">
                <h3 className="text-gray-400 text-xs mb-2 font-black uppercase tracking-tighter">{card.title}</h3>
                <p className="text-5xl font-black text-white tracking-tighter group-hover:text-[#05E59F] transition-colors">
                  {card.value}
                </p>
              </div>

              <div className="absolute bottom-0 right-0 left-0 h-1 bg-gradient-to-l from-transparent via-[#05E59F]/20 to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-700"></div>
            </div>
          );
        })}
      </div>

      {/* تذييل الصفحة المحدث مع اللوجو */}
      <div className="mt-20 pt-10 border-t border-white/5 flex flex-col items-center gap-6">
        <div className="relative group cursor-default">
            <div className="absolute inset-0 bg-[#05E59F]/5 blur-2xl rounded-full scale-150 group-hover:bg-[#05E59F]/10 transition-colors"></div>
            <img src={logo1} className="w-20 h-20 object-contain relative z-10 opacity-20 group-hover:opacity-40 transition-opacity duration-700 grayscale group-hover:grayscale-0" alt="Ghanem" />
        </div>
        
        <div className="text-center space-y-2 relative z-10">
            <p className="text-[10px] text-gray-500 font-black tracking-[0.6em] uppercase">Ghanem Management Systems Core</p>
            <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">© 2026 All Rights Reserved to Ghanem Identity</p>
        </div>
      </div>
    </div>
  );
}