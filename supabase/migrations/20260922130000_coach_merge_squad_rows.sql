-- ============================================================
-- T4: a coach can merge an orphaned roster row into the player who joined
--
-- link_player_to_coach() adopts the coach's row only on an exact, unique,
-- case-insensitive name match. A misspelling ("Mohammad"/"Mohammed") or two
-- players with the same name lands the player on a NEW empty row, while their
-- earlier assessments stay on the coach's original, now orphaned, row
-- (supabase/tests/roster_adoption.sql, sections 2-3). my_link_outcome() warns
-- the player; nothing could repair it.
--
-- Decision (Tarek, 22 Sep): the coach, who knows their players, confirms the
-- merge. No automatic fuzzy matching: "Ali Khan" and "Ali Khen" may be two
-- children, and a guess would hand one child the other's record.
--
-- Safety properties, each covered by supabase/tests/roster_merge.sql:
--   * caller is a coach who owns BOTH rows (squad_player_is_mine, so departed
--     coaches and closed academies are refused);
--   * p_from is unlinked (the orphan) and p_into is linked (the player);
--   * every row referencing p_from moves, found dynamically from the catalog so
--     a table added later is covered without editing this function;
--   * p_from is deleted only after zero references are PROVEN to remain,
--     because every one of those foreign keys is ON DELETE CASCADE;
--   * both rows are locked, so two merges cannot interleave.
-- ============================================================

CREATE OR REPLACE FUNCTION public.coach_merge_squad_rows(p_from uuid, p_into uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid   uuid := auth.uid();
  v_from  public.squad_players%ROWTYPE;
  v_into  public.squad_players%ROWTYPE;
  v_fk    record;
  v_moved jsonb := '{}'::jsonb;
  v_n     bigint;
  v_left  bigint;
BEGIN
  IF v_uid IS NULL OR NOT public.is_coach() THEN
    RAISE EXCEPTION 'Only a coach can merge roster rows' USING ERRCODE = '42501';
  END IF;
  IF p_from IS NULL OR p_into IS NULL OR p_from = p_into THEN
    RAISE EXCEPTION 'Choose two different roster rows' USING ERRCODE = '22023';
  END IF;

  -- Lock in a fixed order so two concurrent merges cannot deadlock or interleave.
  PERFORM 1 FROM public.squad_players WHERE id IN (p_from, p_into) ORDER BY id FOR UPDATE;
  SELECT * INTO v_from FROM public.squad_players WHERE id = p_from;
  SELECT * INTO v_into FROM public.squad_players WHERE id = p_into;

  -- One refusal for "missing" and "not yours", so ids cannot be probed.
  IF v_from.id IS NULL OR v_into.id IS NULL
     OR v_from.coach_user_id IS DISTINCT FROM v_uid OR v_into.coach_user_id IS DISTINCT FROM v_uid
     OR NOT public.squad_player_is_mine(p_from) OR NOT public.squad_player_is_mine(p_into) THEN
    RAISE EXCEPTION 'Both players must be on your current roster' USING ERRCODE = '42501';
  END IF;
  IF v_from.linked_player_id IS NOT NULL THEN
    RAISE EXCEPTION 'The row being merged must not belong to a signed-up player' USING ERRCODE = '22023';
  END IF;
  IF v_into.linked_player_id IS NULL THEN
    RAISE EXCEPTION 'Merge into the player who has signed up' USING ERRCODE = '22023';
  END IF;

  -- Assessments first: feedback drafts are validated against their
  -- assessment's roster row (stamp_feedback_draft_provenance).
  UPDATE public.coach_assessments SET squad_player_id = p_into WHERE squad_player_id = p_from;
  GET DIAGNOSTICS v_n = ROW_COUNT;
  v_moved := v_moved || jsonb_build_object('coach_assessments', v_n);

  FOR v_fk IN
    SELECT c.conrelid::regclass AS tbl, cl.relname AS name, a.attname AS col
    FROM pg_catalog.pg_constraint c
    JOIN pg_catalog.pg_class cl ON cl.oid = c.conrelid
    JOIN pg_catalog.pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
    WHERE c.contype = 'f' AND c.confrelid = 'public.squad_players'::regclass
      AND c.conrelid <> 'public.coach_assessments'::regclass
      AND array_length(c.conkey, 1) = 1
    ORDER BY 1, 2
  LOOP
    EXECUTE format('UPDATE %s SET %I = $1 WHERE %I = $2', v_fk.tbl, v_fk.col, v_fk.col)
      USING p_into, p_from;
    GET DIAGNOSTICS v_n = ROW_COUNT;
    IF v_n > 0 THEN v_moved := v_moved || jsonb_build_object(v_fk.name, v_n); END IF;
  END LOOP;

  -- Every referencing foreign key cascades on delete. Prove nothing is left
  -- before the delete can take anything with it.
  FOR v_fk IN
    SELECT c.conrelid::regclass AS tbl, a.attname AS col
    FROM pg_catalog.pg_constraint c
    JOIN pg_catalog.pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
    WHERE c.contype = 'f' AND c.confrelid = 'public.squad_players'::regclass
  LOOP
    EXECUTE format('SELECT count(*) FROM %s WHERE %I = $1', v_fk.tbl, v_fk.col) INTO v_left USING p_from;
    IF v_left > 0 THEN
      RAISE EXCEPTION 'Merge stopped: % still references the old row', v_fk.tbl;
    END IF;
  END LOOP;

  DELETE FROM public.squad_players WHERE id = p_from;

  RETURN jsonb_build_object('merged_into', p_into, 'moved', v_moved);
END;
$$;

REVOKE ALL ON FUNCTION public.coach_merge_squad_rows(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.coach_merge_squad_rows(uuid, uuid) TO authenticated;

COMMENT ON FUNCTION public.coach_merge_squad_rows(uuid, uuid) IS
  'T4: coach-confirmed merge of an unlinked roster row''s history into the linked row of the player who joined. Refuses unless the caller owns both.';
