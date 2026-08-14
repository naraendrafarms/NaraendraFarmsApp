-- Diagnostic only (no schema changes, no data changes).
--
-- Does every daily record balance?
--   closing = opening + transfer_in − mortality − cull − transfer_out
-- separately for females and males, on every flock and every day.
--
-- This is the formula fn_chain_daily_opening enforces on write (migrations
-- 200/225), but rows can still be out of balance: an entry saved before that
-- trigger existed, an import, a direct edit, or a closing figure typed by hand.
-- Nothing has ever checked the whole table.
--
-- A second, different failure is also worth catching: the CHAIN. Today's
-- opening should equal yesterday's closing. A break there means birds appeared
-- or vanished between two days without any movement recorded — which is how
-- Flock 23's missing chick receipts showed up.
--
-- Five statements, each aggregated so it always returns a row and prints.

-- 1. FEMALES — rows where the arithmetic does not hold.
SELECT COUNT(*) AS female_rows_checked,
       COUNT(*) FILTER (WHERE COALESCE(closing_female,0) <> COALESCE(opening_female,0)
                              + COALESCE(transfer_in_female,0) - COALESCE(mortality_female,0)
                              - COALESCE(cull_female,0) - COALESCE(transfer_female,0)) AS female_out_of_balance
FROM public.daily_records
WHERE COALESCE(opening_female,0) > 0 OR COALESCE(closing_female,0) > 0;

-- 2. MALES — the same test. Kept separate because a flock can be female-only,
--    and a combined count would hide which sex is wrong.
SELECT COUNT(*) AS male_rows_checked,
       COUNT(*) FILTER (WHERE COALESCE(closing_male,0) <> COALESCE(opening_male,0)
                              + COALESCE(transfer_in_male,0) - COALESCE(mortality_male,0)
                              - COALESCE(cull_male,0) - COALESCE(transfer_male,0)) AS male_out_of_balance
FROM public.daily_records
WHERE COALESCE(opening_male,0) > 0 OR COALESCE(closing_male,0) > 0;

-- 3. Name the worst offenders, with the size of the gap, so they can be opened
--    and corrected rather than merely counted.
SELECT COALESCE(string_agg(line, ' | ' ORDER BY diff DESC), 'NONE — every row balances') AS worst_breaks
FROM (
  SELECT 'F-' || f.flock_no || ' ' || d.record_date::text
         || ' ♀ open=' || COALESCE(d.opening_female,0) || ' in=' || COALESCE(d.transfer_in_female,0)
         || ' mort=' || COALESCE(d.mortality_female,0) || ' cull=' || COALESCE(d.cull_female,0)
         || ' out=' || COALESCE(d.transfer_female,0) || ' close=' || COALESCE(d.closing_female,0)
         || ' (off by ' || (COALESCE(d.closing_female,0) - (COALESCE(d.opening_female,0)
              + COALESCE(d.transfer_in_female,0) - COALESCE(d.mortality_female,0)
              - COALESCE(d.cull_female,0) - COALESCE(d.transfer_female,0))) || ')' AS line,
         ABS(COALESCE(d.closing_female,0) - (COALESCE(d.opening_female,0)
              + COALESCE(d.transfer_in_female,0) - COALESCE(d.mortality_female,0)
              - COALESCE(d.cull_female,0) - COALESCE(d.transfer_female,0))) AS diff
  FROM public.daily_records d JOIN public.flocks f ON f.id = d.flock_id
  WHERE COALESCE(d.closing_female,0) <> COALESCE(d.opening_female,0)
        + COALESCE(d.transfer_in_female,0) - COALESCE(d.mortality_female,0)
        - COALESCE(d.cull_female,0) - COALESCE(d.transfer_female,0)
  ORDER BY diff DESC LIMIT 12
) x;

-- 4. THE CHAIN — today's opening against yesterday's closing, per flock and
--    shed. A break means birds appeared or disappeared with no movement behind
--    it. Only consecutive days are compared; a gap in entry is not a break.
SELECT COUNT(*) AS consecutive_day_pairs,
       COUNT(*) FILTER (WHERE open_f <> prev_close_f) AS female_chain_breaks,
       COUNT(*) FILTER (WHERE open_m <> prev_close_m) AS male_chain_breaks
FROM (
  SELECT COALESCE(opening_female,0) AS open_f, COALESCE(opening_male,0) AS open_m,
         LAG(COALESCE(closing_female,0)) OVER w AS prev_close_f,
         LAG(COALESCE(closing_male,0)) OVER w AS prev_close_m,
         record_date - LAG(record_date) OVER w AS gap
  FROM public.daily_records
  WINDOW w AS (PARTITION BY flock_id, shed_id ORDER BY record_date)
) y
WHERE gap = 1;

-- 5. The chain breaks themselves, worst first.
SELECT COALESCE(string_agg(line, ' | ' ORDER BY diff DESC), 'NONE — the chain is unbroken') AS chain_breaks
FROM (
  SELECT 'F-' || f.flock_no || ' ' || z.record_date::text
         || ' ♀ opened ' || z.open_f || ' but previous day closed ' || z.prev_close_f
         || ' (gap ' || (z.open_f - z.prev_close_f) || ')' AS line,
         ABS(z.open_f - z.prev_close_f) AS diff
  FROM (
    SELECT flock_id, record_date, COALESCE(opening_female,0) AS open_f,
           LAG(COALESCE(closing_female,0)) OVER w AS prev_close_f,
           record_date - LAG(record_date) OVER w AS gap
    FROM public.daily_records
    WINDOW w AS (PARTITION BY flock_id, shed_id ORDER BY record_date)
  ) z JOIN public.flocks f ON f.id = z.flock_id
  WHERE z.gap = 1 AND z.open_f <> z.prev_close_f
  ORDER BY diff DESC LIMIT 12
) w2;
