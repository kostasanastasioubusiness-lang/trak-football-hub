-- @trak-suite mode=--roster-merge-review in-all=true
-- T4 repair: coach_merge_squad_rows (20260922130000).
--
-- Synthetic fixtures only. Run after real migrations in a disposable database.
--
-- A player whose name did not exactly match the coach's roster row lands on a
-- new, empty row; their history stays on the coach's orphaned row. The coach
-- merges the orphan into the player. Every "allowed" below has a "refused"
-- beside it, the total amount of history is checked before and after (every
-- referencing FK is ON DELETE CASCADE, so a missed table would be destroyed,
-- not left behind), and a table created inside this test proves the move is
-- driven by the catalog rather than a hard-coded list.
BEGIN;
SET LOCAL TIME ZONE 'UTC';
DO $test$
BEGIN
  IF current_setting('trak.test_database', true) IS DISTINCT FROM 'disposable' THEN
    RAISE EXCEPTION 'Refusing roster-merge fixtures outside the disposable test harness';
  END IF;
END;
$test$;

CREATE FUNCTION pg_temp.mid(n integer) RETURNS uuid LANGUAGE sql IMMUTABLE AS $test$
  SELECT ('98200000-0000-0000-0000-' || lpad(n::text, 12, '0'))::uuid;
