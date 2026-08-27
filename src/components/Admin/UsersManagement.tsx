import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAdmin } from '../../contexts/AdminContext';
import { Search, Eye, Star, Phone, Award, X, Loader2, User } from 'lucide-react';

type UserProfile = {
  user_id: string;
  full_name: string;
  phone: string;
  points: number;
  level: number;
  referral_code: string;
  matches_attended: number;
  created_at: string;
};

export function UsersManagement() {
  const { hasPermission } = useAdmin();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [pointsAdjustment, setPointsAdjustment] = useState(0);
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 20;

  const canEdit = hasPermission('users', 'edit');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select(`user_id, full_name, phone, points, level, referral_code, matches_attended, created_at`)
        .order('points', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLevelInfo = (points: number) => {
    if (points < 500) 
      return { name: 'مبتدئ', color: 'text-gray-400', bg: 'bg-white/5', border: 'border-white/10' };
    if (points < 2000) 
      return { name: 'غانم', color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' };
    if (points < 5000) 
      return { name: 'غانم بلس', color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20' };
    
    return { name: 'غانم إيليت', color: 'text-[#05E59F]', bg: 'bg-[#05E59F]/10', border: 'border-[#05E59F]/20' };
  };

  const filteredUsers = users.filter(
    (user) =>
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone?.includes(searchQuery) ||
      user.referral_code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const startIndex = (currentPage - 1) * usersPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + usersPerPage);

  const handleViewUser = (user: UserProfile) => {
    setSelectedUser(user);
    setShowModal(true);
    setPointsAdjustment(0);
    setAdjustmentReason('');
  };

  const handleAdjustPoints = async () => {
    if (!selectedUser || pointsAdjustment === 0 || !adjustmentReason.trim()) {
      alert('يرجى إدخال قيمة النقاط والسبب');
      return;
    }

    try {
      const newPoints = (selectedUser.points || 0) + pointsAdjustment;
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ points: newPoints })
        .eq('user_id', selectedUser.user_id);

      if (updateError) throw updateError;

      alert('تم تحديث رصيد المشجع بنجاح ✅');
      fetchUsers();
      setShowModal(false);
    } catch (error) {
      console.error('Error:', error);
      alert('حدث خطأ أثناء التحديث');
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 bg-[#003837] min-h-screen">
      <Loader2 className="w-12 h-12 text-[#05E59F] animate-spin mb-4" />
      <p className="font-almarai font-black text-white uppercase tracking-widest">جاري جلب قائمة المشجعين...</p>
    </div>
  );

  return (
    <div className="p-6 bg-[#003837] min-h-screen text-right font-almarai" dir="rtl">
      
      {/* هيدر الصفحة */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight">إدارة المشجعين</h1>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-2 h-2 bg-[#05E59F] rounded-full"></div>
            <p className="text-[#05E59F] text-xs font-bold uppercase tracking-widest opacity-70">User Directory Control</p>
          </div>
        </div>
        <div className="bg-[#002b2a] border border-white/5 px-8 py-5 rounded-[2rem] shadow-2xl text-center">
          <div className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mb-1">Total Fanbase</div>
          <div className="text-3xl font-black text-[#05E59F] leading-none">{users.length.toLocaleString('ar-SA')}</div>
        </div>
      </div>

      {/* حقل البحث */}
      <div className="mb-10 relative group">
        <Search className="absolute right-5 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5 group-focus-within:text-[#05E59F] transition-colors" />
        <input
          type="text"
          placeholder="ابحث عن مشجع (اسم، جوال، كود إحالة)..."
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
          className="w-full pr-14 pl-6 py-5 bg-[#002b2a] border border-white/5 rounded-3xl text-white outline-none focus:border-[#05E59F]/30 transition-all placeholder:text-gray-600 font-bold shadow-inner"
        />
      </div>

      {/* جدول البيانات */}
      <div className="bg-[#002b2a] rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl">
        <div className="overflow-x-auto">
            <table className="min-w-full text-right">
            <thead className="bg-white/5 border-b border-white/5">
                <tr>
                <th className="px-8 py-6 text-gray-500 text-[10px] font-black uppercase tracking-widest">المشجع</th>
                <th className="px-8 py-6 text-gray-500 text-[10px] font-black uppercase tracking-widest text-center">رصيد الغنائم</th>
                <th className="px-8 py-6 text-gray-500 text-[10px] font-black uppercase tracking-widest text-center">المستوى</th>
                <th className="px-8 py-6 text-gray-500 text-[10px] font-black uppercase tracking-widest">تاريخ الانضمام</th>
                <th className="px-8 py-6"></th>
                </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
                {paginatedUsers.map((user) => {
                const level = getLevelInfo(user.points || 0);
                return (
                    <tr key={user.user_id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-[#05E59F] font-black text-xl border border-white/10 shadow-inner group-hover:scale-110 transition-transform">
                            {user.full_name?.charAt(0)}
                        </div>
                        <div>
                            <div className="text-white font-black text-lg leading-tight">{user.full_name}</div>
                            <div className="text-[11px] text-gray-500 flex items-center gap-2 mt-1"><Phone size={10}/> {user.phone}</div>
                        </div>
                        </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                        <Star size={14} className="text-[#05E59F] fill-[#05E59F]/20" />
                        <span className="text-white font-black text-xl tracking-tighter">{(user.points || 0).toLocaleString()}</span>
                        </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                        <span className={`${level.bg} ${level.color} ${level.border} border px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter shadow-inner`}>
                        {level.name}
                        </span>
                    </td>
                    <td className="px-8 py-6 text-gray-500 text-xs font-bold">
                        {new Date(user.created_at).toLocaleDateString('ar-SA')}
                    </td>
                    <td className="px-8 py-6 text-center">
                        <button onClick={() => handleViewUser(user)} className="p-3 bg-white/5 hover:bg-[#05E59F] hover:text-black rounded-2xl text-gray-400 transition-all">
                        <Eye size={20} />
                        </button>
                    </td>
                    </tr>
                );
                })}
            </tbody>
            </table>
        </div>
      </div>

      {/* تفاصيل المشجع (Modal) */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-[#002b2a] border border-white/10 rounded-[3rem] p-10 max-w-lg w-full text-right shadow-3xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#05E59F]/5 blur-[100px] -z-10" />
            
            <div className="flex justify-between items-start mb-10">
               <button onClick={() => setShowModal(false)} className="bg-white/5 p-3 rounded-2xl text-gray-500 hover:text-white transition-colors"><X size={28}/></button>
               <div>
                 <h2 className="text-3xl font-black text-white">ملف المشجع</h2>
                 <p className="text-[#05E59F] text-[10px] font-bold uppercase tracking-widest mt-1 opacity-60">System ID: {selectedUser.user_id.slice(0, 8)}</p>
               </div>
            </div>
            
            <div className="space-y-8">
               <div className="flex items-center gap-6 bg-white/5 p-6 rounded-[2rem] border border-white/5 shadow-inner">
                  <div className="w-20 h-20 bg-[#05E59F] rounded-3xl flex items-center justify-center text-black font-black text-4xl shadow-xl shadow-[#05E59F]/10">
                     {selectedUser.full_name.charAt(0)}
                  </div>
                  <div>
                     <div className="text-2xl font-black text-white mb-2 leading-none">{selectedUser.full_name}</div>
                     <div className={`text-[10px] font-black px-4 py-1.5 rounded-full inline-block mt-2 ${getLevelInfo(selectedUser.points).bg} ${getLevelInfo(selectedUser.points).color} border ${getLevelInfo(selectedUser.points).border} uppercase`}>
                       {getLevelInfo(selectedUser.points).name}
                     </div>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-5 rounded-3xl border border-white/5">
                    <div className="text-[9px] text-gray-500 mb-1 font-black uppercase tracking-widest">رابط الإحالة</div>
                    <div className="text-[#05E59F] font-mono font-black text-lg uppercase tracking-tighter">{selectedUser.referral_code}</div>
                  </div>
                  <div className="bg-white/5 p-5 rounded-3xl border border-white/5">
                    <div className="text-[9px] text-gray-500 mb-1 font-black uppercase tracking-widest">عدد الحضور</div>
                    <div className="text-white font-black text-xl tracking-tighter">{selectedUser.matches_attended} <span className="text-[9px] text-gray-500">مباراة</span></div>
                  </div>
               </div>

               {canEdit && (
                 <div className="bg-black/40 border border-[#05E59F]/20 p-8 rounded-[2.5rem] space-y-5">
                   <h3 className="text-white font-black text-xs flex items-center gap-3 uppercase tracking-wider">
                     <Award size={16} className="text-[#05E59F]"/> تعديل الرصيد اليدوي
                   </h3>
                   <div className="flex gap-4">
                     <input
                       type="number"
                       placeholder="± نقاط"
                       onChange={(e) => setPointsAdjustment(parseInt(e.target.value) || 0)}
                       className="w-1/3 bg-[#003837] border border-white/10 rounded-2xl p-4 text-white text-center focus:border-[#05E59F] outline-none font-black text-xl"
                     />
                     <input
                       type="text"
                       placeholder="سبب التعديل..."
                       onChange={(e) => setAdjustmentReason(e.target.value)}
                       className="w-2/3 bg-[#003837] border border-white/10 rounded-2xl p-4 text-white text-right focus:border-[#05E59F] outline-none text-sm font-bold"
                     />
                   </div>
                   <button onClick={handleAdjustPoints} className="w-full bg-[#05E59F] hover:shadow-[0_0_20px_rgba(5,229,159,0.2)] text-black py-5 rounded-2xl font-black text-lg transition-all active:scale-95">
                     تحديث الغنائم
                   </button>
                 </div>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}