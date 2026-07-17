-- The 10 remaining orphaned rows display as "Toxfin 360 Dry" (matching
-- migration 484's exact-match list) yet weren't updated by it — there
-- must be a hidden character (extra space, non-breaking space, etc.)
-- that looks identical on screen. Surface the exact byte length and
-- codepoints to confirm.
SELECT DISTINCT item_name, length(item_name) AS len,
  encode(convert_to(item_name, 'UTF8'), 'hex') AS hex
FROM public.stock_ledger
WHERE item_id IS NULL AND item_name ILIKE '%toxfin%';
