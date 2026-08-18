-- Migration 745: correct the bird-balance rule. It read opening minus deaths,
-- culls and transfers OUT, and never added transfers IN — so the 12 days it
-- flagged were mostly days when birds ARRIVED in a shed, which is not a fault
-- at all. Flock 23 on 06/08 was "out by -1208" and "-10931": exactly the birds
-- moved into those sheds. A check that cries wolf is worse than no check.

CREATE OR REPLACE FUNCTION public.fn_check_bird_balance(p_run TIMESTAMPTZ)
RETURNS INTEGER LANGUAGE plpgsql AS
$$
DECLARE
  v_count INTEGER; v_detail TEXT;
BEGIN
  SELECT count(*), COALESCE(string_agg(x.d, ' | '), '')
    INTO v_count, v_detail FROM (
      SELECT dr.record_date::text || ' flock ' || COALESCE(f.flock_no::text, '?')
             || ' out by ' || (COALESCE(dr.opening_female,0) + COALESCE(dr.transfer_in_female,0)
                               - COALESCE(dr.mortality_female,0) - COALESCE(dr.cull_female,0)
                               - COALESCE(dr.transfer_female,0) - COALESCE(dr.closing_female,0))::text AS d
      FROM public.daily_records dr LEFT JOIN public.flocks f ON f.id = dr.flock_id
      WHERE COALESCE(dr.opening_female, 0) > 0 AND COALESCE(dr.closing_female, 0) > 0
        AND (COALESCE(dr.opening_female,0) + COALESCE(dr.transfer_in_female,0)
             - COALESCE(dr.mortality_female,0) - COALESCE(dr.cull_female,0)
             - COALESCE(dr.transfer_female,0)) <> COALESCE(dr.closing_female,0)
      ORDER BY dr.record_date DESC LIMIT 20) x;

  INSERT INTO public.health_check_results (run_at, check_key, title, module, severity, failed_count, detail, what_it_means)
  VALUES (p_run, 'birds_dont_balance', 'Days where the bird count does not add up', 'Flocks', 'critical', v_count, v_detail,
          'Opening plus birds moved in, less deaths, culls and birds moved out, does not equal closing — one of those figures is wrong.');
  RETURN v_count;
END;
$$;

SELECT 'function' AS chk, count(*)::int AS n
FROM pg_proc WHERE proname = 'fn_check_bird_balance';
