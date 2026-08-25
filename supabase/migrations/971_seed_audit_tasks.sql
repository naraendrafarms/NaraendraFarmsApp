-- Migration 971: seed pending tasks from the independent Opus-5 audit
-- (2026-08-25). All four are WAITING ON A DECISION -- nothing has been
-- fixed yet, this only logs them so they are not lost.
INSERT INTO public.tasks (title, description, task_type, team, priority, status)
SELECT * FROM (VALUES
  ('Audit: 345 NHE sales missing from cash_book (~Rs 51.1L)',
   'WAITING ON YOU: 345 of 486 nhe_sales rows have no matching cash_book entry (via nhe_sale_id), no duplicates/orphans found otherwise. Breakdown: 2025-11 (3, Rs 888), 2026-05 (5, Rs 16,03,125), 2026-06 (106, Rs 34,27,903), 2026-07 (141, Rs 33,058), 2026-08 (101, Rs 49,701). This is still occurring in live months, not just historical import -- need to decide whether these are legitimate credit/unpaid sales (schema has no payment-status column to distinguish) or a real insert gap, then either build a backfill migration or add a payment-status field.',
   'development', 'Accounts', 'high', 'open'),
  ('Audit: Flock 20 opening/closing chain broken at 41 points',
   'WAITING ON YOU: Flock 20 is the only flock with continuity breaks (19/22/23 clean). Two need explanation before any fix: shed 12 on 2025-06-14 opening_female=2796 vs prior closing=12114 (9318 birds missing, males unchanged), and shed 2 on 2025-11-12 (the row that failed to insert 5+ times in the prior session) where female/male figures look transposed. Remaining ~39 breaks are smaller month-boundary drifts (a few dozen birds per shed on 2025-11-09/12-01/2026-06-01) and shed-emptying transfers not recorded same-day. Full list in supabase/migrations/949-970_audit_*.sql job logs.',
   'development', 'Flocks', 'high', 'open'),
  ('Audit: same bird movement double-written into trcull/transfer/cull columns (87 rows)',
   'OPEN: On 87 rows across Flocks 19/20/22/23, the identical figure is stored in both trcull_female and transfer_female (or cull_female and trcull_female). Closing values are correct, but FlockLifetime.tsx:170 sums trcull_female as culls -- so Flock 22 (11/11 rows) and Flock 23 (2/2 rows) transfers-out are misreported as culls in that view. Needs a decision: pick one canonical column per movement type and either null out the duplicate or fix FlockLifetime.tsx to not double-read it.',
   'development', 'Flocks', 'medium', 'open'),
  ('Audit: 15 Flock 20 rows have wrong/missing farm_id',
   'OPEN: 14 rows from 2025-11-07/08 (7 each) say farm_id=Kethireddypally but the shed itself belongs to Bodjanampet-1 -- misattributes 2 days of Bodjanampet-1 production to Kethireddypally in farm-filtered reports. Separately, 1 row from 2026-08-24 (Flock 20 shed 4) has farm_id=NULL -- this one is NEW, written yesterday, not import residue, so check whether the app is failing to set farm_id somewhere in the live insert path. Also ~30+ flock-level (shed_id IS NULL) event rows on Flock 19/20 have farm_id NULL by what looks like convention -- confirm intentional or fix.',
   'development', 'Flocks', 'medium', 'open')
) AS v(title, description, task_type, team, priority, status)
WHERE NOT EXISTS (
  SELECT 1 FROM public.tasks t WHERE t.title = v.title AND t.task_type = 'development'
);

SELECT 'audit_tasks_seeded' AS chk, count(*)::int AS rows
FROM public.tasks WHERE task_type='development' AND title LIKE 'Audit:%';
