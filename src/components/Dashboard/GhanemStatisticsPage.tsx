import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { BarChart3, Trophy, MapPin, Target, TrendingUp, Loader } from 'lucide-react';
// ✅ استيراد الشعار المفرغ
import logo1 from '../../assets/logo3.svg';

interface AttendanceStats {
  total_matches: number;
  total_points_earned: number;
  unique_cities: number;
  unique_clubs: number;
  derby_matches: number;
  kings_cup_matches: number;
}

export function GhanemStatisticsPage() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState<AttendanceStats>({
    total_matches: 0,
    total_points_earned: 0,
    unique_cities: 0,
    unique_clubs: 0,
    derby_matches: 0,
    kings_cup_matches: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      setLoading(true);
      try {
        // ✅ تعديل الاستعلام لجدول match_attendance وحساب الحضور الفعلي
        const { data: attendance, error, count } = await supabase
          .from('match_attendance')
          .select('*', { count: 'exact' }) // نطلب الـ count الفعلي
          .eq('user_id', user.id);
          // ملاحظة: لو عندك عمود status وتبغى تحسب فقط اللي "حضروا" أضف .eq('status', 'attended')

        if (error) throw error;

        // حساب عدد المدن والأندية الفريدة من البيانات اللي جات
        const uniqueCities = attendance ? new Set(attendance.map(m => m.city)).size : 0;
        const uniqueClubs = attendance ? new Set(attendance.map(m => m.club_name)).size : 0;

        setStats({
          // ✅ نستخدم count اللي رجع من الداتابيز مباشرة
          total_matches: count || 0,
          total_points_earned: profile?.points || 0,
          unique_cities: uniqueCities || (profile as any)?.unique_cities || 1, 
          unique_clubs: uniqueClubs || (profile as any)?.unique_clubs || 1,
          derby_matches: (profile as any)?.derby_matches || 0,
          kings_cup_matches: (profile as any)?.kings_cup_matches || 0,
        });

      } catch (err) {
        console.error('Error fetching statistics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user, profile]);

  const statCards = [
    {
      icon: Trophy,
      label: 'إجمالي المباريات',
      value: stats.total_matches,
      color: 'text-[#05E59F]',
    },
    {
      icon: TrendingUp,
      label: 'غنائم المباريات',
      value: stats.total_points_earned,
      color: 'text-[#05E59F]',
    },
    {
      icon: MapPin,
      label: 'مدن زرتها',
      value: stats.unique_cities,
      color: 'text-blue-400',
    },
    {
      icon: Target,
      label: 'أندية حضرت لها',
      value: stats.unique_clubs,
      color: 'text-orange-400',
    },
  ];

  return (
    <div className="pb-24 bg-[#003837] min-h-screen text-right font-almarai" dir="rtl">
      <div className="p-6">
        
        {/* الهيدر مع اللوجو */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#05E59F] flex items-center justify-center shadow-lg shadow-[#05E59F]/20">
              <BarChart3 className="w-6 h-6 text-black" />
            </div>
            <h1 className="text-2xl font-black text-white">إحصائياتي</h1>
          </div>
          
          <div className="w-14 h-14 flex items-center justify-center">
            <img src={logo1} className="w-full h-full object-contain" alt="Ghanem Logo" />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader className="w-10 h-10 animate-spin text-[#05E59F] mb-4" />
            <p className="text-gray-400 text-sm font-bold">جاري تحليل بياناتك...</p>
          </div>
        ) : (
          <>
            {/* بطاقة الرصيد الإجمالي */}
            <div className="bg-white/5 backdrop-blur-md rounded-[2.5rem] p-8 border border-white/10 mb-6 shadow-2xl relative overflow-hidden">
              <div className="absolute -left-10 -top-10 w-32 h-32 bg-[#05E59F]/5 blur-3xl rounded-full"></div>
              <div className="flex items-center justify-between mb-4 relative z-10">
                <h3 className="font-black text-gray-400 text-sm uppercase tracking-widest">الرصيد الإجمالي</h3>
                <Trophy className="w-6 h-6 text-[#05E59F]" />
              </div>
              <p className="text-6xl font-black text-[#05E59F] mb-1 tracking-tighter relative z-10">
                {(profile?.points || 0).toLocaleString('ar-SA')}
              </p>
              <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.3em] relative z-10">Ghanem Points</p>
            </div>

            {/* شبكة الإحصائيات */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              {statCards.map((card, index) => {
                const Icon = card.icon;
                return (
                  <div key={index} className="bg-[#002b2a] rounded-[2rem] p-6 border border-white/5 shadow-xl transition-transform active:scale-95">
                    <div className="flex items-center gap-2 mb-4">
                      <div className={`p-2 rounded-lg bg-white/5 ${card.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">{card.label}</p>
                    </div>
                    <p className="text-3xl font-black text-white">{card.value}</p>
                  </div>
                );
              })}
            </div>

            {/* قسم مباريات خاصة */}
            <div className="bg-[#002b2a] rounded-[2.5rem] p-6 border border-white/5 shadow-2xl">
              <h3 className="font-black text-white mb-6 px-2 text-lg">الأوسمة والمباريات</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/5 shadow-inner">
                  <div className="flex items-center gap-4">
                    <div className="w-3 h-3 bg-[#05E59F] rounded-full shadow-[0_0_10px_#05E59F]"></div>
                    <span className="text-sm text-gray-300 font-bold">مباريات ديربي</span>
                  </div>
                  <span className="text-2xl font-black text-white">{stats.derby_matches}</span>
                </div>
                
                <div className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/5 shadow-inner">
                  <div className="flex items-center gap-4">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full shadow-[0_0_10px_#eab308]"></div>
                    <span className="text-sm text-gray-300 font-bold">مباريات كأس الملك</span>
                  </div>
                  <span className="text-2xl font-black text-white">{stats.kings_cup_matches}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}