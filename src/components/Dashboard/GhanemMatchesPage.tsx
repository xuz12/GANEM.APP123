import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Database } from '../../lib/database.types';
import { Trophy, Crown, CheckCircle2 } from 'lucide-react';
import { POINTS_CONFIG } from '../../utils/pointsSystem';
// ✅ استيراد الشعار المفرغ
import logo1 from '../../assets/logo1.svg';

type Match = Database['public']['Tables']['matches']['Row'] & {
  home_club: Database['public']['Tables']['clubs']['Row'];
  away_club: Database['public']['Tables']['clubs']['Row'];
};

export function GhanemMatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'upcoming' | 'previous' | 'kings_cup'>('upcoming');
  const [attendedMatches, setAttendedMatches] = useState<Set<string>>(new Set());

  const getMatchPoints = (match: Match) => {
    const isRegular = match.competition_type === 'roshn_league' && (match.points_multiplier || 1) < 1.5;
    const isDerby = (match.points_multiplier || 1) >= 1.5;
    const isKingsCup = match.competition_type === 'kings_cup';
    const isAFC = match.competition_type === 'afc_champions_league';

    if (isAFC) return POINTS_CONFIG.ATTENDANCE.AFC;
    if (isKingsCup) return POINTS_CONFIG.ATTENDANCE.FINAL;
    if (isDerby) return POINTS_CONFIG.ATTENDANCE.DERBY;
    return POINTS_CONFIG.ATTENDANCE.REGULAR;
  };

  useEffect(() => {
    const fetchMatches = async () => {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: attendanceData } = await supabase
          .from('match_attendance')
          .select('match_id')
          .eq('user_id', user.id);

        if (attendanceData) {
          setAttendedMatches(new Set(attendanceData.map(a => a.match_id)));
        }
      }

      let query = supabase
        .from('matches')
        .select(`
          *,
          home_club:clubs!matches_home_club_id_fkey(*),
          away_club:clubs!matches_away_club_id_fkey(*)
        `);

      if (activeFilter === 'upcoming') {
        // يعرض المباريات التي لم تبدأ بعد
        query = query
          .in('status', ['upcoming', 'NS', 'scheduled'])
          .eq('competition_type', 'roshn_league')
          .order('match_date', { ascending: true });
      } else if (activeFilter === 'previous') {
        // ✅ التعديل هنا: يعرض المباريات المنتهية (finished أو FT)
        query = query
          .in('status', ['finished', 'FT', 'completed'])
          .order('match_date', { ascending: false }); // الأحدث يظهر أولاً
      } else if (activeFilter === 'kings_cup') {
        query = query
          .eq('competition_type', 'kings_cup')
          .order('match_date', { ascending: true });
      }

      const { data, error } = await query.limit(20);
      if (!error) {
        setMatches(data || []);
      }
      setLoading(false);
    };

    fetchMatches();
  }, [activeFilter]);

  const filters = [
    { id: 'upcoming' as const, label: 'القادمة' },
    { id: 'previous' as const, label: 'السابقة' },
    { id: 'kings_cup' as const, label: 'كأس الملك', icon: Crown },
  ];

  return (
    <div className="pb-24 bg-[#003837] min-h-screen font-almarai text-right" dir="rtl">
      <div className="p-6">
        
        {/* الهيدر */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#05E59F] flex items-center justify-center shadow-lg shadow-[#05E59F]/20">
              <Trophy className="w-6 h-6 text-black" />
            </div>
            <h1 className="text-2xl font-black text-white">المباريات</h1>
          </div>

          <div className="w-14 h-14 flex items-center justify-center">
            <img src={logo1} className="w-full h-full object-contain" alt="شعار غانم" />
          </div>
        </div>

        {/* الفلاتر */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {filters.map((filter) => {
            const Icon = filter.icon;
            const isActive = activeFilter === filter.id;
            return (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                  isActive
                    ? 'bg-[#05E59F] text-black shadow-lg shadow-[#05E59F]/20'
                    : 'bg-[#002b2a] text-gray-400 border border-white/5'
                }`}
              >
                {Icon && <Icon className="w-4 h-4" />}
                {filter.label}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#05E59F]"></div>
            <p className="text-gray-400 text-sm mt-4">جاري تحديث جدول المباريات...</p>
          </div>
        ) : (
          <div className="space-y-5">
            {matches.map((match) => {
              const isDerby = (match.points_multiplier || 1) >= 1.5;
              const isKingsCup = match.competition_type === 'kings_cup';
              const hasAttended = attendedMatches.has(match.id);

              return (
                <div
                  key={match.id}
                  className="bg-[#002b2a] rounded-[30px] p-6 border border-white/5 relative shadow-2xl transition-transform active:scale-[0.98]"
                >
                  {hasAttended && (
                    <div className="absolute -top-2 -right-2 z-10 shadow-lg">
                      <CheckCircle2 className="w-10 h-10 text-[#05E59F] bg-[#002b2a] rounded-full p-0.5 border-4 border-[#003837]" />
                    </div>
                  )}
                  
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex gap-2">
                      {isKingsCup && (
                        <div className="bg-yellow-500/10 text-yellow-500 px-3 py-1.5 rounded-lg text-[10px] font-black flex items-center gap-1.5 border border-yellow-500/20 uppercase">
                          <Crown className="w-3 h-3" /> كأس الملك
                        </div>
                      )}
                      {isDerby && (
                        <div className="bg-[#05E59F]/10 text-[#05E59F] px-3 py-1.5 rounded-lg text-[10px] font-black border border-[#05E59F]/20 uppercase">
                          ديربي ⚡
                        </div>
                      )}
                    </div>
                    {match.status === 'LIVE' && (
                      <span className="bg-red-600 text-white px-3 py-1 rounded-full text-[10px] font-black animate-pulse">
                        مباشر
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between mb-6">
                    <div className="flex-1 text-center">
                      <div className="w-20 h-20 mx-auto mb-3 bg-white/5 backdrop-blur-sm rounded-2xl flex items-center justify-center p-2 border border-white/5 shadow-inner">
                        <img src={match.home_club.logo_url || ''} alt="" className="w-14 h-14 object-contain filter drop-shadow-md" />
                      </div>
                      <p className="font-black text-xs text-white">{match.home_club.name_ar}</p>
                    </div>

                    <div className="text-center px-4">
                      {/* عرض النتيجة للمباريات المنتهية أو المباشرة */}
                      {['finished', 'FT', 'completed', 'LIVE'].includes(match.status) && match.home_score !== null ? (
                        <div className="text-3xl font-black text-[#05E59F] tracking-tighter">
                          {match.home_score} - {match.away_score}
                        </div>
                      ) : (
                        <div className="bg-black/30 text-gray-500 rounded-xl px-4 py-2 font-black text-sm border border-white/5">
                          VS
                        </div>
                      )}
                    </div>

                    <div className="flex-1 text-center">
                      <div className="w-20 h-20 mx-auto mb-3 bg-white/5 backdrop-blur-sm rounded-2xl flex items-center justify-center p-2 border border-white/5 shadow-inner">
                        <img src={match.away_club.logo_url || ''} alt="" className="w-14 h-14 object-contain filter drop-shadow-md" />
                      </div>
                      <p className="font-black text-xs text-white">{match.away_club.name_ar}</p>
                    </div>
                  </div>

                  <div className="border-t border-white/5 pt-5 space-y-3">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-gray-500 uppercase tracking-widest">التاريخ والوقت</span>
                      <span className="text-white text-left">
                        {new Date(match.match_date).toLocaleDateString('ar-SA', { weekday: 'short', month: 'short', day: 'numeric' })} | {new Date(match.match_date).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-gray-500 uppercase tracking-widest">الملعب</span>
                      <span className="text-gray-300 line-clamp-1 text-left">{match.venue || match.home_club.stadium_name}</span>
                    </div>
                    
                    {activeFilter === 'upcoming' && (
                      <div className="bg-[#05E59F]/10 rounded-2xl py-3 text-center mt-4 border border-[#05E59F]/20 shadow-inner">
                        <span className="text-[#05E59F] font-black text-sm">
                          {getMatchPoints(match).toLocaleString('ar-SA')} غنيمة حضور
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {matches.length === 0 && (
              <div className="text-center py-20 bg-white/5 rounded-[40px] border border-dashed border-white/10">
                <Trophy className="w-20 h-20 mx-auto mb-4 text-white/5" />
                <p className="text-gray-500 font-black">لا توجد مباريات في هذا القسم حالياً</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}