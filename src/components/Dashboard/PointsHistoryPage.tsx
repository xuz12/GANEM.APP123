import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { TrendingUp, TrendingDown, Clock, Award, Gift, Users, Calendar, Target, Star } from 'lucide-react';
import { Database } from '../../lib/database.types';

type Transaction = Database['public']['Tables']['points_transactions']['Row'];

const transactionIcons: Record<string, any> = {
  match_attendance: Calendar,
  early_arrival: Clock,
  stayed_end: Target,
  consecutive_bonus: Award,
  season_completion: Star,
  referral: Users,
  daily_login: Calendar,
  prediction: Target,
  content: Star,
  redemption: Gift,
  admin_adjustment: Award,
};

const transactionColors: Record<string, string> = {
  match_attendance: 'text-green-600 bg-green-100',
  early_arrival: 'text-blue-600 bg-blue-100',
  stayed_end: 'text-teal-600 bg-teal-100',
  consecutive_bonus: 'text-yellow-600 bg-yellow-100',
  season_completion: 'text-orange-600 bg-orange-100',
  referral: 'text-pink-600 bg-pink-100',
  daily_login: 'text-cyan-600 bg-cyan-100',
  prediction: 'text-blue-600 bg-blue-100',
  content: 'text-teal-600 bg-teal-100',
  redemption: 'text-red-600 bg-red-100',
  admin_adjustment: 'text-gray-600 bg-gray-100',
};

export function PointsHistoryPage() {
  const { user, profile } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<'all' | 'earned' | 'spent'>('all');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEarned: 0,
    totalSpent: 0,
    thisMonth: 0,
    lastMonth: 0,
  });

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user, filter]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('points_transactions')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (filter === 'earned') {
        query = query.gt('points', 0);
      } else if (filter === 'spent') {
        query = query.lt('points', 0);
      }

      const { data } = await query;
      setTransactions(data || []);

      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      const allTransactions = data || [];
      const totalEarned = allTransactions
        .filter(t => t.points > 0)
        .reduce((sum, t) => sum + t.points, 0);
      const totalSpent = Math.abs(
        allTransactions
          .filter(t => t.points < 0)
          .reduce((sum, t) => sum + t.points, 0)
      );
      const thisMonth = allTransactions
        .filter(t => new Date(t.created_at) >= thisMonthStart && t.points > 0)
        .reduce((sum, t) => sum + t.points, 0);
      const lastMonth = allTransactions
        .filter(
          t =>
            new Date(t.created_at) >= lastMonthStart &&
            new Date(t.created_at) <= lastMonthEnd &&
            t.points > 0
        )
        .reduce((sum, t) => sum + t.points, 0);

      setStats({ totalEarned, totalSpent, thisMonth, lastMonth });
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - d.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'اليوم';
    } else if (diffDays === 1) {
      return 'أمس';
    } else if (diffDays < 7) {
      return `منذ ${diffDays} أيام`;
    } else {
      return d.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  const getChangePercentage = () => {
    if (stats.lastMonth === 0) return stats.thisMonth > 0 ? 100 : 0;
    return Math.round(((stats.thisMonth - stats.lastMonth) / stats.lastMonth) * 100);
  };

  return (
    <div className="pb-20 p-4" dir="rtl">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">سجل النقاط</h2>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-4 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm opacity-90">إجمالي النقاط المكتسبة</span>
            <TrendingUp className="w-5 h-5 opacity-90" />
          </div>
          <p className="text-3xl font-bold">{stats.totalEarned.toLocaleString('ar-SA')}</p>
          <p className="text-xs opacity-80 mt-1">منذ التسجيل</p>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-4 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm opacity-90">النقاط المستخدمة</span>
            <TrendingDown className="w-5 h-5 opacity-90" />
          </div>
          <p className="text-3xl font-bold">{stats.totalSpent.toLocaleString('ar-SA')}</p>
          <p className="text-xs opacity-80 mt-1">إجمالي الاستبدالات</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border-2 border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">هذا الشهر</span>
            <Calendar className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.thisMonth.toLocaleString('ar-SA')}</p>
          {stats.lastMonth > 0 && (
            <div className="flex items-center gap-1 mt-1">
              {getChangePercentage() >= 0 ? (
                <TrendingUp className="w-3 h-3 text-green-600" />
              ) : (
                <TrendingDown className="w-3 h-3 text-red-600" />
              )}
              <p className={`text-xs ${getChangePercentage() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(getChangePercentage())}% عن الشهر الماضي
              </p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-4 border-2 border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">الرصيد الحالي</span>
            <Award className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{profile?.points.toLocaleString('ar-SA') || 0}</p>
          <p className="text-xs text-gray-500 mt-1">متاح للاستبدال</p>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex gap-2 bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all ${
              filter === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
            }`}
          >
            الكل
          </button>
          <button
            onClick={() => setFilter('earned')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all ${
              filter === 'earned' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
            }`}
          >
            المكتسبة
          </button>
          <button
            onClick={() => setFilter('spent')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all ${
              filter === 'spent' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
            }`}
          >
            المستخدمة
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="text-gray-500 mt-4">جاري التحميل...</p>
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-12">
          <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">لا توجد معاملات</p>
          <p className="text-sm text-gray-400 mt-2">ابدأ بحضور المباريات لكسب النقاط</p>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((transaction) => {
            const Icon = transactionIcons[transaction.transaction_type] || Award;
            const colorClass = transactionColors[transaction.transaction_type] || 'text-gray-600 bg-gray-100';
            const isPositive = transaction.points > 0;

            return (
              <div
                key={transaction.id}
                className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-3 rounded-xl ${colorClass.split(' ')[1]}`}>
                    <Icon className={`w-5 h-5 ${colorClass.split(' ')[0]}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 mb-1">{transaction.description}</p>
                    <p className="text-xs text-gray-500">{formatDate(transaction.created_at)}</p>
                  </div>

                  <div className="text-left">
                    <p
                      className={`text-lg font-bold ${
                        isPositive ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {isPositive ? '+' : ''}
                      {transaction.points.toLocaleString('ar-SA')}
                    </p>
                    <p className="text-xs text-gray-500">نقطة</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
