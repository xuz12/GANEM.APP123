import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';

type UserProfile = Database['public']['Tables']['user_profiles']['Row'];

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, referralCode?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // دالة جلب البروفايل - تم تعديل الربط ليكون "user_id" كما في جدولك
  const fetchProfile = async (userId: string) => {
    try {
      // 1. التأكد من الأدمن أولاً
      const { data: adminData } = await supabase
        .from('admins')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      if (adminData) return null;

      // 2. جلب بيانات المستخدم (استخدام user_id لضمان جلب redemptions_count)
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId) // التعديل الجوهري هنا ✅
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error in fetchProfile:', err);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const profileData = await fetchProfile(user.id);
      setProfile(profileData);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (mounted) {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          if (currentSession?.user) {
            const profileData = await fetchProfile(currentSession.user.id);
            setProfile(profileData);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (!mounted) return;
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user) {
        fetchProfile(currentSession.user.id).then(data => setProfile(data));
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string, referralCode?: string) => {
    // 1. إنشاء الحساب
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } }
    });

    if (signUpError) throw signUpError;

    if (data.user) {
      // انتظار لضمان استقرار السجل في القاعدة
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const formattedCode = referralCode?.trim().toLowerCase() || null;

      // تحديث البيانات الأساسية (استخدام user_id بدلاً من id)
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ 
          full_name: fullName,
          referred_by: formattedCode 
        })
        .eq('user_id', data.user.id); // التعديل هنا ليتوافق مع جدولك ✅

      if (updateError) {
        console.error('Profile update error:', updateError.message);
      }

      await refreshProfile();
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const value = { user, profile, session, loading, signUp, signIn, signOut, refreshProfile };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}