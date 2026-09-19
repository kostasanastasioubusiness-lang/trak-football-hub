-- ============================================================
-- A deny policy is a request for the privilege it forbids
--
-- Kostas found this on #62: `CREATE POLICY "No shared feedback deletion"
-- ... FOR DELETE USING (false)` caused #62's grant derivation to GRANT DELETE
-- on the table the policy was written to protect. The derivation asks "does a
-- policy exist for this operation", not "does that policy permit anything",
-- and a deny policy answers the first question yes.
--
-- He fixed his table. Scanning for the shape found three more, and all three
-- hold children's records:
--
--   coach_assessments        "No assessment deletion"       -> DELETE granted
--   coach_assessment_notes   "No assessment note deletion"  -> DELETE granted
--   recognition_awards       "No award deletion"            -> DELETE granted
--
-- Verified by replaying main + #62 and reading information_schema: all three
-- hold DELETE for `authenticated` today, each traceable to the policy that
-- forbids deletion.
--
-- Nothing is deletable through them right now: USING (false) matches no row,
-- so a DELETE affects zero rows. This is not a live data-loss defect and is
-- not presented as one. It is that the grant exists at all — which is exactly
-- the "pure surface" 20260919120001 says it removes — and that the barrier is
-- now one thing (the deny policy) rather than two. If any of these tables ever
-- gains a permissive DELETE policy, the grant is already sitting there.
--
-- The fix is Kostas's, applied to the rest of the class: drop the deny policy,
-- move the intent into a COMMENT that no grant-derivation pass can mistake for
-- a permission somebody wants, and let RLS deny by default.
--
--   before   deny policy      + DELETE granted    -> one barrier
--   after    no policy at all + no grant          -> two barriers
--
-- Safe because nothing deletes through a table grant: the only DELETEs against
-- these tables are inside delete_my_account(), which is SECURITY DEFINER and
-- runs as the owner, and nothing in src/ deletes from them at all.
--
-- TRUNCATE is untouched and must stay revoked: TRUNCATE ignores RLS, so there
-- the grant genuinely is the only barrier.
-- ============================================================

DROP POLICY IF EXISTS "No assessment deletion"      ON public.coach_assessments;
DROP POLICY IF EXISTS "No assessment note deletion" ON public.coach_assessment_notes;
DROP POLICY IF EXISTS "No award deletion"           ON public.recognition_awards;

REVOKE DELETE ON public.coach_assessments      FROM authenticated;
REVOKE DELETE ON public.coach_assessment_notes FROM authenticated;
REVOKE DELETE ON public.recognition_awards     FROM authenticated;

COMMENT ON TABLE public.coach_assessments IS
  'A child''s development record. Never deletable by a client: no DELETE policy '
  'and no DELETE grant. Erasure runs through delete_my_account(), which is '
  'SECURITY DEFINER. Do not add a deny policy to say so — under derived grants '
  'that requests the privilege it forbids.';

COMMENT ON TABLE public.coach_assessment_notes IS
  'Coach-private notes about a child. Never deletable by a client: no DELETE '
  'policy and no DELETE grant. Erasure runs through delete_my_account(). Do not '
  'add a deny policy to say so — under derived grants that requests the '
  'privilege it forbids.';

COMMENT ON TABLE public.recognition_awards IS
  'Recognition given to a child. Never deletable by a client: no DELETE policy '
  'and no DELETE grant. Erasure runs through delete_my_account(). Do not add a '
  'deny policy to say so — under derived grants that requests the privilege it '
  'forbids.';

-- ── Post-conditions ─────────────────────────────────────────
DO $migration$
DECLARE offender text;
BEGIN
  SELECT string_agg(t, ', ') INTO offender
  FROM unnest(ARRAY['coach_assessments','coach_assessment_notes','recognition_awards']) t
  WHERE EXISTS (
    SELECT 1 FROM information_schema.role_table_grants g
    WHERE g.table_schema = 'public' AND g.table_name = t
      AND g.grantee = 'authenticated' AND g.privilege_type = 'DELETE');
  IF offender IS NOT NULL THEN
    RAISE EXCEPTION 'DELETE still granted to authenticated on: %', offender;
  END IF;

  SELECT string_agg(p.tablename || '.' || p.policyname, ', ') INTO offender
  FROM pg_policies p
  WHERE p.schemaname = 'public' AND p.cmd = 'DELETE'
    AND p.tablename IN ('coach_assessments','coach_assessment_notes','recognition_awards');
  IF offender IS NOT NULL THEN
    RAISE EXCEPTION 'A DELETE policy was re-added, which re-requests the grant: %', offender;
  END IF;
END;
$migration$;
