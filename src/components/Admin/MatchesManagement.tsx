import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAdmin } from '../../contexts/AdminContext';
import { Plus, Edit3 as Edit, Trash2, Search, Calendar, Trophy, Zap, Clock, Loader2, MapPin } from 'lucide-react';
import { Database } from '../../lib/database.types';

type Match = Database['public']['Tables']['matches']['Row'] & {
  home_club: Database['public']['Tables']['clubs']['Row'];
  away_club: Database['public']['Tables']['clubs']['Row'];
};

type Club = Database['public']['Tables']['clubs']['Row'];

export function MatchesManagement() {
  const { hasPermission } = useAdmin();
  const [matches, setMatches] = useState<Match[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);

  const canCreate = hasPermission('matches', 'create');
  const canEdit = hasPermission('matches', 'edit');
  const canDelete = hasPermission('matches', 'delete');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [matchesResult, clubsResult] = await Promise.all([
      supabase
        .from('matches')
        .select(`
          *,
          home_club:clubs!matches_home_club_id_fkey(*),
          away_club:clubs!matches_away_club_id_fkey(*)
        `)
        .order('match_date', { ascending: false }),
      supabase.from('clubs').select('*').order('name_ar')
    ]);

    if (matchesResult.data) setMatches(matchesResult.data as any);
    if (clubsResult.data) setClubs(clubsResult.data);
    setLoading(false);
  };

  const filteredMatches = matches.filter((match) =>
    match.home_club?.name_ar.toLowerCase().includes(searchQuery.toLowerCase()) ||
    match.away_club?.name_ar.toLowerCase().includes(searchQuery.toLowerCase()) ||
    match.competition_type?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const homeClubId = formData.get('home_club_id') as string;
    const homeClub = clubs.find(c => c.id === homeClubId);

    const matchData = {
      home_club_id: homeClubId,
      away_club_id: formData.get('away_club_id') as string,
      match_date: new Date(formData.get('match_date') as string).toISOString(),
      competition_type: formData.get('competition_type') as string,
      round_number: formData.get('round_number') ? parseInt(formData.get('round_number') as string) : null,
      status: formData.get('status') as string,
      base_points: parseInt(formData.get('base_points') as string) || 100,
      points_multiplier: parseFloat(formData.get('points_multiplier') as string) || 1,
      stadium_lat: homeClub?.stadium_lat || 21.43,
      stadium_lng: homeClub?.stadium_lng || 40.51,
    };

    const action = editingMatch 
      ? supabase.from('matches').update(matchData).eq('id', editingMatch.id)
      : supabase.from('matches').insert([matchData]);

    const { error } = await action;

    if (error) {
      alert('حدث خطأ: ' + error.message);
    } else {
      alert(editingMatch ? 'تم تحديث المباراة بنجاح ✅' : 'تم إضافة المباراة بنجاح ✅');
      fetchData();
      setShowModal(false);
      setEditingMatch(null);
    }
  };

  const handleDelete = async (matchId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه المباراة؟')) return;
    const { error } = await supabase.from('matches').delete().eq('id', matchId);
    if (!error) { fetchData(); }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'live':
        return <span className="flex items-center gap-1.5 px-4 py-1.5 bg-[#05E59F]/10 text-[#05E59F] rounded-full text-[10px] font-black animate-pulse border border-[#05E59F]/20"><Zap size={12}/> مباشر</span>;
      case 'finished':
        return <span className="px-4 py-1.5 bg-white/5 text-gray-500 rounded-full text-[10px] font-bold border border-white/5">انتهت</span>;
      default:
        return <span className="px-4 py-1.5 bg-blue-500/10 text-blue-400 rounded-full text-[10px] font-bold border border-blue-500/20">قادمة</span>;
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 bg-[#003837] min-h-[60vh]">
      <Loader2 className="w-12 h-12 text-[#05E59F] animate-spin mb-4" />
      <p className="font-almarai font-black text-white uppercase tracking-widest text-sm">جاري جلب جدول المواجهات...</p>
    </div>
  );

  return (
    <div className="font-almarai text-right bg-[#003837] min-h-screen p-6" dir="rtl">
      
      {/* هيدر الصفحة */}
      <div className="mb-10 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black text-white tracking-tight">جدول المباريات</h2>
          <div className="flex items-center gap-2 mt-2">
            <Calendar className="w-4 h-4 text-[#05E59F]" />
            <p className="text-[#05E59F] text-[10px] font-black uppercase tracking-[0.2em] opacity-70">Fixture & Points Management</p>
          </div>
        </div>
        {canCreate && (
          <button
            onClick={() => { setEditingMatch(null); setShowModal(true); }}
            className="flex items-center gap-3 px-8 py-4 bg-[#05E59F] text-black rounded-[1.5rem] font-black transition-all hover:shadow-[0_0_20px_rgba(5,229,159,0.3)] active:scale-95 shadow-lg"
          >
            <Plus size={20} /> إضافة مباراة
          </button>
        )}
      </div>

      {/* حقل البحث */}
      <div className="mb-10 relative group">
        <Search className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-[#05E59F] transition-colors" />
        <input
          type="text"
          placeholder="ابحث عن نادٍ، مسابقة، أو جولة..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pr-14 pl-6 py-5 bg-[#002b2a] border border-white/5 rounded-3xl text-white outline-none focus:border-[#05E59F]/30 transition-all font-bold shadow-inner placeholder:text-gray-700"
        />
      </div>

      {/* الجدول الرئيسي */}
      <div className="bg-[#002b2a] rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/5">
              <tr>
                <th className="px-8 py-6 text-right text-[10px] font-black text-gray-500 uppercase tracking-widest">المواجهة</th>
                <th className="px-8 py-6 text-right text-[10px] font-black text-gray-500 uppercase tracking-widest">التوقيت</th>
                <th className="px-8 py-6 text-right text-[10px] font-black text-gray-500 uppercase tracking-widest">المسابقة</th>
                <th className="px-8 py-6 text-center text-[10px] font-black text-gray-500 uppercase tracking-widest">الحالة</th>
                <th className="px-8 py-6 text-center text-[10px] font-black text-gray-500 uppercase tracking-widest">النقاط</th>
                <th className="px-8 py-6"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredMatches.map((match) => (
                <tr key={match.id} className="hover:bg-white/[0.02] transition-all group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-6 justify-end">
                      <div className="flex flex-col items-center gap-2 w-16">
                         <div className="p-2 bg-white rounded-xl shadow-lg"><img src={match.home_club?.logo_url || ''} className="w-8 h-8 object-contain" /></div>
                         <span className="text-[10px] font-black text-white text-center line-clamp-1">{match.home_club?.name_ar}</span>
                      </div>
                      <span className="text-[#05E59F] font-black italic text-xs">VS</span>
                      <div className="flex flex-col items-center gap-2 w-16">
                         <div className="p-2 bg-white rounded-xl shadow-lg"><img src={match.away_club?.logo_url || ''} className="w-8 h-8 object-contain" /></div>
                         <span className="text-[10px] font-black text-white text-center line-clamp-1">{match.away_club?.name_ar}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1">
                       <span className="text-white font-black text-sm tracking-tighter">{new Date(match.match_date).toLocaleDateString('ar-SA')}</span>
                       <span className="text-gray-500 text-[10px] flex items-center gap-1 font-bold"><Clock size={10}/> {new Date(match.match_date).toLocaleTimeString('ar-SA', {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                     <div className="flex flex-col gap-1 text-right">
                        <span className="text-white font-bold text-xs">{match.competition_type}</span>
                        <span className="text-[10px] text-gray-500 font-black tracking-widest uppercase">Round {match.round_number || '-'}</span>
                     </div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <div className="flex justify-center">{getStatusBadge(match.status)}</div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <div className="bg-[#05E59F]/5 text-[#05E59F] px-4 py-2 rounded-xl font-black text-sm border border-[#05E59F]/10 shadow-inner inline-block tracking-tighter">
                      {Math.round(match.base_points * (match.points_multiplier || 1))} <span className="text-[10px] opacity-60">PTS</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center justify-end gap-2">
                      {canEdit && (
                        <button onClick={() => { setEditingMatch(match); setShowModal(true); }} className="p-3 text-gray-500 hover:text-[#05E59F] hover:bg-[#05E59F]/10 rounded-2xl transition-all"><Edit size={18} /></button>
                      )}
                      {canDelete && (
                        <button onClick={() => handleDelete(match.id)} className="p-3 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all"><Trash2 size={18} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* مودال فخم للإضافة / التعديل */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-300">
          <div className="bg-[#002b2a] border border-white/10 rounded-[3rem] max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-3xl relative flex flex-col">
            <form onSubmit={handleSave}>
              <div className="p-10 border-b border-white/5 flex items-center gap-5 bg-white/5">
                <div className="bg-[#05E59F]/10 p-4 rounded-3xl text-[#05E59F] shadow-inner"><Trophy size={28}/></div>
                <div>
                    <h3 className="text-3xl font-black text-white tracking-tighter">{editingMatch ? 'تحديث المباراة' : 'إضافة مواجهة جديدة'}</h3>
                    <p className="text-[#05E59F] text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mt-1">Match Node Registry</p>
                </div>
              </div>

              <div className="p-10 space-y-10">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pr-2">النادي المضيف (أرضه)</label>
                    <select name="home_club_id" defaultValue={editingMatch?.home_club_id || ''} required className="w-full px-5 py-4 bg-[#003837] border border-white/10 rounded-2xl text-white font-bold outline-none focus:border-[#05E59F]/50 shadow-inner">
                      <option value="">اختر النادي</option>
                      {clubs.map(club => <option key={club.id} value={club.id}>{club.name_ar}</option>)}
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pr-2">النادي الضيف</label>
                    <select name="away_club_id" defaultValue={editingMatch?.away_club_id || ''} required className="w-full px-5 py-4 bg-[#003837] border border-white/10 rounded-2xl text-white font-bold outline-none focus:border-[#05E59F]/50 shadow-inner">
                      <option value="">اختر النادي</option>
                      {clubs.map(club => <option key={club.id} value={club.id}>{club.name_ar}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pr-2">توقيت الانطلاق الرسمي</label>
                  <input type="datetime-local" name="match_date" defaultValue={editingMatch?.match_date ? new Date(editingMatch.match_date).toISOString().slice(0, 16) : ''} required className="w-full px-6 py-5 bg-[#003837] border border-white/10 rounded-[1.5rem] text-white font-bold outline-none focus:border-[#05E59F]/50 text-right shadow-inner" />
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pr-2">نوع المسابقة</label>
                    <select name="competition_type" defaultValue={editingMatch?.competition_type || 'roshn_league'} className="w-full px-5 py-4 bg-[#003837] border border-white/10 rounded-2xl text-white font-bold outline-none focus:border-[#05E59F]/50 shadow-inner">
                      <option value="roshn_league">دوري روشن السعودي</option>
                      <option value="kings_cup">كأس الملك</option>
                      <option value="super_cup">كأس السوبر</option>
                      <option value="acl">دوري أبطال آسيا</option>
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pr-2">رقم الجولة</label>
                    <input type="number" name="round_number" defaultValue={editingMatch?.round_number || ''} className="w-full px-5 py-4 bg-[#003837] border border-white/10 rounded-2xl text-white font-bold outline-none focus:border-[#05E59F]/50 shadow-inner" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6 bg-black/30 p-8 rounded-[2.5rem] border border-white/5 relative">
                   <div className="absolute -top-3 right-6 bg-[#002b2a] px-4 py-1 rounded-full border border-white/10 text-[8px] font-black text-[#05E59F] tracking-[0.3em] uppercase">Control Matrix</div>
                  <div className="text-right">
                    <label className="text-[9px] font-black text-gray-500 mb-3 uppercase block text-center">Status</label>
                    <select name="status" defaultValue={editingMatch?.status || 'upcoming'} className="w-full bg-transparent text-[#05E59F] font-black text-center outline-none border-b border-[#05E59F]/20 pb-2 text-sm">
                      <option value="upcoming" className="bg-[#002b2a]">UPCOMING</option>
                      <option value="live" className="bg-[#002b2a]">LIVE NOW</option>
                      <option value="finished" className="bg-[#002b2a]">FINISHED</option>
                    </select>
                  </div>
                  <div className="text-right">
                    <label className="text-[9px] font-black text-gray-500 mb-3 uppercase block text-center">Base Pts</label>
                    <input type="number" name="base_points" defaultValue={editingMatch?.base_points || 100} className="w-full bg-transparent text-white font-black text-center outline-none border-b border-white/10 pb-2 text-lg" />
                  </div>
                  <div className="text-right">
                    <label className="text-[9px] font-black text-gray-500 mb-3 uppercase block text-center">Multiplier</label>
                    <input type="number" step="0.1" name="points_multiplier" defaultValue={editingMatch?.points_multiplier || 1} className="w-full bg-transparent text-white font-black text-center outline-none border-b border-white/10 pb-2 text-lg" />
                  </div>
                </div>
              </div>

              <div className="p-10 bg-black/20 border-t border-white/5 flex justify-end gap-5">
                <button type="button" onClick={() => { setShowModal(false); setEditingMatch(null); }} className="px-8 py-4 text-gray-500 hover:text-white transition-colors font-black uppercase text-xs tracking-widest">Discard</button>
                <button type="submit" className="px-12 py-4 bg-[#05E59F] text-black rounded-2xl font-black transition-all hover:shadow-[0_0_20px_rgba(5,229,159,0.3)] active:scale-95 shadow-xl">
                  {editingMatch ? 'تحديث البيانات' : 'تأكيد الإضافة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}