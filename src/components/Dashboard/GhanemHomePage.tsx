import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Database } from '../../lib/database.types';
// استيراد الشعار المفرغ المعتمد
import logo1 from '../../assets/logo1.svg';

type Match = Database['public']['Tables']['matches']['Row'] & {
  home_club: Database['public']['Tables']['clubs']['Row'];
  away_club: Database['public']['Tables']['clubs']['Row'];
};

type Offer = Database['public']['Tables']['partner_offers']['Row'] & {
  partner: Database['public']['Tables']['partners']['Row'];
};

interface SystemSettings {
  attendance_points: number;
}

export function GhanemHomePage() {
  const { profile, user } = useAuth();
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [topOffers, setTopOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPoints, setCurrentPoints] = useState(0);
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  const getLevelName = (points: number) => {
    if (points < 500) return 'مبتدئ';
    if (points < 2000) return 'غانم';
    if (points < 5000) return 'غانم بلس';
    return 'غانم إيليت';
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      const { data: settingsData } = await supabase
        .from('system_settings')
        .select('attendance_points')
        .single();
      
      if (settingsData) setSettings(settingsData);

      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('points')
        .eq('user_id', user.id)
        .maybeSingle();

      if (userProfile) {
        setCurrentPoints(userProfile.points || 0);
      }

      const { data: matches } = await supabase
        .from('matches')
        .select(`
          *,
          home_club:clubs!matches_home_club_id_fkey(*),
          away_club:clubs!matches_away_club_id_fkey(*)
        `)
        .in('status', ['upcoming', 'NS'])
        .eq('competition_type', 'roshn_league')
        .order('match_date', { ascending: true })
        .limit(5);

      const { data: offers } = await supabase
        .from('partner_offers')
        .select(`
          *,
          partner:partners(*)
        `)
        .eq('is_active', true)
        .order('points_required', { ascending: true })
        .limit(3);

      setUpcomingMatches(matches || []);
      setTopOffers(offers || []);
      setLoading(false);
    };

    fetchData();

    const channel = supabase
      .channel('user-points-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_profiles',
          filter: `user_id=eq.${user?.id}`
        },
        (payload) => {
          if (payload.new && 'points' in payload.new) {
            setCurrentPoints((payload.new as any).points || 0);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#003837]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#05E59F]"></div>
      </div>
    );
  }

  const levelName = getLevelName(currentPoints);

  return (
    <div className="pb-24 bg-[#003837] min-h-screen font-almarai text-right" dir="rtl">
      <div className="p-6">
        
        {/* الهيدر العلوي */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-gray-400 text-xs mb-1 uppercase tracking-wider font-bold">أهلاً بك يا غانم</p>
            <h1 className="text-2xl font-black text-white">
              {profile?.full_name || 'عبدالله'}
            </h1>
          </div>
          <div className="w-16 h-16 flex items-center justify-center">
            <img src={logo1} className="w-full h-full object-contain" alt="شعار غانم" />
          </div>
        </div>

        {/* بطاقة الرصيد */}
        <div className="bg-white/5 backdrop-blur-md rounded-[2rem] p-8 border border-white/10 mb-4 shadow-2xl relative overflow-hidden">
          <div className="absolute -left-10 -top-10 w-32 h-32 bg-[#05E59F]/5 blur-3xl rounded-full"></div>
          <div className="flex items-center justify-between relative z-10">
            <span className="text-gray-300 text-sm font-bold">رصيد الغنائم</span>
            <div className="flex flex-col items-end">
                <span className="text-4xl font-black text-[#05E59F] tracking-tighter">
                {currentPoints.toLocaleString('ar-SA')}
                </span>
                <span className="text-[10px] font-black text-[#05E59F] uppercase tracking-widest mt-1">نقطة غنيمة</span>
            </div>
          </div>
        </div>

        {/* بطاقة المستوى */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 flex items-center justify-between mb-10 border border-[#05E59F]/20 shadow-lg">
          <div>
            <p className="text-[#05E59F] font-black text-lg mb-0.5">اللي يحضر يغنم</p>
            <p className="text-gray-400 text-[10px] font-bold uppercase">مستواك الحالي</p>
          </div>
          <div className="bg-[#05E59F]/10 px-5 py-2.5 rounded-xl border border-[#05E59F]/20 shadow-inner">
            <span className="text-[#05E59F] font-black text-xs uppercase italic">
              {levelName}
            </span>
          </div>
        </div>

        {/* قسم المباريات القادمة */}
        <div className="mb-10">
          <h2 className="text-xl font-black text-white mb-5 pr-3 border-r-4 border-[#05E59F]">المباريات القادمة</h2>
          <div className="overflow-x-auto pb-4 -mx-6 px-6 scrollbar-hide">
            <div className="flex gap-5" style={{ width: 'max-content' }}>
              {upcomingMatches.map((match) => (
                <div key={match.id} className="bg-[#002b2a] rounded-[2.5rem] p-6 border border-white/5 shadow-2xl transition-transform active:scale-95" style={{ minWidth: '320px' }}>
                  
                  {/* منطقة الأندية */}
                  <div className="flex items-center justify-between mb-8 mt-4 px-2">
                    <div className="flex-1 text-center">
                      <div className="w-20 h-20 mx-auto mb-3 bg-white/5 rounded-2xl flex items-center justify-center p-3 border border-white/10 shadow-inner">
                        <img src={match.home_club.logo_url || ''} alt="" className="w-full h-full object-contain filter drop-shadow-lg" />
                      </div>
                      <p className="text-white text-sm font-black">{match.home_club.name_ar}</p>
                    </div>
                    
                    <div className="px-2">
                      <div className="bg-white/5 text-gray-500 rounded-xl px-3 py-2 font-black text-xs border border-white/5">VS</div>
                    </div>

                    <div className="flex-1 text-center">
                      <div className="w-20 h-20 mx-auto mb-3 bg-white/5 rounded-2xl flex items-center justify-center p-3 border border-white/10 shadow-inner">
                        <img src={match.away_club.logo_url || ''} alt="" className="w-full h-full object-contain filter drop-shadow-lg" />
                      </div>
                      <p className="text-white text-sm font-black">{match.away_club.name_ar}</p>
                    </div>
                  </div>

                  {/* ✅ تفاصيل المباراة - تم عكس الأماكن بناءً على الصورة */}
                  <div className="space-y-4 border-t border-white/5 pt-6 mb-6">
                    
                    {/* سطر التاريخ والوقت */}
                    <div className="flex flex-row justify-between items-center px-2 w-full">
                      <span className="text-gray-500 font-bold text-[10px] text-right">التاريخ والوقت</span>
                      <p className="text-white font-black text-[12px] text-left">
                        {new Date(match.match_date).toLocaleDateString('ar-SA', { weekday: 'long', day: 'numeric', month: 'long' })} | {new Date(match.match_date).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    
                    {/* سطر الملعب */}
                    <div className="flex flex-row justify-between items-center px-2 w-full">
                      <span className="text-gray-500 font-bold text-[10px] text-right">الملعب</span>
                      <p className="text-white font-black text-[12px] text-left truncate max-w-[180px]">
                        {match.venue || match.home_club.stadium_name || 'ملعب المباراة'}
                      </p>
                    </div>

                  </div>

                  {/* زر النقاط */}
                  <div className="bg-[#05E59F]/5 rounded-2xl py-4 text-center border border-[#05E59F]/20 shadow-inner">
                    <span className="text-[#05E59F] font-black text-sm">
                      {settings?.attendance_points || 100} غنيمة حضور
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* عروض مميزة */}
        <div className="mb-12">
          <h2 className="text-xl font-black text-white mb-5 pr-3 border-r-4 border-[#05E59F]">عروض مميزة</h2>
          <div className="grid grid-cols-2 gap-4">
              {topOffers.map((offer) => (
                <div key={offer.id} className="bg-white/5 backdrop-blur-sm rounded-[2rem] p-5 border border-white/10 shadow-xl transition-transform active:scale-[0.98]">
                  <div className="w-full h-24 mb-4 bg-white/5 backdrop-blur-sm rounded-2xl flex items-center justify-center p-3 border border-white/5 shadow-inner overflow-hidden">
                    <img src={offer.partner.logo_url || ''} alt="" className="w-full h-full object-contain filter drop-shadow-sm" />
                  </div>
                  <h4 className="font-bold text-white text-xs mb-3 text-center line-clamp-1">{offer.title_ar}</h4>
                  <div className="bg-[#05E59F] rounded-xl py-2 text-center shadow-lg shadow-[#05E59F]/20">
                    <span className="text-black font-black text-[10px] uppercase">
                      {offer.points_required} غنيمة
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* شعار النهاية */}
        <div className="flex flex-col items-center justify-center mt-20 mb-12 opacity-40 group">
            <img 
              src={logo1} 
              className="w-32 h-auto object-contain mb-4 transition-transform group-hover:scale-110 duration-500" 
              alt="Ghanem Logo Footer" 
            />
            <p className="text-[12px] text-gray-400 font-black tracking-[0.4em] uppercase">
              GHANEM APP V1.0
            </p>
        </div>

      </div>
    </div>
  );
}