import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Trophy, TrendingUp, Gift, Calendar } from 'lucide-react';
import { Database } from '../../lib/database.types';

type Match = Database['public']['Tables']['matches']['Row'] & {
  home_club: Database['public']['Tables']['clubs']['Row'];
  away_club: Database['public']['Tables']['clubs']['Row'];
};

type Offer = Database['public']['Tables']['partner_offers']['Row'] & {
  partner: Database['public']['Tables']['partners']['Row'];
};

export function HomePage() {
  const { profile } = useAuth();
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [topOffers, setTopOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: matches, error: matchError } = await supabase
  .from('matches')
  .select(`
          *,
          home_club:home_club_id(*),
          away_club:away_club_id(*)
        `)
  .eq('status', 'upcoming')
  .order('match_date', { ascending: true })
  .limit(3);

if (matchError) console.error('Match Error:', matchError);

      const { data: offers } = await supabase
        .from('partner_offers')
        .select(`
          *,
          partner:partners(*)
        `)
        .eq('is_active', true)
        .order('points_required', { ascending: true })
        .limit(4);

      setUpcomingMatches(matches || []);
      setTopOffers(offers || []);
      setLoading(false);
    };

    fetchData();
  }, [profile]);

  const getLevelName = (level: number) => {
    switch (level) {
      case 1: return 'المشجع الجديد';
      case 2: return 'المشجع النشط';
      case 3: return 'المشجع المخلص';
      case 4: return 'السوبر فان';
      case 5: return 'الأسطورة';
      default: return 'المشجع الجديد';
    }
  };

  const getLevelColor = (level: number) => {
    switch (level) {
      case 1: return 'from-gray-400 to-gray-600';
      case 2: return 'from-blue-400 to-blue-600';
      case 3: return 'from-green-400 to-green-600';
      case 4: return 'from-yellow-400 to-yellow-600';
      case 5: return 'from-orange-400 to-orange-600';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const getNextLevelPoints = (currentLevel: number) => {
    switch (currentLevel) {
      case 1: return 1000;
      case 2: return 5000;
      case 3: return 15000;
      case 4: return 30000;
      case 5: return null;
      default: return 1000;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const nextLevelPoints = getNextLevelPoints(profile?.level || 1);
  const progressPercentage = nextLevelPoints
    ? ((profile?.total_points_earned || 0) / nextLevelPoints) * 100
    : 100;

  return (
    <div className="pb-20" dir="rtl">
      <div className={`bg-gradient-to-br ${getLevelColor(profile?.level || 1)} text-white p-6 rounded-b-3xl shadow-lg`}>
        <h2 className="text-2xl font-bold mb-2">مرحباً، {profile?.full_name}</h2>
        <p className="text-white/80 mb-4">{getLevelName(profile?.level || 1)}</p>

        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm">النقاط الحالية</span>
            <span className="text-2xl font-bold">{profile?.points || 0}</span>
          </div>

          {nextLevelPoints && (
            <>
              <div className="w-full bg-white/30 rounded-full h-2 mb-2">
                <div
                  className="bg-white h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                />
              </div>
              <p className="text-xs text-white/80">
                {nextLevelPoints - (profile?.total_points_earned || 0)} نقطة للمستوى التالي
              </p>
            </>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 text-center">
            <Trophy className="w-6 h-6 mx-auto mb-1" />
            <p className="text-xs text-white/80">المباريات</p>
            <p className="text-lg font-bold">{profile?.matches_attended || 0}</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 text-center">
            <TrendingUp className="w-6 h-6 mx-auto mb-1" />
            <p className="text-xs text-white/80">متتالية</p>
            <p className="text-lg font-bold">{profile?.consecutive_matches || 0}</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 text-center">
            <Gift className="w-6 h-6 mx-auto mb-1" />
            <p className="text-xs text-white/80">المستوى</p>
            <p className="text-lg font-bold">{profile?.level || 1}</p>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">المباريات القادمة</h3>
          <Calendar className="w-5 h-5 text-gray-500" />
        </div>

        <div className="space-y-3">
          {upcomingMatches.map((match) => (
            <div key={match.id} className="bg-white rounded-xl shadow-md p-4 border border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex-1 text-center">
                  <img
                    src={match.home_club.logo_url || ''}
                    alt={match.home_club.name_ar}
                    className="w-12 h-12 mx-auto mb-2 object-contain"
                  />
                  <p className="font-bold text-sm">{match.home_club.name_ar}</p>
                </div>

                <div className="flex-1 text-center">
                  {match.round_number && (
                    <span className="inline-block bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-medium mb-1">
                      الجولة {match.round_number}
                    </span>
                  )}
                  <div className="bg-green-100 text-green-700 rounded-lg px-3 py-2 font-bold text-sm mb-1">
                    VS
                  </div>
                  <p className="text-xs text-gray-500">
                    {new Date(match.match_date).toLocaleDateString('ar-SA', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(match.match_date).toLocaleTimeString('ar-SA', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                <div className="flex-1 text-center">
                  <img
                    src={match.away_club.logo_url || ''}
                    alt={match.away_club.name_ar}
                    className="w-12 h-12 mx-auto mb-2 object-contain"
                  />
                  <p className="font-bold text-sm">{match.away_club.name_ar}</p>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-500">{match.home_club.stadium_name}</span>
                <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-medium">
                  {Math.round(match.base_points * match.points_multiplier)} نقطة
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mb-4 mt-8">
          <h3 className="text-xl font-bold text-gray-900">عروض مميزة</h3>
          <Gift className="w-5 h-5 text-gray-500" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {topOffers.map((offer) => (
            <div key={offer.id} className="bg-white rounded-xl shadow-md p-4 border border-gray-100">
              <img
                src={offer.partner.logo_url || ''}
                alt={offer.partner.name_ar}
                className="w-full h-20 object-contain mb-3"
              />
              <h4 className="font-bold text-sm mb-1 text-gray-900 line-clamp-2">
                {offer.title_ar}
              </h4>
              <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                {offer.description_ar}
              </p>
              <div className="flex items-center justify-between">
                <span className="bg-green-100 text-green-700 px-2 py-1 rounded-lg text-xs font-bold">
                  {offer.points_required} نقطة
                </span>
                {offer.discount_percentage && (
                  <span className="text-green-600 font-bold text-sm">
                    {offer.discount_percentage}%
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
