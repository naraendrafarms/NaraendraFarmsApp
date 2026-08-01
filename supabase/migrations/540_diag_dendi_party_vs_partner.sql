-- Diagnostic only (no schema changes) — 539 found Dendi Naraendra Reddy
-- has a partners row (f356073d...) AND a pending_payments bill
-- 'REM-2026-06-DENDI' that carries BOTH party_id=84460852... and
-- partner_id=f356073d..., meaning he also has a real `parties` row —
-- yet the earlier "as party" name search in 539 returned 0 rows. That
-- means his parties.name doesn't literally match 'Dendi Naraendra Reddy'
-- (typo/spacing/short-name difference). Checking the exact name on record
-- and the full unpaid-bill list for both his party_id and partner_id.

SELECT id, name, type, is_active FROM public.parties WHERE id = '84460852-bf13-4685-a532-e027e8c6e9db';

SELECT id, vendor_name, invoice_no, party_id, partner_id, is_opening, payment_status, net_payable, paid_amount, discount_amount
FROM public.pending_payments
WHERE party_id = '84460852-bf13-4685-a532-e027e8c6e9db' OR partner_id = 'f356073d-d57d-4581-a943-74a524126e45'
ORDER BY invoice_date;

SELECT 'sentinel' AS marker, 1 AS n;
