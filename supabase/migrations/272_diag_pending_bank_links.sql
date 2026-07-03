-- Diagnostic only (SELECT), no data changes. Check outstanding bank
-- statement transactions waiting to be linked (WaitingToLink feature) and
-- any pending_payments/receipts still unlinked.
SELECT 'bank_txn_waiting' AS chk, count(*) AS n, min(txn_date) AS earliest, max(txn_date) AS latest
FROM public.bank_transactions WHERE imported = true AND match_status = 'waiting';

SELECT 'bank_txn_by_status' AS chk, match_status, count(*) AS n
FROM public.bank_transactions WHERE imported = true GROUP BY match_status ORDER BY n DESC;

SELECT 'pending_payments_unpaid' AS chk, count(*) AS n, sum(COALESCE(net_payable,invoice_amount,0)) AS total_outstanding
FROM public.pending_payments WHERE payment_status <> 'Paid';
