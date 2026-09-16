-- Flock 24: laying_start_date set to 13/09/2026, the day the first birds were
-- received at the laying farm. Approved by the owner on 16/09/2026.
--
-- This matches the app's OWN convention, checked before writing: the transfer
-- flow in FlockDetail sets laying_start_date = transfer_date, i.e. the day
-- birds move to the laying farm - NOT the first-egg date. It drives which site
-- a day's cost belongs to (on or after this date the laying farm, before it
-- the rearing farm) and whether a date counts as laying.
--
-- 13/09/2026 is the first arrival: 1600 female into Shed 1. A second 1600
-- followed on 14/09 and 3200 into Shed 4 on 15/09.
SELECT 1 AS warmup;

-- Backup before the UPDATE. One row, reverses exactly.
CREATE TABLE IF NOT EXISTS public.flocks_laying_start_backup_1259 AS
SELECT id, flock_no, placement_date, laying_start_date, status, NOW() AS backed_up_at
FROM public.flocks WHERE flock_no::text = '24';

UPDATE public.flocks
SET laying_start_date = DATE '2026-09-13'
WHERE flock_no::text = '24'
  AND laying_start_date IS DISTINCT FROM DATE '2026-09-13';

SELECT flock_no,
       placement_date::text     AS placement_date,
       laying_start_date::text  AS laying_start_date,
       status,
       (SELECT count(*)::int FROM public.flocks_laying_start_backup_1259) AS rows_backed_up
FROM public.flocks WHERE flock_no::text = '24';
