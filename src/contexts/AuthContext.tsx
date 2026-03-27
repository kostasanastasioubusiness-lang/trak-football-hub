import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

type UserRole = 'player' | 'coach' | 'parent';

interface Profile {
  id: string;
  user_id: string;
  role: UserRole;
  full_name: string;
  nationality: string | null;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ user: User | null; error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

/** Write pending onboarding data from localStorage to Supabase */
async function writePendingProfile(userId: string): Promise<Profile | null> {
  const raw = localStorage.getItem('trak_pending_profile');
  if (!raw) return null;

  try {
    const data = JSON.parse(raw);

    const { error: profileError } = await supabase.from('profiles').insert({
      user_id: userId,
      role: data.role as any,
      full_name: data.full_name,
      nationality: data.nationality || null,
    });
    if (profileError) throw profileError;

    if (data.role === 'player' && data.player_details) {
      const pd = data.player_details;
      await supabase.from('player_details').insert({
        user_id: userId,
        date_of_birth: pd.date_of_birth,
        position: pd.position,
        current_club: pd.current_club,
        age_group: pd.age_group,
        shirt_number: pd.shirt_number,
      });

      if (data.parent_email) {
        await supabase.from('parent_invites').insert({
          player_user_id: userId,
          parent_email: data.parent_email,
        });
      }
    }

    if (data.role === 'coach' && data.coach_details) {
      const cd = data.coach_details;
      await supabase.from('coach_details').insert({
        user_id: userId,
        current_club: cd.current_club,
        team: cd.team,
        coach_role: cd.coach_role,
      });
    }

    localStorage.removeItem('trak_pending_profile');

    // Fetch the newly created profile
    const { data: newProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    return newProfile as Profile | null;
  } catch (err) {
    console.error('Failed to write pending profile:', err);
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrCreateProfile = async (userId: string) => {
    // Try to fetch existing profile
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (data) {
      setProfile(data as Profile);
      return;
    }

    // No profile — try writing pending data from localStorage
    const created = await writePendingProfile(userId);
    setProfile(created);
  };

  const refreshProfile = async () => {
    if (user) await fetchOrCreateProfile(user.id);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        setTimeout(() => fetchOrCreateProfile(currentUser.id), 0);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchOrCreateProfile(currentUser.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    return { user: data.user, error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
