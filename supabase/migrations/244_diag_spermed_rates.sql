-- Diagnostic only (SELECT), no data changes. Investigating why SPERMED
-- production-cost rate is picking a stock_ledger adjustment instead of the
-- correct/recent GRN rate, even after item-master rename + GRN row edit.

-- 1) Current master row(s) for SPERMED (confirm no leftover duplicate ids)
SELECT id, name, code FROM public.feed_ingredients WHERE name ILIKE '%sperm%';

-- 2) GRN purchase rows (what the rate lookup keys off item_name for)
SELECT id, item_name, price_per_unit, qty, other_charges, grn_date
FROM public.grn WHERE category = 'Feed' AND item_name ILIKE '%sperm%'
ORDER BY grn_date DESC;

-- 3) stock_ledger adjustment/opening rows (the other source merged into the rate list)
SELECT id, item_name, unit_price, txn_date, txn_type
FROM public.stock_ledger
WHERE item_name ILIKE '%sperm%' AND txn_type IN ('opening','adjustment_in')
ORDER BY txn_date DESC;

-- 4) What name string is actually stored on production ingredient rows (frozen at save time)
SELECT fpi.ingredient_name, fpi.ingredient_id, fpl.production_date
FROM public.feed_production_ingredients fpi
JOIN public.feed_production_log fpl ON fpl.id = fpi.production_id
WHERE fpi.ingredient_name ILIKE '%sperm%'
ORDER BY fpl.production_date DESC;
