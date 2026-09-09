-- Owner approved 09/09/2026. Correct the two Flock 20 links that migration 1222
-- got wrong, and nothing else.
--
-- WHAT WAS WRONG: 1222 matched batches to dispatches on a running egg total and
-- broke ties inside a setting date on hb.id, a random UUID that means nothing.
-- Three batches were set on 09/04/2026 - Howrah 50,400 (22-110-08), NilGanj
-- 30,240 (25-110-09) and NilGanj 10,080 (25-110-10) - and the random order put
-- the 50,400 first, so it fell across the join between two invoices. DC 4619
-- ended with 80,640 eggs set against 60,480 carried, which is the
-- dispatch_over_allocated critical rule from migration 754, and DC 4620 with
-- 40,320 of its 60,480.
--
-- THE CORRECTION: the two swap. Howrah 50,400 goes to DC 4620, NilGanj 30,240
-- goes to DC 4619. Then DC 4619 holds Ruiya Top Floor 30,240 plus NilGanj
-- 30,240 = 60,480, and DC 4620 holds Howrah 50,400 plus NilGanj 10,080 =
-- 60,480, and all 90 dispatches tally to the egg.
--
-- Only dispatch_id is written, on exactly two rows. No eggs set, no setting
-- date, no hatchery and no hatch result is touched - the linking-only limit the
-- owner set. The previous state is kept so this can be reversed exactly.

CREATE TABLE IF NOT EXISTS public.hatch_batches_link_1230 AS
SELECT id, setting_date, setting_no, hatchery_name, eggs_set,
       dispatch_id AS old_dispatch_id, now() AS backed_up_at
FROM public.hatch_batches
WHERE flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'::uuid
  AND setting_date = '2026-04-09' AND setting_no IN ('22-110-08','25-110-09','25-110-10');

-- 1. The swap. Either dispatch missing and this matches nothing rather than guessing.
WITH d19 AS (
  SELECT id FROM public.he_dispatch
  WHERE flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'::uuid
    AND dc_no = 4619 AND dispatch_date = '2026-04-04'
),
d20 AS (
  SELECT id FROM public.he_dispatch
  WHERE flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'::uuid
    AND dc_no = 4620 AND dispatch_date = '2026-04-06'
),
tgt AS (
  SELECT hb.id,
         CASE WHEN hb.setting_no = '22-110-08' THEN d20.id ELSE d19.id END AS new_dispatch_id
  FROM public.hatch_batches hb CROSS JOIN d19 CROSS JOIN d20
  WHERE hb.flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'::uuid
    AND hb.setting_date = '2026-04-09'
    AND hb.setting_no IN ('22-110-08','25-110-09')
),
upd AS (
  UPDATE public.hatch_batches hb SET dispatch_id = tgt.new_dispatch_id
  FROM tgt WHERE hb.id = tgt.id AND hb.dispatch_id IS DISTINCT FROM tgt.new_dispatch_id
  RETURNING hb.id
)
SELECT count(*)::int AS links_swapped FROM upd;

-- 2. The task this closes, ticked off in the same run that ships it
WITH t AS (
  UPDATE public.tasks
     SET status = 'done', completed_at = now(), updated_at = now()
   WHERE task_type = 'development' AND status <> 'done'
     AND title = 'Flock 20 hatch batches - two links are wrong and DC 4619 is over-allocated'
  RETURNING id
)
SELECT count(*)::int AS task_marked_done FROM t;

-- 3. The test that matters: every dispatch's eggs against the eggs set on it,
--    plus the over-allocation rule and proof nothing but the link moved
SELECT (SELECT count(*) FROM public.he_dispatch d JOIN public.parties p ON p.id = d.party_id
        LEFT JOIN (SELECT dispatch_id, sum(eggs_set)::bigint AS eggs FROM public.hatch_batches
                   WHERE flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'::uuid AND dispatch_id IS NOT NULL
                   GROUP BY dispatch_id) b ON b.dispatch_id = d.id
        WHERE d.flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'::uuid
          AND d.dispatch_date BETWEEN '2025-12-01' AND '2026-08-04' AND p.name ILIKE '%hitech%')::int AS dispatches,
       (SELECT count(*) FROM public.he_dispatch d JOIN public.parties p ON p.id = d.party_id
        LEFT JOIN (SELECT dispatch_id, sum(eggs_set)::bigint AS eggs FROM public.hatch_batches
                   WHERE flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'::uuid AND dispatch_id IS NOT NULL
                   GROUP BY dispatch_id) b ON b.dispatch_id = d.id
        WHERE d.flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'::uuid
          AND d.dispatch_date BETWEEN '2025-12-01' AND '2026-08-04' AND p.name ILIKE '%hitech%'
          AND COALESCE(b.eggs,0) = d.total_dispatched)::int AS reconcile_exactly,
       (SELECT count(*) FROM public.he_dispatch d
        JOIN LATERAL (SELECT COALESCE(sum(hb.eggs_set),0) AS setts, count(*) AS n
                      FROM public.hatch_batches hb WHERE hb.dispatch_id = d.id) b ON TRUE
        WHERE b.n > 0 AND COALESCE(d.total_dispatched,0) > 0
          AND b.setts > COALESCE(d.total_dispatched,0))::int AS over_allocated_anywhere,
       (SELECT count(*) FROM public.hatch_batches hb JOIN public.hatch_batches_link_1222 bk ON bk.id = hb.id
        WHERE hb.eggs_set IS DISTINCT FROM bk.eggs_set
           OR hb.setting_date IS DISTINCT FROM bk.setting_date
           OR hb.hatchery_name IS DISTINCT FROM bk.hatchery_name)::int AS anything_but_the_link_changed,
       (SELECT count(*) FROM public.hatch_batches
        WHERE flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'::uuid AND dispatch_id IS NULL)::int AS unlinked_batches;

-- 4. The two dispatches in question, with what now hangs on each
SELECT d.dispatch_date::text AS dispatch_date, d.dc_no, d.invoice_no, d.total_dispatched AS carried,
       COALESCE(sum(hb.eggs_set),0)::bigint AS eggs_set_on_it,
       string_agg(COALESCE(hb.hatchery_name,'?') || ' ' || hb.eggs_set::text, ' + ' ORDER BY hb.eggs_set DESC) AS batches
FROM public.he_dispatch d
LEFT JOIN public.hatch_batches hb ON hb.dispatch_id = d.id
WHERE d.flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'::uuid AND d.dc_no IN (4619, 4620)
GROUP BY d.dispatch_date, d.dc_no, d.invoice_no, d.total_dispatched
ORDER BY d.dc_no;
