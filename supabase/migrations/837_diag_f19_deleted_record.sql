-- Migration 837 (READ ONLY): investigate what deleting Flock 19's 03/07/2026
-- daily_records row did to the flock's "alive birds" figure, and why body
-- weight Actual vs Standard shows nothing.

-- 1. Does a 03/07/2026 row exist now? (should be gone if deleted)
SELECT 'f19_0307_row' AS chk, count(*)::int AS n
  FROM public.daily_records d
  JOIN public.flocks f ON f.id = d.flock_id
 WHERE f.flock_no::text = '19' AND d.record_date = '2026-07-03';

-- 2. Last several rows of Flock 19's history now, per shed, around that date.
SELECT 'f19_recent_rows' AS chk,
       string_agg(t, ' | ' ORDER BY t) AS rows
  FROM (
    SELECT (d.record_date::text || ' sh' || COALESCE(s.shed_no,'none')
            || ' open_f=' || COALESCE(d.opening_female,0)
            || ' close_f=' || COALESCE(d.closing_female,0)
            || ' cull_f=' || COALESCE(d.cull_female,0)
            || ' mort_f=' || COALESCE(d.mortality_female,0)) AS t
      FROM public.daily_records d
      JOIN public.flocks f ON f.id = d.flock_id
      LEFT JOIN public.sheds s ON s.id = d.shed_id
     WHERE f.flock_no::text = '19' AND d.record_date BETWEEN '2026-06-25' AND '2026-07-10'
     ORDER BY d.record_date, s.shed_no
  ) x;

-- 3. What v_flock_summary (the view driving "alive birds") shows for Flock 19 now.
SELECT 'f19_summary' AS chk, to_jsonb(v) AS row
  FROM public.v_flock_summary v
  JOIN public.flocks f ON f.id = v.id
 WHERE f.flock_no::text = '19';

-- 4. Flock 19's own placement/status columns (used as fallback in the summary formula).
SELECT 'f19_flock_row' AS chk,
       flock_no::text, status, placement_date::text,
       total_placed_f, total_placed_m
  FROM public.flocks WHERE flock_no::text = '19';

-- 5. Does Flock 19 have any age_weeks / feed data on its most recent rows (used by
-- the body-weight Actual-vs-Standard chart)?
SELECT 'f19_recent_weight_inputs' AS chk,
       string_agg(t, ' | ' ORDER BY t) AS rows
  FROM (
    SELECT (d.record_date::text
            || ' age_wk=' || COALESCE(d.age_weeks::text,'null')
            || ' feed_f_kg=' || COALESCE(d.feed_female_kg::text,'null')) AS t
      FROM public.daily_records d
      JOIN public.flocks f ON f.id = d.flock_id
     WHERE f.flock_no::text = '19'
     ORDER BY d.record_date DESC LIMIT 10
  ) x;

-- 6. Flock 19's breed (used to look up the standard curve).
SELECT 'f19_breed_info' AS chk, breed FROM public.flocks WHERE flock_no::text='19';
