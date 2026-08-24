-- Migration 855 (READ ONLY): final full verification after the double-credit fix.
SELECT 'f19_formula_mismatches_final' AS chk, count(*)::int AS n
  FROM public.daily_records d
  JOIN public.flocks f ON f.id = d.flock_id
 WHERE f.flock_no::text = '19'
   AND d.closing_female <> GREATEST(0, COALESCE(d.opening_female,0) + COALESCE(d.transfer_in_female,0)
       - COALESCE(d.mortality_female,0) - COALESCE(d.cull_female,0) - COALESCE(d.transfer_female,0))
   OR d.closing_male <> GREATEST(0, COALESCE(d.opening_male,0) + COALESCE(d.transfer_in_male,0)
       - COALESCE(d.mortality_male,0) - COALESCE(d.cull_male,0) - COALESCE(d.transfer_male,0));

-- Boundary check: does the last Kethireddypally/imported row per shed still
-- tie in exactly to the already-live 23/06/2025+ Agraharam Potlapally data?
SELECT 'f19_boundary_after_fix' AS chk,
       string_agg(t, ' | ' ORDER BY t) AS rows
  FROM (
    SELECT (s.shed_no || ' last_import_close=' || prev.closing_female::text
            || ' first_live_open=' || nxt.opening_female::text
            || CASE WHEN prev.closing_female = nxt.opening_female THEN ' OK' ELSE ' MISMATCH' END) AS t
      FROM public.sheds s
      JOIN LATERAL (
        SELECT d.closing_female FROM public.daily_records d
        JOIN public.flocks f ON f.id = d.flock_id
        WHERE f.flock_no::text='19' AND d.shed_id = s.id AND d.record_date < '2025-06-23'
        ORDER BY d.record_date DESC LIMIT 1
      ) prev ON true
      JOIN LATERAL (
        SELECT d.opening_female FROM public.daily_records d
        JOIN public.flocks f ON f.id = d.flock_id
        WHERE f.flock_no::text='19' AND d.shed_id = s.id AND d.record_date >= '2025-06-23'
        ORDER BY d.record_date ASC LIMIT 1
      ) nxt ON true
  ) x;
