-- Import the HE Association rate for every week in the uploaded daily sheet.
--
-- The sheet is 302 DAILY rates, 24/08/2025 to 21/06/2026, with no missing days
-- and no duplicates. It is daily only in how it was written down: all 20 rate
-- changes in it start on a SUNDAY and every run is a whole number of weeks, so
-- it collapses to 44 Sun-Sat weeks with nothing averaged and nothing lost.
-- Checked before writing this: no week in the sheet holds two different rates.
--
-- Existing rows are NOT touched. The register already holds 9 weeks entered by
-- hand (21/06/2026 to 16/08/2026, every one a Sunday start, every one 7 days,
-- no gaps). The sheet's last week, 21/06/2026, overlaps them and carries the
-- same 22.25 that is already saved -- agreement, not a conflict -- and the
-- NOT EXISTS below skips it rather than overwriting a hand-checked row.
--
-- declared_date is left NULL. The sheet does not say when each rate was
-- declared, and inventing a Friday for 43 weeks would put made-up dates beside
-- the real ones on the existing rows.

INSERT INTO public.he_rate_register (week_start, week_end, rate, remarks)
SELECT v.ws, v.we, v.rate, 'Imported from daily HE rate sheet'
FROM (VALUES
  (DATE '2025-08-24', DATE '2025-08-30', 25.75),
  (DATE '2025-08-31', DATE '2025-09-06', 25.75),
  (DATE '2025-09-07', DATE '2025-09-13', 25.75),
  (DATE '2025-09-14', DATE '2025-09-20', 27.75),
  (DATE '2025-09-21', DATE '2025-09-27', 27.75),
  (DATE '2025-09-28', DATE '2025-10-04', 27.75),
  (DATE '2025-10-05', DATE '2025-10-11', 28.75),
  (DATE '2025-10-12', DATE '2025-10-18', 28.75),
  (DATE '2025-10-19', DATE '2025-10-25', 28.75),
  (DATE '2025-10-26', DATE '2025-11-01', 29.75),
  (DATE '2025-11-02', DATE '2025-11-08', 30.75),
  (DATE '2025-11-09', DATE '2025-11-15', 30.75),
  (DATE '2025-11-16', DATE '2025-11-22', 31.75),
  (DATE '2025-11-23', DATE '2025-11-29', 31.75),
  (DATE '2025-11-30', DATE '2025-12-06', 31.75),
  (DATE '2025-12-07', DATE '2025-12-13', 32.75),
  (DATE '2025-12-14', DATE '2025-12-20', 32.75),
  (DATE '2025-12-21', DATE '2025-12-27', 32.75),
  (DATE '2025-12-28', DATE '2026-01-03', 32.75),
  (DATE '2026-01-04', DATE '2026-01-10', 32.75),
  (DATE '2026-01-11', DATE '2026-01-17', 34.75),
  (DATE '2026-01-18', DATE '2026-01-24', 37.75),
  (DATE '2026-01-25', DATE '2026-01-31', 39.25),
  (DATE '2026-02-01', DATE '2026-02-07', 39.25),
  (DATE '2026-02-08', DATE '2026-02-14', 39.25),
  (DATE '2026-02-15', DATE '2026-02-21', 39.25),
  (DATE '2026-02-22', DATE '2026-02-28', 40.25),
  (DATE '2026-03-01', DATE '2026-03-07', 42.25),
  (DATE '2026-03-08', DATE '2026-03-14', 42.25),
  (DATE '2026-03-15', DATE '2026-03-21', 42.25),
  (DATE '2026-03-22', DATE '2026-03-28', 42.25),
  (DATE '2026-03-29', DATE '2026-04-04', 42.25),
  (DATE '2026-04-05', DATE '2026-04-11', 38.25),
  (DATE '2026-04-12', DATE '2026-04-18', 37.25),
  (DATE '2026-04-19', DATE '2026-04-25', 34.25),
  (DATE '2026-04-26', DATE '2026-05-02', 28.25),
  (DATE '2026-05-03', DATE '2026-05-09', 25.25),
  (DATE '2026-05-10', DATE '2026-05-16', 23.25),
  (DATE '2026-05-17', DATE '2026-05-23', 21.25),
  (DATE '2026-05-24', DATE '2026-05-30', 21.25),
  (DATE '2026-05-31', DATE '2026-06-06', 21.25),
  (DATE '2026-06-07', DATE '2026-06-13', 21.25),
  (DATE '2026-06-14', DATE '2026-06-20', 21.25),
  (DATE '2026-06-21', DATE '2026-06-27', 22.25)
) AS v(ws, we, rate)
WHERE NOT EXISTS (
  SELECT 1 FROM public.he_rate_register r WHERE r.week_start = v.ws
);

-- VERIFY 2: the register should now run unbroken from 24/08/2025 to
-- 16/08/2026 -- 43 imported weeks plus the 9 already there = 52.
SELECT COUNT(*)::text AS rows_now,
       to_char(MIN(week_start),'DD/MM/YYYY') AS first_week,
       to_char(MAX(week_start),'DD/MM/YYYY') AS last_week,
       COUNT(*) FILTER (WHERE EXTRACT(dow FROM week_start) <> 0)::text AS not_a_sunday,
       COUNT(*) FILTER (WHERE week_end - week_start <> 6)::text AS not_7_days,
       COUNT(*) FILTER (WHERE remarks = 'Imported from daily HE rate sheet')::text AS imported_rows
FROM public.he_rate_register;

-- VERIFY 3: no gaps and no overlaps anywhere in the register.
SELECT COALESCE(string_agg(g, ', ' ORDER BY g), 'NONE - unbroken') AS gaps_or_overlaps
FROM (
  SELECT to_char(week_start,'DD/MM/YY') || ' -> ' || to_char(nxt,'DD/MM/YY') AS g
  FROM (SELECT week_start, LEAD(week_start) OVER (ORDER BY week_start) AS nxt
        FROM public.he_rate_register) x
  WHERE nxt IS NOT NULL AND nxt - week_start <> 7
) y;

-- VERIFY 4: spot-check four weeks against the sheet by hand --
--   24/08/25 = 25.75 (first week) | 07/12/25 = 32.75 | 01/03/26 = 42.25 | 14/06/26 = 21.25
SELECT COALESCE(string_agg(to_char(week_start,'DD/MM/YY') || '=' || rate, ', ' ORDER BY week_start), 'NONE') AS spot_check
FROM public.he_rate_register
WHERE week_start IN (DATE '2025-08-24', DATE '2025-12-07', DATE '2026-03-01', DATE '2026-06-14');

-- VERIFY 5: every HE dispatch should now fall in a week that has a rate.
SELECT COUNT(*)::text AS dispatches,
       COUNT(*) FILTER (WHERE r.id IS NULL)::text AS still_with_no_rate_for_their_week
FROM public.he_dispatch d
LEFT JOIN public.he_rate_register r ON d.dispatch_date BETWEEN r.week_start AND r.week_end;
