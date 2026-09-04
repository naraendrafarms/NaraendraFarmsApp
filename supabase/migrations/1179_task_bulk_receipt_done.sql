-- Migration 1179: the bulk receipt shipped in the session it was asked for, so
-- it is recorded already closed rather than raised and immediately ticked.
--
-- Recorded even though it never sat pending, so the task list carries WHY the
-- screen exists rather than only that it does.

INSERT INTO public.tasks (title, description, task_type, team, status, priority)
SELECT 'Receive one payment against several outstanding vouchers',
       'DONE 04/09/2026, same session it was asked for. THE PROBLEM: a buyer or employee handing over one lump sum against five unpaid vouchers meant five separate trips through the Receive Payment window, re-typing the same date and re-picking the same imprest each time, with nothing stopping voucher 3 being tagged to a different tin than voucher 1. The tempting shortcut was worse: entering the lump on Imprest Ledger -> Add Voucher writes a cash_book row with no nhe_sale_id link, so the vouchers stay Pending for ever AND the cash is counted twice once they are receipted properly. '
       || 'BUILT: BulkReceiptModal lists every voucher a payer still owes on, oldest first, each ticked by default, and allocates one amount down the list as it is typed -- each row showing what it takes and what remains due. The last voucher the money reaches is marked Partial and the rest stay fully due; nothing is spread evenly. An amount larger than the ticked vouchers can absorb is refused rather than parked. One date, one cash location and one imprest for the whole receipt. '
       || 'REACHED FROM: the Employee Dues and Party (Buyer) Dues panels on NHE Sales, and Receive All on each party row in Reports -> Party Outstanding. A buyer gets HE dispatches and NHE sales together; an employee gets NHE sales, since hatching eggs never go to an employee. '
       || 'DESIGN NOTES: insert-only, never delete-then-reinsert -- the single Receive Payment window clears a sale prior ledger rows before writing the new one, which is right when editing one payment but would wipe an earlier receipt here, so each bulk receipt is its own cash_book row and amount_received accumulates. Outstanding is amount - amount_received, the same definition Party Outstanding uses, so the two screens cannot disagree. The Received/Partial test carries the same rounding tolerance used to decide a voucher is outstanding at all, so a paisa cannot leave a settled voucher reading Partial.',
       'development', 'Accounts', 'done', 'normal'
WHERE NOT EXISTS (
  SELECT 1 FROM public.tasks WHERE task_type = 'development'
    AND title = 'Receive one payment against several outstanding vouchers');

-- VERIFY: recorded once, closed, and the open count is unchanged by it.
SELECT (SELECT COALESCE(status,'MISSING') FROM public.tasks
        WHERE task_type='development'
          AND title='Receive one payment against several outstanding vouchers' LIMIT 1) AS bulk_task,
       (SELECT count(*)::int FROM public.tasks
        WHERE task_type='development' AND COALESCE(status,'pending') <> 'done') AS open_total,
       (SELECT count(*)::int FROM public.tasks
        WHERE task_type='development' AND COALESCE(status,'pending') <> 'done' AND priority='high') AS open_high;
