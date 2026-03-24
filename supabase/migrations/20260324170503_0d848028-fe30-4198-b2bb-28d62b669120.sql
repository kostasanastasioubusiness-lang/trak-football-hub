
-- Role enum
CREATE TYPE public.user_role AS ENUM ('player', 'coach', 'parent');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  role user_role NOT NULL,
  full_name TEXT NOT NULL,
  nationality TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Player details
CREATE TABLE public.player_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  date_of_birth DATE,
  position TEXT,
  current_club TEXT,
  age_group TEXT,
  shirt_number INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Coach details
CREATE TABLE public.coach_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  current_club TEXT,
  team TEXT,
  coach_role TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Parent invites
CREATE TABLE public.parent_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  parent_email TEXT NOT NULL,
  invite_token UUID DEFAULT gen_random_uuid() NOT NULL UNIQUE,
  status TEXT DEFAULT 'pending' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Player-parent links
CREATE TABLE public.player_parent_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  parent_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(player_user_id, parent_user_id)
);

-- RLS policies

-- Profiles: users can read and update their own profile
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Player details
CREATE POLICY "Players can read own details"
  ON public.player_details FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Players can insert own details"
  ON public.player_details FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Players can update own details"
  ON public.player_details FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Coach details
CREATE POLICY "Coaches can read own details"
  ON public.coach_details FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Coaches can insert own details"
  ON public.coach_details FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Coaches can update own details"
  ON public.coach_details FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Parent invites: players can create, anyone can read by token
CREATE POLICY "Players can create invites"
  ON public.parent_invites FOR INSERT
  TO authenticated
  WITH CHECK (player_user_id = auth.uid());

CREATE POLICY "Players can read own invites"
  ON public.parent_invites FOR SELECT
  TO authenticated
  USING (player_user_id = auth.uid());

CREATE POLICY "Anyone can read invite by token"
  ON public.parent_invites FOR SELECT
  TO anon
  USING (true);

-- Player-parent links
CREATE POLICY "Linked users can read links"
  ON public.player_parent_links FOR SELECT
  TO authenticated
  USING (player_user_id = auth.uid() OR parent_user_id = auth.uid());

CREATE POLICY "Authenticated can insert links"
  ON public.player_parent_links FOR INSERT
  TO authenticated
  WITH CHECK (parent_user_id = auth.uid());

-- Trigger to create profile on signup is NOT needed since we handle it in the app
