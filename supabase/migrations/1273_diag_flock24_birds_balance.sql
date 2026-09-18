-- READ ONLY. Flock 24's birds line on Daily Summary for 17/09/2026 reads
-- Op 12799 | Mort 03 | Recv 4760 | C/s 00 | Close 12186, which does not
-- balance: 12799 + 4760 - 3 = 17556, not 12186. Short by 5370.
--
-- The block sums the shed rows, so look at each row as stored.
SELECT 1 AS warmup;

SELECT COALESCE(s.shed_no::text, 'NO SHED') AS shed,
       COALESCE(d.opening_female,-1)   AS open_f,
       COALESCE(d.received_female,-1)  AS recd_f,
       COALESCE(d.transfer_female,-1)  AS transf_f,
       COALESCE(d.cull_female,-1)      AS cull_f,
       COALESCE(d.mortality_female,-1) AS death_f,
       COALESCE(d.closing_female,-1)   AS close_f,
       COALESCE(d.trcull_female,-1)    AS trcull_f,
       (COALESCE(d.opening_female,0) + COALESCE(d.received_female,0)
        - COALESCE(d.transfer_female,0) - COALESCE(d.cull_female,0)
        - COALESCE(d.mortality_female,0)) AS should_close
FROM public.vhl_daily_entry d
LEFT JOIN public.sheds s ON s.id = d.shed_id
JOIN public.flocks f ON f.id = d.flock_id
WHERE f.flock_no::text = '24' AND d.record_date = DATE '2026-09-17'
ORDER BY shed;

-- The sums the report would draw, and whether they balance.
SELECT count(*)::int AS rows_that_day,
       count(*) FILTER (WHERE d.shed_id IS NULL)::int AS rows_with_no_shed,
       sum(COALESCE(d.opening_female,0))::int   AS sum_open_f,
       sum(COALESCE(d.received_female,0))::int  AS sum_recd_f,
       sum(COALESCE(d.transfer_female,0))::int  AS sum_transfer_f,
       sum(COALESCE(d.cull_female,0))::int      AS sum_cull_f,
       sum(COALESCE(d.mortality_female,0))::int AS sum_death_f,
       sum(COALESCE(d.closing_female,0))::int   AS sum_close_f,
       (sum(COALESCE(d.opening_female,0)) + sum(COALESCE(d.received_female,0))
        - sum(COALESCE(d.transfer_female,0)) - sum(COALESCE(d.cull_female,0))
        - sum(COALESCE(d.mortality_female,0)) - sum(COALESCE(d.closing_female,0)))::int
         AS open_plus_recd_less_out_less_close
FROM public.vhl_daily_entry d
JOIN public.flocks f ON f.id = d.flock_id
WHERE f.flock_no::text = '24' AND d.record_date = DATE '2026-09-17';

-- Every Flock 24 day, to see whether 17/09 is the only one out.
SELECT d.record_date::text AS the_date,
       count(*)::int AS rows,
       sum(COALESCE(d.opening_female,0))::int AS open_f,
       sum(COALESCE(d.received_female,0))::int AS recd_f,
       sum(COALESCE(d.closing_female,0))::int AS close_f,
       (sum(COALESCE(d.opening_female,0)) + sum(COALESCE(d.received_female,0))
        - sum(COALESCE(d.transfer_female,0)) - sum(COALESCE(d.cull_female,0))
        - sum(COALESCE(d.mortality_female,0)) - sum(COALESCE(d.closing_female,0)))::int AS out_by
FROM public.vhl_daily_entry d
JOIN public.flocks f ON f.id = d.flock_id
WHERE f.flock_no::text = '24'
GROUP BY d.record_date ORDER BY d.record_date;
