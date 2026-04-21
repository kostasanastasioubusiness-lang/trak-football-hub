import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { generateCode } from '@/lib/invite-codes';
import type { User } from '@supabase/supabase-js';

type UserRole = 'player' | 'coach' | 'parent';
const PENDING_PROFILE_KEY = 'trak_pending_profile';

interface PendingProfileData {
  role: UserRole;
  full_name: string;
  nationality: string | null;
  player_details?: {
    date_of_birth: string;
    position: string;
    current_club: string;
    age_group: string;
    shirt_number: number | null;
  };
  coach_details?: {
    current_club: string;
    team: string;
    coach_role: string;
  };
  parent_email?: string | null;
  coach_invite_code?: string | null;
}

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
  signUp: (email: string, password: string, pendingProfile?: PendingProfileData) => Promise<{ user: User | null; error: Error | null }>;
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
const isValidRole = (value: unknown): value is UserRole => value === 'player' || value === 'coach' || value === 'parent';

const parsePendingProfile = (value: unknown): PendingProfileData | null => {
  if (!value || typeof value !== 'object') return null;

  const data = value as Record<string, unknown>;
  if (!isValidRole(data.role) || typeof data.full_name !== 'string') return null;

  return {
    role: data.role,
    full_name: data.full_name,
    nationality: typeof data.nationality === 'string' ? data.nationality : null,
    player_details: data.player_details as PendingProfileData['player_details'] | undefined,
    coach_details: data.coach_details as PendingProfileData['coach_details'] | undefined,
    parent_email: typeof data.parent_email === 'string' ? data.parent_email : null,
    coach_invite_code: typeof data.coach_invite_code === 'string' ? data.coach_invite_code : null,
  };
};

const readPendingProfileFromLocalStorage = (): PendingProfileData | null => {
  const raw = localStorage.getItem(PENDING_PROFILE_KEY);
  if (!raw) return null;

  try {
    return parsePendingProfile(JSON.parse(raw));
  } catch {
    return null;
  }
};

const readPendingProfileFromMetadata = (user: User): PendingProfileData | null => {
  const metadata = user.user_metadata as Record<string, unknown> | undefined;
  return parsePendingProfile(metadata?.trak_onboarding);
};

async function writeProfileFromPendingData(userId: string, data: PendingProfileData): Promise<Profile | null> {
  const { error: profileError } = await supabase.from('profiles').upsert({
    user_id: userId,
    role: data.role as any,
    full_name: data.full_name,
    nationality: data.nationality || null,
  }, { onConflict: 'user_id' });
  if (profileError) throw profileError;

  if (data.role === 'player' && data.player_details) {
    const pd = data.player_details;
    const { error: playerError } = await supabase.from('player_details').upsert({
      user_id: userId,
      date_of_birth: pd.date_of_birth,
      position: pd.position,
      current_club: pd.current_club,
      age_group: pd.age_group,
      shirt_number: pd.shirt_number,
    }, { onConflict: 'user_id' });
    if (playerError) throw playerError;

    if (data.parent_email) {
      const { data: existingInvite } = await supabase
        .from('parent_invites')
        .select('id')
        .eq('player_user_id', userId)
        .eq('parent_email', data.parent_email)
        .maybeSingle();

      if (!existingInvite) {
        const { error: inviteError } = await supabase.from('parent_invites').insert({
          player_user_id: userId,
          parent_email: data.parent_email,
        });
        if (inviteError) throw inviteError;
      }
    }
  }

  if (data.role === 'coach' && data.coach_details) {
    const cd = data.coach_details;
    const { error: coachError } = await supabase.from('coach_details').upsert({
      user_id: userId,
      current_club: cd.current_club,
      team: cd.team,
      coach_role: cd.coach_role,
    }, { onConflict: 'user_id' });
    if (coachError) throw coachError;

    // Generate invite code for this coach if not already set
    const { data: existingProfile } = await supabase
      .from('profiles').select('invite_code').eq('user_id', userId).single();
    if (!existingProfile?.invite_code) {
      const newCode = generateCode();
      await supabase.from('profiles').update({ invite_code: newCode }).eq('user_id', userId);
    }
  }

  if (data.role === 'player' && data.coach_invite_code) {
    const rawCode = data.coach_invite_code.replace(/^TRK-/i, '').toUpperCase();
    const { data: coachProfile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('invite_code', rawCode)
      .eq('role', 'coach')
      .maybeSingle();
    if (coachProfile) {
      await supabase.from('squad_players').insert({
        coach_user_id: coachProfile.user_id,
        player_name: data.full_name,
        position: data.player_details?.position || null,
        shirt_number: data.player_details?.shirt_number || null,
        linked_player_id: userId,
      });
    }
  }

  const { data: newProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  return newProfile as Profile | null;
}

async function writePendingProfile(user: User): Promise<Profile | null> {
  const data = readPendingProfileFromLocalStorage() || readPendingProfileFromMetadata(user);
  if (!data) return null;

  try {
    const created = await writeProfileFromPendingData(user.id, data);
    if (created) localStorage.removeItem(PENDING_PROFILE_KEY);
    return created;
  } catch (err) {
    console.error('Failed to write pending profile:', err);
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrCreateProfile = async (currentUser: User) => {
    // Try to fetch existing profile
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', currentUser.id)
      .maybeSingle();

    if (data) {
      setProfile(data as Profile);
      return;
    }

    // No profile — try writing pending data from localStorage or auth metadata
    const created = await writePendingProfile(currentUser);
    setProfile(created);
  };

  const refreshProfile = async () => {
    if (user) await fetchOrCreateProfile(user);
  };

  useEffect(() => {
    const hydrate = async (currentUser: User | null) => {
      if (!currentUser) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        await fetchOrCreateProfile(currentUser);
      } finally {
        setLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setLoading(true);
      void hydrate(currentUser);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setLoading(true);
      void hydrate(currentUser);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, pendingProfile?: PendingProfileData) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        ...(pendingProfile ? { data: { trak_onboarding: pendingProfile } } : {}),
      },
    });

    if (error && /already registered|already exists|user exists/i.test(error.message)) {
      return { user: null, error: new Error('An account with this email already exists. Please sign in instead.') };
    }

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
