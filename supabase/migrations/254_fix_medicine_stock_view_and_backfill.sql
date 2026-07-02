-- Fixes why Famitone (and likely other non-Medicine/Vaccine items tracked in
-- medicines_master, e.g. Sanitizer/Disinfectant) showed Rs 0.00 / "not in GRN"
-- rate in flock medicine usage:
--
-- 1) v_medicine_stock only aggregated GRN purchases where category IN
--    ('Medicine','Vaccine') — but medicines_master also covers other types
--    (Famitone is type 'sanitizer'). Its real GRN purchase (qty 108 @ Rs580,
--    02/04/2026) was excluded purely by category label, even though the row
--    genuinely represents a medicines_master item.
-- 2) That GRN row also had medicine_id = NULL — the entry form (now fixed in
--    code) only linked medicine_id for category Medicine/Vaccine, so a
--    Sanitizer-category purchase of a medicines_master item saved with no
--    link at all. Backfilling by exact name match here.

-- (1) Widen the view: the authoritative signal is medicine_id being linked,
--     not the free-text category string.
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
  COALESCE(u.used_qty, 0)       AS used_qty,
  COALESCE(u.used_value, 0)     AS used_value,
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
) u ON u.medicine_id = m.id;

-- (2) Backfill medicine_id on existing GRN rows that clearly match a
--     medicines_master item by name but never got linked (any category).
UPDATE public.grn g
SET medicine_id = mm.id
FROM public.medicines_master mm
WHERE g.medicine_id IS NULL
  AND lower(trim(g.item_name)) = lower(trim(mm.name));

SELECT 'famitone_after_fix' AS chk, * FROM public.v_medicine_stock WHERE name ILIKE '%famitone%';
SELECT 'grn_backfilled_medicine_id' AS chk, count(*) FROM public.grn WHERE medicine_id IS NOT NULL;
