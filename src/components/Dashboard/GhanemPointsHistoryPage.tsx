import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { History, TrendingDown, Users, Trophy, Loader2 } from 'lucide-react';
import logo1 from '../../assets/logo1.svg';

interface Transaction {
  id: string;
  points: number;
  description: string;
  transaction_type: string;
  created_at: string;
}

export function GhanemPointsHistoryPage() {
  const { user, profile } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'earned' | 'spent'>('all');

  useEffect(() => {
    if (!user || !profile) return;

    const fetchAllHistory = async () => {
      setLoading(true);
      try {
        // 1. جلب نقاط الإحالة من إعدادات النظام
        const { data: settings } = await supabase
          .from('system_settings')
          .select('referral_points')
          .single();
        
        const refPointsValue = settings?.referral_points || 0;

        // 2. جلب العمليات العامة (استبدالات وغيرها)
        const { data: resGeneral } = await supabase
          .from('points_transactions')
          .select('id, points, description, transaction_type, created_at')
          .eq('user_id', user.id);

        // 3. جلب الحضور من جدول الحضور (للمباريات)
        const { data: resAttendance } = await supabase
          .from('match_attendance')
          .select(`
            id, 
            created_at, 
            points_earned, 
            matches (
              home_club:clubs!matches_home_club_id_fkey(name_ar),
              away_club:clubs!matches_away_club_id_fkey(name_ar)
            )
          `)
          .eq('user_id', user.id)
          .in('status', ['approved', 'confirmed', 'attended']);

        // 4. جلب الإحالات (الأشخاص اللي استخدموا كودك) بدون جلب أسمائهم
        const { data: resReferrals } = await supabase
          .from('user_profiles')
          .select('id, created_at')
          .eq('referred_by', profile.referral_code);

        // تحويل بيانات الحضور
        const attendanceMapped: Transaction[] = (resAttendance || []).map(item => {
          const home = item.matches?.home_club?.name_ar;
          const away = item.matches?.away_club?.name_ar;
          return {
            id: item.id,
            points: item.points_earned || 0,
            description: home && away ? `حضور مباراة: ${home} vs ${away}` : 'حضور مباراة',
            transaction_type: 'match_attendance',
            created_at: item.created_at
          };
        });

        // ✅ تحويل بيانات الإحالة لعمليات بدون إظهار الاسم
        const referralsMapped: Transaction[] = (resReferrals || []).map(item => ({
          id: item.id,
          points: refPointsValue,
          description: `إحالة ناجحة (عضو جديد)`, // تم تعديل الوصف هنا
          transaction_type: 'referral',
          created_at: item.created_at
        }));

        // 5. دمج وترتيب كل شيء
        let combined = [
          ...(resGeneral || []), 
          ...attendanceMapped, 
          ...referralsMapped
        ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        // تطبيق الفلترة
        if (filter === 'earned') combined = combined.filter(t => t.points > 0);
        if (filter === 'spent') combined = combined.filter(t => t.points < 0);

        setTransactions(combined);
      } catch (err) {
        console.error("Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllHistory();
  }, [user, profile, filter]);

  const getTransactionIcon = (type: string, points: number) => {
    if (type === 'referral') return <Users className="w-5 h-5 text-blue-400" />;
    if (points > 0) return <Trophy className="w-5 h-5 text-[#05E59F]" />;
    return <TrendingDown className="w-5 h-5 text-red-400" />;
  };

  return (
    <div className="pb-24 bg-[#003837] min-h-screen font-almarai text-right" dir="rtl">
      <div className="p-6">
        {/* الهيدر العلوي */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#05E59F] flex items-center justify-center shadow-lg shadow-[#05E59F]/20">
              <History className="w-6 h-6 text-black" />
            </div>
            <h1 className="text-2xl font-black text-white">سجل الغنائم</h1>
          </div>
          <img src={logo1} className="w-14 h-14 object-contain" alt="Ghanem" />
        </div>

        {/* أزرار الفلترة */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {[{ id: 'all', label: 'الكل' }, { id: 'earned', label: 'مكتسبة' }, { id: 'spent', label: 'مصروفة' }].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as any)}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                filter === f.id 
                ? 'bg-[#05E59F] text-black shadow-lg shadow-[#05E59F]/20' 
                : 'bg-[#002b2a] text-gray-400 border border-white/5'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-[#05E59F] w-10 h-10" />
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((t) => (
              <div key={t.id} className="bg-[#002b2a] rounded-[2rem] p-5 border border-white/5 shadow-xl transition-all active:scale-[0.98]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5 shadow-inner">
                      {getTransactionIcon(t.transaction_type, t.points)}
                    </div>
                    <div>
                      <p className="text-sm font-black text-white mb-1 leading-tight">{t.description}</p>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">
                        {new Date(t.created_at).toLocaleDateString('ar-SA', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-left">
                    <div className={`px-4 py-2 rounded-xl font-black text-lg ${t.points > 0 ? 'bg-[#05E59F]/10 text-[#05E59F]' : 'bg-red-500/10 text-red-400'}`}>
                      {t.points > 0 ? '+' : ''}{t.points}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {transactions.length === 0 && (
              <div className="text-center py-20 opacity-20">
                <History className="w-16 h-16 mx-auto mb-4 text-white" />
                <p className="text-white font-bold">لا توجد غنائم مسجلة</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  ); 
}