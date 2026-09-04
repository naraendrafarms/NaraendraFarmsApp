-- Migration 1181: the "345 NHE sales missing from cash_book" audit is answered.
-- There is no posting gap. Closing it with the finding rather than leaving a
-- high-priority task standing over money that was never missing.
--
-- Measured by 1180 on 04/09/2026 against the live data.

UPDATE public.tasks
SET status = 'done',
    priority = 'normal',
    description = description || E'\n\nRESOLVED 04/09/2026 -- NO GAP EXISTS. Measured by migration 1180. The premise in this task was wrong on two counts. First, it said the schema has no payment-status column: nhe_sales.payment_status has existed for some time (Pending / Partial / Received), as do payment_cash, payment_online and advance_adjusted, so the two cases were always separable. Second, the figures had moved: 540 sales now, 138 with a cash_book row and 402 without (not 486/345). '
      || 'THE ANSWER: a cash_book row is written ONLY when CASH is received, so its absence is correct whenever the money came another way. Of the 402 without one, ZERO carry any cash at all (payment_cash = 0 on every single row), so not one of them should have a cash_book entry. Breaking them down: 243 are unpaid credit sales worth Rs 62,765 with nothing received yet; 159 are settled, worth Rs 50,62,617 billed. 368 carry a salary deduction (employee_deductions) and 18 were paid by bank (bank_transactions); the categories overlap, since a still-pending sale can already carry a pending deduction row. Settled against a party advance: 0. '
      || 'THE REAL GAP -- a sale carrying cash with no cash_book row and no other route explaining it -- is 0 rows and Rs 0. The "~Rs 51.1 lakh missing" was never missing: it is money that arrived through payroll or the bank, or has not arrived yet. Nothing to backfill. '
      || 'ONE THING NOTED BUT NOT MEASURED: across the 159 settled rows, received (Rs 51,09,567) exceeds billed (Rs 50,62,617) by Rs 46,950. nhe_sales carries refund_amount/refund_date, so an overpayment awaiting refund is a legitimate explanation, but this has NOT been verified and is worth its own check.'
WHERE task_type = 'development' AND COALESCE(status,'pending') <> 'done'
  AND title ILIKE '%NHE sales missing from cash_book%';

-- VERIFY: closed, and what that leaves open.
SELECT (SELECT COALESCE(status,'MISSING') FROM public.tasks
        WHERE task_type='development' AND title ILIKE '%NHE sales missing from cash_book%' LIMIT 1) AS audit_task,
       (SELECT count(*)::int FROM public.tasks
        WHERE task_type='development' AND COALESCE(status,'pending') <> 'done') AS open_total,
       (SELECT count(*)::int FROM public.tasks
        WHERE task_type='development' AND COALESCE(status,'pending') <> 'done' AND priority='high') AS open_high;
