-- ============================================================
-- Remove rows created while proving the write-authorisation flaw
--
-- These were inserted from an ordinary player account to demonstrate that
-- coach-owned tables did not check the writer's role. They cannot be
-- deleted through the app: coach_assessments and recognition_awards
-- deliberately have no DELETE policy.
--
-- Run this AFTER applying 20260614000001_require_role_for_coach_writes.sql.
-- Step 1 is read-only. Read it before running step 2.
-- ============================================================

-- ─── STEP 1: inspect (nothing is modified) ───────────────────
-- An assessment is forged if the "coach" who wrote it is not a coach.
SELECT 'forged assessment' AS what, ca.id, ca.coach_user_id, p.role AS author_role,
       ca.work_rate, ca.tactical, ca.created_at
FROM public.coach_assessments ca
LEFT JOIN public.profiles p ON p.user_id = ca.coach_user_id
WHERE p.role IS DISTINCT FROM 'coach';

SELECT 'forged award' AS what, ra.id, ra.coach_user_id, p.role AS author_role, ra.awarded_for
FROM public.recognition_awards ra
LEFT JOIN public.profiles p ON p.user_id = ra.coach_user_id
WHERE p.role IS DISTINCT FROM 'coach' OR ra.awarded_for = 'SECURITY PROBE';

SELECT 'probe organization' AS what, o.id, o.name, o.admin_user_id, p.role AS admin_role
FROM public.organizations o
LEFT JOIN public.profiles p ON p.user_id = o.admin_user_id
WHERE o.name = 'SECURITY PROBE' OR p.role IS DISTINCT FROM 'club';

SELECT 'probe rows' AS what, 'coach_sessions' AS tbl, COUNT(*) FROM public.coach_sessions WHERE title = 'SECURITY PROBE'
UNION ALL SELECT 'probe rows', 'coach_calendar_events', COUNT(*) FROM public.coach_calendar_events WHERE title = 'SECURITY PROBE'
UNION ALL SELECT 'probe rows', 'squad_players', COUNT(*) FROM public.squad_players WHERE player_name = 'SECURITY PROBE';


-- ─── STEP 2: delete. Uncomment after reviewing step 1. ───────
-- Expect roughly: 1 assessment, 1 award, 1 organization.

-- BEGIN;
--
-- DELETE FROM public.coach_assessment_notes
-- WHERE assessment_id IN (
--   SELECT ca.id FROM public.coach_assessments ca
--   LEFT JOIN public.profiles p ON p.user_id = ca.coach_user_id
--   WHERE p.role IS DISTINCT FROM 'coach'
-- );
--
-- DELETE FROM public.coach_assessments ca
-- USING public.profiles p
-- WHERE p.user_id = ca.coach_user_id AND p.role IS DISTINCT FROM 'coach';
--
-- DELETE FROM public.recognition_awards ra
-- WHERE ra.awarded_for = 'SECURITY PROBE'
--    OR ra.coach_user_id IN (SELECT user_id FROM public.profiles WHERE role IS DISTINCT FROM 'coach');
--
-- DELETE FROM public.organizations WHERE name = 'SECURITY PROBE';
-- DELETE FROM public.coach_sessions WHERE title = 'SECURITY PROBE';
-- DELETE FROM public.coach_calendar_events WHERE title = 'SECURITY PROBE';
-- DELETE FROM public.squad_players WHERE player_name = 'SECURITY PROBE';
--
-- COMMIT;   -- or ROLLBACK;
