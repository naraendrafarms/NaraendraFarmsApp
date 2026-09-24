-- INSERT only, guarded by title. No existing row is changed or deleted, so no
-- backup table is needed.
--
-- Both of these came out of this session's cost work and were left in the chat.
-- Writing them down so the pending list is true.

INSERT INTO public.tasks (title, description, task_type, team, priority, status)
SELECT v.title, v.description, 'development', v.team, v.priority, 'pending'
FROM (VALUES
  (
   'F-22 chick cost is charged on 49,280 birds, not the 1,00,371 placed',
   'WAITING ON YOU - you said on 22/09/2026 you would check where it went wrong in the app, so the cause is yours to find; the figure below is mine, measured. WHAT IS STORED: F-22 chick cost Rs 1,70,01,600, which is exactly Rs 345 x 49,280 birds. WHAT WAS PLACED: 1,00,371 birds. So the rate looks right and the COUNT is roughly half. At Rs 345 on all 1,00,371 the cost would be Rs 3,46,27,995 - the flock is carrying Rs 1,76,26,395 LESS chick cost than it should. WHY IT MATTERS NOW: the Cost per Egg (Estimate) report shipped this session reads this figure, so F-22 shows a cost per egg that is too low, and F-22 against the other flocks is not a fair comparison until it is right. NOT FIXED, NOTHING WRITTEN - I have not touched the cost row, because we do not yet know whether the rate, the bird count, or a second missing entry is the fault. WHAT IS NEEDED: tell me whether 49,280 was a part-consignment with a second one never entered, or a single entry with the wrong count, and I will correct it with the row copied to a backup table first.',
   'Flocks', 'high'),
  (
   'Cost per Egg is only as good as the costs entered - most months are blank',
   'WAITING ON YOU - this is data entry, not code. The Cost per Egg (Estimate) report is BUILT and working (Reports, its own page, reads only, writes nothing), but it has to estimate because the books are mostly empty, and an estimate is not the real number. MEASURED for F-20 on 22/09/2026, over its 17 months: FEED - about 40% of the kg carry no price at all, so the report applies the Rs 27-30 per kg you gave instead; SALARIES - entered for 4 months of 17; ELECTRICITY - 6 of 17; OTHER EXPENSES - 5 of 17; MEDICINE - 5 of 17. The report scales each one up by the months that ARE filled, which is why it lands at Rs 14.69 to Rs 15.63 per egg against the Rs 9.17 the app shows from entered costs alone. The app figure is not wrong arithmetic - it is simply counting costs that were never entered as zero. WHAT IS NEEDED, in the order that moves the number most: (1) feed purchase prices for the unpriced lots, (2) the missing months of salary, (3) electricity bills, (4) medicine, (5) other expenses. Every month you fill makes the report lean less on scaling. Nothing about the report changes when you do - it will just have less to estimate.',
   'Accounts', 'normal')
) AS v(title, description, team, priority)
WHERE NOT EXISTS (
  SELECT 1 FROM public.tasks t WHERE t.title = v.title AND t.task_type = 'development'
);

-- Verify: both rows present, and show the whole open development list so the
-- count is visible rather than assumed.
SELECT left(title, 60) AS title, team, priority, status
  FROM public.tasks
 WHERE task_type = 'development' AND status <> 'done'
 ORDER BY priority DESC, id;
