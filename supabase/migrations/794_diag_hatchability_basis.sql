-- Migration 794 (READ ONLY): what base is hatchability_pct actually measured
-- against? Chicks divided by eggs set does not reproduce the stored figure --
-- 30,480 of 40,320 is 75.6% while the batch stores 79.70 -- so the percentage
-- is being taken on a smaller base, most likely fertile eggs. Test both
-- hypotheses against every batch rather than assuming one.
--
-- Two batches also look stale: 8,100 of 10,080 and 16,200 of 20,160 are both
-- 80.36%, yet they store 16.20 and 33.08, which are those chick counts over
-- 50,400 -- the whole invoice figure that was corrected this morning. Their
-- eggs_set was fixed and their hatchability was not.

SELECT 'basis' AS chk,
       (SELECT string_agg(t, ' | ' ORDER BY t) FROM (
          SELECT b.setting_date::text
                 || ' set=' || COALESCE(b.eggs_set, 0)
                 || ' broken=' || COALESCE(b.broken_transit, 0)
                 || ' infertile=' || COALESCE(b.infertile, 0)
                 || ' fertile=' || COALESCE(b.fertile_eggs, 0)
                 || ' chicks=' || COALESCE(b.hatched_chicks, 0)
                 || ' stored=' || COALESCE(b.hatchability_pct::text, '-')
                 || ' /set=' || COALESCE(round(b.hatched_chicks * 100.0 / NULLIF(b.eggs_set, 0), 2)::text, '-')
                 || ' /fertile=' || COALESCE(round(b.hatched_chicks * 100.0 / NULLIF(b.fertile_eggs, 0), 2)::text, '-')
                 || ' /set-broken=' || COALESCE(round(b.hatched_chicks * 100.0
                      / NULLIF(COALESCE(b.eggs_set,0) - COALESCE(b.broken_transit,0), 0), 2)::text, '-') AS t
            FROM public.hatch_batches b
            JOIN public.he_dispatch d ON d.id = b.dispatch_id
            JOIN public.flocks f ON f.id = d.flock_id
           WHERE f.flock_no::text = '19'
       ) x) AS batches;

-- How many batches across the whole app would change if hatchability were
-- recomputed, whichever base turns out to be right.
SELECT 'app_wide' AS chk,
       count(*) AS batches_with_pct,
       count(*) FILTER (WHERE abs(COALESCE(hatchability_pct,0)
              - COALESCE(hatched_chicks * 100.0 / NULLIF(fertile_eggs, 0), 0)) > 0.5) AS differ_from_fertile_base,
       count(*) FILTER (WHERE abs(COALESCE(hatchability_pct,0)
              - COALESCE(hatched_chicks * 100.0 / NULLIF(eggs_set, 0), 0)) > 0.5) AS differ_from_set_base
FROM public.hatch_batches
WHERE hatchability_pct IS NOT NULL AND hatched_chicks IS NOT NULL;
