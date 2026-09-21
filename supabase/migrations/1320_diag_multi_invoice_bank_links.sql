-- READ ONLY. No INSERT, UPDATE or DELETE anywhere in this file.
--
-- A bank receipt that settles SEVERAL invoices stores only the first one of
-- each kind on the bank row - bank_transactions has a single nhe_sale_id and a
-- single he_dispatch_id - so the edit modal names one invoice while
-- settled_amount covers them all. Measure how many entries that affects and
-- what, if anything, already links an invoice back to the bank row it was
-- settled by.

-- 1. Receipts whose settled_amount exceeds the single invoice they name.
--    Those are the ones settling more than one.
SELECT count(*)::int AS receipts_with_settlement,
       count(*) FILTER (WHERE COALESCE(b.settled_amount,0) > 0
                          AND (b.nhe_sale_id IS NOT NULL OR b.he_dispatch_id IS NOT NULL))::int AS named_at_least_one,
       count(*) FILTER (WHERE COALESCE(b.settled_amount,0) > 0
                          AND b.nhe_sale_id IS NULL AND b.he_dispatch_id IS NULL)::int AS names_none,
       round(sum(COALESCE(b.settled_amount,0)))::int AS settled_total
FROM public.bank_transactions b
WHERE COALESCE(b.settled_amount,0) > 0;

-- 2. Where the named invoice accounts for less than what was settled, the
--    rest went to invoices the bank row cannot name.
SELECT b.txn_date::text AS txn_date,
       round(b.amount)::int AS amount,
       round(COALESCE(b.settled_amount,0))::int AS settled,
       COALESCE(hd.invoice_no, hd.dc_no::text, ns.invoice_no, ns.dc_no, '(none)') AS named_invoice,
       round(COALESCE(hd.amount_received, ns.amount_received, 0))::int AS named_invoice_received
FROM public.bank_transactions b
LEFT JOIN public.he_dispatch hd ON hd.id = b.he_dispatch_id
LEFT JOIN public.nhe_sales  ns ON ns.id = b.nhe_sale_id
WHERE COALESCE(b.settled_amount,0) > 0
  AND COALESCE(b.settled_amount,0) > COALESCE(hd.amount_received, ns.amount_received, 0)
ORDER BY b.txn_date DESC;

-- 3. What could tie an invoice back to the bank row that settled it. The
--    purchase side tags pending_payments.transaction_ref with BANKTXN:<id>;
--    check whether anything equivalent exists on the sales side.
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('he_dispatch','nhe_sales')
  AND (column_name LIKE '%utr%' OR column_name LIKE '%bank%' OR column_name LIKE '%ref%'
       OR column_name LIKE '%txn%' OR column_name LIKE '%transaction%')
ORDER BY table_name, column_name;

-- 4. Is utr_ref actually populated, and does it match a bank reference_no?
SELECT (SELECT count(*)::int FROM public.he_dispatch WHERE utr_ref IS NOT NULL) AS he_with_utr,
       (SELECT count(*)::int FROM public.nhe_sales  WHERE utr_ref IS NOT NULL) AS nhe_with_utr,
       (SELECT count(*)::int FROM public.he_dispatch hd
        JOIN public.bank_transactions b ON b.reference_no = hd.utr_ref) AS he_utr_matching_a_bank_row,
       (SELECT count(*)::int FROM public.bank_transactions WHERE reference_no IS NOT NULL) AS bank_rows_with_ref;
