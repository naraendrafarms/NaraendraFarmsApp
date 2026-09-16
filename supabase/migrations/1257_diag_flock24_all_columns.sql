-- READ ONLY. Everything recorded for Flock 24 so far - feed, mortality,
-- transfer, cull, eggs, wastage, lighting, remarks - not just the few columns
-- the Recent Shed-wise Entries list happens to show.
SELECT 1 AS warmup;

SELECT d.record_date::text                  AS the_date,
       COALESCE(s.shed_no::text,'NO SHED')  AS shed,
       COALESCE(d.feed_female_kg,0)         AS feed_f_kg,
       COALESCE(d.feed_type_f,'-')          AS feed_type_f,
       COALESCE(d.feed_male_kg,0)           AS feed_m_kg,
       COALESCE(d.feed_type_m,'-')          AS feed_type_m,
       COALESCE(d.mortality_female,0)       AS death_f,
       COALESCE(d.mortality_male,0)         AS death_m,
       COALESCE(d.transfer_female,0)        AS transf_f,
       COALESCE(d.cull_female,0)            AS cull_f,
       COALESCE(d.lighting_hrs,0)           AS light_hrs,
       COALESCE(d.remarks,'-')              AS remarks
FROM public.vhl_daily_entry d
LEFT JOIN public.sheds s ON s.id = d.shed_id
JOIN public.flocks f ON f.id = d.flock_id
WHERE f.flock_no::text = '24'
ORDER BY d.record_date, shed;

SELECT COALESCE(sum(d.feed_female_kg),0)::numeric  AS total_feed_f_kg,
       COALESCE(sum(d.feed_male_kg),0)::numeric    AS total_feed_m_kg,
       COALESCE(sum(d.mortality_female),0)::int    AS total_death_f,
       COALESCE(sum(d.mortality_male),0)::int      AS total_death_m,
       COALESCE(sum(d.transfer_female),0)::int     AS total_transfer_f,
       COALESCE(sum(d.cull_female),0)::int         AS total_cull_f,
       COALESCE(sum(d.total_eggs),0)::int          AS total_eggs,
       COALESCE(sum(d.he_eggs),0)::int             AS total_he,
       count(*) FILTER (WHERE COALESCE(d.feed_female_kg,0) = 0)::int AS rows_with_no_feed,
       count(*)::int                               AS rows_total
FROM public.vhl_daily_entry d
JOIN public.flocks f ON f.id = d.flock_id
WHERE f.flock_no::text = '24';

-- Medicine recorded against Flock 24 so far.
SELECT count(*)::int AS vhl_medicine_rows_flock24,
       COALESCE(sum(u.quantity),0)::numeric AS total_qty
FROM public.vhl_medicine_usage u
JOIN public.flocks f ON f.id = u.flock_id
WHERE f.flock_no::text = '24';
