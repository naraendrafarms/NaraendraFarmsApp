-- Owner-approved: link Flock 20's hatch batches to their dispatches by DATE
-- ORDER, FIFO ON EGG COUNT.
--
-- Why a rule rather than a key: the 231 unlinked batches carry no invoice and no
-- DC - only hatchery, setting date, eggs set and the hatch results the owner
-- typed. What makes the rule safe is that the totals reconcile exactly: 232
-- batches hold 53,42,409 eggs and the 90 Hitech dispatches sent 53,42,409. Not
-- one egg out.
--
-- The method: lay both lists end to end in date order and give each batch the
-- dispatch that covers its MIDPOINT of the running egg count. Ranges are
-- contiguous and the totals equal, so every batch lands on exactly one dispatch
-- and none is left over. The midpoint, rather than the start, keeps a batch that
-- straddles a boundary with the dispatch it mostly came from.
--
-- HATCH RESULTS ARE NOT TOUCHED. Only dispatch_id is written, and only where it
-- is currently empty - the batch the owner linked by hand is left exactly as it
-- is, and serves as a check: the rule should reproduce his own answer for it.

CREATE TABLE IF NOT EXISTS public.hatch_batches_link_1222 AS
SELECT id, flock_id, hatchery_name, setting_date, eggs_set,
       dispatch_id AS old_dispatch_id, now() AS backed_up_at
FROM public.hatch_batches
WHERE flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'::uuid;

WITH b AS (
  SELECT hb.id,
         sum(hb.eggs_set) OVER w - hb.eggs_set AS cum_start,
         sum(hb.eggs_set) OVER w                AS cum_end
  FROM public.hatch_batches hb
  WHERE hb.flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'::uuid
    AND hb.eggs_set IS NOT NULL
  WINDOW w AS (ORDER BY hb.setting_date, hb.id ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)
),
d AS (
  SELECT dd.id,
         sum(dd.total_dispatched) OVER w - dd.total_dispatched AS cum_start,
         sum(dd.total_dispatched) OVER w                        AS cum_end
  FROM public.he_dispatch dd
  JOIN public.parties p ON p.id = dd.party_id
  WHERE dd.flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'::uuid
    AND dd.dispatch_date BETWEEN '2025-12-01' AND '2026-08-04'
    AND p.name ILIKE '%hitech%'
  WINDOW w AS (ORDER BY dd.dispatch_date, dd.dc_no ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)
),
pair AS (
  SELECT b.id AS batch_id, d.id AS dispatch_id
  FROM b JOIN d
    ON (b.cum_start + b.cum_end) / 2.0 >= d.cum_start
   AND (b.cum_start + b.cum_end) / 2.0 <  d.cum_end
)
UPDATE public.hatch_batches hb
SET dispatch_id = pair.dispatch_id
FROM pair
WHERE hb.id = pair.batch_id
  AND hb.dispatch_id IS NULL;
