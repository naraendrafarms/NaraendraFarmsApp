UPDATE public.tasks
SET status = 'done',
    description = description || E'\n\nRESOLVED 2026-08-25: All 41 breaks accounted for. 8 rows (2025-11-11, all 7 Bodjanampet-1 sheds + Kethireddypally sh2) were the duplicate trcull/transfer column bug -- fixed by recomputing closing as opening-trcull-mortality (single subtraction), verified against farm owner''s own figures for shed 2, cascade trigger propagated the fix into 11-12 automatically. Shed 12 2025-06-14 confirmed a legitimate shed-redistribution event (matches source Excel exactly), not a bug. 3 remaining 1-2 bird drifts on Bodjanampet-1 sheds 4/5/6 on 2025-11-09 confirmed against source Excel Shed sheet -- no cull/sale/received event recorded there either, so nothing to correct or record; left as-is (import noise in the F/M split, source only tracks combined bird count).'
WHERE task_type='development' AND title = 'Audit: Flock 20 opening/closing chain broken at 41 points';

SELECT 'task_updated' AS chk, count(*)::int AS rows
FROM public.tasks WHERE task_type='development' AND title = 'Audit: Flock 20 opening/closing chain broken at 41 points' AND status='done';
