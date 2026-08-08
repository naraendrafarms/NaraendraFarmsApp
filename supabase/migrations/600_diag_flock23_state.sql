-- Diagnostic only (no schema changes).
-- Flock 23's bird counts are reported as still wrong. Show exactly what is
-- stored, so the failing step is identified rather than guessed at.

SELECT COALESCE(string_agg(
         d.record_date::text || ' shed=' || COALESCE(s.shed_no,'(flock)') ||
         ' openF=' || COALESCE(d.opening_female::text,'-') ||
         ' openM=' || COALESCE(d.opening_male::text,'-') ||
         ' mortF=' || COALESCE(d.mortality_female,0) ||
         ' closeF=' || COALESCE(d.closing_female::text,'-') ||
         ' closeM=' || COALESCE(d.closing_male::text,'-'),
         ' | ' ORDER BY d.record_date, s.shed_no), 'NO ROWS') AS flock23_daily
FROM public.daily_records d
LEFT JOIN public.sheds s ON s.id = d.shed_id
JOIN public.flocks f ON f.id = d.flock_id
WHERE f.flock_no = '23';

-- Placements, for comparison with what the daily rows should total.
SELECT COALESCE(string_agg(
         sa.allocated_date::text || ' shed=' || COALESCE(s.shed_no,'-') ||
         ' f=' || sa.female_count || ' m=' || sa.male_count,
         ' | ' ORDER BY sa.allocated_date, s.shed_no), 'NONE') AS placements
FROM public.shed_allocations sa
LEFT JOIN public.sheds s ON s.id = sa.shed_id
JOIN public.flocks f ON f.id = sa.flock_id
WHERE f.flock_no = '23';

-- The flock header: placement date and the placed totals every report falls
-- back to when no daily record exists.
SELECT flock_no, placement_date::text AS placement_date, status,
       total_placed_f, total_placed_m, laying_season
FROM public.flocks WHERE flock_no = '23';

-- What the app will show as current birds, per v_flock_summary.
SELECT COALESCE(string_agg(k || '=' || v, ', '), 'VIEW MISSING') AS summary
FROM (
  SELECT 'current_female' AS k, COALESCE(current_female,0)::text AS v FROM public.v_flock_summary WHERE flock_no = '23'
  UNION ALL
  SELECT 'current_male', COALESCE(current_male,0)::text FROM public.v_flock_summary WHERE flock_no = '23'
) x;
