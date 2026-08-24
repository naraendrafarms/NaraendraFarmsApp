-- Migration 819 (READ ONLY): every shed Flock 19 has ever touched, and
-- which site each belongs to -- needed before comparing the uploaded
-- Flock_19.xlsx (which only has bare shed numbers, no site) against real
-- daily_records, since shed numbers repeat across sites (Kethireddypally,
-- Bodjanampet-1, Agraharam Potlapally).

SELECT 'f19_sheds_used' AS chk,
       (SELECT string_agg(t, ' | ' ORDER BY t) FROM (
          SELECT DISTINCT fa.name || ' shed ' || s.shed_no
                 || ' (rows ' || cnt::text || ', ' || min_d::text || '..' || max_d::text || ')' AS t
            FROM (
              SELECT d.shed_id, count(*) AS cnt, min(d.record_date) AS min_d, max(d.record_date) AS max_d
                FROM public.daily_records d
                JOIN public.flocks f ON f.id = d.flock_id
               WHERE f.flock_no::text = '19'
               GROUP BY d.shed_id
            ) x
            JOIN public.sheds s ON s.id = x.shed_id
            JOIN public.farms fa ON fa.id = s.farm_id
       ) y) AS rows;

SELECT 'all_sheds_by_site' AS chk,
       (SELECT string_agg(t, ' | ' ORDER BY t) FROM (
          SELECT fa.name || ': ' || string_agg(s.shed_no, ',' ORDER BY s.shed_no::int) AS t
            FROM public.sheds s JOIN public.farms fa ON fa.id = s.farm_id
           WHERE fa.name ILIKE 'Kethireddypally%' OR fa.name ILIKE 'Agraharam%' OR fa.name ILIKE 'Bodjanampet%'
           GROUP BY fa.name
       ) x) AS site_sheds;

SELECT 'f19_transfers' AS chk,
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
           WHERE f.flock_no::text = '19'
           ORDER BY ft.transfer_date
       ) x) AS rows;
