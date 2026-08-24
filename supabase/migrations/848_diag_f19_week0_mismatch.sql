-- Migration 848 (READ ONLY): Flock 19 Week 0 (16-22 Feb 2025) real daily_records,
-- per shed, to find why the Weekly tab shows Close=45,512 for that week.
SELECT 'f19_week0_rows' AS chk,
       string_agg(t, ' | ' ORDER BY t) AS rows
  FROM (
    SELECT (d.record_date::text || ' sh' || s.shed_no
            || ' open_f=' || COALESCE(d.opening_female,0)
            || ' transfer_in_f=' || COALESCE(d.transfer_in_female,0)
            || ' transfer_f=' || COALESCE(d.transfer_female,0)
            || ' cull_f=' || COALESCE(d.cull_female,0)
            || ' mort_f=' || COALESCE(d.mortality_female,0)
            || ' close_f=' || COALESCE(d.closing_female,0)) AS t
      FROM public.daily_records d
      JOIN public.flocks f ON f.id = d.flock_id
      JOIN public.sheds s ON s.id = d.shed_id
     WHERE f.flock_no::text = '19' AND d.record_date BETWEEN '2025-02-16' AND '2025-02-22'
     ORDER BY d.record_date, s.shed_no
  ) x;

-- Sum of real DB closing_female across all sheds, per date in that window.
SELECT 'f19_week0_daily_totals' AS chk,
       string_agg(t, ' | ' ORDER BY t) AS rows
  FROM (
    SELECT (d.record_date::text
            || ' sum_open_f=' || SUM(COALESCE(d.opening_female,0))
            || ' sum_close_f=' || SUM(COALESCE(d.closing_female,0))
            || ' sum_transfer_in_f=' || SUM(COALESCE(d.transfer_in_female,0))) AS t
      FROM public.daily_records d
      JOIN public.flocks f ON f.id = d.flock_id
     WHERE f.flock_no::text = '19' AND d.record_date BETWEEN '2025-02-16' AND '2025-02-22'
     GROUP BY d.record_date
  ) x;
