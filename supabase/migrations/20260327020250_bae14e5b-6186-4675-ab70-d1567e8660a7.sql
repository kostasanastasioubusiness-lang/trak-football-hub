-- Matches table for player match logs
CREATE TABLE public.matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  position text NOT NULL,
  competition text NOT NULL,
  venue text NOT NULL,
  team_score integer NOT NULL DEFAULT 0,
  opponent_score integer NOT NULL DEFAULT 0,
  age_group text NOT NULL,
  minutes_played integer NOT NULL DEFAULT 0,
  card_received text DEFAULT 'None',
  body_condition text,
  self_rating text,
  goals integer NOT NULL DEFAULT 0,
  assists integer NOT NULL DEFAULT 0,
  computed_rating numeric(3,1) NOT NULL DEFAULT 6.5,
  created_at timestamptz DEFAULT now()
);

-- RLS for matches
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players can insert own matches" ON public.matches
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Players can read own matches" ON public.matches
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Players can update own matches" ON public.matches
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Wellness logs table
CREATE TABLE public.wellness_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  logged_date date NOT NULL DEFAULT CURRENT_DATE,
  mood text,
  energy text,
  sleep_quality text,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, logged_date)
);

ALTER TABLE public.wellness_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players can insert own wellness" ON public.wellness_logs
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Players can read own wellness" ON public.wellness_logs
  FOR SELECT TO authenticated USING (user_id = auth.uid());