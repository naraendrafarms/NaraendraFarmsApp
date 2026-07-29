-- Diagnostic only (no schema changes) — find Amit Das's actual is_opening
-- pending_payments row(s) specifically, since the previous query's log got
-- truncated before showing the full row set (9 rows total for both names).
SELECT pp.id, pp.vendor_name, pp.invoice_no, pp.invoice_amount, pp.net_payable,
  pp.paid_amount, pp.payment_status, pp.party_id, pp.partner_id, pp.opening_balance_id
FROM public.pending_payments pp
WHERE pp.vendor_name = 'Amit Das' AND pp.is_opening = true;

SELECT ob.id, ob.fy, ob.amount, ob.dr_cr, ob.party_id, ob.partner_id, ob.remarks
FROM public.opening_balances ob
JOIN public.partners p ON p.id = ob.partner_id
WHERE p.name = 'Amit Das';

SELECT 'sentinel' AS marker, 1 AS n;
