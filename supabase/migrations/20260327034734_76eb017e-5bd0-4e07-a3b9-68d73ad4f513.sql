-- Coach squad management: players added by coach
CREATE TABLE public.squad_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_user_id uuid NOT NULL,
  player_name text NOT NULL,
  position text,
  shirt_number integer,
  age integer,
  linked_player_id uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.squad_players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can manage own squad" ON public.squad_players
  FOR ALL TO authenticated
  USING (coach_user_id = auth.uid())
  WITH CHECK (coach_user_id = auth.uid());

-- Coach sessions (training or match)
CREATE TABLE public.coach_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_user_id uuid NOT NULL,
  session_type text NOT NULL DEFAULT 'training',
  title text NOT NULL,
  session_date date DEFAULT CURRENT_DATE,
  training_type text,
  competition text,
  venue text,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.coach_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can manage own sessions" ON public.coach_sessions
  FOR ALL TO authenticated
  USING (coach_user_id = auth.uid())
  WITH CHECK (coach_user_id = auth.uid());

-- Session attendance
CREATE TABLE public.session_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.coach_sessions(id) ON DELETE CASCADE,
  squad_player_id uuid NOT NULL REFERENCES public.squad_players(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'present',
  minutes_played integer,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.session_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can manage attendance via session ownership" ON public.session_attendance
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.coach_sessions cs WHERE cs.id = session_id AND cs.coach_user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.coach_sessions cs WHERE cs.id = session_id AND cs.coach_user_id = auth.uid()));

-- Coach assessments (6 sliders)
CREATE TABLE public.coach_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_user_id uuid NOT NULL,
  squad_player_id uuid NOT NULL REFERENCES public.squad_players(id) ON DELETE CASCADE,
  session_id uuid REFERENCES public.coach_sessions(id) ON DELETE SET NULL,
  appearance text,
  work_rate integer NOT NULL DEFAULT 5,
  tactical integer NOT NULL DEFAULT 5,
  attitude integer NOT NULL DEFAULT 5,
  technical integer NOT NULL DEFAULT 5,
  physical integer NOT NULL DEFAULT 5,
  coachability integer NOT NULL DEFAULT 5,
  coach_rating numeric GENERATED ALWAYS AS (
    ROUND((work_rate + tactical + attitude + technical + physical + coachability)::numeric / 6.0, 1)
  ) STORED,
  flag text DEFAULT 'fair',
  private_note text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.coach_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can manage own assessments" ON public.coach_assessments
  FOR ALL TO authenticated
  USING (coach_user_id = auth.uid())
  WITH CHECK (coach_user_id = auth.uid());

-- 1-on-1 meeting requests
CREATE TABLE public.meeting_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_user_id uuid NOT NULL,
  squad_player_id uuid NOT NULL REFERENCES public.squad_players(id) ON DELETE CASCADE,
  reason text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.meeting_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coaches can manage own meeting requests" ON public.meeting_requests
  FOR ALL TO authenticated
  USING (coach_user_id = auth.uid())
  WITH CHECK (coach_user_id = auth.uid());