import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAdmin } from '../../contexts/AdminContext';
import { Search, Shield, ToggleLeft, ToggleRight, UserCheck, Lock, Loader2 } from 'lucide-react';

export function AdminsManagement() {
  const { adminProfile } = useAdmin();
  const [admins, setAdmins] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const isSuperAdmin = adminProfile?.role_name === 'super_admin';

  useEffect(() => {
    if (isSuperAdmin) {
      loadData();
    }
  }, [isSuperAdmin]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [adminsRes, rolesRes] = await Promise.all([
        supabase.from('admins').select('*').order('created_at', { ascending: false }),
        supabase.from('admin_roles').select('id, name_ar')
      ]);

      if (adminsRes.error) throw adminsRes.error;
      
      setAdmins(adminsRes.data || []);
      setRoles(rolesRes.data || []);
    } catch (error) {
      console.error('Error loading admins:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAdminStatus = async (adminId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('admins')
      .update({ is_active: !currentStatus })
      .eq('id', adminId);

    if (!error) {
      alert('تم تحديث حالة الصلاحية بنجاح ✅');
      loadData();
    }
  };

  const getRoleName = (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    return role ? role.name_ar : 'جاري الجلب...';
  };

  const filteredAdmins = admins.filter((admin) =>
    admin.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    admin.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isSuperAdmin) {
    return (
      <div className="p-6 font-almarai text-right" dir="rtl">
        <div className="text-center py-20 bg-[#002b2a] border border-red-500/20 rounded-[3rem] shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-red-500/5 blur-3xl rounded-full"></div>
          <Lock className="w-16 h-16 text-red-500 mx-auto mb-6 relative z-10 animate-bounce" />
          <h2 className="text-2xl font-black text-white relative z-10">منطقة محظورة</h2>
          <p className="text-gray-400 mt-2 relative z-10 font-bold uppercase tracking-widest text-[10px]">Super Admin Access Only</p>
        </div>
      </div>
    );
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 bg-[#003837] min-h-[60vh]">
      <Loader2 className="w-12 h-12 text-[#05E59F] animate-spin mb-4" />
      <p className="font-almarai font-black text-white uppercase tracking-widest text-sm">جاري جلب سجل المسؤولين...</p>
    </div>
  );

  return (
    <div className="p-6 bg-[#003837] min-h-screen text-right font-almarai" dir="rtl">
      
      {/* هيدر الصفحة */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight">صلاحيات المسؤولين</h1>
          <div className="flex items-center gap-2 mt-2">
            <Shield className="w-4 h-4 text-[#05E59F]" />
            <p className="text-[#05E59F] text-[10px] font-black uppercase tracking-[0.2em]">Security & Permissions</p>
          </div>
        </div>
        <div className="bg-[#002b2a] border border-white/10 px-8 py-4 rounded-[2rem] shadow-2xl">
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest text-center">Admin Nodes</p>
          <p className="text-3xl font-black text-white text-center">{admins.length}</p>
        </div>
      </div>

      {/* حقل البحث الفخم */}
      <div className="mb-10 relative group">
        <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-[#05E59F] transition-colors" size={20} />
        <input
          type="text"
          placeholder="ابحث بالاسم أو البريد..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pr-14 pl-6 py-5 bg-[#002b2a] border border-white/5 rounded-3xl text-white outline-none focus:border-[#05E59F]/30 transition-all font-bold shadow-inner placeholder:text-gray-700"
        />
      </div>

      {/* جدول الصلاحيات */}
      <div className="bg-[#002b2a] rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-white/5 border-b border-white/5">
              <tr>
                <th className="px-8 py-6 text-gray-500 text-[10px] font-black uppercase tracking-widest">المسؤول</th>
                <th className="px-8 py-6 text-gray-500 text-[10px] font-black uppercase tracking-widest text-right">الدور الوظيفي</th>
                <th className="px-8 py-6 text-gray-500 text-[10px] font-black uppercase tracking-widest text-center">حالة الحساب</th>
                <th className="px-8 py-6"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredAdmins.map((admin) => (
                <tr key={admin.id} className="hover:bg-white/[0.02] transition-all group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center font-black text-[#05E59F] text-xl border border-white/10 shadow-inner group-hover:scale-110 transition-transform">
                        {admin.full_name?.charAt(0)}
                      </div>
                      <div>
                        <div className="text-white font-black text-lg leading-tight">{admin.full_name}</div>
                        <div className="text-gray-500 font-mono text-[11px] mt-1">{admin.email}</div>
                      </div>
                    </div>
                  </td>

                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/5 w-fit">
                      <UserCheck size={14} className="text-[#05E59F]" />
                      <span className="text-white font-black text-xs uppercase tracking-tighter">
                        {getRoleName(admin.role_id)}
                      </span>
                    </div>
                  </td>

                  <td className="px-8 py-6 text-center">
                    <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border ${admin.is_active ? 'bg-[#05E59F]/10 border-[#05E59F]/20' : 'bg-red-500/10 border-red-500/20'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${admin.is_active ? 'bg-[#05E59F] shadow-[0_0_10px_#05E59F]' : 'bg-red-500'}`} />
                      <span className={`text-[10px] font-black uppercase tracking-tighter ${admin.is_active ? 'text-[#05E59F]' : 'text-red-500'}`}>
                        {admin.is_active ? 'ACTIVE' : 'DISABLED'}
                      </span>
                    </div>
                  </td>

                  <td className="px-8 py-6 text-left">
                    {admin.id !== adminProfile?.admin_id && (
                      <button
                        onClick={() => toggleAdminStatus(admin.id, admin.is_active)}
                        className={`transition-all active:scale-90 ${admin.is_active ? 'text-[#05E59F]' : 'text-gray-600'}`}
                      >
                        {admin.is_active ? <ToggleRight size={40} strokeWidth={1.5} /> : <ToggleLeft size={40} strokeWidth={1.5} />}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-12 text-center opacity-20">
        <p className="text-[9px] text-gray-500 font-black tracking-[0.4em] uppercase">Security Clearance Level 4 Required</p>
      </div>
    </div>
  );
}