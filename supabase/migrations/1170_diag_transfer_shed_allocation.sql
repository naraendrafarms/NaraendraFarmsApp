-- Migration 1170: read-only. Is "transfer destinations with no shed allocation"
-- still real, and for which flocks?
--
-- The owner says this was cleared. The nightly rule still counted 25 pairs an
-- hour ago, but the rule spans EVERY flock while the task named only Flocks 20
-- and 22 (17 pairs at the time). So the 25 may be other flocks entirely, or the
-- same ones, or rows since added. Measured before anything is changed.
--
-- The rule: a flock_transfers row with a to_shed_id, where no shed_allocations
-- row exists for that flock and shed.
--
-- Nothing is written.

-- [1] The unallocated pairs by flock, with how much daily history each already
-- carries -- history is what decides whether an allocation is needed at all.
SELECT COALESCE(string_agg(t.txt, ' | ' ORDER BY t.fno), 'NONE') AS unallocated_by_flock
FROM (
  SELECT f.flock_no AS fno,
         'Flock ' || f.flock_no || ': ' || count(*) || ' shed(s) - '
           || string_agg(COALESCE(sh.shed_no::text, '?'), ',' ORDER BY sh.shed_no)
           || ' (daily rows on them: '
           || (SELECT count(*) FROM public.daily_records d
               WHERE d.flock_id = y.flock_id AND d.shed_id IN (
                 SELECT t2.to_shed_id FROM public.flock_transfers t2
                 WHERE t2.flock_id = y.flock_id AND t2.to_shed_id IS NOT NULL
                   AND NOT EXISTS (SELECT 1 FROM public.shed_allocations a
                                   WHERE a.flock_id = t2.flock_id AND a.shed_id = t2.to_shed_id))) || ')' AS txt
  FROM (SELECT DISTINCT t.flock_id, t.to_shed_id FROM public.flock_transfers t
        WHERE t.to_shed_id IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM public.shed_allocations a
                          WHERE a.flock_id = t.flock_id AND a.shed_id = t.to_shed_id)) y
  JOIN public.flocks f ON f.id = y.flock_id
  LEFT JOIN public.sheds sh ON sh.id = y.to_shed_id
  GROUP BY f.flock_no, y.flock_id
) t;

-- [2] The headline numbers: total pairs, and how many belong to Flocks 20/22 --
-- the only ones the task ever named.
SELECT count(*)::int AS unallocated_pairs,
       count(*) FILTER (WHERE f.flock_no IN ('20','22'))::int AS pairs_flock_20_22,
       count(*) FILTER (WHERE f.flock_no NOT IN ('20','22'))::int AS pairs_other_flocks,
       count(*) FILTER (WHERE COALESCE(f.status,'') = 'closed')::int AS pairs_on_closed_flocks
FROM (SELECT DISTINCT t.flock_id, t.to_shed_id FROM public.flock_transfers t
      WHERE t.to_shed_id IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM public.shed_allocations a
                        WHERE a.flock_id = t.flock_id AND a.shed_id = t.to_shed_id)) y
JOIN public.flocks f ON f.id = y.flock_id;

-- [3] Flocks 20 and 22 specifically: how many destination sheds they have, how
-- many are allocated, how many are not. If the owner cleared it, unallocated
-- here is 0.
SELECT string_agg(t.txt, ' | ' ORDER BY t.fno) AS flock_20_22_status
FROM (
  SELECT f.flock_no AS fno,
         'Flock ' || f.flock_no || ': ' || count(DISTINCT t.to_shed_id) || ' destination shed(s), '
           || count(DISTINCT t.to_shed_id) FILTER (WHERE EXISTS (
                SELECT 1 FROM public.shed_allocations a
                WHERE a.flock_id = t.flock_id AND a.shed_id = t.to_shed_id)) || ' allocated, '
           || count(DISTINCT t.to_shed_id) FILTER (WHERE NOT EXISTS (
                SELECT 1 FROM public.shed_allocations a
                WHERE a.flock_id = t.flock_id AND a.shed_id = t.to_shed_id)) || ' NOT allocated' AS txt
  FROM public.flock_transfers t
  JOIN public.flocks f ON f.id = t.flock_id
  WHERE t.to_shed_id IS NOT NULL AND f.flock_no IN ('20','22')
  GROUP BY f.flock_no
) t;

-- [4] Allocation rows added recently -- if the owner cleared this by hand, the
-- new rows show up here with their dates.
SELECT COALESCE(string_agg(t.txt, ' | ' ORDER BY t.d DESC), 'NONE IN LAST 30 DAYS') AS recent_allocations
FROM (
  SELECT a.created_at::date AS d,
         a.created_at::date || ': ' || count(*) || ' allocation row(s)' AS txt
  FROM public.shed_allocations a
  WHERE a.created_at > now() - interval '30 days'
  GROUP BY a.created_at::date
) t;

-- [5] What the last health check run actually recorded for this rule, so the
-- figure on screen and the figure here can be compared rather than assumed.
SELECT failed_count::int AS rule_count_at_last_run, run_at
FROM public.health_check_results
WHERE check_key = 'transfer_shed_unallocated'
ORDER BY run_at DESC LIMIT 1;
