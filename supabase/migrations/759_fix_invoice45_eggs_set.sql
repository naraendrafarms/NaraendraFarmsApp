-- Migration 759: put back the eggs that linking an invoice overwrote.
--
-- Invoice NF/HHF/25-26/45 carried 50,400 eggs. Both batches linked to it were
-- rewritten to 50,400 each — 100,800 set against an invoice that held 50,400 —
-- because picking an invoice filled Eggs Set with its whole quantity over what
-- was already there. The form no longer does that.
--
-- Which figure belongs to which batch is not a guess: the two are one setting
-- (22-110-559, hatched 07/10/2025) split across two floors of Ruiya, and the
-- chicks are exactly 1:2 — 8,100 on the ground floor, 16,200 on the top. That
-- pairs with 10,080 and 20,160, and both then give the same 80.4% hatch. Had
-- 50,400 each been right, the hatch would read 16% and 32%.

UPDATE public.hatch_batches SET eggs_set = 10080
WHERE id = '088915a5-20f7-4821-9964-ae8710b3cace' AND eggs_set = 50400;

UPDATE public.hatch_batches SET eggs_set = 20160
WHERE id = '5ee8e554-5ecd-42df-9d1c-2d197b833fc7' AND eggs_set = 50400;

SELECT 'after' AS chk, COALESCE(string_agg(x.d, '   ///   '), '(none)') AS batches
FROM (
  SELECT COALESCE(h.name, hb.hatchery_name, '?') || ': set=' || hb.eggs_set::text
         || ' chicks=' || COALESCE(hb.hatched_chicks, 0)::text
         || ' hatch=' || CASE WHEN COALESCE(hb.eggs_set,0) > 0
              THEN round(100.0 * COALESCE(hb.hatched_chicks,0) / hb.eggs_set, 1)::text || '%'
              ELSE '-' END
         || ' fertile=' || COALESCE(hb.fertile_eggs, 0)::text AS d
  FROM public.hatch_batches hb
  LEFT JOIN public.hatcheries h ON h.id = hb.hatchery_id
  WHERE hb.dispatch_id = (SELECT id FROM public.he_dispatch WHERE invoice_no = 'NF/HHF/25-26/45')
) x;

SELECT 'invoice_now' AS chk,
       (SELECT COALESCE(sum(eggs_set),0)::int FROM public.hatch_batches
        WHERE dispatch_id = (SELECT id FROM public.he_dispatch WHERE invoice_no = 'NF/HHF/25-26/45')) AS eggs_set_total,
       (SELECT total_dispatched FROM public.he_dispatch WHERE invoice_no = 'NF/HHF/25-26/45') AS invoice_eggs;

-- Fertile eggs cannot exceed the eggs set. These two now read ~50,300 fertile
-- against 10,080 and 20,160 set, which is impossible — reported, not guessed at.
SELECT 'fertile_over_set' AS chk, count(*)::int AS batches
FROM public.hatch_batches
WHERE COALESCE(fertile_eggs,0) > COALESCE(eggs_set,0) AND COALESCE(eggs_set,0) > 0;
