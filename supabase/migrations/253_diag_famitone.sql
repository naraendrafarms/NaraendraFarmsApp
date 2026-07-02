-- Diagnostic only (SELECT), no data changes. Famitone medicine usage on
-- 06/05/2026 shows "not in GRN" / Rs 0.00 rate — check master, GRN, and the
-- v_medicine_stock view that the new medicine-usage rate fix reads from.
SELECT id, name, unit, rate, is_active FROM public.medicines_master WHERE name ILIKE '%famitone%';
SELECT id, medicine_id, item_name, category, price_per_unit, qty, total_amount, grn_date
FROM public.grn WHERE item_name ILIKE '%famitone%' ORDER BY grn_date DESC;
SELECT * FROM public.v_medicine_stock WHERE name ILIKE '%famitone%';
