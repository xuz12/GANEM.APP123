import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Users, Share2, Copy, Check, Gift, TrendingUp, Award } from 'lucide-react';
import { Database } from '../../lib/database.types';

type Referral = Database['public']['Tables']['user_referrals']['Row'] & {
  referred_user?: {
    full_name: string;
    matches_attended: number;
  };
};

export function ReferralsPage() {
  const { profile } = useAuth();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    registered: 0,
    firstMatch: 0,
    vip: 0,
    totalPoints: 0,
  });

  useEffect(() => {
    fetchReferrals();
  }, [profile]);

  const fetchReferrals = async () => {
    if (!profile) return;

    setLoading(true);
    try {
      const { data } = await supabase
        .from('user_referrals')
        .select(`
          *,
          referred_user:user_profiles!user_referrals_referred_id_fkey(
            full_name,
            matches_attended
          )
        `)
        .eq('referrer_id', profile.id)
        .order('created_at', { ascending: false });

      setReferrals(data || []);

      const total = data?.length || 0;
      const registered = data?.filter(r => r.status === 'registered').length || 0;
      const firstMatch = data?.filter(r => r.status === 'first_match').length || 0;
      const vip = data?.filter(r => r.status === 'vip').length || 0;
      const totalPoints = data?.reduce((sum, r) => sum + r.points_awarded, 0) || 0;

      setStats({ total, registered, firstMatch, vip, totalPoints });
    } catch (error) {
      console.error('Error fetching referrals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyReferralCode = () => {
    if (profile?.referral_code) {
      navigator.clipboard.writeText(profile.referral_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareReferral = async () => {
    const shareText = `انضم إلى رواد واحصل على نقاط مجانية! استخدم كود الإحالة: ${profile?.referral_code}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'انضم إلى رواد',
          text: shareText,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      handleCopyReferralCode();
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'registered':
        return 'مسجل';
      case 'first_match':
        return 'حضر أول مباراة';
      case 'vip':
        return 'عضو VIP';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'registered':
        return 'bg-blue-100 text-blue-700';
      case 'first_match':
        return 'bg-green-100 text-green-700';
      case 'vip':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="pb-20 p-4" dir="rtl">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">برنامج الإحالة</h2>

      <div className="bg-gradient-to-br from-green-500 to-blue-500 rounded-2xl p-6 text-white shadow-lg mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold mb-1">كود الإحالة الخاص بك</h3>
            <p className="text-white/80 text-sm">شارك مع أصدقائك واحصل على مكافآت</p>
          </div>
          <Share2 className="w-8 h-8 opacity-90" />
        </div>

        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <span className="font-mono font-bold text-2xl">{profile?.referral_code}</span>
            <button
              onClick={handleCopyReferralCode}
              className="bg-white/30 hover:bg-white/40 backdrop-blur-sm p-3 rounded-lg transition-all"
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <button
          onClick={handleShareReferral}
          className="w-full bg-white text-green-600 hover:bg-gray-50 font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <Share2 className="w-5 h-5" />
          مشاركة كود الإحالة
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span className="text-xs text-gray-500">إجمالي الإحالات</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <Gift className="w-5 h-5 text-green-600" />
            <span className="text-xs text-gray-500">النقاط المكتسبة</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalPoints}</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-5 h-5 text-teal-600" />
            <span className="text-xs text-gray-500">حضروا مباريات</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.firstMatch}</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <Award className="w-5 h-5 text-yellow-600" />
            <span className="text-xs text-gray-500">أعضاء VIP</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.vip}</p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-4 mb-6">
        <h3 className="font-bold text-gray-900 mb-3">كيف تربح النقاط؟</h3>
        <ul className="space-y-2">
          <li className="flex items-start">
            <span className="text-green-600 ml-2 font-bold">50</span>
            <span className="text-sm text-gray-700">نقطة عند تسجيل صديقك</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-600 ml-2 font-bold">100</span>
            <span className="text-sm text-gray-700">نقطة عند حضور صديقك أول مباراة</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-600 ml-2 font-bold">250</span>
            <span className="text-sm text-gray-700">نقطة عند وصول صديقك لعضوية VIP</span>
          </li>
        </ul>
      </div>

      <h3 className="font-bold text-gray-900 mb-4">الإحالات الخاصة بك</h3>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="text-gray-500 mt-4">جاري التحميل...</p>
        </div>
      ) : referrals.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">لم تقم بإحالة أحد بعد</p>
          <p className="text-sm text-gray-400 mt-2">شارك كود الإحالة الخاص بك مع أصدقائك</p>
        </div>
      ) : (
        <div className="space-y-3">
          {referrals.map((referral) => (
            <div
              key={referral.id}
              className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">
                      {referral.referred_user?.full_name || 'مستخدم جديد'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(referral.created_at).toLocaleDateString('ar-SA', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-lg font-bold text-green-600">+{referral.points_awarded}</p>
                  <p className="text-xs text-gray-500">نقطة</p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${getStatusColor(referral.status)}`}>
                  {getStatusLabel(referral.status)}
                </span>
                {referral.referred_user && (
                  <span className="text-xs text-gray-500">
                    {referral.referred_user.matches_attended} مباراة محضورة
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
