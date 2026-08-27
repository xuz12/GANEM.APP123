import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { User, Trophy, Calendar, TrendingUp, LogOut, Share2, Copy, Check } from 'lucide-react';
import { Database } from '../../lib/database.types';
import { UserQRCode } from '../components/Dashboard/UserQRCode';

type Transaction = Database['public']['Tables']['points_transactions']['Row'];

export function ProfilePage() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, [user, profile]);

  const fetchTransactions = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('points_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    setTransactions(data || []);
  };

  const handleCopyReferralCode = () => {
    if (profile?.referral_code) {
      navigator.clipboard.writeText(profile.referral_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSignOut = async () => {
    if (confirm('هل تريد تسجيل الخروج؟')) {
      await signOut();
    }
  };

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

  const getLevelBenefits = (level: number) => {
    switch (level) {
      case 1:
        return ['خصم 20% على أول استبدال', 'الوصول للعروض الأساسية'];
      case 2:
        return ['مضاعف نقاط ×1.2', 'عروض إضافية شهرياً', 'شارة رقمية خاصة'];
      case 3:
        return ['مضاعف نقاط ×1.5', 'أولوية في الحجوزات', 'خصم 15% دائم'];
      case 4:
        return ['مضاعف نقاط ×2', 'لقاء مع اللاعبين', 'تذكرتين VIP مجانية', 'خصم 25% دائم'];
      case 5:
        return ['مضاعف نقاط ×2.5', 'وصول لكل الفعاليات', 'اسم في قاعة المشاهير', 'خصم 35% دائم'];
      default:
        return [];
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'match_attendance':
      case 'early_arrival':
      case 'stayed_end':
      case 'consecutive_bonus':
      case 'season_completion':
        return '🏟️';
      case 'referral':
        return '👥';
      case 'redemption':
        return '🎁';
      default:
        return '⭐';
    }
  };

  return (
    <div className="pb-20" dir="rtl">
      <div className="bg-gradient-to-br from-green-600 to-green-700 text-white p-6 rounded-b-3xl shadow-lg mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center ml-4">
              <User className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{profile?.full_name || 'مشجع غنيمة'}</h2>
              <p className="text-white/80 text-sm">{user?.email}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
          <div className="text-center mb-2">
            <p className="text-white/80 text-sm mb-1">مستواك الحالي</p>
            <p className="text-2xl font-bold">{getLevelName(profile?.level || 1)}</p>
            <p className="text-white/80 text-xs mt-1">المستوى {profile?.level || 1} من 5</p>
          </div>
        </div>
      </div>

      <div className="px-4">
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white rounded-xl shadow-md p-4 text-center">
            <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{profile?.points || 0}</p>
            <p className="text-sm text-gray-600">النقاط الحالية</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-4 text-center">
            <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{profile?.total_points_earned || 0}</p>
            <p className="text-sm text-gray-600">إجمالي النقاط</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-4 text-center">
            <Calendar className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{profile?.matches_attended || 0}</p>
            <p className="text-sm text-gray-600">المباريات المحضورة</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-4 text-center">
            <Trophy className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{profile?.consecutive_matches || 0}</p>
            <p className="text-sm text-gray-600">المباريات المتتالية</p>
          </div>
        </div>

        {/* إضافة باركود غنيمة الشخصي هنا - يحل مشكلة الـ Import ويظهر الباركود */}
        <div className="mb-6">
          <UserQRCode 
            qrCode={user?.id || ''} 
            userName={profile?.full_name || 'مشجع غنيمة'} 
          />
        </div>

        <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-900">كود الإحالة الخاص بك</h3>
            <Share2 className="w-5 h-5 text-green-600" />
          </div>
          <div className="bg-white rounded-lg p-3 flex items-center justify-between">
            <span className="font-mono font-bold text-lg text-green-600">
              {profile?.referral_code}
            </span>
            <button
              onClick={handleCopyReferralCode}
              className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition-colors"
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-2">
            شارك هذا الكود مع أصدقائك واحصل على 100 نقطة عند تسجيلهم
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <h3 className="font-bold text-gray-900 mb-3">مزايا مستواك</h3>
          <ul className="space-y-2">
            {getLevelBenefits(profile?.level || 1).map((benefit, index) => (
              <li key={index} className="flex items-start">
                <span className="text-green-600 ml-2">✓</span>
                <span className="text-sm text-gray-700">{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <h3 className="font-bold text-gray-900 mb-4">سجل النقاط</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {transactions.length === 0 ? (
              <p className="text-center text-gray-500 text-sm py-4">لا يوجد سجل بعد</p>
            ) : (
              transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between pb-3 border-b border-gray-100 last:border-0"
                >
                  <div className="flex items-start flex-1">
                    <span className="text-2xl ml-3">{getTransactionIcon(transaction.transaction_type)}</span>
                    <div>
                      <p className="font-medium text-sm text-gray-900">{transaction.description}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(transaction.created_at).toLocaleDateString('ar-SA', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`font-bold text-lg ${
                      transaction.points > 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {transaction.points > 0 ? '+' : ''}
                    {transaction.points}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <LogOut className="w-5 h-5" />
          تسجيل الخروج
        </button>
      </div>
    </div>
  );
}