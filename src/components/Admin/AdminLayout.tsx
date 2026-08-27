import { useState } from 'react';
import { useAdmin } from '../../contexts/AdminContext';
import { supabase } from '../../lib/supabase';
import {
  Users,
  Shield,
  Trophy,
  Calendar,
  Store,
  Gift,
  CheckSquare,
  Settings,
  LogOut,
  Menu,
  X,
  LayoutDashboard
} from 'lucide-react';
// ✅ استيراد الشعار المفرغ المعتمد
import logo1 from '../../assets/logo3.svg';

type AdminLayoutProps = {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
};

export function AdminLayout({ children, currentPage, onNavigate }: AdminLayoutProps) {
  const { adminProfile, hasPermission } = useAdmin();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const menuItems = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard, permission: null },
    { id: 'users', label: 'إدارة المستخدمين', icon: Users, category: 'users', action: 'view' },
    { id: 'admins', label: 'صلاحيات المسؤولين', icon: Shield, category: 'admins', action: 'view' },
    { id: 'clubs', label: 'قائمة الأندية', icon: Trophy, category: 'clubs', action: 'view' },
    { id: 'matches', label: 'جدول المباريات', icon: Calendar, category: 'matches', action: 'view' },
    { id: 'partners', label: 'شركاء النجاح', icon: Store, category: 'partners', action: 'view' },
    { id: 'offers', label: 'غنائم العروض', icon: Gift, category: 'offers', action: 'view' },
    { id: 'attendance', label: 'تحقق الحضور', icon: CheckSquare, category: 'attendance', action: 'view' },
    { id: 'settings', label: 'الإعدادات', icon: Settings, category: 'settings', action: 'view' },
  ];

  const visibleMenuItems = menuItems.filter(item =>
    !item.category || hasPermission(item.category, item.action)
  );

  return (
    /* ✅ تحديث الخلفية للهوية الجديدة #003837 */
    <div className="min-h-screen bg-[#003837] text-white font-almarai" dir="rtl">
      
      {/* Header العلوي المحدث */}
      <header className="fixed top-0 left-0 right-0 bg-[#002b2a]/80 backdrop-blur-xl border-b border-white/5 z-50">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-white/5 rounded-xl text-[#05E59F] transition-colors"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div className="flex items-center gap-3">
              <img src={logo1} className="w-10 h-10 object-contain" alt="Ghanem" />
              <div className="flex flex-col border-r border-white/10 pr-3 mr-1">
                <h1 className="text-lg font-black text-white tracking-tight leading-none">غـانم</h1>
                <span className="text-[#05E59F] text-[9px] font-black tracking-widest uppercase mt-1">Admin Portal</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-left pl-4 border-l border-white/10">
              <p className="text-sm font-black text-white leading-none mb-1">{adminProfile?.full_name}</p>
              <p className="text-[10px] text-[#05E59F] font-black uppercase tracking-wider">{adminProfile?.role_name_ar || 'مدير نظام'}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="p-2.5 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all shadow-inner"
              title="تسجيل الخروج"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <div className="flex pt-20">
        {/* Sidebar الجانبي المحدث */}
        <aside
          className={`
            fixed lg:sticky top-20 right-0 h-[calc(100vh-5rem)] bg-[#002b2a] border-l border-white/5
            transition-all duration-300 z-40 w-72 lg:block
            ${sidebarOpen ? 'translate-x-0 shadow-2xl shadow-black' : 'translate-x-full lg:translate-x-0'}
          `}
        >
          <nav className="p-4 space-y-2 overflow-y-auto h-full">
            <p className="text-[10px] font-black text-gray-600 px-4 mb-4 uppercase tracking-[0.3em]">التحكم والعمليات</p>
            {visibleMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-right
                    transition-all duration-300 group relative overflow-hidden
                    ${isActive
                      ? 'bg-[#05E59F]/10 text-[#05E59F] border border-[#05E59F]/20'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    }
                  `}
                >
                  {isActive && (
                    <div className="absolute right-0 w-1 h-6 bg-[#05E59F] rounded-l-full shadow-[0_0_15px_rgba(5,229,159,1)]" />
                  )}
                  <Icon size={18} className={`${isActive ? 'text-[#05E59F]' : 'group-hover:text-white transition-colors opacity-70 group-hover:opacity-100'}`} />
                  <span className={`text-sm ${isActive ? 'font-black' : 'font-bold'}`}>{item.label}</span>
                </button>
              );
            })}

            {/* بطاقة معلومات الإصدار في أسفل السايدبار */}
            <div className="mt-10 p-5 bg-white/5 rounded-3xl border border-white/5 text-center">
              <div className="w-12 h-12 bg-[#003837] rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner border border-white/5">
                <img src={logo1} className="w-7 h-7 opacity-50" alt="" />
              </div>
              <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest leading-relaxed">
                Ghanem Admin Engine<br/>
                <span className="text-[#05E59F]/40 italic">System V2.5.0</span>
              </p>
            </div>
          </nav>
        </aside>

        {/* منطقة المحتوى الأساسية */}
        <main className="flex-1 p-6 min-h-[calc(100vh-5rem)]">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* خلفية معتمة عند فتح السايدبار في الجوال */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}