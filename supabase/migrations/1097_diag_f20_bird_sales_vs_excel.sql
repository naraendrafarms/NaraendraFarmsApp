-- Flock 20 bird/cull sales currently in the app
SELECT string_agg(sale_type || '=' || cnt::text || ' rows/Rs' || amt::text, ' | ' ORDER BY sale_type) AS f20_bird_sales
FROM (
  SELECT sale_type, count(*)::int AS cnt, round(sum(COALESCE(amount,0))::numeric,0) AS amt
  FROM public.nhe_sales
  WHERE flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'
    AND sale_type IN ('bird_sale','bird_cull','bird_lame','bird_weak','bird_sex_error')
  GROUP BY sale_type
) t;

SELECT count(*)::int AS n_bird_rows,
       round(sum(COALESCE(amount,0))::numeric,0) AS total_amount,
       min(sale_date)::text AS first_sale, max(sale_date)::text AS last_sale
FROM public.nhe_sales
WHERE flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'
  AND sale_type IN ('bird_sale','bird_cull','bird_lame','bird_weak','bird_sex_error');

-- Flock 22 state (re-run of 1096 stmt 1, not yet read)
SELECT string_agg(fm.name || '/Sh' || s.shed_no || '=' || COALESCE(d.closing_female,0)::text
       || '/' || COALESCE(d.closing_male,0)::text, ' | ' ORDER BY fm.name, (s.shed_no)::int) AS f22_rows_on_max_date
FROM public.daily_records d
JOIN public.flocks f ON f.id = d.flock_id
JOIN public.sheds s ON s.id = d.shed_id
JOIN public.farms fm ON fm.id = s.farm_id
WHERE f.flock_no::text = '22'
  AND d.record_date = (SELECT max(d2.record_date) FROM public.daily_records d2
                       JOIN public.flocks f2 ON f2.id = d2.flock_id WHERE f2.flock_no::text='22');

-- Does the app record the 26/12/2025 transfer-out on Kethireddypally Shed 2?
SELECT record_date::text, opening_female, transfer_female, transfer_male,
       cull_female, closing_female, closing_male
FROM public.daily_records
WHERE flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'
  AND shed_id = '678fa4de-c9e1-4e8a-965c-40d21b5eaf47'
  AND record_date = '2025-12-26';
