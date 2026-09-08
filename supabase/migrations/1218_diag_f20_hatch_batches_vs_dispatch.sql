-- Read-only. Owner asks for Hatch Batches on Flock 20 for 01/12/2025 to
-- 04/08/2026 to Hitech Hatch Fresh, saying total eggs SENT is 53,42,409, and the
-- hatchability report for the same period linked correctly. Measure what the app
-- already holds before proposing anything: what was dispatched in that window,
-- what hatchability rows exist, and whether they link to the dispatches.
SELECT 1 AS warmup;

-- 1. What Flock 20 actually dispatched to Hitech in that exact window
SELECT count(*)::int AS dispatches,
       sum(d.total_dispatched)::bigint AS eggs_sent,
       sum(d.invoice_eggs)::bigint AS billable,
       sum(d.free_eggs)::bigint AS free,
       min(d.dispatch_date)::text || ' -> ' || max(d.dispatch_date)::text AS span,
       min(d.dc_no)::text || ' .. ' || max(d.dc_no)::text AS dc_range
FROM public.he_dispatch d
JOIN public.parties p ON p.id = d.party_id
WHERE d.flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'::uuid
  AND d.dispatch_date BETWEEN '2025-12-01' AND '2026-08-04'
  AND p.name ILIKE '%hitech%';

-- 2. The same window, every party, so the owner's figure can be placed
SELECT COALESCE(p.name,'(no party)') AS party, count(*)::int AS dispatches,
       sum(d.total_dispatched)::bigint AS eggs_sent
FROM public.he_dispatch d
LEFT JOIN public.parties p ON p.id = d.party_id
WHERE d.flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'::uuid
  AND d.dispatch_date BETWEEN '2025-12-01' AND '2026-08-04'
GROUP BY 1 ORDER BY 3 DESC;

-- 3. What the hatchability table already holds for Flock 20
SELECT count(*)::int AS rows,
       COALESCE(sum(eggs_received),0)::bigint AS eggs_received,
       COALESCE(sum(eggs_set),0)::bigint AS eggs_set,
       COALESCE(sum(chicks_hatched),0)::bigint AS chicks,
       COALESCE(min(setting_date)::text,'-') || ' -> ' || COALESCE(max(setting_date)::text,'-') AS span,
       COALESCE(string_agg(DISTINCT hatchery, ', '), '-') AS hatcheries,
       count(*) FILTER (WHERE dc_no IS NULL)::int AS rows_with_no_dc
FROM public.hatchability
WHERE flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'::uuid;

-- 4. Do those hatchability rows match a real dispatch by DC number
SELECT count(*)::int AS hatch_rows,
       count(*) FILTER (WHERE d.id IS NOT NULL)::int AS matched_to_a_dispatch,
       count(*) FILTER (WHERE d.id IS NULL)::int AS unmatched
FROM public.hatchability h
LEFT JOIN public.he_dispatch d
       ON d.flock_id = h.flock_id AND d.dc_no = h.dc_no
WHERE h.flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'::uuid;
