-- Migration 717: read-only. CEVAC IBIRD is in Items Master, yet a usage of
-- 72,500 doses on 30/06/2026 wrote a ledger row with NO name and NO item link.
-- Look for duplicates, near-spellings and merge leftovers before changing
-- anything.

SELECT 'items' AS chk, id::text AS item_id, name, code, category, unit, is_active
FROM public.items
WHERE name ILIKE '%cevac%' OR name ILIKE '%ibird%' OR name ILIKE '%ib bird%'
ORDER BY name;

SELECT 'aliases' AS chk, a.alias, a.item_id::text AS item_id, i.name AS points_to
FROM public.item_aliases a LEFT JOIN public.items i ON i.id = a.item_id
WHERE a.alias ILIKE '%cevac%' OR a.alias ILIKE '%ibird%'
ORDER BY a.alias;

SELECT 'medicines_master' AS chk, id::text AS med_id, name
FROM public.medicines_master
WHERE name ILIKE '%cevac%' OR name ILIKE '%ibird%'
ORDER BY name;

SELECT 'usage_rows' AS chk, mu.medicine_id::text AS med_id, mm.name AS medicine,
       count(*)::int AS n_usages, round(sum(mu.quantity)::numeric, 2) AS total_qty
FROM public.medicine_usage mu LEFT JOIN public.medicines_master mm ON mm.id = mu.medicine_id
WHERE mm.name ILIKE '%cevac%' OR mm.name ILIKE '%ibird%'
GROUP BY mu.medicine_id, mm.name ORDER BY mm.name;

SELECT 'ledger_rows' AS chk, COALESCE(NULLIF(btrim(sl.item_name), ''), '(blank)') AS item_name,
       sl.item_id::text AS item_id, sl.txn_type, count(*)::int AS n,
       round(sum(sl.qty)::numeric, 2) AS total_qty
FROM public.stock_ledger sl
WHERE sl.item_name ILIKE '%cevac%' OR sl.item_name ILIKE '%ibird%'
   OR sl.med_usage_id IN (SELECT mu.id FROM public.medicine_usage mu
                          LEFT JOIN public.medicines_master mm ON mm.id = mu.medicine_id
                          WHERE mm.name ILIKE '%cevac%' OR mm.name ILIKE '%ibird%')
GROUP BY 2, 3, 4 ORDER BY 2, 4;

SELECT 'usage_item_link' AS chk, count(*)::int AS usages_with_item_id
FROM public.medicine_usage mu
LEFT JOIN public.medicines_master mm ON mm.id = mu.medicine_id
WHERE (mm.name ILIKE '%cevac%' OR mm.name ILIKE '%ibird%') AND mu.item_id IS NOT NULL;
