-- Migration 792 (READ ONLY): where do Flock 19's 14 linked hatch batches
-- actually fall, in weeks of age? The vs-Standard tab shows a blank hatch
-- column for weeks 24 and 25, and before changing anything it is worth knowing
-- whether that is because no batch belongs to those weeks or because the
-- figures on the batches are empty.
--
-- Week is counted 1-based, the way the breed standard and the farm's weekly
-- report number them: week 1 is the placement day and the six days after.

SELECT 'batch_weeks' AS chk,
       (SELECT string_agg(t, ' | ' ORDER BY t) FROM (
          SELECT 'wk' || lpad((floor((d.dispatch_date - f.placement_date) / 7) + 1)::text, 2, '0')
                 || ' batches=' || count(*)
                 || ' set=' || COALESCE(sum(b.eggs_set), 0)
                 || ' chicks=' || COALESCE(sum(b.hatched_chicks), 0)
                 || ' pct=' || COALESCE(round(avg(b.hatchability_pct), 1)::text, '-') AS t
            FROM public.hatch_batches b
            JOIN public.he_dispatch d ON d.id = b.dispatch_id
            JOIN public.flocks f ON f.id = d.flock_id
           WHERE f.flock_no::text = '19'
           GROUP BY floor((d.dispatch_date - f.placement_date) / 7)
       ) x) AS by_week,
       (SELECT count(*) FROM public.hatch_batches b
          JOIN public.he_dispatch d ON d.id = b.dispatch_id
          JOIN public.flocks f ON f.id = d.flock_id
         WHERE f.flock_no::text = '19' AND b.hatched_chicks IS NULL) AS batches_without_chicks,
       (SELECT count(*) FROM public.hatch_batches b
          JOIN public.he_dispatch d ON d.id = b.dispatch_id
          JOIN public.flocks f ON f.id = d.flock_id
         WHERE f.flock_no::text = '19' AND COALESCE(b.eggs_set, 0) = 0) AS batches_without_eggs_set;

-- And the dispatch dates themselves, since 14 dispatches across a 44-week lay
-- would leave most weeks with nothing to compare.
SELECT 'dispatch_span' AS chk,
       (SELECT count(*) FROM public.he_dispatch d JOIN public.flocks f ON f.id = d.flock_id
         WHERE f.flock_no::text = '19') AS dispatches,
       (SELECT min(d.dispatch_date)::text || ' .. ' || max(d.dispatch_date)::text
          FROM public.he_dispatch d JOIN public.flocks f ON f.id = d.flock_id
         WHERE f.flock_no::text = '19') AS span;
