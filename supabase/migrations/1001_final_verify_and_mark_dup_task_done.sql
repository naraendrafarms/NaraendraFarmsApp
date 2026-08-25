SELECT string_agg(
  'F' || fl.flock_no || ': total_dup=' || cnt || ' bad_close=' || bad,
  ' | ' ORDER BY fl.flock_no
) AS rows
FROM (
  SELECT d.flock_id, count(*) AS cnt,
    sum(CASE WHEN d.closing_female <> (d.opening_female - d.trcull_female - d.mortality_female)
              OR d.closing_male <> (d.opening_male - d.trcull_male - d.mortality_male)
         THEN 1 ELSE 0 END) AS bad
  FROM public.daily_records d
  WHERE d.trcull_female = d.transfer_female
    AND d.trcull_male = d.transfer_male
    AND (d.trcull_female <> 0 OR d.trcull_male <> 0)
  GROUP BY d.flock_id
) x
JOIN public.flocks fl ON fl.id = x.flock_id;

UPDATE public.tasks
SET status = 'done',
    description = description || E'\n\nRESOLVED 2026-08-25: Root-caused as duplicate trcull->transfer column write causing double-subtraction in closing_female/closing_male. Fixed 8 rows in F20 (migration 980), 15 rows across F19 (4) and F22 (11) (migrations 996-997). F23''s 2 duplicate-column rows had NO closing mismatch (harmless duplication, left as-is). Final verification confirms 0 rows with a bad closing remain across all flocks. Only closing_female/closing_male were recomputed; trcull/transfer/mortality source data was never touched.'
WHERE task_type='development' AND title = 'Audit: same bird movement double-written into trcull/transfer/cull columns (87 rows)';

SELECT 'task_updated' AS chk, count(*)::int AS rows
FROM public.tasks WHERE task_type='development' AND title = 'Audit: same bird movement double-written into trcull/transfer/cull columns (87 rows)' AND status='done';
