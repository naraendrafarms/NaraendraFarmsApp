-- Owner approved 16/09/2026. Flock 24's placement_date was entered as
-- 14/09/2026 - the day the birds ARRIVED at Bodjanampet-2 - but VHL had already
-- reared them: on that date they were 17 weeks 2 days old, shifted grower to
-- laying. 14/09 is a transfer-in date, not a day-old placement.
--
-- WHY IT MATTERS: VHL Daily Entry fills age_weeks from placement_date, and HD
-- percent, the Vencobb standard curve and VHL Shed Performance are all read
-- against flock age. Left as it is, every daily row would carry an age about
-- 17 weeks too young and every comparison against standard would be nonsense.
--
-- 16/05/2026 is the date that makes the age come out right: on 14/09/2026 it is
-- exactly 17w 2d, which is what VHL states. Checked both ways before writing.
--
-- SAFE TO DO NOW: no vhl_daily_entry and no daily_records rows exist for this
-- flock yet (verified in migration 1247), so no recorded age is being rewritten
-- behind anyone's back - this only affects rows entered from here on.
--
-- The row is copied out BEFORE the update, so this reverses exactly.
-- ONE flock, ONE column. Nothing else is touched.

CREATE TABLE IF NOT EXISTS public.flocks_placement_backup_1248 AS
SELECT id, flock_no, placement_date, laying_start_date, status, is_vhl_contract, now() AS backed_up_at
FROM public.flocks
WHERE flock_no = '24' AND is_vhl_contract = true;

UPDATE public.flocks
   SET placement_date = '2026-05-16'
 WHERE flock_no = '24' AND is_vhl_contract = true
   AND placement_date = '2026-09-14';

-- VERIFY: the backup captured the old value, and the new one gives 17w 2d on
-- 14/09/2026 - the figure VHL quoted.
SELECT f.flock_no,
       b.placement_date::text AS was,
       f.placement_date::text AS now_is,
       (DATE '2026-09-14' - f.placement_date) AS days_old_on_14_09,
       ((DATE '2026-09-14' - f.placement_date)/7)::text || 'w ' ||
       ((DATE '2026-09-14' - f.placement_date)%7)::text || 'd' AS age_on_14_09,
       ((CURRENT_DATE - f.placement_date)/7)::text || 'w ' ||
       ((CURRENT_DATE - f.placement_date)%7)::text || 'd' AS age_today,
       f.status,
       COALESCE(f.laying_start_date::text, '(not set)') AS laying_start_date
FROM public.flocks f
JOIN public.flocks_placement_backup_1248 b ON b.id = f.id
WHERE f.flock_no = '24';

-- VERIFY: still no daily rows, so nothing recorded was disturbed; and exactly
-- one flock was touched.
SELECT (SELECT count(*) FROM public.flocks_placement_backup_1248)::int AS rows_backed_up,
       (SELECT count(*) FROM public.vhl_daily_entry
        WHERE flock_id = (SELECT id FROM public.flocks WHERE flock_no = '24'))::int AS vhl_daily_rows,
       (SELECT count(*) FROM public.daily_records
        WHERE flock_id = (SELECT id FROM public.flocks WHERE flock_no = '24'))::int AS ordinary_daily_rows,
       (SELECT count(*) FROM public.flocks WHERE placement_date = '2026-05-16')::int AS flocks_on_that_placement_date;
