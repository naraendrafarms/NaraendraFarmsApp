-- READ ONLY. Confirm the 14/09/2026 correction you entered on screen actually
-- landed, and that the two days now reconcile: 13/09 closes 1600, 14/09 opens
-- on that and closes 3200 after its own 1600 received.
SELECT 1 AS warmup;

SELECT d.record_date::text            AS the_date,
       COALESCE(s.shed_no::text,'NO SHED') AS shed,
       COALESCE(d.opening_female,-1)  AS open_f,
       COALESCE(d.received_female,-1) AS recd_f,
       COALESCE(d.closing_female,-1)  AS close_f,
       COALESCE(d.opening_male,-1)    AS open_m,
       COALESCE(d.received_male,-1)   AS recd_m,
       COALESCE(d.closing_male,-1)    AS close_m,
       d.updated_at::text             AS updated_at
FROM public.vhl_daily_entry d
LEFT JOIN public.sheds s ON s.id = d.shed_id
JOIN public.flocks f ON f.id = d.flock_id
WHERE f.flock_no::text = '24'
ORDER BY d.record_date;

-- Does each day's closing equal opening + received - transfer - cull - death?
-- A row that fails this is arithmetic that will not add up in any report.
SELECT count(*)::int AS shed_rows,
       count(*) FILTER (WHERE COALESCE(d.closing_female,0) <> GREATEST(0,
           COALESCE(d.opening_female,0) + COALESCE(d.received_female,0)
         - COALESCE(d.transfer_female,0) - COALESCE(d.cull_female,0)
         - COALESCE(d.mortality_female,0)))::int AS female_rows_not_balancing,
       sum(COALESCE(d.received_female,0))::int AS total_received_f,
       max(COALESCE(d.closing_female,0))::int  AS latest_closing_f
FROM public.vhl_daily_entry d
JOIN public.flocks f ON f.id = d.flock_id
WHERE f.flock_no::text = '24' AND d.shed_id IS NOT NULL;
