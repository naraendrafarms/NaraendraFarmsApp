-- Migration 823 (READ ONLY): compare the staged Flock 19 Agraharam Potlapally
-- rows (from Flock_19.xlsx) against real daily_records. Output only counts +
-- a sample of mismatches/missing dates, not the full row set (that stays in
-- Python locally for building the output file).

SELECT 'staged_total' AS chk, count(*) AS n FROM public.staging_f19_ap;

-- Dates+sheds in the file with NO matching daily_records row at all.
SELECT 'missing_in_db' AS chk,
       count(*) AS missing_count,
       (SELECT string_agg(t, ' | ' ORDER BY t) FROM (
          SELECT (st.record_date::text || ' sh' || st.shed_no) AS t
            FROM public.staging_f19_ap st
           WHERE NOT EXISTS (
             SELECT 1 FROM public.daily_records d
             JOIN public.flocks f ON f.id = d.flock_id
             JOIN public.sheds s ON s.id = d.shed_id
             JOIN public.farms fa ON fa.id = s.farm_id
            WHERE f.flock_no::text = '19' AND fa.name = 'Agraharam Potlapally'
              AND s.shed_no = st.shed_no AND d.record_date = st.record_date
           )
           LIMIT 15
       ) x) AS sample
  FROM public.staging_f19_ap st
 WHERE NOT EXISTS (
   SELECT 1 FROM public.daily_records d
   JOIN public.flocks f ON f.id = d.flock_id
   JOIN public.sheds s ON s.id = d.shed_id
   JOIN public.farms fa ON fa.id = s.farm_id
  WHERE f.flock_no::text = '19' AND fa.name = 'Agraharam Potlapally'
    AND s.shed_no = st.shed_no AND d.record_date = st.record_date
 );

-- Dates+sheds present in BOTH, but with a different closing count or eggs
-- (real material difference, not a rounding gap).
WITH db_ap AS (
  SELECT d.record_date, s.shed_no, d.closing_female, d.total_eggs
    FROM public.daily_records d
    JOIN public.flocks f ON f.id = d.flock_id
    JOIN public.sheds s ON s.id = d.shed_id
    JOIN public.farms fa ON fa.id = s.farm_id
   WHERE f.flock_no::text = '19' AND fa.name = 'Agraharam Potlapally'
),
diffs AS (
  SELECT st.record_date, st.shed_no, st.close_f, st.eggs,
         db.closing_female, db.total_eggs
    FROM public.staging_f19_ap st
    JOIN db_ap db ON db.record_date = st.record_date AND db.shed_no = st.shed_no
   WHERE COALESCE(db.closing_female,0) != st.close_f OR COALESCE(db.total_eggs,0) != st.eggs
)
SELECT 'differs' AS chk,
       (SELECT count(*) FROM diffs) AS differs_count,
       (SELECT string_agg(t, ' | ' ORDER BY t) FROM (
          SELECT (record_date::text || ' sh' || shed_no
                  || ' file(close_f=' || close_f || ' eggs=' || eggs || ')'
                  || ' db(close_f=' || COALESCE(closing_female,0) || ' eggs=' || COALESCE(total_eggs,0) || ')') AS t
            FROM diffs LIMIT 15
       ) x) AS sample;
