-- 281's PL/pgSQL backfill loop ran with "Errors: 0" but created no rows for
-- GRN 2758-2761. Check for any other trigger on pending_payments that could
-- be silently vetoing/no-op'ing writes, then redo the backfill as a plain
-- set-based INSERT ... SELECT (no loop, nothing to get subtly wrong).

SELECT tgname, tgenabled FROM pg_trigger
WHERE tgrelid = 'public.pending_payments'::regclass AND NOT tgisinternal;

INSERT INTO public.pending_payments
  (vendor_name, party_id, grn_no, grn_date, invoice_no, invoice_date,
   invoice_amount, payment_status, credit_limit, pay_before_date)
SELECT
  p.name, p.id, g.grn_no, MIN(g.grn_date), MIN(g.invoice_no), MIN(g.invoice_date),
  SUM(COALESCE(g.total_amount, g.basic_amount, 0)), 'Pending',
  NULLIF(COALESCE(po.credit_limit_days, p.credit_days, 0), 0),
  CASE WHEN COALESCE(po.credit_limit_days, p.credit_days, 0) > 0
       THEN MIN(g.grn_date) + COALESCE(po.credit_limit_days, p.credit_days, 0)
       ELSE NULL END
FROM public.grn g
JOIN public.parties p ON p.id = g.party_id
LEFT JOIN LATERAL (
  SELECT credit_limit_days FROM public.purchase_orders
  WHERE po_no = g.po_no AND credit_limit_days IS NOT NULL LIMIT 1
) po ON true
WHERE g.grn_no IN ('2758','2759','2760','2761')
GROUP BY p.name, p.id, g.grn_no, po.credit_limit_days, p.credit_days
ON CONFLICT (vendor_name, grn_no)
DO UPDATE SET
  invoice_amount = EXCLUDED.invoice_amount,
  net_payable    = GREATEST(0, EXCLUDED.invoice_amount - COALESCE(public.pending_payments.tds_amount, 0)),
  grn_date       = EXCLUDED.grn_date,
  invoice_no     = EXCLUDED.invoice_no,
  invoice_date   = EXCLUDED.invoice_date,
  party_id       = EXCLUDED.party_id,
  credit_limit   = COALESCE(EXCLUDED.credit_limit, public.pending_payments.credit_limit),
  pay_before_date = COALESCE(EXCLUDED.pay_before_date, public.pending_payments.pay_before_date);

SELECT vendor_name, grn_no, grn_date, invoice_amount, credit_limit
FROM public.pending_payments
WHERE grn_no IN ('2758','2759','2760','2761')
ORDER BY grn_no;
