-- Diagnostic only. What is ALREADY saved in the HE Rate Register, before any
-- import is written on top of it. The uploaded sheet holds 302 daily rates from
-- 24/08/2025 to 21/06/2026; every rate change in it starts on a SUNDAY and every
-- run is a whole number of weeks, which is exactly the Sun-Sat week the register
-- is built around. So the question is not whether the two agree in shape -- it
-- is what is already there, and whether any of it disagrees with the sheet.

-- 1. Size and span of what is saved now.
SELECT COUNT(*)::text AS rows_saved,
       COALESCE(to_char(MIN(week_start),'DD/MM/YYYY'),'-') AS first_week,
       COALESCE(to_char(MAX(week_start),'DD/MM/YYYY'),'-') AS last_week,
       COUNT(DISTINCT week_start)::text AS distinct_week_starts,
       COUNT(*) FILTER (WHERE EXTRACT(dow FROM week_start) <> 0)::text AS week_start_not_a_sunday,
       COUNT(*) FILTER (WHERE week_end - week_start <> 6)::text AS week_not_7_days,
       COUNT(declared_date)::text AS with_declared_date
FROM public.he_rate_register;

-- 2. Every saved row, so the rates can be compared against the sheet by eye.
SELECT COALESCE(string_agg(to_char(week_start,'DD/MM/YY') || '=' || rate, ', ' ORDER BY week_start), 'NONE') AS saved_rates
FROM public.he_rate_register;

-- 3. Any gaps between consecutive saved weeks -- a missing week means an HE
--    dispatch in it gets no suggested rate.
SELECT COALESCE(string_agg(gap, ', ' ORDER BY gap), 'NONE') AS gaps_between_saved_weeks
FROM (
  SELECT to_char(week_start,'DD/MM/YY') || ' -> ' || to_char(nxt,'DD/MM/YY')
         || ' (' || ((nxt - week_start)/7 - 1) || ' week(s) missing)' AS gap
  FROM (SELECT week_start, LEAD(week_start) OVER (ORDER BY week_start) AS nxt
        FROM public.he_rate_register) x
  WHERE nxt IS NOT NULL AND nxt - week_start > 7
) y;

-- 4. Which HE dispatches sit in a week that has NO saved rate. This is what a
--    missing week actually costs: those dispatches had to be priced by hand.
SELECT COUNT(*)::text AS dispatches_total,
       COUNT(*) FILTER (WHERE r.id IS NULL)::text AS dispatches_with_no_rate_for_their_week,
       COALESCE(to_char(MIN(d.dispatch_date),'DD/MM/YYYY'),'-') AS first_dispatch,
       COALESCE(to_char(MAX(d.dispatch_date),'DD/MM/YYYY'),'-') AS last_dispatch
FROM public.he_dispatch d
LEFT JOIN public.he_rate_register r
       ON d.dispatch_date BETWEEN r.week_start AND r.week_end;

-- 5. Where a rate IS saved for the dispatch week, does the dispatch's own rate
--    match it? A mismatch is not necessarily wrong -- a vendor rate can differ
--    from the association rate -- but it is worth knowing before importing.
SELECT COUNT(*)::text AS dispatches_with_a_week_rate,
       COUNT(*) FILTER (WHERE d.rate IS NOT NULL AND d.rate <> r.rate)::text AS rate_differs_from_register,
       COALESCE(ROUND(AVG(d.rate - r.rate) FILTER (WHERE d.rate IS NOT NULL), 3)::text, '-') AS avg_difference
FROM public.he_dispatch d
JOIN public.he_rate_register r
  ON d.dispatch_date BETWEEN r.week_start AND r.week_end;
