-- Migration 847 (READ ONLY): Flock 20's current real app data range/sheds, to
-- find the gap before comparing against the uploaded Flock_20.xlsx (same
-- approach as Flock 19).
SELECT 'f20_flock_id' AS chk, id::text, placement_date::text, status
  FROM public.flocks WHERE flock_no::text='20';

SELECT 'f20_sheds_used' AS chk,
       (SELECT string_agg(t, ' | ' ORDER BY t) FROM (
          SELECT DISTINCT fa.name || ' shed ' || s.shed_no
                 || ' (rows ' || cnt::text || ', ' || min_d::text || '..' || max_d::text || ')' AS t
            FROM (
              SELECT d.shed_id, count(*) AS cnt, min(d.record_date) AS min_d, max(d.record_date) AS max_d
                FROM public.daily_records d
                JOIN public.flocks f ON f.id = d.flock_id
               WHERE f.flock_no::text = '20'
               GROUP BY d.shed_id
            ) x
            LEFT JOIN public.sheds s ON s.id = x.shed_id
            LEFT JOIN public.farms fa ON fa.id = s.farm_id
       ) y) AS rows;

SELECT 'f20_all_sheds_by_site' AS chk,
       (SELECT string_agg(t, ' | ' ORDER BY t) FROM (
          SELECT fa.name || ': ' || string_agg(s.shed_no, ',' ORDER BY s.shed_no::int) AS t
            FROM public.sheds s JOIN public.farms fa ON fa.id = s.farm_id
           WHERE fa.name ILIKE 'Kethireddypally%' OR fa.name ILIKE 'Bodjanampet%'
           GROUP BY fa.name
       ) x) AS site_sheds;

SELECT 'f20_transfers' AS chk,
       (SELECT string_agg(t, ' | ' ORDER BY t) FROM (
          SELECT ft.transfer_date::text
                 || ' ' || COALESCE(fromf.name,'?') || '/sh' || COALESCE(sf.shed_no,'-')
                 || ' -> ' || COALESCE(tof.name,'?') || '/sh' || COALESCE(st.shed_no,'-')
                 || ' f=' || COALESCE(ft.female_count,0) || ' m=' || COALESCE(ft.male_count,0) AS t
            FROM public.flock_transfers ft
            JOIN public.flocks f ON f.id = ft.flock_id
            LEFT JOIN public.sheds sf ON sf.id = ft.from_shed_id
            LEFT JOIN public.sheds st ON st.id = ft.to_shed_id
            LEFT JOIN public.farms fromf ON fromf.id = ft.from_farm_id
            LEFT JOIN public.farms tof ON tof.id = ft.to_farm_id
           WHERE f.flock_no::text = '20'
           ORDER BY ft.transfer_date
       ) x) AS rows;
