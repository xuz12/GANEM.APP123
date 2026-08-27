import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAdmin } from '../../contexts/AdminContext';
import { Plus, Edit, Trash2, Search, ExternalLink, Loader2, Store, X } from 'lucide-react';

type Partner = {
  id: string;
  name_ar: string;
  name_en: string;
  logo_url: string;
  category: string;
  website?: string;
  description_ar?: string;
  is_active: boolean;
};

export function PartnersManagement() {
  const { hasPermission } = useAdmin();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);

  const canCreate = hasPermission('partners', 'create');
  const canEdit = hasPermission('partners', 'edit');
  const canDelete = hasPermission('partners', 'delete');

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('partners')
      .select('*')
      .order('name_ar');

    if (error) {
      console.error('Error fetching partners:', error);
    } else {
      setPartners(data || []);
    }
    setLoading(false);
  };

  const filteredPartners = partners.filter(
    (partner) =>
      partner.name_ar?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partner.name_en?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partner.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const partnerData = {
      name_ar: formData.get('name_ar') as string,
      name_en: formData.get('name_en') as string,
      category: formData.get('category') as string,
      logo_url: formData.get('logo_url') as string,
      website: formData.get('website') as string || null,
      is_active: true,
    };

    if (editingPartner) {
      const { error } = await supabase
        .from('partners')
        .update(partnerData)
        .eq('id', editingPartner.id);

      if (error) {
        alert('حدث خطأ في التحديث');
      } else {
        alert('تم تحديث الشريك بنجاح ✅');
        fetchPartners();
        setShowModal(false);
        setEditingPartner(null);
      }
    } else {
      const { error } = await supabase
        .from('partners')
        .insert([partnerData]);

      if (error) {
        alert('حدث خطأ في الإضافة');
      } else {
        alert('تم إضافة الشريك بنجاح ✅');
        fetchPartners();
        setShowModal(false);
      }
    }
  };

  const handleDelete = async (partnerId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الشريك؟')) return;
    const { error } = await supabase.from('partners').delete().eq('id', partnerId);
    if (error) alert('حدث خطأ في الحذف');
    else {
      alert('تم حذف الشريك بنجاح');
      fetchPartners();
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 bg-[#003837] min-h-[60vh]">
      <Loader2 className="w-12 h-12 text-[#05E59F] animate-spin mb-4" />
      <p className="font-almarai font-black text-white uppercase tracking-widest text-sm">جاري جلب قائمة الشركاء...</p>
    </div>
  );

  return (
    <div dir="rtl" className="p-6 bg-[#003837] min-h-screen text-right font-almarai">
      {/* الرأس */}
      <div className="mb-10 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tight">شركاء النجاح</h2>
          <div className="flex items-center gap-2 mt-2">
            <Store className="w-4 h-4 text-[#05E59F]" />
            <p className="text-[#05E59F] text-[10px] font-black uppercase tracking-[0.2em] opacity-70">Partner Ecosystem Management</p>
          </div>
        </div>
        {canCreate && (
          <button
            onClick={() => { setEditingPartner(null); setShowModal(true); }}
            className="flex items-center gap-3 px-8 py-4 bg-[#05E59F] text-black rounded-[1.5rem] font-black transition-all hover:shadow-[0_0_20px_rgba(5,229,159,0.3)] active:scale-95 shadow-lg"
          >
            <Plus className="w-5 h-5" />
            إضافة شريك جديد
          </button>
        )}
      </div>

      {/* البحث */}
      <div className="mb-10 relative group">
        <Search className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-[#05E59F] transition-colors" />
        <input
          type="text"
          placeholder="ابحث عن اسم الشريك أو الفئة..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pr-14 pl-6 py-5 bg-[#002b2a] border border-white/5 rounded-3xl text-white outline-none focus:border-[#05E59F]/30 transition-all font-bold shadow-inner placeholder:text-gray-700"
        />
      </div>

      {/* شبكة الشركاء المحدثة */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredPartners.map((partner) => (
          <div key={partner.id} className="bg-[#002b2a] rounded-[2.5rem] border border-white/5 p-8 hover:border-[#05E59F]/30 transition-all group relative overflow-hidden shadow-2xl">
            {/* توهج خلفي ناعم يبرز الشعار المفرغ */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-[#05E59F]/5 blur-3xl -translate-x-1/2 -translate-y-1/2 transition-colors group-hover:bg-[#05E59F]/10"></div>
            
            <div className="flex items-start justify-between mb-8 relative z-10">
              {/* ✅ اللوجو مفرغ تماماً وبدون خلفية بيضاء */}
              <div className="w-24 h-24 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-500 overflow-hidden">
                <img 
                  src={partner.logo_url || ''} 
                  alt={partner.name_ar} 
                  className="w-full h-full object-contain filter brightness-110" 
                />
              </div>

              {/* أزرار التحكم */}
              <div className="flex gap-2">
                {canEdit && (
                    <button onClick={() => { setEditingPartner(partner); setShowModal(true); }} className="p-3 bg-white/5 rounded-2xl text-gray-400 hover:text-[#05E59F] hover:bg-[#05E59F]/10 transition-all">
                        <Edit className="w-5 h-5" />
                    </button>
                )}
                {canDelete && (
                    <button onClick={() => handleDelete(partner.id)} className="p-3 bg-white/5 rounded-2xl text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-all">
                        <Trash2 className="w-5 h-5" />
                    </button>
                )}
              </div>
            </div>
            
            <div className="relative z-10">
                <h3 className="text-2xl font-black text-[#05E59F] mb-1 leading-none">{partner.name_ar}</h3>
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-6 leading-none">{partner.name_en}</p>
                
                <div className="flex items-center justify-between pt-6 border-t border-white/5">
                    <span className="text-[10px] bg-[#05E59F]/10 text-[#05E59F] px-4 py-2 rounded-xl font-black uppercase tracking-tighter border border-[#05E59F]/20">
                        {partner.category}
                    </span>
                    {partner.website && (
                        <a href={partner.website} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white flex items-center gap-2 text-xs font-bold transition-colors">
                            <ExternalLink className="w-3.5 h-3.5" /> زيارة الرابط
                        </a>
                    )}
                </div>
            </div>
          </div>
        ))}
      </div>

      {/* المودال */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-300">
          <div className="bg-[#002b2a] border border-white/10 rounded-[3rem] p-10 max-w-lg w-full text-right shadow-3xl relative overflow-hidden flex flex-col max-h-[90vh]">
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#05E59F]/5 blur-[100px] -z-10" />
            
            <form onSubmit={handleSave} className="flex flex-col h-full">
              <div className="flex justify-between items-start mb-10">
                <button type="button" onClick={() => setShowModal(false)} className="bg-white/5 p-3 rounded-2xl text-gray-500 hover:text-white transition-colors">
                    <X className="w-6 h-6"/>
                </button>
                <div>
                    <h3 className="text-3xl font-black text-white tracking-tighter">
                    {editingPartner ? 'تحديث الشريك' : 'إضافة شريك جديد'}
                    </h3>
                    <p className="text-[#05E59F] text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mt-1">Partner Node Registry</p>
                </div>
              </div>

              <div className="space-y-6 overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pr-2">الاسم بالعربية *</label>
                    <input type="text" name="name_ar" defaultValue={editingPartner?.name_ar} required className="w-full px-5 py-4 bg-[#003837] border border-white/10 rounded-2xl text-white font-bold outline-none focus:border-[#05E59F]/50 shadow-inner" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pr-2">الاسم بالإنجليزية *</label>
                    <input type="text" name="name_en" defaultValue={editingPartner?.name_en} required className="w-full px-5 py-4 bg-[#003837] border border-white/10 rounded-2xl text-white font-bold outline-none focus:border-[#05E59F]/50 shadow-inner" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pr-2">الفئة *</label>
                  <select name="category" defaultValue={editingPartner?.category} required className="w-full px-5 py-4 bg-[#003837] border border-white/10 rounded-2xl text-white font-bold outline-none focus:border-[#05E59F]/50 shadow-inner">
                    <option value="">اختر الفئة</option>
                    <option value="مطاعم">مطاعم</option>
                    <option value="كافيهات">كافيهات</option>
                    <option value="رياضة">رياضة</option>
                    <option value="تقنية">تقنية</option>
                    <option value="فنادق">فنادق</option>
                    <option value="أخرى">أخرى</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pr-2">رابط الشعار (URL) *</label>
                  <input type="url" name="logo_url" defaultValue={editingPartner?.logo_url} required className="w-full px-5 py-4 bg-[#003837] border border-white/10 rounded-2xl text-white outline-none focus:border-[#05E59F]/50 shadow-inner" placeholder="https://..." dir="ltr" />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pr-2">الموقع الإلكتروني</label>
                  <input type="url" name="website" defaultValue={editingPartner?.website} className="w-full px-5 py-4 bg-[#003837] border border-white/10 rounded-2xl text-white outline-none focus:border-[#05E59F]/50 shadow-inner" placeholder="https://..." dir="ltr" />
                </div>
              </div>

              <div className="pt-10 mt-auto flex justify-end gap-5">
                <button type="button" onClick={() => setShowModal(false)} className="px-8 py-4 text-gray-500 hover:text-white transition-colors font-black uppercase text-xs tracking-widest">Discard</button>
                <button type="submit" className="px-12 py-4 bg-[#05E59F] text-black rounded-2xl font-black transition-all hover:shadow-[0_0_20px_rgba(5,229,159,0.3)] active:scale-95 shadow-xl">
                  {editingPartner ? 'تحديث الشريك' : 'حفظ الشريك'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}