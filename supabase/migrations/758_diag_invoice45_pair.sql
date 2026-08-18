-- Migration 758: read-only. The runner prints single-row answers reliably and
-- skips some multi-row ones, so ask for the two batches as ONE row of text.

SELECT 'pair' AS chk, COALESCE(string_agg(x.d, '   ///   ' ORDER BY x.created_at), '(none)') AS batches
FROM (
  SELECT hb.created_at,
         'id=' || hb.id::text
         || ' set=' || COALESCE(hb.eggs_set, 0)::text
         || ' chicks=' || COALESCE(hb.hatched_chicks, 0)::text
         || ' fertile=' || COALESCE(hb.fertile_eggs, 0)::text
         || ' hatchery=' || COALESCE(h.name, hb.hatchery_name, '?')
         || ' settingno=' || COALESCE(hb.setting_no, '-')
         || ' hatch=' || COALESCE(hb.hatch_date::text, '-') AS d
  FROM public.hatch_batches hb
  LEFT JOIN public.hatcheries h ON h.id = hb.hatchery_id
  WHERE hb.dispatch_id = (SELECT id FROM public.he_dispatch WHERE invoice_no = 'NF/HHF/25-26/45')
) x;
