-- Solucal (and similar) has a rate recorded in Inventory > Adjustments
-- (feed_stock_adjustments, which despite the "feed" name is the shared
-- opening/adjustment ledger for ALL items including medicines — matched by
-- ingredient_name text) but no GRN purchase. v_medicine_stock only read GRN,
-- so items with only an adjustment-sourced rate still showed Rs 0.00.
-- Fall back to the latest adjustment rate (by name match) when there's no
-- GRN purchase for that medicine.
CREATE OR REPLACE VIEW public.v_medicine_stock AS
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
  p.last_expiry_date,
  a.adjustment_rate
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
  WHERE medicine_id IS NOT NULL
  GROUP BY medicine_id
) p ON p.medicine_id = m.id
LEFT JOIN (
  SELECT
    medicine_id,
    SUM(quantity) AS used_qty,
    SUM(amount)   AS used_value
  FROM public.medicine_usage
  GROUP BY medicine_id
) u ON u.medicine_id = m.id
LEFT JOIN (
  SELECT DISTINCT ON (lower(trim(ingredient_name)))
    lower(trim(ingredient_name)) AS norm_name, rate AS adjustment_rate
  FROM public.feed_stock_adjustments
  WHERE rate IS NOT NULL AND rate > 0
  ORDER BY lower(trim(ingredient_name)), adjustment_date DESC
) a ON a.norm_name = lower(trim(m.name));

SELECT 'solucal_after_fix' AS chk, name, purchased_qty, purchase_value, adjustment_rate
FROM public.v_medicine_stock WHERE name ILIKE '%solucal%';