$test$;
CREATE TEMP TABLE merge_results (description text, passed boolean, detail text);
GRANT INSERT ON merge_results TO anon, authenticated, service_role;
CREATE FUNCTION pg_temp.massert(ok boolean, description text, detail text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql AS $test$
BEGIN INSERT INTO pg_temp.merge_results VALUES (description, ok IS TRUE, detail); END;
$test$;
CREATE FUNCTION pg_temp.as_user(p uuid) RETURNS void LANGUAGE plpgsql AS $test$
BEGIN
  PERFORM set_config('request.jwt.claims', jsonb_build_object('role', 'authenticated', 'sub', p::text)::text, true);
END;
$test$;
-- Refused with a specific SQLSTATE; success or any other error is recorded as a failure.
CREATE FUNCTION pg_temp.mrefused(stmt text, want text, description text) RETURNS void
LANGUAGE plpgsql AS $test$
DECLARE ok boolean := false; failure text;
BEGIN
  BEGIN EXECUTE stmt; failure := 'unexpectedly allowed';
  EXCEPTION WHEN OTHERS THEN
    IF SQLSTATE = want THEN ok := true; ELSE failure := SQLSTATE || ': ' || SQLERRM; END IF;
  END;
  INSERT INTO pg_temp.merge_results VALUES (description, ok, failure);
END;
$test$;

-- ── Fixture ─────────────────────────────────────────────────────────────────
INSERT INTO auth.users (id, email, email_confirmed_at) VALUES
  (pg_temp.mid(1),  'admin@merge.test',  now()),
  (pg_temp.mid(10), 'coach@merge.test',  now()),
  (pg_temp.mid(11), 'other-coach@merge.test', now()),
  (pg_temp.mid(20), 'mohammed@merge.test', now()),
  (pg_temp.mid(21), 'second@merge.test', now()),
  (pg_temp.mid(22), 'third@merge.test', now()),
  (pg_temp.mid(23), 'fourth@merge.test', now());
INSERT INTO public.organizations (id, admin_user_id, name, join_code)
VALUES (pg_temp.mid(100), pg_temp.mid(1), 'Merge FC', 'MERGE1');
INSERT INTO public.profiles (user_id, role, full_name, invite_code) VALUES
  (pg_temp.mid(10), 'coach', 'Merge Coach', 'MRGC01'),
  (pg_temp.mid(11), 'coach', 'Other Coach', 'MRGC02'),
  (pg_temp.mid(20), 'player', 'Mohammed Hassan', NULL),
  (pg_temp.mid(21), 'player', 'Second Player', NULL),
  (pg_temp.mid(22), 'player', 'Third Player', NULL),
  (pg_temp.mid(23), 'player', 'Fourth Player', NULL);
INSERT INTO public.coach_details (user_id, organization_id) VALUES
  (pg_temp.mid(10), pg_temp.mid(100)), (pg_temp.mid(11), pg_temp.mid(100));
INSERT INTO public.squad_players (id, coach_user_id, player_name, linked_player_id, organization_id, status) VALUES
  -- The coach typed "Mohammad"; the player joined as "Mohammed" and landed on a new row.
  (pg_temp.mid(30), pg_temp.mid(10), 'Mohammad Hassan', NULL,             pg_temp.mid(100), 'active'),
  (pg_temp.mid(31), pg_temp.mid(10), 'Mohammed Hassan', pg_temp.mid(20),  pg_temp.mid(100), 'active'),
  -- A second pair, for the future-table case.
  (pg_temp.mid(32), pg_temp.mid(10), 'Secnd Player',    NULL,             pg_temp.mid(100), 'active'),
  (pg_temp.mid(33), pg_temp.mid(10), 'Second Player',   pg_temp.mid(21),  pg_temp.mid(100), 'active'),
  -- Another coach's rows.
  (pg_temp.mid(34), pg_temp.mid(11), 'Other Orphan',    NULL,             pg_temp.mid(100), 'active'),
  (pg_temp.mid(35), pg_temp.mid(11), 'Third Player',    pg_temp.mid(22),  pg_temp.mid(100), 'active'),
  -- A pair whose merge is made to fail partway, for the atomicity case.
  (pg_temp.mid(36), pg_temp.mid(10), 'Forth Player',    NULL,             pg_temp.mid(100), 'active'),
  (pg_temp.mid(37), pg_temp.mid(10), 'Fourth Player',   pg_temp.mid(23),  pg_temp.mid(100), 'active');
-- History on the orphan: two assessments (one with a private note), an award.
INSERT INTO public.coach_assessments (id, coach_user_id, squad_player_id, work_rate, tactical, attitude, technical, physical, coachability, organization_id)
VALUES (pg_temp.mid(40), pg_temp.mid(10), pg_temp.mid(30), 7,7,7,7,7,7, pg_temp.mid(100)),
       (pg_temp.mid(41), pg_temp.mid(10), pg_temp.mid(30), 8,8,8,8,8,8, pg_temp.mid(100)),
       (pg_temp.mid(42), pg_temp.mid(10), pg_temp.mid(32), 6,6,6,6,6,6, pg_temp.mid(100)),
       (pg_temp.mid(43), pg_temp.mid(10), pg_temp.mid(36), 5,5,5,5,5,5, pg_temp.mid(100));
INSERT INTO public.coach_assessment_notes (assessment_id, coach_user_id, note)
VALUES (pg_temp.mid(40), pg_temp.mid(10), 'Private synthetic note');
INSERT INTO public.recognition_awards (id, coach_user_id, squad_player_id, award_type, awarded_for, organization_id)
VALUES (pg_temp.mid(50), pg_temp.mid(10), pg_temp.mid(30), 'most_improved', 'Synthetic', pg_temp.mid(100));

-- A table created here, after the migration, referencing roster rows. If the
-- merge used a fixed list this row would be lost to the cascade.
CREATE TABLE public.zz_merge_probe (id int PRIMARY KEY, squad_player_id uuid NOT NULL REFERENCES public.squad_players(id) ON DELETE CASCADE);
INSERT INTO public.zz_merge_probe VALUES (1, pg_temp.mid(32));
-- A referencing row that cannot be moved to mid(37): the merge must fail
-- partway, after assessments have already moved, and undo all of it.
CREATE TABLE public.zz_merge_blocker (id int PRIMARY KEY,
  squad_player_id uuid NOT NULL REFERENCES public.squad_players(id) ON DELETE CASCADE,
  CHECK (squad_player_id <> '98200000-0000-0000-0000-000000000037'));
INSERT INTO public.zz_merge_blocker VALUES (1, pg_temp.mid(36));

SET LOCAL ROLE authenticated;

-- ── 1. Refusals ─────────────────────────────────────────────────────────────
SELECT pg_temp.as_user(pg_temp.mid(20));
SELECT pg_temp.mrefused(format('SELECT public.coach_merge_squad_rows(%L, %L)', pg_temp.mid(30), pg_temp.mid(31)), '42501',
  '1 a player cannot merge roster rows');
SELECT pg_temp.as_user(pg_temp.mid(11));
SELECT pg_temp.mrefused(format('SELECT public.coach_merge_squad_rows(%L, %L)', pg_temp.mid(30), pg_temp.mid(31)), '42501',
  '1 another coach in the same academy cannot merge this coach''s rows');
SELECT pg_temp.mrefused(format('SELECT public.coach_merge_squad_rows(%L, %L)', pg_temp.mid(34), pg_temp.mid(31)), '42501',
  '1 a coach cannot merge their orphan into another coach''s player');
SELECT pg_temp.as_user(pg_temp.mid(10));
SELECT pg_temp.mrefused(format('SELECT public.coach_merge_squad_rows(%L, %L)', pg_temp.mid(31), pg_temp.mid(33)), '22023',
  '1 a signed-up player''s row cannot be merged away');
SELECT pg_temp.mrefused(format('SELECT public.coach_merge_squad_rows(%L, %L)', pg_temp.mid(30), pg_temp.mid(32)), '22023',
  '1 cannot merge into a row nobody has claimed');
SELECT pg_temp.mrefused(format('SELECT public.coach_merge_squad_rows(%L, %L)', pg_temp.mid(30), pg_temp.mid(30)), '22023',
  '1 cannot merge a row into itself');

-- ── 2. The coach merges the misspelt orphan into the player ─────────────────
DO $test$
DECLARE v_total_before bigint; v_total_after bigint; v_result jsonb;
BEGIN
  SELECT count(*) INTO v_total_before FROM public.coach_assessments WHERE coach_user_id = pg_temp.mid(10);
  PERFORM pg_temp.massert((public.my_link_outcome(pg_temp.mid(31)) IS NOT NULL), '2-control my_link_outcome is callable for the coach''s row');
  v_result := public.coach_merge_squad_rows(pg_temp.mid(30), pg_temp.mid(31));
  PERFORM pg_temp.massert((v_result->'moved'->>'coach_assessments')::int = 2,
    '2 both prior assessments move to the player''s row', coalesce(v_result::text, 'null'));
  PERFORM pg_temp.massert((v_result->'moved'->>'recognition_awards')::int = 1,
    '2 the award moves too', coalesce(v_result::text, 'null'));
  PERFORM pg_temp.massert(NOT EXISTS (SELECT 1 FROM public.squad_players WHERE id = pg_temp.mid(30)),
    '2 the orphaned row is gone');
  SELECT count(*) INTO v_total_after FROM public.coach_assessments WHERE coach_user_id = pg_temp.mid(10);
  PERFORM pg_temp.massert(v_total_after = v_total_before,
    '2 no assessment was lost to the cascade', v_total_before || ' before, ' || v_total_after || ' after');
  PERFORM pg_temp.massert(EXISTS (SELECT 1 FROM public.coach_assessment_notes WHERE assessment_id = pg_temp.mid(40)),
    '2 the private note stays attached to its assessment');
END;
$test$;

-- The player now sees their history, and is no longer warned it may be missing.
SELECT pg_temp.as_user(pg_temp.mid(20));
DO $test$
DECLARE v_seen integer; v_outcome jsonb;
BEGIN
  SELECT count(*) INTO v_seen FROM public.coach_assessments WHERE squad_player_id = pg_temp.mid(31);
  PERFORM pg_temp.massert(v_seen = 2, '3 the player can read both assessments after the merge', v_seen || ' visible');
  v_outcome := public.my_link_outcome(pg_temp.mid(31));
  PERFORM pg_temp.massert((v_outcome->>'may_have_missed_history')::boolean IS FALSE,
    '3 the "history may be missing" warning clears', coalesce(v_outcome::text, 'null'));
END;
$test$;

-- ── 4. A table the migration never heard of is still carried over ──────────
SELECT pg_temp.as_user(pg_temp.mid(10));
DO $test$
DECLARE v_result jsonb;
BEGIN
  v_result := public.coach_merge_squad_rows(pg_temp.mid(32), pg_temp.mid(33));
  PERFORM pg_temp.massert((v_result->'moved'->>'zz_merge_probe')::int = 1,
    '4 a referencing table added after the migration is moved, not cascaded away', coalesce(v_result::text, 'null'));
END;
$test$;

-- ── 5. A merge that fails partway leaves everything where it was ──────────
DO $test$
DECLARE v_failed boolean := false;
BEGIN
  BEGIN
    PERFORM public.coach_merge_squad_rows(pg_temp.mid(36), pg_temp.mid(37));
  EXCEPTION WHEN check_violation THEN v_failed := true;
  END;
  PERFORM pg_temp.massert(v_failed, '5 the blocked merge fails');
  PERFORM pg_temp.massert(EXISTS (SELECT 1 FROM public.squad_players WHERE id = pg_temp.mid(36)),
    '5 the orphan row still exists after the failed merge');
  PERFORM pg_temp.massert((SELECT squad_player_id FROM public.coach_assessments WHERE id = pg_temp.mid(43)) = pg_temp.mid(36),
    '5 its assessment was not left half-moved');
END;
$test$;

RESET ROLE;
DO $test$
BEGIN
  PERFORM pg_temp.massert((SELECT squad_player_id FROM public.zz_merge_probe WHERE id = 1) = pg_temp.mid(33),
    '4 the probe row now points at the player''s row');
END;
$test$;

-- ── Report ──────────────────────────────────────────────────────────────────
DO $test$
DECLARE failed integer; total integer;
BEGIN
  SELECT count(*) FILTER (WHERE NOT passed), count(*) INTO failed, total FROM pg_temp.merge_results;
  IF total <> 19 THEN
    RAISE EXCEPTION 'Roster merge: % assertions ran; expected exactly 19', total;
  END IF;
  IF failed > 0 THEN
    RAISE EXCEPTION 'Roster merge: % of % failed: %', failed, total,
      (SELECT string_agg(description || ' [' || coalesce(detail, '') || ']', ' || ') FROM pg_temp.merge_results WHERE NOT passed);
  END IF;
  RAISE NOTICE 'Roster merge: % of % passed', total - failed, total;
END;
$test$;

ROLLBACK;
