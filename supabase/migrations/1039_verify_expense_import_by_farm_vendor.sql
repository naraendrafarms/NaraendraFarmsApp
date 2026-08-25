SELECT string_agg(coalesce(f.code,'no-farm(vehicle)') || ':' || cnt, ', ' ORDER BY cnt DESC) AS by_farm
FROM (
  SELECT farm_id, count(*) cnt FROM public.farm_expenses
  WHERE created_at > now() - interval '10 minutes'
  GROUP BY farm_id
) x
LEFT JOIN public.farms f ON f.id = x.farm_id;

SELECT string_agg(coalesce(f.code,'no-farm') || ':' || cnt, ', ' ORDER BY cnt DESC) AS cash_book_by_farm
FROM (
  SELECT farm_id, count(*) cnt FROM public.cash_book
  WHERE created_at > now() - interval '10 minutes'
  GROUP BY farm_id
) x
LEFT JOIN public.farms f ON f.id = x.farm_id;

SELECT string_agg(vendor || ':' || cnt || ' (₹' || tot || ')', ', ') AS vehicle_totals
FROM (
  SELECT vendor, count(*) cnt, sum(amount) tot FROM public.farm_expenses
  WHERE created_at > now() - interval '10 minutes' AND vendor IS NOT NULL
  GROUP BY vendor
) x;
