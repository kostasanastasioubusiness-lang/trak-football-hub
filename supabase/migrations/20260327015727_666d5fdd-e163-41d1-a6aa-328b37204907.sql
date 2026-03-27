-- Drop the overly permissive anon SELECT policy
DROP POLICY IF EXISTS "Anyone can read invite by token" ON public.parent_invites;

-- Create a security definer function for anonymous token lookup
CREATE OR REPLACE FUNCTION public.get_parent_invite_by_token(p_token uuid)
RETURNS TABLE (
  id uuid,
  player_user_id uuid,
  parent_email text,
  invite_token uuid,
  status text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, player_user_id, parent_email, invite_token, status, created_at
  FROM public.parent_invites
  WHERE invite_token = p_token AND status = 'pending';
$$;