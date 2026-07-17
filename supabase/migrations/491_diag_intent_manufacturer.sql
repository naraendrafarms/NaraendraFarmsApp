-- Checking whether Purchase Intent lines linked to Items Master actually
-- have a manufacturer on that item — if manufacturer is NULL there, the
-- "Mfr: ..." line correctly shows nothing (a data gap, not a code bug).
SELECT
  count(*) AS total_lines,
  count(*) FILTER (WHERE pil.item_id IS NOT NULL) AS linked_lines,
  count(*) FILTER (WHERE pil.item_id IS NOT NULL AND i.manufacturer IS NOT NULL AND i.manufacturer != '') AS linked_with_manufacturer,
  count(*) FILTER (WHERE pil.item_id IS NOT NULL AND (i.manufacturer IS NULL OR i.manufacturer = '')) AS linked_but_no_manufacturer
FROM public.purchase_intent_lines pil
LEFT JOIN public.items i ON i.id = pil.item_id;

-- Sample of linked lines with no manufacturer, to see which items/categories are affected
SELECT pil.item_name, i.name AS master_name, i.category, i.manufacturer
FROM public.purchase_intent_lines pil
JOIN public.items i ON i.id = pil.item_id
WHERE i.manufacturer IS NULL OR i.manufacturer = ''
LIMIT 20;
