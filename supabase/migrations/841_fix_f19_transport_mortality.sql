-- Migration 841: reclassify Flock 19's 16-18 Feb 2025 entries from cull to
-- mortality. The source file's "Tr. Mortality / Cull Sales" column is a single
-- combined column used for two different real-world events -- confirmed against
-- the farm's own WEEKLY_REPORT_NF_19.xlsx (REARING DEPLETION sheet): week 1
-- (16-22 Feb) shows SALES FEMALE PIC/WEEK = 0, so these entries cannot be sales/
-- culls; the user separately confirmed these three days are transport mortality
-- (chicks that died in transit/on arrival). Week 10's cull entries (21-22 Apr,
-- previously classified as cull_female) match the report's SALES FEMALE PIC/WEEK
-- = 171 exactly, confirming those genuinely are cull sales and are left as-is.
--
-- Pure reclassification: mortality_female/male go UP by the same amount
-- cull_female/male go DOWN, so closing_female/male (mortality+cull both
-- subtracted) is unaffected -- no bird-count change, just correct bucketing.

UPDATE public.daily_records d
   SET cull_female = 0,
       mortality_female = COALESCE(mortality_female,0) + 8
  FROM public.flocks f
 WHERE f.id = d.flock_id AND f.flock_no::text = '19'
   AND d.shed_id = 'ea960057-3519-42d0-aa94-4feceb1acb8a'  -- KP shed 10 (B1)
   AND d.record_date = '2025-02-16' AND d.cull_female = 8;

UPDATE public.daily_records d
   SET cull_female = 0,
       mortality_female = COALESCE(mortality_female,0) + 24
  FROM public.flocks f
 WHERE f.id = d.flock_id AND f.flock_no::text = '19'
   AND d.shed_id = 'ea960057-3519-42d0-aa94-4feceb1acb8a'  -- KP shed 10 (B1)
   AND d.record_date = '2025-02-17' AND d.cull_female = 24;

UPDATE public.daily_records d
   SET cull_male = 0,
       mortality_male = COALESCE(mortality_male,0) + 4
  FROM public.flocks f
 WHERE f.id = d.flock_id AND f.flock_no::text = '19'
   AND d.shed_id = '25318f4b-5494-4e26-8211-9935d2d81722'  -- KP shed 11 (B2)
   AND d.record_date = '2025-02-17' AND d.cull_male = 4;

UPDATE public.daily_records d
   SET cull_female = 0, cull_male = 0,
       mortality_female = COALESCE(mortality_female,0) + 22,
       mortality_male = COALESCE(mortality_male,0) + 18
  FROM public.flocks f
 WHERE f.id = d.flock_id AND f.flock_no::text = '19'
   AND d.shed_id = '25318f4b-5494-4e26-8211-9935d2d81722'  -- KP shed 11 (B2)
   AND d.record_date = '2025-02-18' AND d.cull_female = 22 AND d.cull_male = 18;

-- Verify: closing counts unchanged, cull now 0 on these 4 rows, mortality carries the total.
SELECT 'f19_reclassified_rows' AS chk,
       string_agg(t, ' | ' ORDER BY t) AS rows
  FROM (
    SELECT (d.record_date::text || ' sh' || s.shed_no
            || ' mort_f=' || COALESCE(d.mortality_female,0) || ' mort_m=' || COALESCE(d.mortality_male,0)
            || ' cull_f=' || COALESCE(d.cull_female,0) || ' cull_m=' || COALESCE(d.cull_male,0)
            || ' close_f=' || COALESCE(d.closing_female,0) || ' close_m=' || COALESCE(d.closing_male,0)) AS t
      FROM public.daily_records d
      JOIN public.flocks f ON f.id = d.flock_id
      JOIN public.sheds s ON s.id = d.shed_id
     WHERE f.flock_no::text = '19' AND d.record_date BETWEEN '2025-02-16' AND '2025-02-18'
       AND s.shed_no IN ('10','11')
  ) x;
