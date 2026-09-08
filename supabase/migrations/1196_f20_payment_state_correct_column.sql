-- The payment check in 1194 and 1195 named he_dispatch.paid_amount, which does not
-- exist - the receipt column on this table is amount_received (migration 076).
-- run_sql.py treats a "does not exist" error as success, so that statement failed
-- silently and printed nothing both times. Re-run against the real column, and
-- correct the one phrase it put into the task description.

-- 1. The real payment position of the 72 imported dispatches
SELECT count(*)::int AS rows,
       sum(amount)::numeric AS billed,
       sum(COALESCE(amount_received,0))::numeric AS received,
       sum(tds_amount)::numeric AS tds,
       count(*) FILTER (WHERE amount_received IS NOT NULL)::int AS rows_with_a_receipt,
       count(*) FILTER (WHERE received_date IS NOT NULL)::int AS rows_with_a_receipt_date,
       string_agg(DISTINCT COALESCE(payment_status,'(null)'), ' / ') AS statuses
FROM public.he_dispatch
WHERE flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'::uuid AND dispatch_date < '2026-06-01';

-- 2. Same question for the 35 Flock 20 dispatches that were already there, for comparison
SELECT count(*)::int AS rows,
       sum(amount)::numeric AS billed,
       sum(COALESCE(amount_received,0))::numeric AS received,
       string_agg(DISTINCT COALESCE(payment_status,'(null)'), ' / ') AS statuses
FROM public.he_dispatch
WHERE flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'::uuid AND dispatch_date >= '2026-06-01';

-- 3. Correct the column name in the task text so it points at the right field
UPDATE public.tasks
SET description = replace(description,
      'payment_status Pending with paid_amount 0',
      'payment_status Pending with amount_received empty')
WHERE task_type = 'development'
  AND title = 'Flock 20 Hitech receipts not entered - Rs 12.83 crore is showing as unpaid';

-- 4. Confirm the wording is right
SELECT title, position('amount_received empty' in description) > 0 AS wording_fixed,
       position('paid_amount' in description) = 0 AS old_wording_gone
FROM public.tasks
WHERE task_type = 'development'
  AND title = 'Flock 20 Hitech receipts not entered - Rs 12.83 crore is showing as unpaid';
