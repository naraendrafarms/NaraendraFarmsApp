-- Migration 834 (READ ONLY): verify the 761-row Flock 19 import that just went
-- in across migrations 833_1-833_6.

SELECT 'total_imported' AS chk, count(*)::int AS n
  FROM public.daily_records d
  JOIN public.flocks f ON f.id = d.flock_id
 WHERE f.flock_no::text = '19' AND d.record_date < '2025-06-23';

-- Any row where the trigger's own closing formula doesn't match what got stored
-- (should be impossible since the trigger computes it, but confirms the trigger
-- actually fired and wasn't bypassed).
SELECT 'formula_mismatches' AS chk, count(*)::int AS n
  FROM public.daily_records d
  JOIN public.flocks f ON f.id = d.flock_id
 WHERE f.flock_no::text = '19' AND d.record_date < '2025-06-23'
   AND d.closing_female <> GREATEST(0, COALESCE(d.opening_female,0) + COALESCE(d.transfer_in_female,0)
       - COALESCE(d.mortality_female,0) - COALESCE(d.cull_female,0) - COALESCE(d.transfer_female,0));

-- Continuity check: for each shed, does opening always equal the prior row's
-- closing (across the WHOLE flock now, including the pre-existing 23/06+ data)?
WITH chained AS (
  SELECT d.id, d.shed_id, d.record_date, d.opening_female,
         LAG(d.closing_female) OVER (PARTITION BY d.shed_id ORDER BY d.record_date, d.id) AS prev_close
    FROM public.daily_records d
    JOIN public.flocks f ON f.id = d.flock_id
   WHERE f.flock_no::text = '19'
)
SELECT 'continuity_breaks' AS chk, count(*)::int AS n
  FROM chained WHERE prev_close IS NOT NULL AND opening_female <> prev_close;

-- Does the last imported row per shed (just before 23/06) actually connect
-- into what was already live from 23/06 onward?
SELECT 'boundary_check' AS chk,
       string_agg(t, ' | ' ORDER BY t) AS rows
  FROM (
    SELECT (s.shed_no || ' last_import_close=' || COALESCE(prev.closing_female,'?')
            || ' first_live_open=' || COALESCE(nxt.opening_female,'?')
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
