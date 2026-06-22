-- Migration 113: GRN Unification — single receiving register for all stock
-- Adds category + medicine columns to grn, migrates medicine_purchases data,
-- updates v_medicine_stock to read from grn.

-- 1. New columns on grn
ALTER TABLE public.grn
  ADD COLUMN IF NOT EXISTS category    TEXT NOT NULL DEFAULT 'Feed',
  ADD COLUMN IF NOT EXISTS gst_amount  NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS medicine_id UUID REFERENCES public.medicines_master(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS batch_no    TEXT,
  ADD COLUMN IF NOT EXISTS expiry_date DATE;

-- Confirm columns added
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'grn'
  AND column_name IN ('category','gst_amount','medicine_id','batch_no','expiry_date')
ORDER BY column_name;

-- 2. Migrate medicine_purchases → grn (compute GENERATED ALWAYS values manually)
INSERT INTO public.grn (
  grn_date, farm_id, party_id, invoice_no, invoice_date,
  category, medicine_id, item_name,
  qty, unit, price_per_unit,
  basic_amount, gst_amount, gst_pct, total_amount,
  batch_no, expiry_date, remarks,
  supply_type, nature, is_rcm, party_gstin,
  cgst_amount, sgst_amount, igst_amount,
  grn_no
)
SELECT
  mp.purchase_date,
  mp.farm_id,
  mp.supplier_id,
  mp.invoice_no,
  mp.invoice_date,
  CASE WHEN LOWER(COALESCE(mm.type,'medicine')) = 'vaccine' THEN 'Vaccine' ELSE 'Medicine' END,
  mp.medicine_id,
  COALESCE(mm.name, 'Unknown Medicine'),
  mp.qty,
  COALESCE(mp.unit, mm.unit),
  mp.rate,
  ROUND(mp.qty * mp.rate, 2),
  ROUND(mp.qty * mp.rate * COALESCE(mp.gst_pct, 0) / 100.0, 2),
  COALESCE(mp.gst_pct, 0),
  ROUND(mp.qty * mp.rate * (1 + COALESCE(mp.gst_pct, 0) / 100.0), 2),
  mp.batch_no,
  mp.expiry_date,
  mp.remarks,
  COALESCE(mp.supply_type, 'intra'),
  COALESCE(mp.nature, 'expense'),
  COALESCE(mp.is_rcm, false),
  mp.party_gstin,
  COALESCE(mp.cgst_amount, 0),
  COALESCE(mp.sgst_amount, 0),
  COALESCE(mp.igst_amount, 0),
  'MED-' || SUBSTRING(mp.id::TEXT, 1, 8)
FROM public.medicine_purchases mp
LEFT JOIN public.medicines_master mm ON mm.id = mp.medicine_id;

-- Verify migration row count
SELECT category, COUNT(*) AS rows
FROM public.grn
GROUP BY category
ORDER BY category;

-- 3. Update v_medicine_stock to read from grn instead of medicine_purchases
DROP VIEW IF EXISTS public.v_medicine_stock;

CREATE VIEW public.v_medicine_stock AS
SELECT
  m.id          AS medicine_id,
  m.name,
  m.type,
  m.unit,
  m.rate        AS master_rate,
  m.is_active,
  COALESCE(p.purchased_qty,  0) AS purchased_qty,
  COALESCE(p.purchase_value, 0) AS purchase_value,
  COALESCE(u.used_qty,       0) AS used_qty,
  COALESCE(u.used_value,     0) AS used_value,
  COALESCE(p.purchased_qty,  0) - COALESCE(u.used_qty, 0) AS balance_qty,
  p.last_purchase_date,
  p.last_batch_no,
  p.last_expiry_date
FROM public.medicines_master m
LEFT JOIN (
  SELECT
    medicine_id,
    SUM(qty)           AS purchased_qty,
    SUM(total_amount)  AS purchase_value,
    MAX(grn_date)      AS last_purchase_date,
    MAX(batch_no)      AS last_batch_no,
    MAX(expiry_date)   AS last_expiry_date
  FROM public.grn
  WHERE category IN ('Medicine', 'Vaccine') AND medicine_id IS NOT NULL
  GROUP BY medicine_id
) p ON p.medicine_id = m.id
LEFT JOIN (
  SELECT
    medicine_id,
    SUM(quantity) AS used_qty,
    SUM(amount)   AS used_value
  FROM public.medicine_usage
  GROUP BY medicine_id
) u ON u.medicine_id = m.id;

NOTIFY pgrst, 'reload schema';
