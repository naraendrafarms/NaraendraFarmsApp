-- Data fix: Amit Das's second opening balance (opening_balances id
-- 65dbac3c-01bd-4bcc-b7d5-b5580f10c19f, amount 1350000, Cr) was created
-- successfully, but its linked payable bill in pending_payments was never
-- created — the insert failed on the old fixed "OPENING-<FY>" invoice_no
-- already used by his first (180000) opening balance, and the save wasn't
-- atomic, so the opening_balances row was left orphaned with nothing to
-- pay against it anywhere (confirmed via diagnostic 525). Creating the
-- missing bill now, using the same unique-per-entry invoice_no format the
-- code now generates for new entries.
INSERT INTO public.pending_payments (
  vendor_name, party_id, partner_id, is_opening, opening_balance_id,
  invoice_no, invoice_amount, net_payable,
  invoice_date, grn_date, pay_before_date,
  payment_type, payment_status, po_raised_by
)
SELECT 'Amit Das', NULL, ob.partner_id, true, ob.id,
  'OPENING-' || ob.fy || '-' || substring(ob.id::text, 1, 8),
  ob.amount, ob.amount,
  ob.as_of_date, ob.as_of_date, ob.as_of_date,
  'NEFT', 'Pending', 'Opening'
FROM public.opening_balances ob
WHERE ob.id = '65dbac3c-01bd-4bcc-b7d5-b5580f10c19f'
  AND NOT EXISTS (SELECT 1 FROM public.pending_payments pp WHERE pp.opening_balance_id = ob.id);

SELECT 'sentinel' AS marker, 1 AS n;
SELECT id, vendor_name, invoice_no, invoice_amount, payment_status, opening_balance_id
FROM public.pending_payments WHERE opening_balance_id = '65dbac3c-01bd-4bcc-b7d5-b5580f10c19f';
