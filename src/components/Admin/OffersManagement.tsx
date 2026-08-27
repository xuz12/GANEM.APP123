import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAdmin } from '../../contexts/AdminContext';
import { Plus, Edit, Trash2, Search, ToggleLeft, ToggleRight, MapPin, Loader2, Tag, Gift, X } from 'lucide-react';

type Offer = {
  id: string;
  partner_id: string;
  title_ar: string;
  description_ar: string;
  points_required: number;
  discount_percentage: number | null;
  category: string;
  is_active: boolean;
  region: string | null;
  partner: {
    name_ar: string;
    logo_url: string;
  };
};

export function OffersManagement() {
  const { hasPermission } = useAdmin();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);

  const canCreate = hasPermission('offers', 'create');
  const canEdit = hasPermission('offers', 'edit');
  const canDelete = hasPermission('offers', 'delete');

  const categories = ['مطاعم', 'تسوق', 'ترفيه', 'خدمات'];
  const regions = ['كل المناطق', 'جدة', 'مكة المكرمة', 'الرياض', 'الشرقية', 'عسير', 'نجران', 'القصيم', 'تبوك'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [offersResult, partnersResult] = await Promise.all([
      supabase
        .from('partner_offers')
        .select('*, partner:partners(name_ar, logo_url)')
        .order('created_at', { ascending: false }),
      supabase.from('partners').select('*').order('name_ar')
    ]);

    if (offersResult.data) setOffers(offersResult.data);
    if (partnersResult.data) setPartners(partnersResult.data);
    setLoading(false);
  };

  const filteredOffers = offers.filter((offer) =>
    offer.title_ar?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    offer.partner?.name_ar?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    offer.region?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const offerData = {
      partner_id: formData.get('partner_id') as string,
      title_ar: formData.get('title_ar') as string,
      description_ar: formData.get('description_ar') as string,
      points_required: parseInt(formData.get('points_required') as string),
      discount_percentage: formData.get('discount_percentage') ? parseInt(formData.get('discount_percentage') as string) : null,
      region: formData.get('region') === 'كل المناطق' ? null : formData.get('region') as string,
      category: formData.get('category') as string,
      is_active: formData.get('is_active') === 'true',
    };

    if (editingOffer) {
      const { error } = await supabase.from('partner_offers').update(offerData).eq('id', editingOffer.id);
      if (!error) {
        alert('تم تحديث العرض بنجاح ✅');
        fetchData();
        setShowModal(false);
        setEditingOffer(null);
      }
    } else {
      const { error } = await supabase.from('partner_offers').insert([offerData]);
      if (!error) {
        alert('تم إضافة العرض بنجاح ✅');
        fetchData();
        setShowModal(false);
      }
    }
  };

  const handleToggleActive = async (offerId: string, currentStatus: boolean) => {
    const { error } = await supabase.from('partner_offers').update({ is_active: !currentStatus }).eq('id', offerId);
    if (!error) fetchData();
  };

  const handleDelete = async (offerId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا العرض؟')) return;
    const { error } = await supabase.from('partner_offers').delete().eq('id', offerId);
    if (!error) {
      alert('تم حذف العرض بنجاح');
      fetchData();
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 bg-[#003837] min-h-[60vh]">
      <Loader2 className="w-12 h-12 text-[#05E59F] animate-spin mb-4" />
      <p className="font-almarai font-black text-white uppercase tracking-widest text-sm">جاري جلب غنائم العروض...</p>
    </div>
  );

  return (
    <div dir="rtl" className="p-6 bg-[#003837] min-h-screen text-right font-almarai">
      {/* الرأس */}
      <div className="mb-10 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tight">إدارة العروض</h2>
          <div className="flex items-center gap-2 mt-2">
            <Gift className="w-4 h-4 text-[#05E59F]" />
            <p className="text-[#05E59F] text-[10px] font-black uppercase tracking-[0.2em] opacity-70">Rewards & Loot Management</p>
          </div>
        </div>
        {canCreate && (
          <button
            onClick={() => { setEditingOffer(null); setShowModal(true); }}
            className="flex items-center gap-3 px-8 py-4 bg-[#05E59F] text-black rounded-[1.5rem] font-black transition-all hover:shadow-[0_0_20px_rgba(5,229,159,0.3)] active:scale-95 shadow-lg"
          >
            <Plus className="w-5 h-5" /> إضافة عرض جديد
          </button>
        )}
      </div>

      {/* البحث */}
      <div className="mb-10 relative group">
        <Search className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-[#05E59F] transition-colors" />
        <input
          type="text"
          placeholder="ابحث بالعنوان، الشريك، أو المنطقة..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pr-14 pl-6 py-5 bg-[#002b2a] border border-white/5 rounded-3xl text-white outline-none focus:border-[#05E59F]/30 transition-all font-bold shadow-inner placeholder:text-gray-700"
        />
      </div>

      {/* شبكة العروض */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredOffers.map((offer) => (
          <div key={offer.id} className="bg-[#002b2a] rounded-[2.5rem] border border-white/5 p-8 hover:border-[#05E59F]/30 transition-all group relative overflow-hidden shadow-2xl flex flex-col">
            <div className="absolute top-0 left-0 w-32 h-32 bg-[#05E59F]/5 blur-3xl -translate-x-1/2 -translate-y-1/2 transition-colors group-hover:bg-[#05E59F]/10"></div>
            
            <div className="flex items-start justify-between mb-6 relative z-10">
              <div className="w-16 h-16 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-500 overflow-hidden">
                {/* اللوجو مفرغ وبدون خلفية بيضاء */}
                <img src={offer.partner?.logo_url} alt="" className="w-full h-full object-contain filter brightness-110" />
              </div>
              <div className="flex gap-1">
                 <button onClick={() => handleToggleActive(offer.id, offer.is_active)} className={`p-2 rounded-xl transition-all ${offer.is_active ? 'text-[#05E59F] bg-[#05E59F]/10' : 'text-gray-600 bg-white/5'}`}>
                    {offer.is_active ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                 </button>
                 <button onClick={() => { setEditingOffer(offer); setShowModal(true); }} className="p-3 bg-white/5 rounded-xl text-gray-400 hover:text-[#05E59F] transition-all"><Edit size={18}/></button>
                 <button onClick={() => handleDelete(offer.id)} className="p-3 bg-white/5 rounded-xl text-gray-400 hover:text-red-500 transition-all"><Trash2 size={18}/></button>
              </div>
            </div>

            <div className="relative z-10 flex-1">
               <span className="text-[9px] bg-[#05E59F]/10 text-[#05E59F] px-3 py-1 rounded-full font-black uppercase tracking-tighter border border-[#05E59F]/20 mb-3 inline-block">{offer.category}</span>
               <h3 className="text-xl font-black text-white mb-2 leading-tight group-hover:text-[#05E59F] transition-colors">{offer.title_ar}</h3>
               <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-6">{offer.description_ar}</p>
            </div>

            <div className="relative z-10 flex justify-between items-center pt-6 border-t border-white/5 mt-auto">
               <div className="flex flex-col">
                  <span className="text-[#05E59F] font-black text-lg tracking-tighter">{offer.points_required} <span className="text-[10px] opacity-60">غنيمة</span></span>
                  {offer.discount_percentage && <span className="text-[10px] text-gray-400 font-bold">خصم {offer.discount_percentage}%</span>}
               </div>
               <div className="bg-white/5 px-3 py-1.5 rounded-xl border border-white/5 flex items-center gap-2">
                 <MapPin size={12} className="text-[#05E59F]" />
                 <span className="text-[10px] text-gray-300 font-black uppercase tracking-tighter">{offer.region || 'كل المناطق'}</span>
               </div>
            </div>
          </div>
        ))}
      </div>

      {/* المودال */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-300">
          <div className="bg-[#002b2a] rounded-[3rem] max-w-xl w-full border border-white/10 shadow-3xl overflow-hidden max-h-[90vh] flex flex-col">
            <form onSubmit={handleSave} className="flex flex-col h-full">
              <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/5">
                <div>
                    <h3 className="text-2xl font-black text-white tracking-tighter">
                    {editingOffer ? 'تحديث العرض' : 'إضافة عرض غنيمة'}
                    </h3>
                    <p className="text-[#05E59F] text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mt-1">Loot Registry Node</p>
                </div>
                <button type="button" onClick={() => setShowModal(false)} className="p-3 bg-white/5 rounded-2xl text-gray-500 hover:text-white transition-colors"><X size={24}/></button>
              </div>
              
              <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pr-2">الشريك الموفر للعرض *</label>
                  <select name="partner_id" defaultValue={editingOffer?.partner_id} required className="w-full px-5 py-4 bg-[#003837] border border-white/10 rounded-2xl text-white font-bold outline-none focus:border-[#05E59F]/50 shadow-inner">
                    <option value="">اختر الشريك</option>
                    {partners.map(p => <option key={p.id} value={p.id}>{p.name_ar}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pr-2">عنوان العرض *</label>
                    <input type="text" name="title_ar" defaultValue={editingOffer?.title_ar} required className="w-full px-5 py-4 bg-[#003837] border border-white/10 rounded-2xl text-white font-bold outline-none focus:border-[#05E59F]/50 shadow-inner" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pr-2">الوصف التفصيلي *</label>
                    <textarea name="description_ar" defaultValue={editingOffer?.description_ar} required rows={3} className="w-full px-5 py-4 bg-[#003837] border border-white/10 rounded-2xl text-white font-bold outline-none focus:border-[#05E59F]/50 shadow-inner resize-none" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pr-2">الفئة *</label>
                    <select name="category" defaultValue={editingOffer?.category || ''} required className="w-full px-5 py-4 bg-[#003837] border border-white/10 rounded-2xl text-white font-bold outline-none focus:border-[#05E59F]/50 shadow-inner">
                      <option value="">اختر الفئة</option>
                      {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pr-2">المنطقة المستهدفة</label>
                    <select name="region" defaultValue={editingOffer?.region || 'كل المناطق'} className="w-full px-5 py-4 bg-[#003837] border border-white/10 rounded-2xl text-white font-bold outline-none focus:border-[#05E59F]/50 shadow-inner">
                      {regions.map(reg => <option key={reg} value={reg}>{reg}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 bg-black/30 p-6 rounded-[2rem] border border-white/5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center block">النقاط المطلوبة</label>
                    <input type="number" name="points_required" defaultValue={editingOffer?.points_required} required className="w-full bg-transparent text-[#05E59F] font-black text-2xl text-center outline-none border-b border-white/10 pb-2" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center block">نسبة الخصم (%)</label>
                    <input type="number" name="discount_percentage" defaultValue={editingOffer?.discount_percentage} className="w-full bg-transparent text-white font-black text-2xl text-center outline-none border-b border-white/10 pb-2" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pr-2">حالة العرض البرمجية</label>
                  <select name="is_active" defaultValue={editingOffer?.is_active ? 'true' : 'false'} className="w-full bg-[#003837] border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-[#05E59F]/50 shadow-inner">
                    <option value="true">نشط (يظهر للمشجعين)</option>
                    <option value="false">معطل (مخفي من القائمة)</option>
                  </select>
                </div>
              </div>

              <div className="p-8 bg-black/20 border-t border-white/5 flex justify-end gap-5">
                <button type="button" onClick={() => setShowModal(false)} className="px-8 py-4 text-gray-500 hover:text-white transition-colors font-black uppercase text-xs tracking-widest">Discard</button>
                <button type="submit" className="px-12 py-4 bg-[#05E59F] text-black rounded-2xl font-black transition-all hover:shadow-[0_0_20px_rgba(5,229,159,0.3)] active:scale-95 shadow-xl">
                  {editingOffer ? 'تحديث البيانات' : 'تأكيد الغنيمة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}