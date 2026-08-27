import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAdmin } from '../../contexts/AdminContext';
import { Plus, Edit, Trash2, Search, MapPin, Loader2, Globe, LayoutGrid, X } from 'lucide-react';

type Club = {
  id: string;
  name_ar: string;
  name_en: string;
  logo_url: string;
  city: string;
  stadium_name: string;
  stadium_lat: number;
  stadium_lng: number;
  geofence_radius: number;
};

export function ClubsManagement() {
  const { hasPermission } = useAdmin();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingClub, setEditingClub] = useState<Club | null>(null);

  const canCreate = hasPermission('clubs', 'create');
  const canEdit = hasPermission('clubs', 'edit');
  const canDelete = hasPermission('clubs', 'delete');

  useEffect(() => {
    fetchClubs();
  }, []);

  const fetchClubs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('clubs')
      .select('*')
      .order('name_ar');

    if (error) {
      console.error('Error fetching clubs:', error);
    } else {
      setClubs(data || []);
    }
    setLoading(false);
  };

  const filteredClubs = clubs.filter(
    (club) =>
      club.name_ar?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      club.name_en?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      club.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const clubData = {
      name_ar: formData.get('name_ar') as string,
      name_en: formData.get('name_en') as string,
      city: formData.get('city') as string,
      stadium_name: formData.get('stadium_name') as string,
      logo_url: formData.get('logo_url') as string,
      stadium_lat: parseFloat(formData.get('stadium_lat') as string) || 21.43,
      stadium_lng: parseFloat(formData.get('stadium_lng') as string) || 40.51,
      geofence_radius: parseInt(formData.get('geofence_radius') as string) || 500,
    };

    if (editingClub) {
      const { error } = await supabase
        .from('clubs')
        .update(clubData)
        .eq('id', editingClub.id);

      if (error) {
        alert('حدث خطأ في التحديث: ' + error.message);
      } else {
        alert('تم تحديث بيانات النادي بنجاح ✅');
        fetchClubs();
        setShowModal(false);
        setEditingClub(null);
      }
    } else {
      const { error } = await supabase
        .from('clubs')
        .insert([clubData]);

      if (error) {
        alert('حدث خطأ في الإضافة: تأكد من تعبئة كافة الحقول الإلزامية');
      } else {
        alert('تم إضافة النادي بنجاح ✅');
        fetchClubs();
        setShowModal(false);
      }
    }
  };

  const handleDelete = async (clubId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا النادي؟')) return;
    const { error } = await supabase.from('clubs').delete().eq('id', clubId);
    if (error) alert('حدث خطأ في الحذف');
    else {
      alert('تم حذف النادي بنجاح');
      fetchClubs();
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 bg-[#003837] min-h-[60vh]">
      <Loader2 className="w-12 h-12 text-[#05E59F] animate-spin mb-4" />
      <p className="font-almarai font-black text-white uppercase tracking-widest text-sm">جاري جلب قائمة الأندية...</p>
    </div>
  );

  return (
    <div dir="rtl" className="p-6 bg-[#003837] min-h-screen text-right font-almarai">
      {/* رأس الصفحة */}
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tight">إدارة الأندية</h2>
          <div className="flex items-center gap-2 mt-2">
            <LayoutGrid className="w-4 h-4 text-[#05E59F]" />
            <p className="text-[#05E59F] text-[10px] font-black uppercase tracking-[0.2em] opacity-70">Club Registry Management</p>
          </div>
        </div>
        {canCreate && (
          <button
            onClick={() => { setEditingClub(null); setShowModal(true); }}
            className="flex items-center gap-3 px-8 py-4 bg-[#05E59F] text-black rounded-[1.5rem] font-black transition-all hover:shadow-[0_0_20px_rgba(5,229,159,0.3)] active:scale-95 shadow-lg"
          >
            <Plus className="w-5 h-5" />
            إضافة نادي جديد
          </button>
        )}
      </div>

      {/* شريط البحث */}
      <div className="mb-10 relative group">
        <Search className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-[#05E59F] transition-colors" />
        <input
          type="text"
          placeholder="ابحث عن النادي، المدينة أو الملعب..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pr-14 pl-6 py-5 bg-[#002b2a] border border-white/5 rounded-3xl text-white outline-none focus:border-[#05E59F]/30 transition-all font-bold shadow-inner placeholder:text-gray-700"
        />
      </div>

      {/* شبكة الأندية */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredClubs.map((club) => (
          <div key={club.id} className="bg-[#002b2a] rounded-[2.5rem] border border-white/5 p-8 hover:border-[#05E59F]/30 transition-all group relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 w-32 h-32 bg-[#05E59F]/5 blur-3xl -translate-x-1/2 -translate-y-1/2 transition-colors group-hover:bg-[#05E59F]/10"></div>
            
            <div className="flex items-start justify-between mb-8 relative z-10">
              <div className="p-4 bg-white rounded-[2rem] shadow-xl transform group-hover:rotate-6 transition-transform">
                <img src={club.logo_url || ''} alt={club.name_ar} className="w-16 h-16 object-contain" />
              </div>
              <div className="flex gap-2">
                {canEdit && <button onClick={() => { setEditingClub(club); setShowModal(true); }} className="p-3 bg-white/5 rounded-2xl text-gray-400 hover:text-[#05E59F] hover:bg-[#05E59F]/10 transition-all"><Edit className="w-5 h-5" /></button>}
                {canDelete && <button onClick={() => handleDelete(club.id)} className="p-3 bg-white/5 rounded-2xl text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-all"><Trash2 className="w-5 h-5" /></button>}
              </div>
            </div>

            <div className="relative z-10">
                <h3 className="text-2xl font-black text-white mb-1 group-hover:text-[#05E59F] transition-colors">{club.name_ar}</h3>
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-6 leading-none">{club.name_en}</p>
                
                <div className="space-y-3 border-t border-white/5 pt-6">
                   <div className="flex items-center gap-3 text-sm text-gray-300 font-bold">
                      <div className="p-1.5 bg-[#05E59F]/10 rounded-lg"><MapPin className="w-4 h-4 text-[#05E59F]" /></div>
                      <span>{club.city}</span>
                   </div>
                   <div className="flex items-center gap-3 text-sm text-gray-400 font-medium">
                      <div className="p-1.5 bg-white/5 rounded-lg">🏟️</div>
                      <span>{club.stadium_name}</span>
                   </div>
                </div>
            </div>
          </div>
        ))}
      </div>

      {/* المودال الاحترافي المصلح */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-300">
          <div className="bg-[#002b2a] rounded-[3rem] max-w-2xl w-full border border-white/10 shadow-3xl overflow-hidden max-h-[90vh] flex flex-col">
            
            {/* رأس المودال ثابت */}
            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/5 shrink-0">
              <div>
                  <h3 className="text-2xl font-black text-white">
                    {editingClub ? 'تعديل النادي' : 'إضافة نادي جديد'}
                  </h3>
                  <p className="text-[#05E59F] text-[10px] font-black uppercase tracking-widest mt-1">Ghanem Core Node Registry</p>
              </div>
              <button 
                type="button" 
                onClick={() => setShowModal(false)} 
                className="p-3 bg-white/5 rounded-2xl text-gray-500 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* جسم المودال - قابل للتمرير */}
            <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pr-2">الاسم بالعربية</label>
                    <input type="text" name="name_ar" defaultValue={editingClub?.name_ar} required className="w-full px-5 py-4 bg-[#003837] border border-white/10 rounded-2xl text-white font-bold outline-none focus:border-[#05E59F]/50 transition-all shadow-inner" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pr-2">الاسم بالإنجليزية</label>
                    <input type="text" name="name_en" defaultValue={editingClub?.name_en} required className="w-full px-5 py-4 bg-[#003837] border border-white/10 rounded-2xl text-white font-bold outline-none focus:border-[#05E59F]/50 transition-all shadow-inner" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pr-2">المدينة</label>
                    <input type="text" name="city" defaultValue={editingClub?.city} required className="w-full px-5 py-4 bg-[#003837] border border-white/10 rounded-2xl text-white font-bold outline-none focus:border-[#05E59F]/50 transition-all shadow-inner" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pr-2">اسم الملعب</label>
                    <input type="text" name="stadium_name" defaultValue={editingClub?.stadium_name} required className="w-full px-5 py-4 bg-[#003837] border border-white/10 rounded-2xl text-white font-bold outline-none focus:border-[#05E59F]/50 transition-all shadow-inner" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-black/20 p-6 rounded-[2rem] border border-white/5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center block">Latitude</label>
                    <input type="number" step="any" name="stadium_lat" defaultValue={editingClub?.stadium_lat} required className="w-full px-4 py-3 bg-[#003837] border border-white/10 rounded-xl text-white text-center font-mono text-sm focus:border-[#05E59F]" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center block">Longitude</label>
                    <input type="number" step="any" name="stadium_lng" defaultValue={editingClub?.stadium_lng} required className="w-full px-4 py-3 bg-[#003837] border border-white/10 rounded-xl text-white text-center font-mono text-sm focus:border-[#05E59F]" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center block">Radius (M)</label>
                    <input type="number" name="geofence_radius" defaultValue={editingClub?.geofence_radius || 500} className="w-full px-4 py-3 bg-[#003837] border border-white/10 rounded-xl text-white text-center font-mono text-sm focus:border-[#05E59F]" />
                  </div>
                </div>

                <div className="space-y-2 pb-4">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pr-2">رابط الشعار (SVG/PNG URL)</label>
                  <input type="url" name="logo_url" defaultValue={editingClub?.logo_url} required className="w-full px-5 py-4 bg-[#003837] border border-white/10 rounded-2xl text-white outline-none focus:border-[#05E59F]/50 transition-all text-left" placeholder="https://..." dir="ltr" />
                </div>
              </div>

              {/* أسفل المودال ثابت */}
              <div className="p-8 bg-black/40 border-t border-white/5 flex justify-end gap-4 shrink-0">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="px-8 py-4 text-gray-400 hover:text-white transition-colors font-black uppercase text-xs tracking-widest"
                >
                  إلغاء
                </button>
                <button 
                  type="submit" 
                  className="px-12 py-4 bg-[#05E59F] text-black rounded-2xl font-black transition-all hover:shadow-[0_0_20px_rgba(5,229,159,0.3)] active:scale-95 shadow-xl"
                >
                  {editingClub ? 'تحديث البيانات' : 'حفظ النادي'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(5, 229, 159, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(5, 229, 159, 0.2);
        }
      `}</style>
    </div>
  );
}