-- Migration 775 (READ ONLY): what the app already holds for Flock 20 and
-- Flock 19, and what sheds exist at each site. Nothing is changed. This is
-- the ground truth before planning how Flock 20 data goes in.

SELECT 'flocks' AS chk,
       (SELECT string_agg(t, ' | ' ORDER BY t) FROM (
          SELECT 'F' || f.flock_no || ' ' || COALESCE(f.status,'?')
                 || ' placed ' || COALESCE(f.total_placed_f,0) || 'f/' || COALESCE(f.total_placed_m,0) || 'm'
                 || ' rear=' || COALESCE(rf.name,'-') || ' lay=' || COALESCE(lf.name,'-') AS t
            FROM public.flocks f
            LEFT JOIN public.farms rf ON rf.id = f.rearing_farm_id
            LEFT JOIN public.farms lf ON lf.id = f.laying_farm_id
           WHERE f.flock_no IN (19, 20)
       ) x) AS flock_lines,
       (SELECT string_agg(t, ' | ' ORDER BY t) FROM (
          SELECT 'F' || f.flock_no || ' shed ' || s.shed_no || ' @' || COALESCE(fa.name,'?')
                 || ' ' || a.female_count || 'f/' || a.male_count || 'm from ' || a.allocated_date AS t
            FROM public.shed_allocations a
            JOIN public.flocks f ON f.id = a.flock_id
            JOIN public.sheds s ON s.id = a.shed_id
            LEFT JOIN public.farms fa ON fa.id = s.farm_id
           WHERE f.flock_no IN (19, 20)
       ) y) AS allocations,
       (SELECT string_agg(t, ' | ' ORDER BY t) FROM (
          SELECT 'F' || f.flock_no || ' shed ' || COALESCE(s.shed_no,'(none)')
                 || ' rows=' || count(*) || ' ' || min(d.record_date) || '..' || max(d.record_date) AS t
            FROM public.daily_records d
            JOIN public.flocks f ON f.id = d.flock_id
            LEFT JOIN public.sheds s ON s.id = d.shed_id
           WHERE f.flock_no IN (19, 20)
           GROUP BY f.flock_no, s.shed_no
       ) z) AS daily_rows;

SELECT 'sites' AS chk,
       (SELECT string_agg(t, ' | ' ORDER BY t) FROM (
          SELECT fa.name || ': ' || count(s.id) || ' sheds ('
                 || COALESCE(string_agg(s.shed_no, ',' ORDER BY s.shed_no), '-') || ')' AS t
            FROM public.farms fa
            LEFT JOIN public.sheds s ON s.farm_id = fa.id
           GROUP BY fa.name
       ) x) AS site_sheds;
