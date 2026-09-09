-- Read-only. 1226 pinned it exactly: DC 4619 runs to a cumulative 2,711,520,
-- and the batch boundaries either side of that are 2,681,280 and 2,731,680.
-- So one batch of 50,400 eggs spans the join: 30,240 of it belongs to DC 4619
-- and 20,160 to DC 4620. A batch row carries one dispatch_id, so no whole-batch
-- assignment can make both invoices reconcile. This names that batch, its hatch
-- results, and everything set on its date, so the owner decides on real rows.
-- Output is aggregated into single text rows because the runner truncates a
-- long result list and the earlier list was cut off mid-row.
SELECT 1 AS warmup;

-- 1. The straddling batch: the one whose eggs span the DC 4619 / DC 4620 join
WITH b AS (
  SELECT hb.*, sum(hb.eggs_set) OVER w - hb.eggs_set AS cum_start, sum(hb.eggs_set) OVER w AS cum_end
  FROM public.hatch_batches hb
  WHERE hb.flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'::uuid AND hb.eggs_set IS NOT NULL
  WINDOW w AS (ORDER BY hb.setting_date, hb.id ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)
)
SELECT b.setting_date::text AS setting_date, COALESCE(b.setting_no,'-') AS setting_no,
       COALESCE(b.hatchery_name,'-') AS hatchery, b.eggs_set,
       b.cum_start, b.cum_end, (2711520 - b.cum_start) AS belongs_to_4619, (b.cum_end - 2711520) AS belongs_to_4620,
       COALESCE(b.fertile_eggs,-1) AS fertile_eggs, COALESCE(b.hatched_chicks,-1) AS hatched_chicks,
       COALESCE(b.hatch_date::text,'-') AS hatch_date, b.id::text AS batch_id
FROM b WHERE b.cum_start < 2711520 AND b.cum_end > 2711520;

-- 2. Everything set on that batch's date, in one line, to see if a different
--    order within the day would move the join onto a clean boundary
SELECT string_agg(x.s, '  ||  ' ORDER BY x.setting_date, x.eggs_set DESC) AS same_day_batches
FROM (SELECT hb.setting_date, hb.eggs_set,
             hb.setting_date::text || ' ' || COALESCE(hb.hatchery_name,'-') || ' set=' || COALESCE(hb.setting_no,'-')
             || ' eggs=' || hb.eggs_set::text AS s
      FROM public.hatch_batches hb
      WHERE hb.flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'::uuid
        AND hb.setting_date IN (SELECT setting_date FROM public.hatch_batches hb2
             WHERE hb2.flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'::uuid
               AND hb2.eggs_set = 50400 AND hb2.setting_date BETWEEN '2026-04-05' AND '2026-04-14')) x;

-- 3. The batch run across the join, compact, so the shape is visible in one line
WITH b AS (
  SELECT hb.setting_date, hb.hatchery_name, hb.setting_no, hb.eggs_set,
         sum(hb.eggs_set) OVER w AS cum_end
  FROM public.hatch_batches hb
  WHERE hb.flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'::uuid AND hb.eggs_set IS NOT NULL
  WINDOW w AS (ORDER BY hb.setting_date, hb.id ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)
)
SELECT string_agg(b.setting_date::text || ' ' || COALESCE(b.hatchery_name,'?') || ' ' || b.eggs_set::text
                  || ' (to ' || b.cum_end::text || ')', '  ||  ' ORDER BY b.cum_end) AS batches_across_the_join
FROM b WHERE b.cum_end BETWEEN 2600000 AND 2830000;

-- 4. The same run of dispatches, compact
WITH d AS (
  SELECT dd.dispatch_date, dd.dc_no, dd.invoice_no, dd.total_dispatched,
         sum(dd.total_dispatched) OVER (ORDER BY dd.dispatch_date, dd.dc_no ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS cum_end
  FROM public.he_dispatch dd JOIN public.parties p ON p.id = dd.party_id
  WHERE dd.flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'::uuid
    AND dd.dispatch_date BETWEEN '2025-12-01' AND '2026-08-04' AND p.name ILIKE '%hitech%'
)
SELECT string_agg(d.dispatch_date::text || ' DC' || d.dc_no::text || ' ' || COALESCE(d.invoice_no,'?')
                  || ' ' || d.total_dispatched::text || ' (to ' || d.cum_end::text || ')', '  ||  ' ORDER BY d.cum_end) AS dispatches_across_the_join
FROM d WHERE d.cum_end BETWEEN 2600000 AND 2830000;
