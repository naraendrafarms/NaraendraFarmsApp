-- Migration 1189: delete the one empty Flock 22 row at Agraharam.
--
-- 28/06/2026, Agraharam Potlapally shed 4, Flock 22: opening 0F+0M, closing
-- 0F+0M, no eggs, no feed. Nothing happened on it. Flock 22's real presence at
-- Agraharam begins 24/08/2026.
--
-- WHY IT MATTERS rather than being harmless clutter: any question of the form
-- "which sites did this flock have birds at" counts DISTINCT sites from the
-- daily records, so this row made Flock 22 look present at Agraharam from June
-- and made Agraharam look like a SHARED site in 2026-06. That is exactly the
-- false reading migration 1187 produced and the owner corrected. The new Daily
-- Farm Summary would also print an empty Agraharam block for Flock 22 on that
-- date.
--
-- Backed up first, so it can be restored exactly.

-- [1] Keep the row before deleting it.
CREATE TABLE IF NOT EXISTS public.daily_records_stray_1189 AS
SELECT d.* FROM public.daily_records d
JOIN public.sheds sh ON sh.id = d.shed_id
JOIN public.farms f ON f.id = sh.farm_id
JOIN public.flocks fl ON fl.id = d.flock_id
WHERE fl.flock_no = '22' AND f.code = 'PPALLY' AND d.record_date = DATE '2026-06-28'
  AND COALESCE(d.opening_female,0) = 0 AND COALESCE(d.opening_male,0) = 0
  AND COALESCE(d.closing_female,0) = 0 AND COALESCE(d.closing_male,0) = 0
  AND COALESCE(d.total_eggs,0) = 0
  AND COALESCE(d.feed_female_kg,0) = 0 AND COALESCE(d.feed_male_kg,0) = 0;

-- [2] WHAT ELSE IT TOUCHES, checked BEFORE the delete so the answer is not
-- guessed. v_flock_summary reads the flock's MAX record date, so removing a row
-- ON that date would move the flock's current bird count -- the single most
-- dangerous side effect here.
SELECT (SELECT count(*)::int FROM public.daily_records_stray_1189) AS row_backed_up,
       (SELECT max(record_date)::text FROM public.daily_records WHERE flock_id =
          (SELECT id FROM public.flocks WHERE flock_no = '22')) AS flock22_max_date,
       (SELECT count(*)::int FROM public.flock_transfers t
        WHERE t.flock_id = (SELECT id FROM public.flocks WHERE flock_no = '22')
          AND t.transfer_date = DATE '2026-06-28') AS transfers_on_that_date,
       (SELECT count(*)::int FROM public.daily_records d
        WHERE d.flock_id = (SELECT id FROM public.flocks WHERE flock_no = '22')
          AND d.record_date = DATE '2026-06-28') AS all_f22_rows_that_date;

-- [3] Delete it.
DELETE FROM public.daily_records d
USING public.daily_records_stray_1189 b
WHERE d.id = b.id;

-- [4] VERIFY: gone, the flock's totals are untouched (the row was all zeros so
-- nothing can have moved), and Agraharam is no longer a June site for Flock 22.
SELECT (SELECT count(*)::int FROM public.daily_records d
        JOIN public.sheds sh ON sh.id = d.shed_id
        JOIN public.farms f ON f.id = sh.farm_id
        WHERE d.flock_id = (SELECT id FROM public.flocks WHERE flock_no='22')
          AND f.code = 'PPALLY' AND d.record_date < DATE '2026-08-01') AS f22_ppally_before_august,
       (SELECT min(d.record_date)::text FROM public.daily_records d
        JOIN public.sheds sh ON sh.id = d.shed_id
        JOIN public.farms f ON f.id = sh.farm_id
        WHERE d.flock_id = (SELECT id FROM public.flocks WHERE flock_no='22')
          AND f.code = 'PPALLY') AS f22_ppally_first_real_date,
       (SELECT sum(COALESCE(total_eggs,0))::bigint FROM public.daily_records
        WHERE flock_id = (SELECT id FROM public.flocks WHERE flock_no='22')) AS f22_total_eggs_unchanged,
       (SELECT count(*)::int FROM public.daily_records) AS daily_records_now;

-- [5] And the sharing picture, rebuilt without any row filter now that the
-- empty one is gone -- it should match the birds-only answer: Kethireddypally
-- and nothing else.
SELECT COALESCE(string_agg(t.txt, ' | ' ORDER BY t.mon DESC), 'NONE') AS shared_months_now
FROM (
  SELECT to_char(d.record_date,'YYYY-MM') AS mon,
         f.code || ' ' || to_char(d.record_date,'YYYY-MM') || ': ' || string_agg(DISTINCT fl.flock_no, ',') AS txt
  FROM public.daily_records d
  JOIN public.sheds sh ON sh.id = d.shed_id
  JOIN public.farms f ON f.id = sh.farm_id
  JOIN public.flocks fl ON fl.id = d.flock_id
  GROUP BY f.code, to_char(d.record_date,'YYYY-MM')
  HAVING count(DISTINCT d.flock_id) > 1
) t;
