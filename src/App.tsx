import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AdminProvider } from './contexts/AdminContext';
import { GhanemSignIn } from './components/Auth/GhanemSignIn';
import { GhanemSignUp } from './components/Auth/GhanemSignUp';
import { GhanemDashboard } from './components/Dashboard/GhanemDashboard';
import { AdminApp } from './components/Admin/AdminApp';
import { StaffCheckIn } from './components/Admin/StaffCheckIn';
import { StaffSignIn } from './components/Admin/StaffSignIn';
import { AdminSignIn } from './components/Admin/AdminSignIn';
import { supabase } from './lib/supabase';
import { Loader2 } from 'lucide-react';
import logo1 from './assets/logo3.svg';

function AppContent() {
  const { user, loading: authLoading, profile } = useAuth();
  const [showSignUp, setShowSignUp] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState<boolean | null>(null);
  const [adminRoleName, setAdminRoleName] = useState<string | null>(null);
  const [checkingAdmin, setCheckingAdmin] = useState(false);

  // 🟢 استخراج الـ mode من الرابط (admin, staff, user)
  const [viewMode, setViewMode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    if (mode === 'admin') return 'admin';
    if (mode === 'staff') return 'staff';
    return 'user';
  });

  // ✅ فحص الرتبة (Role) من جدول admins بربط مع admin_roles
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdminUser(false);
        setAdminRoleName(null);
        return;
      }
      
      setCheckingAdmin(true);
      try {
        const { data, error } = await supabase
          .from('admins')
          .select(`
            is_active,
            admin_roles!role_id (
              name
            )
          `)
          .eq('id', user.id)
          .eq('is_active', true)
          .single();
        
        if (data && data.admin_roles) {
          setIsAdminUser(true);
          setAdminRoleName(data.admin_roles.name); // 'super_admin', 'moderator', 'manager', 'viewer'
        } else {
          setIsAdminUser(false);
          setAdminRoleName(null);
        }
      } catch (err) {
        setIsAdminUser(false);
      } finally {
        setCheckingAdmin(false);
      }
    };

    checkAdminStatus();
  }, [user]);

  // شاشة التحميل الفخمة (Ghanem Loader)
  if (authLoading || checkingAdmin) {
    return (
      <div className="fixed inset-0 bg-[#003837] flex flex-col items-center justify-center z-[9999]">
        <div className="relative">
          <div className="absolute inset-0 bg-[#05E59F]/20 blur-[60px] rounded-full scale-150 animate-pulse"></div>
          <img src={logo1} className="w-44 h-auto relative z-10 animate-pulse" alt="Ghanem" />
        </div>
      </div>
    );
  }

  // 🟢 نظام التوجيه الذكي (Routing Engine)
  if (viewMode === 'admin' || viewMode === 'staff') {
    
    // 1. إذا لم يسجل دخول أو ليس لديه صلاحيات إدارية
    if (!user || isAdminUser === false) {
      return viewMode === 'admin' ? <AdminSignIn /> : <StaffSignIn />;
    }

    // 🛡️ 2. صلاحيات المراقب (Moderator)
    // يُمنع من دخول لوحة التحكم ويُوجه إجبارياً لصفحة الماسح
    if (adminRoleName === 'moderator') {
      return <StaffCheckIn />;
    }

    // 👑 3. صلاحيات السوبر أدمن والمدير (Super Admin / Manager)
    // يدخلون على كل الصفحات بناءً على الرابط المكتوب
    if (adminRoleName === 'super_admin' || adminRoleName === 'manager') {
      if (viewMode === 'staff') {
        return <StaffCheckIn />;
      }
      // افتراضياً يفتح لوحة الإدارة الكاملة لـ mode=admin
      return (
        <AdminProvider>
          <AdminApp />
        </AdminProvider>
      );
    }

    // أي رتبة أخرى (مثل viewer) نوجهها لأقل صلاحية وهي الستاف
    return <StaffCheckIn />;
  }

  // --- مسار المشجعين (التطبيق العادي) ---
  if (!user || !profile) {
    return showSignUp ? (
      <GhanemSignUp onSwitch={() => setShowSignUp(false)} />
    ) : (
      <GhanemSignIn onSwitch={() => setShowSignUp(true)} />
    );
  }

  // الداشبورد الرئيسي للمشجعين
  return <GhanemDashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}