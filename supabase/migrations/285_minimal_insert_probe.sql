-- Isolate whether writes via run_sql.py's per-statement Management API calls
-- actually persist. Insert one throwaway row with literal values (no joins,
-- no aggregates, no ON CONFLICT) and read it back in the next statement.
INSERT INTO public.pending_payments
  (vendor_name, grn_no, invoice_amount, payment_status)
VALUES ('__PROBE_VENDOR__', '__PROBE_GRN__', 1, 'Pending');

SELECT vendor_name, grn_no, invoice_amount FROM public.pending_payments
WHERE vendor_name = '__PROBE_VENDOR__';

-- Clean up the probe row regardless of outcome.
DELETE FROM public.pending_payments WHERE vendor_name = '__PROBE_VENDOR__';
