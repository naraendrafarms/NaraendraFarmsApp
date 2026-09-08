-- 1194's task INSERT failed on tasks_priority_check: priority is one of
-- low / normal / high / urgent (migration 429), and it was given 'medium', so both
-- rows rolled back. Re-seeded here with the right value. Also re-runs the payment
-- check from 1194 that returned nothing in the job log.

-- 1. Payment state of the 72 imported dispatches
SELECT count(*)::int AS rows,
       sum(amount)::numeric AS billed,
       sum(COALESCE(paid_amount,0))::numeric AS paid,
       sum(tds_amount)::numeric AS tds,
       string_agg(DISTINCT COALESCE(payment_status,'(null)'), ' / ') AS statuses
FROM public.he_dispatch
WHERE flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'::uuid AND dispatch_date < '2026-06-01';

-- 2. How much of Hitech's pending balance is the new import and how much was already there
SELECT count(*) FILTER (WHERE d.dispatch_date < '2026-06-01'
                          AND d.flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'::uuid)::int AS imported_pending_rows,
       COALESCE(sum(d.amount) FILTER (WHERE d.dispatch_date < '2026-06-01'
                          AND d.flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'::uuid),0)::numeric AS imported_pending_amt,
       count(*) FILTER (WHERE NOT (d.dispatch_date < '2026-06-01'
                          AND d.flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'::uuid))::int AS other_pending_rows,
       COALESCE(sum(d.amount) FILTER (WHERE NOT (d.dispatch_date < '2026-06-01'
                          AND d.flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'::uuid)),0)::numeric AS other_pending_amt
FROM public.he_dispatch d
WHERE d.party_id = '436decba-1b4f-4dbe-91fa-e8c9d794e095'::uuid AND d.payment_status = 'Pending';

-- 3. Record what is still open
INSERT INTO public.tasks (title, description, task_type, team, status, priority)
SELECT v.title, v.description, 'development', v.team, 'pending', v.priority
FROM (VALUES
  ('Flock 20 Hitech receipts not entered - Rs 12.83 crore is showing as unpaid',
   'OPEN - WAITING ON YOU. Migration 1193 imported the 72 Flock 20 Hitech Hatch Fresh hatching-egg '
   || 'dispatches for 03/12/2025 to 28/05/2026 from your workbook: 39,51,360 eggs, 77,434 of them free, '
   || '38,73,926 billable, Rs 12,83,40,373 billed, Rs 1,28,333 TDS at 0.1 percent. All 72 reconcile to '
   || 'the invoice register on the second sheet exactly. '
   || 'WHAT IS NOT THERE: the workbook carried no receipt information, so all 72 went in as payment_status '
   || 'Pending with paid_amount 0. Reports -> Party Outstanding and the Party Ledger therefore show about '
   || 'Rs 12.82 crore (billed less TDS) as still owed by Hitech on top of what was already pending. '
   || 'NOTHING WAS GUESSED - marking them paid without the bank dates would put invented receipts into the '
   || 'cash book and the imprest balances. '
   || 'WAITING ON YOU: the receipt dates and amounts against these invoices (a bank statement extract or '
   || 'the Tally receipt register is enough). Bulk Receipt on Reports -> Party Outstanding can then settle '
   || 'them several invoices at a time. If they were all settled in full on one date, say so and it is one run. '
   || 'SEE ALSO: Hitech had a large pending balance BEFORE this import as well - that is a separate question '
   || 'about the earlier dispatches, not something this import created.',
   'Accounts', 'high'),

  ('Flock 20 non-Hitech hatching-egg sales from the upload are not imported',
   'OPEN - WAITING ON YOUR DECISION. Your instruction on the Flock 20 workbook was Hitech only, so 16 of the '
   || '268 lines were deliberately left out: 1,75,901 eggs across Meghana Agencies, Akshaya Poultry, '
   || 'Venkatadri Hatcheries, Jamal Agro, Raju Poultry Traders and Ellandula Srinivas, 03/12/2025 to 28/05/2026. '
   || 'WHY THEY WERE NOT SIMPLY IMPORTED WITH THE REST: they do not reconcile the way the Hitech ones do. '
   || 'Thirteen of the 14 NF/HE invoices they carry disagree with the register by ratios from 0.077 to 3.26 - '
   || 'that pattern says those invoices cover eggs from OTHER FLOCKS as well as Flock 20, so the sheet holds only '
   || 'part of each invoice and the amounts cannot be derived from it. Two lines (DC 6186 on 21/01/2026 and '
   || 'DC 6970 on 06/05/2026, both Meghana) carry no invoice number at all. '
   || 'WAITING ON YOU: either the same workbook covering the other flocks on those invoices, so a whole invoice '
   || 'can be reconstructed, or a decision to enter these 16 by hand at the sheet rates and accept that the '
   || 'invoice totals will not tie to the register. Until then Flock 20 HE is short by those 1,75,901 eggs.',
   'Flocks', 'normal')
) AS v(title, description, team, priority)
WHERE NOT EXISTS (
  SELECT 1 FROM public.tasks t WHERE t.title = v.title AND t.task_type = 'development');

-- 4. Confirm both landed
SELECT title, team, priority, status FROM public.tasks
WHERE task_type = 'development'
  AND (title LIKE 'Flock 20 Hitech receipts%' OR title LIKE 'Flock 20 non-Hitech%')
ORDER BY title;
