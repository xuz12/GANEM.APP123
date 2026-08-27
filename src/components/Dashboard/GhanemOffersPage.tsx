import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Database } from '../../lib/database.types';
import { Gift, MapPin, Loader, X, CheckCircle2, Copy } from 'lucide-react';

// ✅ استيراد الشعار المفرغ الخاص بغانم
import logo1 from '../../assets/logo1.svg';

type Offer = Database['public']['Tables']['partner_offers']['Row'] & {
  partner: Database['public']['Tables']['partners']['Row'];
};

export function GhanemOffersPage() {
  const { user, profile, refreshProfile } = useAuth();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [showRedemptionModal, setShowRedemptionModal] = useState(false);
  const [redeeming, setRedeeming] = useState(false);

  // ✅ حالة جديدة لحفظ الكود بعد النجاح وعرضه في المودال
  const [redeemedCode, setRedeemedCode] = useState<string | null>(null);

  const filters = [
    { id: 'all', label: 'الكل' },
    { id: 'مطاعم', label: 'مطاعم' },
    { id: 'تسوق', label: 'تسوق' },
    { id: 'ترفيه', label: 'ترفيه' },
    { id: 'خدمات', label: 'خدمات' },
  ];

  const regions = [
    { id: 'all', name: 'كل المناطق' },
    { id: 'جدة', name: 'جدة' },
    { id: 'مكة المكرمة', name: 'مكة المكرمة' },
    { id: 'الرياض', name: 'الرياض' },
    { id: 'الشرقية', name: 'الشرقية' },
    { id: 'عسير', name: 'عسير' },
    { id: 'نجران', name: 'نجران' },
  ];

  useEffect(() => {
    const fetchOffers = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from('partner_offers')
          .select(`
            *,
            partner:partners(*)
          `)
          .eq('is_active', true)
          .order('points_required', { ascending: true });

        if (activeFilter !== 'all') {
          query = query.eq('category', activeFilter);
        }

        if (selectedRegion !== 'all') {
          query = query.eq('region', selectedRegion);
        }

        const { data, error } = await query.limit(50);
        if (error) throw error;
        setOffers(data || []);
      } catch (error) {
        console.error('Error fetching offers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOffers();
  }, [activeFilter, selectedRegion]);

  const handleRedeem = async () => {
    if (!selectedOffer || !user || !profile) return;
    if (profile.points < selectedOffer.points_required) {
      alert('ليس لديك غنائم كافية');
      return;
    }

    setRedeeming(true);
    try {
      const redemptionCode = `GH-${Date.now().toString().slice(-4)}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
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
        .update({ points: profile.points - selectedOffer.points_required })
        .eq('user_id', user.id);

      await supabase
        .from('partner_offers')
        .update({ current_redemptions: (selectedOffer.current_redemptions || 0) + 1 })
        .eq('id', selectedOffer.id);

      await refreshProfile();
      
      // ✅ حفظ الكود بدلاً من الـ Alert
      setRedeemedCode(redemptionCode);
      
    } catch (error) {
      console.error('Redemption error:', error);
      alert('حدث خطأ أثناء الاستبدال');
    } finally {
      setRedeeming(false);
    }
  };

  const closeModal = () => {
    setShowRedemptionModal(false);
    setSelectedOffer(null);
    setRedeemedCode(null);
  };

  return (
    <div className="pb-24 bg-[#003837] min-h-screen font-almarai text-right" dir="rtl">
      <div className="p-6">
        
        {/* الهيدر العلوي */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#05E59F] flex items-center justify-center shadow-lg shadow-[#05E59F]/20">
              <Gift className="w-6 h-6 text-black" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">العروض</h1>
              <p className="text-[#05E59F] text-sm font-bold tracking-tight">
                رصيدك: {profile?.points?.toLocaleString('ar-SA') || 0} غنيمة
              </p>
            </div>
          </div>

          <div className="w-14 h-14 flex items-center justify-center">
            <img src={logo1} className="w-full h-full object-contain" alt="Ghanem Logo" />
          </div>
        </div>

        {/* فلاتر التصنيف */}
        <div className="mb-6">
          <p className="text-gray-400 text-[10px] mb-3 font-black uppercase tracking-widest px-1">التصنيف</p>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {filters.map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                  activeFilter === f.id 
                  ? 'bg-[#05E59F] text-black shadow-lg shadow-[#05E59F]/20' 
                  : 'bg-white/5 text-gray-400 border border-white/5'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* فلاتر المناطق */}
        <div className="mb-8">
          <p className="text-gray-400 text-[10px] mb-3 font-black uppercase tracking-widest px-1">المنطقة</p>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {regions.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelectedRegion(r.id)}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
                  selectedRegion === r.id 
                  ? 'bg-[#05E59F] text-black' 
                  : 'bg-white/5 text-gray-400 border border-white/5'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                {r.name}
              </button>
            ))}
          </div>
        </div>

        {/* قائمة العروض */}
        {loading ? (
          <div className="flex flex-col items-center py-20">
            <Loader className="w-10 h-10 animate-spin text-[#05E59F] mb-4" />
            <p className="text-gray-400 text-sm">جاري جلب أفضل العروض...</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {offers.map((offer) => {
              const canAfford = (profile?.points || 0) >= offer.points_required;
              return (
                <div key={offer.id} className="bg-white/5 backdrop-blur-md rounded-[30px] p-5 border border-white/10 shadow-2xl transition-transform active:scale-[0.98]">
                  <div className="flex gap-5">
                    <div className="w-24 h-24 bg-white/5 backdrop-blur-sm rounded-2xl flex items-center justify-center p-2 flex-shrink-0 border border-white/5">
                      <img 
                        src={offer.partner.logo_url || ''} 
                        alt="" 
                        className="max-w-[90%] max-h-[90%] object-contain filter drop-shadow-sm" 
                      />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-white font-bold text-lg mb-1">{offer.title_ar}</h3>
                      <p className="text-gray-400 text-xs leading-relaxed mb-3 line-clamp-2">{offer.description_ar}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-[#05E59F] font-black text-sm">{offer.points_required.toLocaleString('ar-SA')} غنيمة</span>
                        {offer.discount_percentage && (
                          <div className="bg-[#05E59F]/10 px-2 py-1 rounded-lg border border-[#05E59F]/20">
                            <span className="text-[#05E59F] text-[10px] font-black">
                              {offer.discount_percentage}% خصم
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <button
                    disabled={!canAfford}
                    onClick={() => { setSelectedOffer(offer); setShowRedemptionModal(true); }}
                    className={`w-full mt-5 py-4 rounded-2xl font-black transition-all ${
                      canAfford 
                      ? 'bg-[#05E59F] text-black shadow-lg shadow-[#05E59F]/20 active:scale-95' 
                      : 'bg-white/5 text-gray-500 cursor-not-allowed opacity-50'
                    }`}
                  >
                    {canAfford ? 'استبدل الآن' : 'نقاطك لا تكفي'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ✅ المودال الكامل المصلح (Centred Modal) */}
      {showRedemptionModal && selectedOffer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={closeModal}></div>
          
          <div className="bg-[#003837] w-full max-w-sm rounded-[3rem] p-8 border border-[#05E59F]/30 shadow-2xl relative z-[101] animate-in zoom-in-95 duration-200">
            
            {redeemedCode ? (
              <div className="text-center">
                <div className="w-20 h-20 bg-[#05E59F]/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-[#05E59F]/20">
                  <CheckCircle2 className="w-10 h-10 text-[#05E59F]" />
                </div>
                <h2 className="text-white text-2xl font-black mb-2">تم الاستبدال!</h2>
                <p className="text-gray-400 text-sm mb-8 font-bold">كود الخصم الخاص بك هو:</p>
                
                <div 
                  className="bg-black/40 border-2 border-dashed border-[#05E59F]/50 rounded-2xl p-6 mb-8 cursor-pointer active:scale-95 transition-transform relative group"
                  onClick={() => {
                    navigator.clipboard.writeText(redeemedCode);
                    alert('تم النسخ ✅');
                  }}
                >
                  <img src={logo1} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 opacity-5" alt="" />
                  <span className="text-[#05E59F] text-2xl font-black tracking-widest relative z-10">{redeemedCode}</span>
                </div>

                <button 
                  onClick={closeModal}
                  className="w-full bg-[#05E59F] text-black py-4 rounded-2xl font-black shadow-lg"
                >
                  العودة للعروض
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-white text-xl font-black mb-6 text-center">تأكيد الاستبدال</h2>
                <div className="bg-black/30 rounded-3xl p-6 mb-8 border border-white/5 text-center">
                  <p className="text-gray-400 text-[10px] mb-2 font-bold uppercase tracking-widest">سيتم خصم</p>
                  <p className="text-[#05E59F] text-5xl font-black tracking-tighter">
                    {selectedOffer.points_required.toLocaleString('ar-SA')}
                  </p>
                  <p className="text-gray-300 text-sm mt-3 font-bold">{selectedOffer.title_ar}</p>
                </div>
                <div className="flex gap-4">
                   <button 
                     onClick={handleRedeem} 
                     disabled={redeeming}
                     className="flex-[2] bg-[#05E59F] text-black py-4 rounded-2xl font-black shadow-lg shadow-[#05E59F]/30 active:scale-95 disabled:opacity-50"
                   >
                     {redeeming ? <Loader className="w-6 h-6 animate-spin mx-auto" /> : 'تأكيد'}
                   </button>
                   <button onClick={closeModal} className="flex-1 py-4 text-gray-400 font-bold hover:text-white transition-colors">إلغاء</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}