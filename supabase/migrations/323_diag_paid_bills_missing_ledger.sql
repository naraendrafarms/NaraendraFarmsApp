-- Find every Paid pending_payments bill that has NO matching cash_book entry
-- (pending_payment_id) — these are bills that were marked Paid before the
-- ledger-sync bug was fixed, where the status never transitioned (so no
-- entry was ever posted), or where bank details were added after the fact.
SELECT pp.id, pp.vendor_name, pp.invoice_no, pp.grn_no, pp.net_payable, pp.invoice_amount,
       pp.account_type, pp.bank_account_id, pp.utr_no, pp.cheque_no, pp.pay_before_date, pp.payment_status
FROM public.pending_payments pp
WHERE pp.payment_status = 'Paid'
  AND NOT EXISTS (SELECT 1 FROM public.cash_book cb WHERE cb.pending_payment_id = pp.id)
ORDER BY pp.pay_before_date DESC NULLS LAST
LIMIT 50;

SELECT COUNT(*) AS paid_missing_cashbook
FROM public.pending_payments pp
WHERE pp.payment_status = 'Paid'
  AND NOT EXISTS (SELECT 1 FROM public.cash_book cb WHERE cb.pending_payment_id = pp.id);
