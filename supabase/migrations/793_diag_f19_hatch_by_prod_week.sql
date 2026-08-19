-- Migration 793 (READ ONLY): a hatch result belongs to the week the eggs were
-- LAID, not the week they were dispatched or set. The dispatch carries its
-- production dates in he_dispatch_lines, so the batch's eggs and chicks can be
-- attributed back to the production weeks they came from, in proportion to the
-- eggs from each of those days.
--
-- Checking that first: how many production weeks do Flock 19's 14 batches
-- actually cover, and how far apart are the laying date, the dispatch and the
-- setting date?

SELECT 'batch_spread' AS chk,
       (SELECT string_agg(t, ' | ' ORDER BY t) FROM (
          SELECT 'set=' || b.setting_date::text
                 || ' disp=' || d.dispatch_date::text
                 || ' prod=' || COALESCE(min(l.prod_date)::text, '-') || '..' || COALESCE(max(l.prod_date)::text, '-')
                 || ' lines=' || count(l.id)
                 || ' eggs_set=' || COALESCE(b.eggs_set, 0)
                 || ' chicks=' || COALESCE(b.hatched_chicks, 0)
                 || ' hatch%=' || COALESCE(b.hatchability_pct::text, '-') AS t
            FROM public.hatch_batches b
            JOIN public.he_dispatch d ON d.id = b.dispatch_id
            JOIN public.flocks f ON f.id = d.flock_id
            LEFT JOIN public.he_dispatch_lines l ON l.dispatch_id = d.id
           WHERE f.flock_no::text = '19'
           GROUP BY b.id, b.setting_date, d.dispatch_date, b.eggs_set, b.hatched_chicks, b.hatchability_pct
       ) x) AS batches;

-- The production weeks those eggs came from, one-based like the standard.
SELECT 'prod_weeks' AS chk,
       (SELECT string_agg(t, ' | ' ORDER BY t) FROM (
          SELECT 'wk' || lpad((floor((l.prod_date - f.placement_date) / 7) + 1)::text, 2, '0')
                 || ' eggs=' || sum(COALESCE(l.grade_a,0) + COALESCE(l.grade_b,0) + COALESCE(l.grade_c,0))
                 || ' days=' || count(DISTINCT l.prod_date) AS t
            FROM public.he_dispatch_lines l
            JOIN public.he_dispatch d ON d.id = l.dispatch_id
            JOIN public.flocks f ON f.id = d.flock_id
           WHERE f.flock_no::text = '19'
             AND EXISTS (SELECT 1 FROM public.hatch_batches b WHERE b.dispatch_id = d.id)
           GROUP BY floor((l.prod_date - f.placement_date) / 7)
       ) x) AS weeks_covered,
       (SELECT count(DISTINCT l.prod_date)
          FROM public.he_dispatch_lines l
          JOIN public.he_dispatch d ON d.id = l.dispatch_id
          JOIN public.flocks f ON f.id = d.flock_id
         WHERE f.flock_no::text = '19') AS all_prod_dates,
       (SELECT count(*) FROM public.he_dispatch_lines l
          JOIN public.he_dispatch d ON d.id = l.dispatch_id
          JOIN public.flocks f ON f.id = d.flock_id
         WHERE f.flock_no::text = '19') AS dispatch_lines_total;
