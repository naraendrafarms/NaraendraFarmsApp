INSERT INTO public.tasks (title, description, task_type, team, priority, status)
SELECT
  'Flock 20: body weight never entered',
  'OPEN — flock_weekly_performance has 0 rows for Flock 20 across all weeks. WAITING ON YOU: the uploaded WEEKLY_REPORT_NF_20.xlsx has full weekly body-weight data (REARING-BW weeks 1-23, FEED & B.W weeks 24-61) — say if you want it backfilled from that report, or nothing built for this yet.',
  'development', 'Flocks', 'medium', 'open'
WHERE NOT EXISTS (
  SELECT 1 FROM public.tasks WHERE title = 'Flock 20: body weight never entered' AND task_type = 'development'
);

INSERT INTO public.tasks (title, description, task_type, team, priority, status)
SELECT
  'Flock 20 week 4 (22-28 Jun 2025): cull-bird sale folded into mortality',
  'OPEN — app mortality_female/male for week 4 (39F/21M) equals the uploaded report''s mortality-only figure (23F/10M) plus its separately tracked cull-bird sales figure (16F/11M), exactly. Confirmed no bird_cull row exists in nhe_sales for Flock 20 in this window, and cull_female/cull_male/trcull_female/trcull_male are all 0 for these dates — so the 16F/11M cull-bird sale was never entered as a sale, it was recorded as mortality instead. Net birds-out is correct but mortality is overstated by 16F/11M and there is no sales/revenue record for those 27 birds if they were actually sold. WAITING ON YOU: confirm whether those birds were culled-and-discarded (leave as is) or sold (need a correcting entry: reduce mortality_female/male for that week and add the matching bird_cull sale to nhe_sales).',
  'development', 'Flocks', 'medium', 'open'
WHERE NOT EXISTS (
  SELECT 1 FROM public.tasks WHERE title = 'Flock 20 week 4 (22-28 Jun 2025): cull-bird sale folded into mortality' AND task_type = 'development'
);
