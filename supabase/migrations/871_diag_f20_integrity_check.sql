-- Migration 871 (READ ONLY): critical integrity checks before continuing the Flock 20 import.
-- (1) Is there now a duplicate row for Kethireddypally shed 2 on 2025-11-12
--     (the one pre-existing untagged row) vs my newly tagged import?
-- (2) Any duplicate (flock_id, shed_id, record_date) at all within Flock 20?
-- (3) Does a unique constraint exist on daily_records for (flock_id, shed_id, record_date)?
SELECT 'keth_sh2_1112_rows' AS chk,
       string_agg((id::text || ' tag=' || COALESCE(remarks,'NULL') || ' cl_f=' || closing_female), ' | ') AS rows
  FROM public.daily_records d
  JOIN public.flocks fl ON fl.id = d.flock_id
  JOIN public.sheds s ON s.id = d.shed_id
 WHERE fl.flock_no::text='20' AND s.shed_no='2' AND d.record_date='2025-11-12'
   AND EXISTS (SELECT 1 FROM public.farms fm WHERE fm.id = s.farm_id AND fm.name='Kethireddypally');

SELECT 'f20_dup_shed_date' AS chk, count(*)::int AS n
  FROM (
    SELECT d.shed_id, d.record_date, count(*) AS c
      FROM public.daily_records d
      JOIN public.flocks fl ON fl.id = d.flock_id
     WHERE fl.flock_no::text='20'
     GROUP BY d.shed_id, d.record_date
    HAVING count(*) > 1
  ) x;

SELECT 'unique_constraints' AS chk,
       string_agg(conname, ' | ') AS rows
  FROM pg_constraint
 WHERE conrelid = 'public.daily_records'::regclass AND contype = 'u';
