-- INSERT only, guarded by title. No existing row is changed or deleted.
--
-- Two gaps found on 26/09/2026 while answering how to undo a wrongly entered
-- HE dispatch payment. Both are hazards in the reversal path, NOT faults in
-- any figure on screen today - measured, both currently affect 0 HE rows.
-- Recorded rather than fixed: no permission was given to change the form.

INSERT INTO public.tasks (title, description, task_type, team, priority, status)
SELECT v.title, v.description, 'development', v.team, v.priority, 'pending'
FROM (VALUES
  (
   'Reversing a receipt to Pending does not clear the amount, so the balance still reads settled',
   'OPEN - mine to fix, WAITING ON YOUR GO-AHEAD, not urgent. MEASURED 26/09/2026: 0 of 242 HE dispatch rows are in this state right now, so no figure on screen is wrong today. THE HAZARD: to undo a receipt you open the Receive Payment window, set Status = Pending and save. The window deletes the cash_book and bank_transactions rows correctly (FlockSalesPages.tsx, the unconditional delete before the status branches), and it writes payment_status = Pending. BUT the Amount box is pre-filled with what was already received, and the update writes amount_received = whatever is in that box regardless of the status chosen. Every balance in the app - Party Outstanding, the dues panels, Bulk Receipt''s outstanding list - is amount minus amount_received. So a row saved as Pending with the amount left in place reads as FULLY SETTLED everywhere while its status says unpaid, and the ledger row backing it is gone. The person undoing has no way to see that from the screen. THE FIX, roughly: when Status is set to Pending, zero and disable the Amount box, or ignore it on save and write amount_received = null. Small and local to ReceivePaymentModal. Say the word and I will do it - migration not needed, this is page code only.',
   'Accounts', 'normal'),
  (
   'The single Receive Payment window wipes ALL ledger rows for a voucher, including other instalments',
   'OPEN - mine to fix, WAITING ON YOUR GO-AHEAD. MEASURED 26/09/2026: 0 HE dispatch vouchers carry more than one cash_book receipt row, so nothing is damaged today. I measured cash_book only - bank_transactions was not checked the same way, so a voucher part-paid by two bank credits has not been ruled out. THE HAZARD, and it is already written in the code comments: Bulk Receipt (one payment spread over the oldest invoices first) is INSERT ONLY and accumulates amount_received, so a voucher paid in three instalments carries three traceable cash_book rows. The single Receive Payment window does the opposite - it DELETES every cash_book and bank_transactions row linked to that voucher before writing one. That is correct when editing one payment and destructive on an instalment history: open the window on a voucher paid in three parts, save, and two real receipts vanish from the Cash Book while amount_received keeps their total. The cash book then no longer adds up to the receipt. WHY IT HAS NOT BITTEN YET: bulk receipts have not been used on an HE voucher that later had its single receipt edited. THE FIX, roughly: count the existing ledger rows for the voucher before deleting, and if there is more than one, either refuse with a plain message or offer to reverse a named instalment instead of all of them. Needs a decision from you on which behaviour you want, so I have not built it.',
   'Accounts', 'normal')
) AS v(title, description, team, priority)
WHERE NOT EXISTS (
  SELECT 1 FROM public.tasks t WHERE t.title = v.title AND t.task_type = 'development'
);

-- Verify by name so the answer cannot be truncated by the runner's 5-row preview.
SELECT 'reversalTasks=' || COUNT(*) AS seeded
  FROM public.tasks
 WHERE task_type = 'development'
   AND ( title LIKE 'Reversing a receipt to Pending%'
      OR title LIKE 'The single Receive Payment window wipes%' );
