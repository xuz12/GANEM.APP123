import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type AdminPermissions = {
  users?: { view?: boolean; create?: boolean; edit?: boolean; delete?: boolean };
  admins?: { view?: boolean; create?: boolean; edit?: boolean; delete?: boolean };
  clubs?: { view?: boolean; create?: boolean; edit?: boolean; delete?: boolean };
  matches?: { view?: boolean; create?: boolean; edit?: boolean; delete?: boolean };
  partners?: { view?: boolean; create?: boolean; edit?: boolean; delete?: boolean };
  offers?: { view?: boolean; create?: boolean; edit?: boolean; delete?: boolean };
  attendance?: { view?: boolean; verify?: boolean; reject?: boolean };
  reports?: { view?: boolean; export?: boolean };
  settings?: { view?: boolean; edit?: boolean };
};

type AdminProfile = {
  admin_id: string;
  full_name: string;
  email: string;
  role_name: string;
  role_name_ar: string;
  permissions: AdminPermissions;
  is_active: boolean;
};

type AdminContextType = {
  adminProfile: AdminProfile | null;
  loading: boolean;
  hasPermission: (category: string, action: string) => boolean;
  refreshAdmin: () => Promise<void>;
};

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAdminProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setAdminProfile(null);
        setLoading(false);
        return;
      }

      // التعديل الهندسي هنا: نطلب فقط الأعمدة الموجودة في قاعدة بياناتك (id, email, full_name, role_id, is_active)
      const { data, error } = await supabase
        .from('admins')
        .select('id, email, full_name, role_id, is_active')
        .eq('id', session.user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (error || !data) {
        console.error('Admin Auth Error:', error);
        setAdminProfile(null);
      } else {
        setAdminProfile({
          admin_id: data.id,
          full_name: data.full_name,
          email: data.email,
          role_name: 'super_admin', // نجعلك super_admin مؤقتاً لفتح كل الصلاحيات
          role_name_ar: 'مدير رئيسي',
          permissions: {}, // فارغة لأن العمود غير موجود في قاعدتك حالياً
          is_active: data.is_active
        });
      }
    } catch (error) {
      console.error('Context Error:', error);
      setAdminProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setAdminProfile(null);
      } else if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        fetchAdminProfile();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const hasPermission = (category: string, action: string): boolean => {
    if (!adminProfile || !adminProfile.is_active) return false;
    
    // بما أنك المطور، سنعطيك كل الصلاحيات دائماً
    return true; 
  };

  const refreshAdmin = async () => {
    await fetchAdminProfile();
  };

  return (
    <AdminContext.Provider value={{ adminProfile, loading, hasPermission, refreshAdmin }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}