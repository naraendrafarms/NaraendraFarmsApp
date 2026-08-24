-- Migration 825 (READ ONLY): what does the app actually hold for Flock 19,
-- Agraharam Potlapally, 01-Jun-2026 to 13-Jun-2026 -- checking the user's
-- claim that data already exists there, against the earlier "missing"
-- finding (checked 03-14 Jun 2026 only, existence-of-row, not shown content).

SELECT 'row_count_by_date' AS chk,
       string_agg(t, ' | ' ORDER BY t) AS rows
  FROM (
    SELECT d.record_date::text || ': ' || count(*) || ' rows, sheds=' ||
           string_agg(DISTINCT s.shed_no, ',' ORDER BY s.shed_no) AS t
      FROM public.daily_records d
      JOIN public.flocks f ON f.id = d.flock_id
      JOIN public.sheds s ON s.id = d.shed_id
      JOIN public.farms fa ON fa.id = s.farm_id
     WHERE f.flock_no::text = '19' AND fa.name = 'Agraharam Potlapally'
       AND d.record_date BETWEEN '2026-06-01' AND '2026-06-13'
     GROUP BY d.record_date
  ) x;

SELECT 'sample_values' AS chk,
       string_agg(t, ' | ' ORDER BY t) AS rows
  FROM (
    SELECT d.record_date::text || ' sh' || s.shed_no
           || ' open=' || COALESCE(d.opening_female,0) || ' close=' || COALESCE(d.closing_female,0)
           || ' eggs=' || COALESCE(d.total_eggs,0) AS t
      FROM public.daily_records d
      JOIN public.flocks f ON f.id = d.flock_id
      JOIN public.sheds s ON s.id = d.shed_id
      JOIN public.farms fa ON fa.id = s.farm_id
     WHERE f.flock_no::text = '19' AND fa.name = 'Agraharam Potlapally'
       AND d.record_date BETWEEN '2026-06-01' AND '2026-06-05'
     ORDER BY d.record_date, s.shed_no
  ) x;
