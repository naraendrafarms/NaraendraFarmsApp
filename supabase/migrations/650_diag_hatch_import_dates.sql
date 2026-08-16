-- Diagnostic only. What did the Hatch Batches import actually write?
--
-- The uploaded workbook holds 394 rows whose Setting Date and Hatch Date are
-- real Excel DATE cells, not text. The importer only ever understood text in
-- DD/MM/YYYY form, so every date arrived as an Excel serial number, failed to
-- parse, and fell back to today() for the setting date and NULL for the hatch
-- date. That is exactly the symptom reported. This measures the damage before
-- anything is changed or deleted.

-- 1. How many batches exist now, and how many carry a hatch date.
SELECT COUNT(*) AS hatch_batches_total,
       COUNT(hatch_date) AS with_hatch_date,
       COUNT(*) FILTER (WHERE hatch_date IS NULL) AS missing_hatch_date,
       COUNT(DISTINCT setting_date) AS distinct_setting_dates,
       MIN(setting_date)::text AS earliest_setting,
       MAX(setting_date)::text AS latest_setting;

-- 2. Setting dates by value, most common first. If one date holds hundreds of
--    rows, that is the fallback firing, not real data.
SELECT COALESCE(string_agg(setting_date::text || ' × ' || c, ' | ' ORDER BY c DESC), 'NONE') AS setting_date_spread
FROM (SELECT setting_date, COUNT(*) AS c FROM public.hatch_batches
      GROUP BY setting_date ORDER BY COUNT(*) DESC LIMIT 8) x;

-- 3. Which rows came from this import: created today, and what they hold.
SELECT COUNT(*) AS created_today,
       COUNT(hatch_date) FILTER (WHERE created_at::date = CURRENT_DATE) AS created_today_with_hatch_date,
       COUNT(std_hatch_pct) FILTER (WHERE created_at::date = CURRENT_DATE) AS created_today_with_std_pct,
       COUNT(hatchery_id) FILTER (WHERE created_at::date = CURRENT_DATE) AS created_today_linked_to_master
FROM public.hatch_batches WHERE created_at::date = CURRENT_DATE;

-- 4. The hatchery names that arrived as text, with counts -- these are the
--    names that need adding to Masters → Hatcheries before a re-import can
--    link them.
SELECT COALESCE(string_agg(COALESCE(hatchery_name,'(blank)') || ' × ' || c, ' | ' ORDER BY c DESC), 'NONE') AS hatchery_names_used
FROM (SELECT hatchery_name, COUNT(*) AS c FROM public.hatch_batches GROUP BY hatchery_name) y;

-- 5. Flock spread and a sample row, so the shape of what landed is visible.
SELECT COALESCE(string_agg(fl || ' × ' || c, ', ' ORDER BY c DESC), 'NONE') AS by_flock
FROM (SELECT COALESCE(f.flock_no,'(none)') AS fl, COUNT(*) AS c
      FROM public.hatch_batches b LEFT JOIN public.flocks f ON f.id = b.flock_id
      GROUP BY 1) z;
