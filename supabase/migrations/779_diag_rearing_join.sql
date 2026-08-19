-- Migration 779 (READ ONLY): before importing the rearing life of Flocks 19
-- and 20, find out whether total_placed is the CHICK count or the count that
-- arrived at the laying farm. If it is the chick count, the existing laying
-- records already start lower and the rearing import will join up. If the two
-- are the same number, importing brooding mortality would make the flock lose
-- birds twice.

SELECT 'join_check' AS chk,
       (SELECT string_agg(t, ' | ' ORDER BY t) FROM (
          SELECT 'F' || f.flock_no
                 || ' placed ' || COALESCE(f.total_placed_f,0) || 'f'
                 || ' | first record ' || min(d.record_date)::text
                 || ' opening ' || COALESCE(sum(d.opening_female) FILTER (WHERE d.record_date = fd.first_date), 0) || 'f'
                 || ' received ' || COALESCE(sum(d.received_female) FILTER (WHERE d.record_date = fd.first_date), 0) || 'f' AS t
            FROM public.flocks f
            JOIN public.daily_records d ON d.flock_id = f.id
            JOIN LATERAL (
              SELECT min(d2.record_date) AS first_date
                FROM public.daily_records d2 WHERE d2.flock_id = f.id
            ) fd ON TRUE
           WHERE f.flock_no::text IN ('19','20')
           GROUP BY f.flock_no, f.total_placed_f, fd.first_date
       ) x) AS placed_vs_first,
       (SELECT string_agg(t, ' | ' ORDER BY t) FROM (
          SELECT 'F' || f.flock_no || ' @' || COALESCE(fa.name, '(no farm)')
                 || ' rows=' || count(*)
                 || ' ' || min(d.record_date)::text || '..' || max(d.record_date)::text AS t
            FROM public.daily_records d
            JOIN public.flocks f ON f.id = d.flock_id
            LEFT JOIN public.farms fa ON fa.id = d.farm_id
           WHERE f.flock_no::text IN ('19','20')
           GROUP BY f.flock_no, fa.name
       ) y) AS records_by_farm;

-- Are the Kethireddypally sheds typed as brooding / grower, so a rearing
-- import lands somewhere sensible?
SELECT 'kpally' AS chk,
       (SELECT string_agg(t, ' | ' ORDER BY t) FROM (
          SELECT 'shed ' || s.shed_no || ' ' || COALESCE(s.shed_type,'?')
                 || ' cap ' || COALESCE(s.capacity_female,0) || 'f' AS t
            FROM public.sheds s JOIN public.farms fa ON fa.id = s.farm_id
           WHERE fa.name ILIKE 'Kethireddypally%'
       ) x) AS kpally_sheds,
       (SELECT count(*) FROM public.flock_transfers) AS transfers_recorded;
