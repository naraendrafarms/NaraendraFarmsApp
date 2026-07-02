-- Diagnostic only (SELECT), no data changes. Find the actual distinct
-- category values used in grn, to see why category='Feed' exact-match
-- filter in FeedMillPages.tsx production-cost rate lookup is missing rows.

SELECT category, count(*) AS n
FROM public.grn
GROUP BY category
ORDER BY n DESC;

-- Sanity check: how many grn rows exist at all for item names matching
-- current feed_ingredients masters, regardless of category
SELECT g.category, count(*) AS n
FROM public.grn g
WHERE EXISTS (
  SELECT 1 FROM public.feed_ingredients fi
  WHERE lower(trim(fi.name)) = lower(trim(g.item_name))
)
GROUP BY g.category
ORDER BY n DESC;
