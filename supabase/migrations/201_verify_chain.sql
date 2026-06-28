-- Migration 201: verify the opening/closing chain after 200 (read-only).

-- Total rows where a day's opening != previous day's closing (per flock+shed). Want 0.
SELECT 'mismatches' AS chk, COUNT(*) AS n FROM (
  SELECT opening_female,
         LAG(closing_female) OVER (PARTITION BY flock_id, shed_id ORDER BY record_date, id) AS prev_close
  FROM public.daily_records
) t WHERE prev_close IS NOT NULL AND opening_female <> prev_close;

-- Flock 20 around the reported 24th/25th June dates.
SELECT 'flock20' AS chk, dr.record_date, dr.opening_female, dr.closing_female
FROM public.daily_records dr
JOIN public.flocks f ON f.id = dr.flock_id
WHERE f.flock_no ILIKE '%20%'
  AND dr.record_date BETWEEN '2026-06-23' AND '2026-06-26'
ORDER BY dr.record_date;
