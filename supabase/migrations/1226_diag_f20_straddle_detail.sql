-- Read-only. 1225 found the fault: 88 of 90 dispatches reconcile, two do not.
-- DC 4619 (60,480 carried) has 80,640 set against it and DC 4620 (60,480) has
-- only 40,320. That is not cosmetic - more eggs set than the invoice carried is
-- the dispatch_over_allocated critical health rule, and it makes a hatch
-- percentage measured against eggs that never left the farm. This lists the
-- batches and dispatches either side of the boundary so the correction is
-- chosen from the real rows, not from a running total.
SELECT 1 AS warmup;

-- 1. Every batch either side of the boundary, with its running total
WITH b AS (
  SELECT hb.id, hb.setting_date, hb.setting_no, hb.hatchery_name, hb.eggs_set, hb.dispatch_id,
         sum(hb.eggs_set) OVER (ORDER BY hb.setting_date, hb.id ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS cum_end
  FROM public.hatch_batches hb
  WHERE hb.flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'::uuid AND hb.eggs_set IS NOT NULL
)
SELECT b.setting_date::text AS setting_date, COALESCE(b.setting_no,'-') AS setting_no,
       COALESCE(b.hatchery_name,'-') AS hatchery, b.eggs_set, b.cum_end,
       COALESCE(d.dc_no::text,'unlinked') AS linked_dc, COALESCE(d.invoice_no,'-') AS linked_invoice,
       COALESCE(d.dispatch_date::text,'-') AS linked_dispatch_date
FROM b LEFT JOIN public.he_dispatch d ON d.id = b.dispatch_id
WHERE b.setting_date BETWEEN '2026-03-28' AND '2026-04-16'
ORDER BY b.cum_end;

-- 2. Every dispatch either side, with its running total
WITH d AS (
  SELECT dd.dispatch_date, dd.dc_no, dd.invoice_no, dd.total_dispatched,
         sum(dd.total_dispatched) OVER (ORDER BY dd.dispatch_date, dd.dc_no ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS cum_end
  FROM public.he_dispatch dd JOIN public.parties p ON p.id = dd.party_id
  WHERE dd.flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'::uuid
    AND dd.dispatch_date BETWEEN '2025-12-01' AND '2026-08-04'
    AND p.name ILIKE '%hitech%'
)
SELECT d.dispatch_date::text AS dispatch_date, d.dc_no, COALESCE(d.invoice_no,'-') AS invoice_no,
       d.total_dispatched, d.cum_end
FROM d WHERE d.dispatch_date BETWEEN '2026-03-28' AND '2026-04-16'
ORDER BY d.cum_end;

-- 3. The one dispatch boundary that does not fall on a batch boundary
WITH b AS (
  SELECT sum(eggs_set) OVER (ORDER BY setting_date, id ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS cum
  FROM public.hatch_batches
  WHERE flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'::uuid AND eggs_set IS NOT NULL
),
d AS (
  SELECT dd.dispatch_date, dd.dc_no, dd.invoice_no,
         sum(dd.total_dispatched) OVER (ORDER BY dd.dispatch_date, dd.dc_no ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS cum
  FROM public.he_dispatch dd JOIN public.parties p ON p.id = dd.party_id
  WHERE dd.flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'::uuid
    AND dd.dispatch_date BETWEEN '2025-12-01' AND '2026-08-04'
    AND p.name ILIKE '%hitech%'
)
SELECT d.dispatch_date::text AS dispatch_date, d.dc_no, COALESCE(d.invoice_no,'-') AS invoice_no,
       d.cum AS dispatch_runs_to,
       (SELECT max(cum) FROM b WHERE b.cum < d.cum) AS batch_boundary_below,
       (SELECT min(cum) FROM b WHERE b.cum > d.cum) AS batch_boundary_above
FROM d WHERE d.cum NOT IN (SELECT cum FROM b);

-- 4. Over-allocated dispatches across the whole database, the critical rule 754 checks
SELECT COALESCE(d.invoice_no,'DC-'||COALESCE(d.dc_no::text,'?')) AS dispatch,
       d.dispatch_date::text AS dispatch_date, f.flock_no,
       d.total_dispatched AS carried, b.setts AS eggs_set_against_it, b.n AS batches
FROM public.he_dispatch d
LEFT JOIN public.flocks f ON f.id = d.flock_id
JOIN LATERAL (SELECT COALESCE(sum(hb.eggs_set),0)::bigint AS setts, count(*)::int AS n
              FROM public.hatch_batches hb WHERE hb.dispatch_id = d.id) b ON TRUE
WHERE b.n > 0 AND COALESCE(d.total_dispatched,0) > 0 AND b.setts > COALESCE(d.total_dispatched,0)
ORDER BY b.setts - d.total_dispatched DESC LIMIT 20;
