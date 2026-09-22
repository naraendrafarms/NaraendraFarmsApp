-- Two things left open after the HE-eggs-vs-standard work, recorded here rather
-- than left in a chat message. INSERT only, each guarded by its title.
-- No existing row is read for update, changed or deleted.

-- 1. The decision that is still with the owner.
INSERT INTO public.tasks (title, description, task_type, team, priority, status)
SELECT v.title, v.description, 'development', v.team, v.priority, 'pending'
FROM (VALUES
  (
   'Decide whether the HE-eggs columns added to Flock Lifetime stay',
   'WAITING ON YOU - one yes or no. BACKGROUND, AND IT IS A MISTAKE OF MINE: you asked where the standard says how many HE eggs should be received. The answer already existed and I did not find it. Open a flock from Flock Management - All Flocks (Data) and use its "vs Standard" tab: it has always shown, week by week, Std Weekly HE/HH and Std Cum HE/HH with the EXPECTED EGG COUNT in small grey type underneath each, the actual beside it and the variance. Measured 22/09/2026: flock 19 (Summer, 45,700 females placed) and flock 20 (Winter, 36,919 placed) each have real data for all 43 weeks of the curve, weeks 24 to 66, so that tab draws a full comparison for both today. INSTEAD OF POINTING AT IT I BUILT TWO THINGS. A Standard vs Actual tab on Flock Management - Dashboard, which you asked me to remove and which has been removed (commit 8d07c3c). And three columns - HE eggs, Std HE eggs, Dev - on Flock Management - Flock Lifetime (vs Standard), in both tables and the CSV export (commit 8897ff7). THE SECOND ONE IS STILL LIVE. It duplicates what the flock page already shows, though on a page that compares a flock week by week across its whole life and exports to CSV, which the flock tab does not do. Reverting it is one commit and touches no data. Nothing was written to the database by either change - both are read only.',
   'Flocks', 'normal')
) AS v(title, description, team, priority)
WHERE NOT EXISTS (
  SELECT 1 FROM public.tasks t WHERE t.title = v.title AND t.task_type = 'development'
);

-- 2. Flocks that cannot be compared at all, because they carry no Laying Season.
--    The list is built from the live rows so it cannot be wrong or out of date.
INSERT INTO public.tasks (title, description, task_type, team, priority, status)
SELECT
  'Laying Season is not set on some flocks, so vs Standard cannot draw',
  'WAITING ON YOU - which season each flock belongs to. The flock page''s "vs Standard" tab and every standard comparison need flocks.laying_season to be Summer or Winter, because the Venco curve is kept per season. Where it is blank the tab prints a message instead of a table and no HE-egg target can be worked out at all. Measured 22/09/2026, these flocks have no Laying Season set: '
    || COALESCE((SELECT string_agg('F-' || f.flock_no || ' (' || f.status || ', ' || COALESCE(f.total_placed_f, 0) || ' females placed, week ' || (((CURRENT_DATE - f.placement_date) / 7) + 1) || ')', '; ' ORDER BY f.flock_no)
          FROM public.flocks f WHERE f.laying_season IS NULL OR f.laying_season = ''), 'none - every flock has one')
    || '. For comparison the ones that ARE set: '
    || COALESCE((SELECT string_agg('F-' || f.flock_no || ' = ' || f.laying_season, '; ' ORDER BY f.flock_no)
          FROM public.flocks f WHERE f.laying_season IS NOT NULL AND f.laying_season <> ''), 'none')
    || '. IT IS SET ON THE FLOCK ITSELF - All Flocks (Data), open the flock, Edit, Laying Season - and I have not set it on any of them, because which season a flock laid in is a fact about the farm and not something to be guessed from a placement date. Some of these are old closed flocks where it may not be worth the trouble; tell me which ones matter and I will leave the rest. NOTHING WAS CHANGED: this task only reports what the column holds today.',
  'development', 'Flocks', 'normal', 'pending'
WHERE NOT EXISTS (
  SELECT 1 FROM public.tasks t
   WHERE t.title = 'Laying Season is not set on some flocks, so vs Standard cannot draw'
     AND t.task_type = 'development'
);

-- Verify: both titles present, and print the season list that was measured.
SELECT left(title, 60) AS title, status, team, priority
  FROM public.tasks
 WHERE task_type = 'development'
   AND (title LIKE 'Decide whether the HE-eggs%' OR title LIKE 'Laying Season is not set%');
