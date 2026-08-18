-- Migration 760: recompute fertile eggs after the eggs_set repair.
--
-- I told the user fertile eggs must have been wrong beforehand. That was
-- wrong, and the code says so plainly: fertile is not typed, it is derived —
--   setting = eggs set − broken in transit
--   fertile = setting − infertile
-- so overwriting Eggs Set with the invoice's 50,400 recalculated fertile to
-- 50,321 and 50,271. Migration 759 put eggs_set back but left the derived
-- figure behind it, which is why fertile still exceeded eggs set.
--
-- Broken and infertile come from the hatchery report and were never touched,
-- so the arithmetic below restores the figure rather than inventing one. The
-- same correction is applied to ANY batch whose stored fertile disagrees with
-- its own components — nothing else should be carrying a stale one either.

UPDATE public.hatch_batches hb
SET fertile_eggs = GREATEST(0, COALESCE(hb.eggs_set,0) - COALESCE(hb.broken_transit,0) - COALESCE(hb.infertile,0)),
    fertility_pct = CASE
      WHEN COALESCE(hb.eggs_set,0) - COALESCE(hb.broken_transit,0) > 0
      THEN round(100.0 * GREATEST(0, COALESCE(hb.eggs_set,0) - COALESCE(hb.broken_transit,0) - COALESCE(hb.infertile,0))
                 / (COALESCE(hb.eggs_set,0) - COALESCE(hb.broken_transit,0)), 2)
      ELSE NULL END
WHERE hb.fertile_eggs IS NOT NULL
  AND hb.fertile_eggs <> GREATEST(0, COALESCE(hb.eggs_set,0) - COALESCE(hb.broken_transit,0) - COALESCE(hb.infertile,0));

SELECT 'invoice45_now' AS chk, COALESCE(string_agg(x.d, '   ///   '), '(none)') AS batches
FROM (
  SELECT COALESCE(h.name, hb.hatchery_name, '?') || ': set=' || hb.eggs_set::text
         || ' broken=' || COALESCE(hb.broken_transit,0)::text
         || ' infertile=' || COALESCE(hb.infertile,0)::text
         || ' fertile=' || COALESCE(hb.fertile_eggs,0)::text
         || ' fert%=' || COALESCE(hb.fertility_pct::text, '-')
         || ' chicks=' || COALESCE(hb.hatched_chicks,0)::text AS d
  FROM public.hatch_batches hb
  LEFT JOIN public.hatcheries h ON h.id = hb.hatchery_id
  WHERE hb.dispatch_id = (SELECT id FROM public.he_dispatch WHERE invoice_no = 'NF/HHF/25-26/45')
) x;

SELECT 'fertile_over_set' AS chk, count(*)::int AS batches
FROM public.hatch_batches
WHERE COALESCE(fertile_eggs,0) > COALESCE(eggs_set,0) AND COALESCE(eggs_set,0) > 0;

SELECT 'chicks_over_fertile' AS chk, count(*)::int AS batches
FROM public.hatch_batches
WHERE COALESCE(hatched_chicks,0) > COALESCE(fertile_eggs,0) AND COALESCE(fertile_eggs,0) > 0;
