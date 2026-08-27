import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Gift, Tag, CheckCircle, Clock, X, MapPin } from 'lucide-react';
import { Database } from '../../lib/database.types';

type Offer = Database['public']['Tables']['partner_offers']['Row'] & {
  partner: Database['public']['Tables']['partners']['Row'];
};

type Redemption = Database['public']['Tables']['redemptions']['Row'] & {
  offer: Database['public']['Tables']['partner_offers']['Row'] & {
    partner: Database['public']['Tables']['partners']['Row'];
  };
};

export function RewardsPage() {
  const { user, profile, refreshProfile } = useAuth();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(false);
  const [showRedemptionModal, setShowRedemptionModal] = useState(false);
  const [uniqueCities, setUniqueCities] = useState(0);

  useEffect(() => {
    fetchOffers();
    fetchRedemptions();
    fetchUniqueCities();
  }, [selectedCategory, selectedRegion, user, profile]);

  const fetchOffers = async () => {
    let query = supabase
      .from('partner_offers')
      .select(`
        *,
        partner:partners(*)
      `)
      .eq('is_active', true)
      .order('points_required', { ascending: true });

    if (selectedCategory !== 'all') {
      query = query.eq('category', selectedCategory);
    }

    if (selectedRegion !== 'all') {
      query = query.or(`region.eq.${selectedRegion},region.is.null`);
    }

    const { data } = await query;

    const filteredOffers = (data || []).filter((offer) => {
      if (offer.category === 'retail') {
        return offer.partner.name_ar === 'نايكي';
      }
      return true;
    });

    setOffers(filteredOffers);
  };

  const fetchUniqueCities = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('attendance')
      .select('match:matches(club:clubs(city))')
      .eq('user_id', user.id);

    if (data) {
      const cities = new Set(
        data
          .map((att: any) => att.match?.club?.city)
          .filter((city): city is string => city != null)
      );
      setUniqueCities(cities.size);
    }
  };

  const fetchRedemptions = async () => {
    if (!user) return;

    const { data } = await supabase
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

    setRedemptions(data || []);
  };

  const handleRedeem = async () => {
    if (!selectedOffer || !user || !profile) return;

    if (profile.points < selectedOffer.points_required) {
      alert('ليس لديك نقاط كافية');
      return;
    }

    setLoading(true);

    try {
      const redemptionCode = `RWD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const { error: redemptionError } = await supabase.from('redemptions').insert({
        user_id: user.id,
        offer_id: selectedOffer.id,
        points_spent: selectedOffer.points_required,
        redemption_code: redemptionCode,
        expires_at: expiresAt.toISOString(),
      });

      if (redemptionError) throw redemptionError;

      await supabase.from('points_transactions').insert({
        user_id: user.id,
        points: -selectedOffer.points_required,
        transaction_type: 'redemption',
        reference_id: selectedOffer.id,
        description: `استبدال: ${selectedOffer.title_ar}`,
      });

      await supabase
        .from('user_profiles')
        .update({
          points: profile.points - selectedOffer.points_required,
        })
        .eq('id', user.id);

      await supabase
        .from('partner_offers')
        .update({
          current_redemptions: (selectedOffer.current_redemptions || 0) + 1,
        })
        .eq('id', selectedOffer.id);

      await refreshProfile();
      await fetchRedemptions();

      setShowRedemptionModal(false);
      setSelectedOffer(null);
      alert('تم الاستبدال بنجاح! يمكنك استخدام الكود في قسم "استبدالاتي"');
    } catch (error) {
      console.error('Redemption error:', error);
      alert('حدث خطأ أثناء الاستبدال');
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: 'all', name: 'الكل', icon: Gift },
    { id: 'restaurant', name: 'مطاعم', icon: Gift },
    { id: 'retail', name: 'تسوق', icon: Tag },
    { id: 'entertainment', name: 'ترفيه', icon: Gift },
    { id: 'services', name: 'خدمات', icon: Gift },
  ];

  const regions = [
    { id: 'all', name: 'كل المناطق' },
    { id: 'عسير', name: 'عسير' },
    { id: 'نجران', name: 'نجران' },
    { id: 'الشرقية', name: 'الشرقية' },
    { id: 'القصيم', name: 'القصيم' },
    { id: 'الرياض', name: 'الرياض' },
    { id: 'تبوك', name: 'تبوك' },
    { id: 'مكة المكرمة', name: 'مكة المكرمة' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
            جاهز للاستخدام
          </span>
        );
      case 'used':
        return (
          <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">
            مستخدم
          </span>
        );
      case 'expired':
        return (
          <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-medium">
            منتهي
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="pb-20" dir="rtl">
      <div className="bg-gradient-to-br from-green-600 to-green-700 text-white p-6 rounded-b-3xl shadow-lg mb-4">
        <h2 className="text-2xl font-bold mb-2">المكافآت والعروض</h2>
        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
          <p className="text-sm text-white/80 mb-1">رصيدك الحالي</p>
          <p className="text-3xl font-bold">{profile?.points || 0} نقطة</p>
        </div>
      </div>

      <div className="px-4 mb-4">
        <h3 className="text-sm font-bold text-gray-700 mb-2">التصنيف</h3>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 mb-6">
        <h3 className="text-sm font-bold text-gray-700 mb-2">المنطقة</h3>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {regions.map((region) => (
            <button
              key={region.id}
              onClick={() => setSelectedRegion(region.id)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all flex items-center gap-1 ${
                selectedRegion === region.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {region.id !== 'all' && <MapPin className="w-4 h-4" />}
              {region.name}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4">
        <h3 className="text-lg font-bold text-gray-900 mb-4">العروض المتاحة</h3>

        <div className="space-y-4 mb-8">
          {offers.map((offer) => {
            const canAfford = (profile?.points || 0) >= offer.points_required;
            return (
              <div
                key={offer.id}
                className={`bg-white rounded-xl shadow-md p-4 border-2 ${
                  canAfford ? 'border-green-200' : 'border-gray-100'
                }`}
              >
                <div className="flex items-start gap-4">
                  <img
                    src={offer.partner.logo_url || ''}
                    alt={offer.partner.name_ar}
                    className="w-20 h-20 object-contain flex-shrink-0"
                  />

                  <div className="flex-1">
                    <div className="flex items-start gap-2 mb-1">
                      <h4 className="font-bold text-gray-900 flex-1">{offer.title_ar}</h4>
                      {offer.region && (
                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1 whitespace-nowrap">
                          <MapPin className="w-3 h-3" />
                          {offer.region}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{offer.description_ar}</p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-sm font-bold">
                          {offer.points_required} نقطة
                        </span>
                        {offer.discount_percentage && (
                          <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-lg text-sm font-bold">
                            {offer.discount_percentage}%
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          setSelectedOffer(offer);
                          setShowRedemptionModal(true);
                        }}
                        disabled={!canAfford}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                          canAfford
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        استبدل الآن
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <h3 className="text-lg font-bold text-gray-900 mb-4">استبدالاتي</h3>

        {redemptions.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-xl shadow-md">
            <Gift className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">لم تقم بأي استبدال بعد</p>
          </div>
        ) : (
          <div className="space-y-3">
            {redemptions.map((redemption) => (
              <div key={redemption.id} className="bg-white rounded-xl shadow-md p-4 border border-gray-100">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-gray-900">{redemption.offer.title_ar}</h4>
                    <p className="text-sm text-gray-600">{redemption.offer.partner.name_ar}</p>
                  </div>
                  {getStatusBadge(redemption.status)}
                </div>

                {redemption.status === 'pending' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-2">
                    <p className="text-xs text-green-700 mb-1">كود الاستبدال</p>
                    <p className="text-lg font-mono font-bold text-green-900">
                      {redemption.redemption_code}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>
                      {redemption.status === 'pending'
                        ? `ينتهي في ${new Date(redemption.expires_at).toLocaleDateString('ar-SA')}`
                        : `تم في ${new Date(redemption.redeemed_at).toLocaleDateString('ar-SA')}`}
                    </span>
                  </div>
                  <span>{redemption.points_spent} نقطة</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showRedemptionModal && selectedOffer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" dir="rtl">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">تأكيد الاستبدال</h3>
              <button
                onClick={() => setShowRedemptionModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6">
              <img
                src={selectedOffer.partner.logo_url || ''}
                alt={selectedOffer.partner.name_ar}
                className="w-24 h-24 object-contain mx-auto mb-4"
              />
              <h4 className="font-bold text-lg text-center mb-2">{selectedOffer.title_ar}</h4>
              <p className="text-sm text-gray-600 text-center mb-4">{selectedOffer.description_ar}</p>

              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">النقاط المطلوبة</span>
                  <span className="font-bold text-red-600">-{selectedOffer.points_required}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">رصيدك الحالي</span>
                  <span className="font-bold">{profile?.points || 0}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200">
                  <span className="text-gray-900 font-bold">الرصيد بعد الاستبدال</span>
                  <span className="font-bold text-green-600">
                    {(profile?.points || 0) - selectedOffer.points_required}
                  </span>
                </div>
              </div>

              {selectedOffer.terms_ar && (
                <div className="mt-4">
                  <p className="text-xs text-gray-500 font-medium mb-1">الشروط والأحكام:</p>
                  <p className="text-xs text-gray-600">{selectedOffer.terms_ar}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowRedemptionModal(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-3 px-4 rounded-xl transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleRedeem}
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'جاري الاستبدال...' : 'تأكيد الاستبدال'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
