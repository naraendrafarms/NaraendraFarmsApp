-- June and July 2026 have now been checked against the filed returns and both
-- tie exactly. Record that on the open task rather than leaving it vague, and
-- open one new item the check turned up. Back the row up before touching it.

CREATE TABLE IF NOT EXISTS public.tasks_backup_1310 AS
SELECT * FROM public.tasks
WHERE task_type = 'development'
  AND title = 'Check the remaining months of ESIC and EPFO filings against the app';

UPDATE public.tasks
SET description = description || ' PROGRESS 21/09/2026 - JUNE AND JULY 2026 BOTH CHECKED AND BOTH TIE EXACTLY. ESI: 23 IPs each month, wage base Rs 2,68,544 (Jun) and Rs 2,69,144 (Jul), employee Rs 2,026 and Rs 2,030 - every figure equal to the filing, and the employer share now matches the challan at Rs 8,728 and Rs 8,748 on the new total basis, where the old per-employee rounding would have read Rs 8,739 and Rs 8,759. PF: 25 members each month, wage base Rs 2,89,144 and Rs 2,99,144, employee Rs 34,700 and Rs 35,898, EPS Rs 24,084 and Rs 24,921, employer difference Rs 10,616 and Rs 10,977 - all exact. Every part-month person matches on wage, and on days once rounded up as ESIC requires (Jun: 10 people, Jul: 14). MONTHS VERIFIED SO FAR: June, July, August 2026. Still open for any earlier or later month you send.'
WHERE task_type = 'development'
  AND title = 'Check the remaining months of ESIC and EPFO filings against the app';

INSERT INTO public.tasks (title, description, task_type, team, priority, status)
SELECT v.title, v.description, 'development', v.team, v.priority, 'pending'
FROM (VALUES
  (
   'PF admin charge and EDLI may have the same per-employee rounding gap as ESI',
   'WAITING ON YOU - one document. Found 21/09/2026 while checking June and July. The app works out the PF admin charge (A/c 2) and EDLI (A/c 21) at 0.5 percent EACH EMPLOYEE and rounds each one, then adds them up: Jun Rs 1,442, Jul Rs 1,495, Aug Rs 1,619 for each of the two. Half a percent of the month total wage instead gives Rs 1,446, Rs 1,496 and Rs 1,621. That is the SAME per-employee versus total question that was just settled for employer ESI, and it would be a few rupees a month on each account. THE DIFFERENCE IS MEASURED BUT WHICH ONE IS RIGHT IS NOT: neither charge appears anywhere on the EPFO ECR return statement, so there is nothing in the three months of documents sent so far to check it against. They appear only on the PF CHALLAN. SEND ONE PF CHALLAN - any month - and this can be settled the same way ESI was, by reading what EPFO actually asked for. NOTHING HAS BEEN CHANGED: the formula stays exactly as it is until there is a document to check it against, because changing a statutory figure on a guess is worse than leaving a few rupees out.',
   'HR', 'normal')
) AS v(title, description, team, priority)
WHERE NOT EXISTS (
  SELECT 1 FROM public.tasks t WHERE t.title = v.title AND t.task_type = 'development'
);

SELECT status, left(title, 58) AS title
FROM public.tasks
WHERE task_type = 'development'
  AND (title LIKE 'Check the remaining months%' OR title LIKE 'PF admin charge and EDLI%')
ORDER BY title;
