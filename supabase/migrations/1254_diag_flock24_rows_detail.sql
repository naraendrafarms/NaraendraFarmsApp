-- READ ONLY. 1253's detail statement named updated_at, which does not exist on
-- vhl_daily_entry - run_sql.py treats "does not exist" as success and prints
-- nothing, so that statement vanished silently. Same query without it.
-- Its balance check DID run: 4 shed rows, 0 failing the arithmetic,
-- 8000 received female in total. This shows where those 8000 sit.
SELECT 1 AS warmup;

SELECT d.record_date::text                 AS the_date,
       COALESCE(s.shed_no::text,'NO SHED') AS shed,
       COALESCE(d.opening_female,-1)       AS open_f,
       COALESCE(d.received_female,-1)      AS recd_f,
       COALESCE(d.closing_female,-1)       AS close_f,
       COALESCE(d.opening_male,-1)         AS open_m,
       COALESCE(d.received_male,-1)        AS recd_m,
       COALESCE(d.closing_male,-1)         AS close_m,
       d.created_at::text                  AS created_at
FROM public.vhl_daily_entry d
LEFT JOIN public.sheds s ON s.id = d.shed_id
JOIN public.flocks f ON f.id = d.flock_id
WHERE f.flock_no::text = '24'
ORDER BY d.record_date, shed;

-- Birds the flock holds on its LATEST recorded date, per shed and in total,
-- so the figure can be compared against what is physically on the farm.
SELECT sum(x.close_f)::int AS live_female_latest_date,
       sum(x.close_m)::int AS live_male_latest_date,
       max(x.the_date)::text AS latest_date,
       count(*)::int AS sheds_counted
FROM (
  SELECT DISTINCT ON (d.shed_id)
         d.shed_id, d.record_date AS the_date,
         COALESCE(d.closing_female,0) AS close_f,
         COALESCE(d.closing_male,0)   AS close_m
  FROM public.vhl_daily_entry d
  JOIN public.flocks f ON f.id = d.flock_id
  WHERE f.flock_no::text = '24' AND d.shed_id IS NOT NULL
  ORDER BY d.shed_id, d.record_date DESC
) x;
