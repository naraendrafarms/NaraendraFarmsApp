-- Migration 1158: sales recovered through salary are marked as received.
--
-- THE FAULT: when a salary is marked Paid, the app correctly sets the linked
-- employee_deductions rows to status 'deducted' and stamps the date and the
-- salary record. Nothing anywhere then updates nhe_sales.payment_status --
-- no code path and no trigger. So a sale whose money HAS been recovered out of
-- wages still reads Pending, for ever.
--
-- Measured before this ran: 368 sales carry a salary deduction and 380 still
-- read Pending. Those are close to the same set, so the Due figure on the NHE
-- Sales page has been largely fiction -- money already recovered, still shown
-- as owed.
--
-- Owner approved correcting the history.
--
-- WHAT IS TOUCHED, precisely: only sales that have at least one
-- employee_deductions row already at status 'deducted'. A deduction still
-- 'pending' means the salary has NOT been paid, so that sale is genuinely
-- still owed and is left alone.
--
-- Settled = cash already recorded + deductions actually taken. Status is set
-- to 'Received' only when that covers the sale; anything short is 'Partial',
-- so a part-recovered sale is never flattened into fully paid.
--
-- received_date takes the LATEST deducted_at, which is the day the money was
-- really recovered.

DO $$
BEGIN
  WITH settled AS (
    SELECT s.id,
           s.amount,
           COALESCE(s.payment_cash, 0) + COALESCE(s.payment_online, 0) AS paid_direct,
           SUM(d.amount)      AS deducted,
           MAX(d.deducted_at) AS last_deducted
    FROM public.nhe_sales s
    JOIN public.employee_deductions d ON d.nhe_sale_id = s.id
    WHERE d.status = 'deducted'
    GROUP BY s.id, s.amount, s.payment_cash, s.payment_online
  )
  UPDATE public.nhe_sales s
  SET amount_received = LEAST(t.paid_direct + t.deducted, t.amount),
      received_date   = COALESCE(s.received_date, t.last_deducted),
      payment_status  = CASE WHEN t.paid_direct + t.deducted >= t.amount
                             THEN 'Received' ELSE 'Partial' END
  FROM settled t
  WHERE s.id = t.id
    AND COALESCE(s.payment_status, 'Pending') <> 'Received';
END
$$;

-- VERIFY 1: the position after the correction. pending_with_deduction_taken
-- must be 0 -- that is the whole point of the migration.
SELECT count(*)::int AS total_sales,
       count(*) FILTER (WHERE payment_status = 'Received')::int AS received,
       count(*) FILTER (WHERE payment_status = 'Partial')::int AS partial,
       count(*) FILTER (WHERE COALESCE(payment_status,'Pending') = 'Pending')::int AS still_pending,
       (SELECT count(*)::int FROM public.nhe_sales s
        WHERE COALESCE(s.payment_status,'Pending') = 'Pending'
          AND EXISTS (SELECT 1 FROM public.employee_deductions d
                      WHERE d.nhe_sale_id = s.id AND d.status = 'deducted')) AS pending_with_deduction_taken
FROM public.nhe_sales;

-- VERIFY 2: sales still genuinely owed, and why -- so the remaining Pending
-- figure can be trusted rather than merely being smaller.
SELECT (SELECT count(*)::int FROM public.nhe_sales s
        WHERE COALESCE(s.payment_status,'Pending') = 'Pending'
          AND EXISTS (SELECT 1 FROM public.employee_deductions d
                      WHERE d.nhe_sale_id = s.id AND d.status = 'pending')) AS awaiting_unpaid_salary,
       (SELECT count(*)::int FROM public.nhe_sales s
        WHERE COALESCE(s.payment_status,'Pending') = 'Pending'
          AND NOT EXISTS (SELECT 1 FROM public.employee_deductions d WHERE d.nhe_sale_id = s.id)) AS pending_no_deduction_at_all,
       (SELECT round(sum(s.amount - COALESCE(s.amount_received,0)))::numeric FROM public.nhe_sales s
        WHERE COALESCE(s.payment_status,'Pending') <> 'Received') AS real_outstanding,
       (SELECT count(*)::int FROM public.employee_deductions WHERE status = 'deducted') AS deductions_taken,
       (SELECT count(*)::int FROM public.employee_deductions WHERE status = 'pending') AS deductions_still_pending;
