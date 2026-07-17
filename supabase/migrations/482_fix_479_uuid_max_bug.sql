-- Root cause of 479's silent failure: PostgreSQL has no built-in MAX()
-- aggregate for the uuid type — MAX(resolved_party_id) throws "function
-- max(uuid) does not exist", and that error message contains "does not
-- exist", which run_sql.py's documented bug treats as silent success.
-- Fix: cast to text for the aggregate, cast back to uuid for the result.
DROP VIEW IF EXISTS public.v_vendor_statement;
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
      MAX(resolved_party_id::text)::uuid AS resolved_party_id,
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
SELECT vendor_name, outstanding FROM public.v_vendor_statement WHERE vendor_name ILIKE '%Venco%';
