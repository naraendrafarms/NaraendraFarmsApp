-- Migration 756: read-only. Statement 2 of 755 printed nothing, so ask again on
-- its own: exactly what the batches on invoice NF/HHF/25-26/45 hold now.

SELECT 'batches' AS chk,
       COALESCE(string_agg(x.d, '  ///  ' ORDER BY x.setting_date), '(none)') AS list
FROM (
  SELECT hb.setting_date,
         hb.setting_date::text || ' set ' || COALESCE(hb.eggs_set, 0)::text
         || ' chicks ' || COALESCE(hb.hatched_chicks, 0)::text
         || ' at ' || COALESCE(h.name, hb.hatchery_name, '?')
         || ' [' || hb.id::text || ']' AS d
  FROM public.hatch_batches hb
  LEFT JOIN public.hatcheries h ON h.id = hb.hatchery_id
  WHERE hb.dispatch_id = (SELECT id FROM public.he_dispatch WHERE invoice_no = 'NF/HHF/25-26/45')
) x;

SELECT 'totals' AS chk,
       (SELECT COALESCE(sum(eggs_set), 0)::int FROM public.hatch_batches
        WHERE dispatch_id = (SELECT id FROM public.he_dispatch WHERE invoice_no = 'NF/HHF/25-26/45')) AS eggs_set_total,
       (SELECT total_dispatched FROM public.he_dispatch WHERE invoice_no = 'NF/HHF/25-26/45') AS invoice_eggs;

-- The five batches whose eggs_set exactly equals the whole invoice: the same
-- auto-fill may have overwritten these too.
SELECT 'exact_match_list' AS chk,
       COALESCE(string_agg(y.d, '  ///  '), '(none)') AS list
FROM (
  SELECT COALESCE(d.invoice_no, 'DC-' || d.dc_no::text) || ' ' || hb.setting_date::text
         || ' set=' || hb.eggs_set::text || ' invoice=' || d.total_dispatched::text AS d
  FROM public.hatch_batches hb JOIN public.he_dispatch d ON d.id = hb.dispatch_id
  WHERE hb.eggs_set = d.total_dispatched AND COALESCE(d.total_dispatched,0) > 0
  ORDER BY hb.setting_date DESC LIMIT 10
) y;
