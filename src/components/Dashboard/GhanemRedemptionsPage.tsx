import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Gift, Clock, CheckCircle, XCircle, Loader } from 'lucide-react';
import { Database } from '../../lib/database.types';
// ✅ استيراد الشعار المفرغ
import logo1 from '../../assets/logo3.svg';

type Redemption = Database['public']['Tables']['redemptions']['Row'] & {
  offer: Database['public']['Tables']['partner_offers']['Row'] & {
    partner: Database['public']['Tables']['partners']['Row'];
  };
};

export function GhanemRedemptionsPage() {
  const { user } = useAuth();
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'used' | 'expired'>('all');

  useEffect(() => {
    if (!user) return;

    const fetchRedemptions = async () => {
      setLoading(true);
      let query = supabase
        .from('redemptions')
        .select(`
          *,
          offer:partner_offers(
            *,
            partner:partners(*)
          )
        `)
        .eq('user_id', user.id)
        .order('redeemed_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data } = await query;
      setRedemptions(data || []);
      setLoading(false);
    };

    fetchRedemptions();
  }, [user, filter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="bg-[#05E59F]/10 text-[#05E59F] px-3 py-1.5 rounded-lg text-[10px] font-black flex items-center gap-1.5 border border-[#05E59F]/20 uppercase">
            <Clock className="w-3 h-3" />
            جاهز
          </span>
        );
      case 'used':
        return (
          <span className="bg-white/5 text-gray-400 px-3 py-1.5 rounded-lg text-[10px] font-black flex items-center gap-1.5 border border-white/5 uppercase">
            <CheckCircle className="w-3 h-3" />
            مستخدم
          </span>
        );
      case 'expired':
        return (
          <span className="bg-red-500/10 text-red-400 px-3 py-1.5 rounded-lg text-[10px] font-black flex items-center gap-1.5 border border-red-500/20 uppercase">
            <XCircle className="w-3 h-3" />
            منتهي
          </span>
        );
      default:
        return null;
    }
  };

  const filters = [
    { id: 'all' as const, label: 'الكل' },
    { id: 'pending' as const, label: 'جاهز' },
    { id: 'used' as const, label: 'مستخدم' },
    { id: 'expired' as const, label: 'منتهي' },
  ];

  return (
    /* ✅ تطبيق الخلفية الداكنة المعتمدة #003837 */
    <div className="pb-24 bg-[#003837] min-h-screen font-almarai text-right" dir="rtl">
      <div className="p-6">
        
        {/* الهيدر مع اللوجو */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#05E59F] flex items-center justify-center shadow-lg shadow-[#05E59F]/20">
              <Gift className="w-6 h-6 text-black" />
            </div>
            <h1 className="text-2xl font-black text-white">استبدالاتي</h1>
          </div>
          
          <div className="w-14 h-14 flex items-center justify-center">
            <img src={logo1} className="w-full h-full object-contain" alt="Ghanem Logo" />
          </div>
        </div>

        {/* أزرار الفلترة */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
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
          <div className="flex flex-col items-center justify-center py-20">
            <Loader className="w-10 h-10 animate-spin text-[#05E59F] mb-4" />
            <p className="text-gray-400 text-sm font-bold">جاري جلب القسائم...</p>
          </div>
        ) : redemptions.length === 0 ? (
          <div className="text-center py-20 bg-[#002b2a] rounded-[2.5rem] border border-dashed border-white/10">
            <Gift className="w-20 h-20 mx-auto mb-4 text-white/5" />
            <p className="text-gray-400 font-bold">لم تقم بأي استبدال بعد</p>
          </div>
        ) : (
          <div className="space-y-4">
            {redemptions.map((redemption) => (
              <div
                key={redemption.id}
                className="bg-[#002b2a] rounded-[2rem] p-6 border border-white/5 shadow-2xl relative overflow-hidden transition-transform active:scale-[0.98]"
              >
                <div className="flex items-start justify-between mb-6 relative z-10">
                  <div className="flex items-start gap-4 flex-1">
                    {/* مربع شعار الشريك المفرغ */}
                    <div className="w-16 h-16 bg-white/5 backdrop-blur-sm rounded-2xl flex items-center justify-center p-2 border border-white/10 shadow-inner">
                      <img
                        src={redemption.offer.partner.logo_url || ''}
                        alt=""
                        className="w-12 h-12 object-contain filter drop-shadow-sm"
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-black text-white text-base mb-1 leading-tight">
                        {redemption.offer.title_ar}
                      </h4>
                      <p className="text-[10px] font-bold text-[#05E59F] uppercase tracking-wider">
                        {redemption.offer.partner.name_ar}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(redemption.status)}
                </div>

                {redemption.status === 'pending' && (
                  <div className="bg-black/30 border border-[#05E59F]/20 rounded-2xl p-5 mb-5 text-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-[#05E59F]/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <p className="text-[10px] text-gray-500 mb-2 font-black uppercase tracking-[0.2em]">كود الاستبدال الخاص بك</p>
                    <p className="text-2xl font-mono font-black text-[#05E59F] tracking-[0.2em] relative z-10">
                      {redemption.redemption_code}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] font-bold pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2 text-gray-500 uppercase">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {redemption.status === 'pending'
                        ? `ينتهي في ${new Date(redemption.expires_at).toLocaleDateString('ar-SA')}`
                        : `${new Date(redemption.redeemed_at).toLocaleDateString('ar-SA')}`}
                    </span>
                  </div>
                  <div className="bg-white/5 px-3 py-1 rounded-lg text-gray-300 border border-white/5">
                    {redemption.points_spent.toLocaleString('ar-SA')} غنيمة
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}