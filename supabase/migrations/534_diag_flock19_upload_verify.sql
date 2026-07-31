-- Diagnostic only (no schema changes) — user says uploaded data doesn't
-- match the source Excel for Flock 19. Comparing what actually got saved
-- against known source values for the very first date (2025-06-23) across
-- all 4 sheds, plus overall row counts for the whole import window.
SELECT s.shed_no, dr.record_date, dr.opening_female, dr.opening_male,
  dr.feed_female_kg, dr.feed_type_f, dr.feed_male_kg, dr.feed_type_m,
  dr.mortality_female, dr.mortality_male, dr.closing_female, dr.closing_male,
  dr.he_eggs, dr.total_eggs
FROM public.daily_records dr
JOIN public.sheds s ON s.id = dr.shed_id
WHERE dr.flock_id = (SELECT id FROM public.flocks WHERE flock_no = '19')
  AND dr.record_date = '2025-06-23'
ORDER BY s.shed_no;

SELECT count(*) AS total_rows_in_window,
  count(DISTINCT record_date) AS distinct_dates,
  min(record_date) AS earliest, max(record_date) AS latest
FROM public.daily_records
WHERE flock_id = (SELECT id FROM public.flocks WHERE flock_no = '19')
  AND record_date >= '2025-06-23' AND record_date <= '2026-06-02';

SELECT 'sentinel' AS marker, 1 AS n;
