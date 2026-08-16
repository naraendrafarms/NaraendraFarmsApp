-- Diagnostic only. "Dates also wrong" -- so compare what is stored against
-- what the workbook holds, row by row, instead of taking either on trust.
--
-- The workbook (checked locally) has, by setting month:
--   2025-09 x 18 | 2025-10 x 27 | 2025-11 x 32 | 2025-12 x 45 | 2026-01 x 66
--   2026-02 x 80 | 2026-03 x 54 | 2026-04 x 50 | 2026-05 x 22
-- and its first rows are
--   22-110-525  05/09/2025 -> 26/09/2025
--   22-110-536  07/09/2025 -> 28/09/2025
--   22-110-198  14/09/2025 -> 05/10/2025
-- and its last are 22-110-141 / 25-110-43 / 25-110-44, all 11/05/2026 -> 01/06/2026.
-- If the stored figures match these, the dates in the database are right and
-- whatever looks wrong is in how they are displayed or read.

-- 1. Setting months as stored -- compare against the list above.
SELECT COALESCE(string_agg(mth || ' x ' || c, ' | ' ORDER BY mth), 'NONE') AS stored_setting_months
FROM (SELECT to_char(setting_date,'YYYY-MM') AS mth, COUNT(*) AS c
      FROM public.hatch_batches GROUP BY 1) x;

-- 2. The earliest rows as stored, in DD/MM/YYYY so there is no ambiguity about
--    which half is the day.
SELECT COALESCE(string_agg(line, ' | '), 'NONE') AS earliest_rows
FROM (SELECT COALESCE(setting_no,'(none)') || '  set ' || to_char(setting_date,'DD/MM/YYYY')
             || ' -> hatch ' || to_char(hatch_date,'DD/MM/YYYY') AS line
      FROM public.hatch_batches ORDER BY setting_date, setting_no LIMIT 5) y;

-- 3. And the latest rows.
SELECT COALESCE(string_agg(line, ' | '), 'NONE') AS latest_rows
FROM (SELECT COALESCE(setting_no,'(none)') || '  set ' || to_char(setting_date,'DD/MM/YYYY')
             || ' -> hatch ' || to_char(hatch_date,'DD/MM/YYYY') AS line
      FROM public.hatch_batches ORDER BY setting_date DESC, setting_no DESC LIMIT 4) z;

-- 4. Anything that could look like a wrong date: a hatch gap that is not 21
--    days, a setting date in the future, or a date outside the workbook range.
SELECT COUNT(*) FILTER (WHERE hatch_date - setting_date <> 21)::text AS gap_not_21,
       COUNT(*) FILTER (WHERE setting_date > CURRENT_DATE)::text AS setting_in_future,
       COUNT(*) FILTER (WHERE hatch_date > CURRENT_DATE)::text AS hatch_in_future,
       COUNT(*) FILTER (WHERE setting_date < DATE '2025-09-05' OR setting_date > DATE '2026-05-11')::text AS outside_workbook_range
FROM public.hatch_batches;

-- 5. Timezone check -- a date shifted by a day is the classic import fault.
--    created_at is a timestamptz; setting_date is a plain date and should be
--    exactly what the sheet said, unaffected by any zone.
SELECT current_setting('TimeZone') AS db_timezone,
       (SELECT to_char(MIN(setting_date),'DD/MM/YYYY') FROM public.hatch_batches) AS min_setting,
       (SELECT to_char(MAX(hatch_date),'DD/MM/YYYY') FROM public.hatch_batches) AS max_hatch,
       (SELECT COUNT(DISTINCT setting_date)::text FROM public.hatch_batches) AS distinct_settings;
