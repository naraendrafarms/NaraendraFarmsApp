-- Migration 1021: 1018 added received_female unconditionally, but on some
-- rows (e.g. Flock 20 Kethireddypally sh2, 2025-11-11) received_female is
-- itself a duplicate write of a value already reflected in closing (not a
-- real additional receipt) -- the mirror image of the trcull/transfer
-- duplicate bug fixed earlier. Adding it there wrongly flags an already-
-- correct row (closing 1243 verified against the farm owner's own figures).
-- Fix: only flag a row if it fails to balance BOTH with and without
-- received_female -- that clears both false-positive shapes at once.
CREATE OR REPLACE FUNCTION public.fn_check_bird_balance(p_run TIMESTAMPTZ)
RETURNS INTEGER LANGUAGE plpgsql AS
$$
DECLARE
  v_count INTEGER; v_detail TEXT;
BEGIN
  SELECT count(*), COALESCE(string_agg(x.d, ' | '), '')
    INTO v_count, v_detail FROM (
      SELECT dr.record_date::text || ' flock ' || COALESCE(f.flock_no::text, '?')
             || ' out by ' || (COALESCE(dr.opening_female,0) + COALESCE(dr.transfer_in_female,0) + COALESCE(dr.received_female,0)
                               - COALESCE(dr.mortality_female,0) - COALESCE(dr.cull_female,0)
                               - COALESCE(dr.transfer_female,0) - COALESCE(dr.closing_female,0))::text AS d
      FROM public.daily_records dr LEFT JOIN public.flocks f ON f.id = dr.flock_id
      WHERE COALESCE(dr.opening_female, 0) > 0 AND COALESCE(dr.closing_female, 0) > 0
        AND (COALESCE(dr.opening_female,0) + COALESCE(dr.transfer_in_female,0) + COALESCE(dr.received_female,0)
             - COALESCE(dr.mortality_female,0) - COALESCE(dr.cull_female,0)
             - COALESCE(dr.transfer_female,0)) <> COALESCE(dr.closing_female,0)
        AND (COALESCE(dr.opening_female,0) + COALESCE(dr.transfer_in_female,0)
             - COALESCE(dr.mortality_female,0) - COALESCE(dr.cull_female,0)
             - COALESCE(dr.transfer_female,0)) <> COALESCE(dr.closing_female,0)
      ORDER BY dr.record_date DESC LIMIT 20) x;

  INSERT INTO public.health_check_results (run_at, check_key, title, module, severity, failed_count, detail, what_it_means)
  VALUES (p_run, 'birds_dont_balance', 'Days where the bird count does not add up', 'Flocks', 'critical', v_count, v_detail,
          'Opening plus birds moved in or received, less deaths, culls and birds moved out, does not equal closing — one of those figures is wrong.');
  RETURN v_count;
END;
$$;

SELECT public.fn_run_health_checks();

SELECT check_key, failed_count, left(detail,600) AS detail FROM public.health_check_results
WHERE check_key='birds_dont_balance' AND run_at = (SELECT max(run_at) FROM public.health_check_results);
