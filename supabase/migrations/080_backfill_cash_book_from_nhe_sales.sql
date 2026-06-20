-- Migration 080: Backfill cash_book entries for existing NHE sales and HE dispatch
-- where cash was received but cash_book entry was never created (due to audit trigger bug).
-- Uses INSERT ... WHERE NOT EXISTS to avoid duplicates on re-run.

-- Map NHE sale_type to cash_book category
-- je → je_sale, te → te_sale, be → be_sale, he_sale → he_sale,
-- bird_sale / legacy bird types → bird_sale, manure → litter_sale, else → sales_collection

INSERT INTO public.cash_book (
  txn_date, txn_type, category, description, party_name,
  farm_id, flock_id, reference_no, amount_in, amount_out, payment_mode, remarks
)
SELECT
  ns.sale_date,
  'receipt',
  CASE
    WHEN ns.sale_type IN ('bird_sale','bird_cull','bird_lame','bird_weak','bird_sex_error') THEN 'bird_sale'
    WHEN ns.sale_type = 'manure'   THEN 'litter_sale'
    WHEN ns.sale_type = 'he_sale'  THEN 'he_sale'
    WHEN ns.sale_type = 'je'       THEN 'je_sale'
    WHEN ns.sale_type = 'te'       THEN 'te_sale'
    WHEN ns.sale_type = 'be'       THEN 'be_sale'
    ELSE 'sales_collection'
  END,
  CONCAT_WS(' — ',
    CASE
      WHEN ns.sale_type IN ('bird_sale','bird_cull','bird_lame','bird_weak','bird_sex_error') THEN 'Bird Sale'
      WHEN ns.sale_type = 'manure'   THEN 'Litter / Manure Sale'
      WHEN ns.sale_type = 'he_sale'  THEN 'HE Egg Sale'
      WHEN ns.sale_type = 'je'       THEN 'Jumbo Egg Sale (JE)'
      WHEN ns.sale_type = 'te'       THEN 'Table Egg Sale (TE)'
      WHEN ns.sale_type = 'be'       THEN 'Broken/Crack Egg Sale (BE)'
      ELSE 'NHE Sale'
    END,
    CASE WHEN f.flock_no IS NOT NULL THEN 'F-' || f.flock_no::TEXT END,
    ns.dc_no
  ),
  p.name,
  NULL,  -- farm_id not stored on nhe_sales; can be updated manually
  ns.flock_id,
  ns.dc_no,
  COALESCE(ns.payment_cash, ns.amount),
  0,
  'cash',
  'Backfilled from NHE Sales (migration 080)'
FROM public.nhe_sales ns
LEFT JOIN public.flocks  f ON f.id = ns.flock_id
LEFT JOIN public.parties p ON p.id = ns.party_id
WHERE ns.payment_status = 'Received'
  AND ns.payment_mode   = 'Cash'
  AND COALESCE(ns.payment_cash, ns.amount) > 0
  -- Only insert if no cash_book entry already references this sale via reference_no + date
  AND NOT EXISTS (
    SELECT 1 FROM public.cash_book cb
    WHERE cb.txn_date    = ns.sale_date
      AND cb.flock_id    = ns.flock_id
      AND cb.amount_in   = COALESCE(ns.payment_cash, ns.amount)
      AND cb.payment_mode = 'cash'
      AND cb.txn_type    = 'receipt'
      AND (cb.reference_no = ns.dc_no OR (cb.reference_no IS NULL AND ns.dc_no IS NULL))
  );

-- Also backfill HE dispatch cash payments
INSERT INTO public.cash_book (
  txn_date, txn_type, category, description, party_name,
  farm_id, flock_id, reference_no, amount_in, amount_out, payment_mode, remarks
)
SELECT
  hd.dispatch_date,
  'receipt',
  'he_sale',
  CONCAT_WS(' — ',
    'HE Egg Sale',
    CASE WHEN f.flock_no IS NOT NULL THEN 'F-' || f.flock_no::TEXT END,
    hd.invoice_no
  ),
  p.name,
  NULL,
  hd.flock_id,
  hd.invoice_no,
  hd.amount,
  0,
  'cash',
  'Backfilled from HE Dispatch (migration 080)'
FROM public.he_dispatch hd
LEFT JOIN public.flocks  f ON f.id = hd.flock_id
LEFT JOIN public.parties p ON p.id = hd.party_id
WHERE hd.payment_status = 'Received'
  AND hd.payment_mode   = 'Cash'
  AND hd.amount > 0
  AND NOT EXISTS (
    SELECT 1 FROM public.cash_book cb
    WHERE cb.txn_date    = hd.dispatch_date
      AND cb.flock_id    = hd.flock_id
      AND cb.amount_in   = hd.amount
      AND cb.payment_mode = 'cash'
      AND cb.txn_type    = 'receipt'
      AND (cb.reference_no = hd.invoice_no OR (cb.reference_no IS NULL AND hd.invoice_no IS NULL))
  );

NOTIFY pgrst, 'reload schema';
