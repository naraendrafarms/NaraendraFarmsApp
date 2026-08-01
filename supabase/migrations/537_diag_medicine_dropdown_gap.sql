-- Diagnostic only (no schema changes) — user reports the Bulk Daily Entry
-- flock-level Medicine dropdown is missing items that DO show under Items
-- Master. Bulk Daily Entry reads from medicines_master (filtered
-- is_active = true), Items Master reads directly from items with no
-- filter at all. Checking for the gap between the two.

-- 1. Items categorized as a medicine-type that have NO linked medicines_master row
SELECT i.id, i.name, i.category, i.is_active, i.created_at
FROM public.items i
WHERE i.category IN ('Medicine','Vaccine','Injectable','Supplement','Sanitizer','Disinfectant','Pesticide')
  AND NOT EXISTS (SELECT 1 FROM public.medicines_master m WHERE m.item_id = i.id)
ORDER BY i.created_at DESC
LIMIT 20;

-- 2. medicines_master rows that are inactive (hidden from the alias-search
--    dropdown Bulk Daily Entry uses, even though their linked item may be active)
SELECT m.id, m.name, m.is_active AS med_active, i.name AS item_name, i.is_active AS item_active
FROM public.medicines_master m
LEFT JOIN public.items i ON i.id = m.item_id
WHERE m.is_active = FALSE
ORDER BY m.created_at DESC
LIMIT 20;

-- 3. Simple counts for context
SELECT
  (SELECT count(*) FROM public.items WHERE category IN ('Medicine','Vaccine','Injectable','Supplement','Sanitizer','Disinfectant','Pesticide')) AS total_med_items,
  (SELECT count(*) FROM public.medicines_master) AS total_medicines_master,
  (SELECT count(*) FROM public.medicines_master WHERE is_active = TRUE) AS active_medicines_master;

SELECT 'sentinel' AS marker, 1 AS n;
