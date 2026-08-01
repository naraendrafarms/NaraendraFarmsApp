-- Diagnostic only (no schema changes) — 537 found 8 items tagged as a
-- medicine-type category with no medicines_master row LINKED BY item_id.
-- But item_id linking only exists from migration 453 onward, and some
-- medicines_master rows may still only be linked by NAME (pre-453) rather
-- than item_id. Checking whether these 8 items truly have NO matching
-- medicines_master row at all (by name too), which would fully explain
-- why they're invisible in the Bulk Daily Entry dropdown.
SELECT i.id, i.name, i.category, i.created_at,
  (SELECT m.id FROM public.medicines_master m WHERE LOWER(TRIM(m.name)) = LOWER(TRIM(i.name)) LIMIT 1) AS name_matched_medicine_id
FROM public.items i
WHERE i.category IN ('Medicine','Vaccine','Injectable','Supplement','Sanitizer','Disinfectant','Pesticide')
  AND NOT EXISTS (SELECT 1 FROM public.medicines_master m WHERE m.item_id = i.id)
ORDER BY i.created_at DESC;

SELECT 'sentinel' AS marker, 1 AS n;
