-- Diagnostic only, before changing anything on the payments side. Checking what
-- columns already exist rather than assuming: a TDS field may already be there
-- under another name, and adding a second would give two answers.
SELECT COALESCE(string_agg(column_name || ' ' || data_type, ', ' ORDER BY ordinal_position), 'TABLE MISSING') AS pending_payments_columns
FROM information_schema.columns WHERE table_schema='public' AND table_name='pending_payments';

SELECT COALESCE(string_agg(column_name || ' ' || data_type, ', ' ORDER BY ordinal_position), 'TABLE MISSING') AS manual_items_columns
FROM information_schema.columns WHERE table_schema='public' AND table_name='payment_plan_manual_items';

SELECT COUNT(*)::text AS pending_rows,
       COUNT(*) FILTER (WHERE payment_status = 'Partial')::text AS partial_rows,
       COUNT(*) FILTER (WHERE COALESCE(paid_amount,0) > 0)::text AS with_paid_amount
FROM public.pending_payments;
