-- Migration 777 (READ ONLY): migration 775 statement 1 silently failed because
-- flocks.flock_no is TEXT and it was compared against the numbers 19 and 20.
-- The runner treats "operator does not exist" as success, so it printed
-- nothing at all. Same questions, compared as text.

SELECT 'flocks' AS chk,
       (SELECT string_agg(t, ' | ' ORDER BY t) FROM (
          SELECT 'F' || f.flock_no || ' ' || COALESCE(f.status,'?')
                 || ' placed ' || COALESCE(f.total_placed_f,0) || 'f/' || COALESCE(f.total_placed_m,0) || 'm'
                 || ' on ' || COALESCE(f.placement_date::text,'-')
                 || ' rear=' || COALESCE(rf.name,'-') || ' lay=' || COALESCE(lf.name,'-') AS t
            FROM public.flocks f
            LEFT JOIN public.farms rf ON rf.id = f.rearing_farm_id
            LEFT JOIN public.farms lf ON lf.id = f.laying_farm_id
           WHERE f.flock_no::text IN ('19','20')
       ) x) AS flock_lines,
       (SELECT string_agg(t, ' | ' ORDER BY t) FROM (
          SELECT 'F' || f.flock_no || ' shed ' || s.shed_no || ' @' || COALESCE(fa.name,'?')
                 || ' ' || a.female_count || 'f/' || a.male_count || 'm from ' || a.allocated_date AS t
            FROM public.shed_allocations a
            JOIN public.flocks f ON f.id = a.flock_id
            JOIN public.sheds s ON s.id = a.shed_id
            LEFT JOIN public.farms fa ON fa.id = s.farm_id
           WHERE f.flock_no::text IN ('19','20')
       ) y) AS allocations,
       (SELECT string_agg(t, ' | ' ORDER BY t) FROM (
          SELECT 'F' || f.flock_no || ' ' || COALESCE(fa.name,'?') || ' shed ' || COALESCE(s.shed_no,'(none)')
                 || ' rows=' || count(*) || ' ' || min(d.record_date) || '..' || max(d.record_date) AS t
            FROM public.daily_records d
            JOIN public.flocks f ON f.id = d.flock_id
            LEFT JOIN public.sheds s ON s.id = d.shed_id
            LEFT JOIN public.farms fa ON fa.id = s.farm_id
           WHERE f.flock_no::text IN ('19','20')
           GROUP BY f.flock_no, fa.name, s.shed_no
       ) z) AS daily_rows;

-- Who is sitting in the four Agraharam Potlapally sheds, by the records
-- themselves rather than by allocation.
SELECT 'app_sheds' AS chk,
       (SELECT string_agg(t, ' | ' ORDER BY t) FROM (
          SELECT 'shed ' || s.shed_no || ': F' || f.flock_no
                 || ' rows=' || count(*) || ' ' || min(d.record_date) || '..' || max(d.record_date) AS t
            FROM public.daily_records d
            JOIN public.sheds s ON s.id = d.shed_id
            JOIN public.farms fa ON fa.id = s.farm_id
            JOIN public.flocks f ON f.id = d.flock_id
           WHERE fa.name ILIKE 'Agraharam%'
           GROUP BY s.shed_no, f.flock_no
       ) x) AS by_shed,
       (SELECT string_agg(t, ' | ' ORDER BY t) FROM (
          SELECT 'shed ' || s.shed_no || ' cap ' || COALESCE(s.capacity_female,0) || 'f/'
                 || COALESCE(s.capacity_male,0) || 'm' AS t
            FROM public.sheds s
            JOIN public.farms fa ON fa.id = s.farm_id
           WHERE fa.name ILIKE 'Agraharam%'
       ) y) AS capacities;
