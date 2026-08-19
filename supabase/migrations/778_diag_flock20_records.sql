-- Migration 778 (READ ONLY): the Flock 20 line was cut off in the last log.
-- Exactly what Flock 20 already holds, and how many birds each flock still
-- has, so nothing gets imported twice and the shed space at Agraharam
-- Potlapally can be judged honestly.

SELECT 'f20' AS chk,
       (SELECT count(*) FROM public.daily_records d JOIN public.flocks f ON f.id = d.flock_id
         WHERE f.flock_no::text = '20') AS rows_total,
       (SELECT count(*) FROM public.daily_records d JOIN public.flocks f ON f.id = d.flock_id
         WHERE f.flock_no::text = '20' AND d.shed_id IS NULL) AS rows_without_shed,
       (SELECT min(d.record_date)::text FROM public.daily_records d JOIN public.flocks f ON f.id = d.flock_id
         WHERE f.flock_no::text = '20') AS first_date,
       (SELECT max(d.record_date)::text FROM public.daily_records d JOIN public.flocks f ON f.id = d.flock_id
         WHERE f.flock_no::text = '20') AS last_date,
       (SELECT string_agg(t, ' | ' ORDER BY t) FROM (
          SELECT to_char(d.record_date, 'YYYY-MM') || ' rows=' || count(*)
                 || ' eggs=' || COALESCE(sum(d.total_eggs), 0) AS t
            FROM public.daily_records d JOIN public.flocks f ON f.id = d.flock_id
           WHERE f.flock_no::text = '20'
           GROUP BY to_char(d.record_date, 'YYYY-MM')
       ) x) AS f20_by_month;

SELECT 'birds_now' AS chk,
       (SELECT string_agg(t, ' | ' ORDER BY t) FROM (
          SELECT 'F' || flock_no || ' ' || COALESCE(current_female, 0) || 'f/'
                 || COALESCE(current_male, 0) || 'm' AS t
            FROM public.v_flock_summary
           WHERE flock_no::text IN ('19','20')
       ) x) AS current_birds;
