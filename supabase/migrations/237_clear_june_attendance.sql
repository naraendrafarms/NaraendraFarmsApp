-- Requested by user: June 2026 attendance was ~99% auto-filled "Present" by a
-- since-fixed bug (defaulted every unmarked day to P on save), drowning out
-- the handful of real entries. Clearing it so June can be re-entered for real.
DELETE FROM public.attendance_daily
WHERE attendance_date >= '2026-06-01' AND attendance_date <= '2026-06-30';

-- Diagnostic: confirm June is now empty
SELECT count(*) AS remaining_june_rows
FROM public.attendance_daily
WHERE attendance_date >= '2026-06-01' AND attendance_date <= '2026-06-30';
