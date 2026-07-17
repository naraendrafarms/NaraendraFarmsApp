-- migration 479's CREATE VIEW silently failed (view_exists came back 0
-- despite "Errors: 0") — re-run just the CREATE VIEW here in isolation so
-- the actual Postgres error message (if any) surfaces in the job log,
-- rather than being swallowed by run_sql.py's silent-success matching.
CREATE VIEW public.v_vendor_statement AS
  WITH resolved AS (
    SELECT pp.*,
      COALESCE(pp.party_id, (SELECT p.id FROM public.parties p
        WHERE LOWER(TRIM(p.name)) = LOWER(TRIM(pp.vendor_name)) LIMIT 1)) AS resolved_party_id
    FROM public.pending_payments pp
    WHERE (pp.is_partner_remuneration IS NULL OR pp.is_partner_remuneration = false)
  ),
  advances AS (
    SELECT party_id, COALESCE(SUM(GREATEST(0, amount - amount_used)), 0) AS available_advance
    FROM public.vendor_advances
    GROUP BY party_id
  ),
  base AS (
    SELECT
      vendor_name,
      MAX(resolved_party_id) AS resolved_party_id,
      COUNT(*) AS bill_count,
      COALESCE(SUM(invoice_amount), 0) AS total_billed,
      COALESCE(SUM(CASE WHEN payment_status = 'Paid'
               THEN COALESCE(invoice_amount, 0)
               ELSE COALESCE(paid_amount, 0) END), 0) AS total_paid,
      COALESCE(SUM(CASE WHEN payment_status = 'Paid' THEN 0
               ELSE GREATEST(0,
                 COALESCE(net_payable, invoice_amount, 0)
                 - COALESCE(discount_amount, 0)
                 - COALESCE(paid_amount, 0)) END), 0) AS outstanding_raw,
      MAX(grn_date) AS last_bill_date
    FROM resolved
    GROUP BY vendor_name
  )
  SELECT
    base.vendor_name, base.bill_count, base.total_billed, base.total_paid,
    GREATEST(0, base.outstanding_raw - COALESCE(adv.available_advance, 0)) AS outstanding,
    base.last_bill_date
  FROM base
  LEFT JOIN advances adv ON adv.party_id = base.resolved_party_id;

SELECT count(*) AS view_exists FROM information_schema.views WHERE table_name='v_vendor_statement';
