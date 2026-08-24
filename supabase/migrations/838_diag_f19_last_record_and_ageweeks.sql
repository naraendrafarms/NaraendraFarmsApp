-- Migration 838 (READ ONLY): find the real MAX(record_date) for Flock 19 now
-- (837's window 06-25 to 07-10 found nothing), and how widespread the missing
-- age_weeks is (needed for the Actual vs Standard body-weight chart).

SELECT 'f19_max_date_rows' AS chk,
       string_agg(t, ' | ' ORDER BY t) AS rows
  FROM (
    SELECT (d.record_date::text || ' sh' || COALESCE(s.shed_no,'none')
            || ' close_f=' || COALESCE(d.closing_female,0)
            || ' close_m=' || COALESCE(d.closing_male,0)) AS t
      FROM public.daily_records d
      JOIN public.flocks f ON f.id = d.flock_id
      LEFT JOIN public.sheds s ON s.id = d.shed_id
     WHERE f.flock_no::text = '19'
       AND d.record_date = (SELECT MAX(record_date) FROM public.daily_records dd
                             JOIN public.flocks ff ON ff.id = dd.flock_id
                             WHERE ff.flock_no::text = '19')
  ) x;

SELECT 'f19_age_weeks_stats' AS chk,
       count(*)::int AS total_rows,
       count(age_weeks)::int AS rows_with_age_weeks,
       min(record_date)::text AS earliest,
       max(record_date)::text AS latest
  FROM public.daily_records d
  JOIN public.flocks f ON f.id = d.flock_id
 WHERE f.flock_no::text = '19';

-- Most recent 15 rows regardless of date range, to see the real tail of the flock's history.
SELECT 'f19_true_tail' AS chk,
       string_agg(t, ' | ' ORDER BY t) AS rows
  FROM (
    SELECT (d.record_date::text || ' sh' || COALESCE(s.shed_no,'none')
            || ' close_f=' || COALESCE(d.closing_female,0)
            || ' age_wk=' || COALESCE(d.age_weeks::text,'null')) AS t
      FROM public.daily_records d
      JOIN public.flocks f ON f.id = d.flock_id
      LEFT JOIN public.sheds s ON s.id = d.shed_id
     WHERE f.flock_no::text = '19'
     ORDER BY d.record_date DESC LIMIT 15
  ) x;
