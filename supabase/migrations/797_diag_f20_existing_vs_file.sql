-- Migration 797 (READ ONLY): before any Flock 20 import, list exactly what the
-- app already holds day by day and shed by shed. The uploaded workbook covers
-- 30-May-2025 to 26-Dec-2025 and the farm has warned that some of it is
-- already entered -- so the overlap has to be named, not estimated.

SELECT 'f20_by_month' AS chk,
       (SELECT string_agg(t, ' | ' ORDER BY t) FROM (
          SELECT to_char(d.record_date, 'YYYY-MM') || ' rows=' || count(*)
                 || ' days=' || count(DISTINCT d.record_date)
                 || ' sheds=' || count(DISTINCT d.shed_id)
                 || ' noshed=' || count(*) FILTER (WHERE d.shed_id IS NULL) AS t
            FROM public.daily_records d
            JOIN public.flocks f ON f.id = d.flock_id
           WHERE f.flock_no::text = '20'
           GROUP BY to_char(d.record_date, 'YYYY-MM')
       ) x) AS months;

-- Every existing row inside the workbook's date range, with its shed and site,
-- so a clash can be pointed at rather than guessed.
SELECT 'in_range' AS chk,
       (SELECT count(*) FROM public.daily_records d JOIN public.flocks f ON f.id = d.flock_id
         WHERE f.flock_no::text = '20'
           AND d.record_date BETWEEN DATE '2025-05-30' AND DATE '2025-12-26') AS rows_in_range,
       (SELECT string_agg(t, ' | ' ORDER BY t) FROM (
          SELECT COALESCE(fa.name, '(no farm)') || ' shed ' || COALESCE(s.shed_no, '(none)')
                 || ': ' || count(*) || ' rows ' || min(d.record_date)::text || '..' || max(d.record_date)::text AS t
            FROM public.daily_records d
            JOIN public.flocks f ON f.id = d.flock_id
            LEFT JOIN public.sheds s ON s.id = d.shed_id
            LEFT JOIN public.farms fa ON fa.id = s.farm_id
           WHERE f.flock_no::text = '20'
             AND d.record_date BETWEEN DATE '2025-05-30' AND DATE '2025-12-26'
           GROUP BY fa.name, s.shed_no
       ) y) AS by_shed;

-- Which sheds exist at each of the three sites Flock 20 has used, since the
-- workbook names sheds by number alone and 1 exists at more than one site.
SELECT 'sheds' AS chk,
       (SELECT string_agg(t, ' | ' ORDER BY t) FROM (
          SELECT fa.name || ': ' || string_agg(s.shed_no, ',' ORDER BY s.shed_no) AS t
            FROM public.sheds s JOIN public.farms fa ON fa.id = s.farm_id
           WHERE fa.name ILIKE 'Kethireddypally%' OR fa.name ILIKE 'Bodjanampet - 1%'
              OR fa.name ILIKE 'Agraharam%'
           GROUP BY fa.name
       ) x) AS site_sheds;
