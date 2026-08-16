-- Diagnostic only. Did the re-import, on the fixed importer, land correctly?
--
-- What "correctly" means here, measured rather than assumed:
--   · setting dates spread across the real 2025-26 range, NOT stacked on one
--     fallback date (the bug deleted in 652 put 394 rows on 16/08/2026)
--   · hatch dates present on nearly every row -- only the day/month-flipped
--     ones in the sheet should be missing, and those are dropped by design
--   · hatch date about 21 days after setting, which is what an incubation is
--   · STD Hatch % and the hatchery link carried through

-- 1. The headline: how many, how many dated, how many still on a single date.
SELECT COUNT(*)::text AS batches_total,
       COUNT(hatch_date)::text AS with_hatch_date,
       COUNT(*) FILTER (WHERE hatch_date IS NULL)::text AS without_hatch_date,
       COUNT(DISTINCT setting_date)::text AS distinct_setting_dates,
       MIN(setting_date)::text AS earliest_setting,
       MAX(setting_date)::text AS latest_setting;

-- 2. Is anything still parked on the old fallback date, or on today?
SELECT COUNT(*) FILTER (WHERE setting_date = CURRENT_DATE)::text AS setting_date_is_today,
       COUNT(hatchery_id)::text AS linked_to_hatchery_master,
       COUNT(std_hatch_pct)::text AS with_std_hatch_pct,
       COUNT(dispatch_id)::text AS linked_to_a_dispatch,
       COUNT(*) FILTER (WHERE hatch_date < setting_date)::text AS hatch_before_setting_should_be_zero
FROM public.hatch_batches;

-- 3. The incubation gap. 21 days should dominate; anything wild is a date that
--    is still wrong in the sheet.
SELECT COALESCE(string_agg(gap || 'd × ' || c, ' | ' ORDER BY c DESC), 'NONE') AS setting_to_hatch_gap
FROM (SELECT (hatch_date - setting_date) AS gap, COUNT(*) AS c
      FROM public.hatch_batches WHERE hatch_date IS NOT NULL
      GROUP BY 1 ORDER BY COUNT(*) DESC LIMIT 8) x;

-- 4. Per hatchery: rows, and whether that hatchery is ticked as sending
--    reports -- the tick is what drives the Pipeline.
SELECT COALESCE(string_agg(nm || ': ' || c || ' batch(es), sends report = ' || rep, ' | ' ORDER BY c DESC), 'NONE') AS by_hatchery
FROM (
  SELECT COALESCE(h.name, b.hatchery_name, '(none)') AS nm,
         COUNT(*) AS c,
         COALESCE(MAX(h.provides_hatch_report::text), 'not linked') AS rep
  FROM public.hatch_batches b LEFT JOIN public.hatcheries h ON h.id = b.hatchery_id
  GROUP BY 1
) y;

-- 5. Setting dates by month, so the spread is visible rather than described.
SELECT COALESCE(string_agg(mth || ' × ' || c, ' | ' ORDER BY mth), 'NONE') AS batches_by_month
FROM (SELECT to_char(setting_date,'YYYY-MM') AS mth, COUNT(*) AS c
      FROM public.hatch_batches GROUP BY 1) z;
