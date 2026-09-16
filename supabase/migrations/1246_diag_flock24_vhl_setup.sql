-- Read-only. Two owner questions on the new VHL flock:
--   (a) VHL Bulk Daily Entry shows nothing, though sheds were assigned;
--   (b) did Received Female 1600 on 14/09/2026 actually save?
--
-- Worth knowing before reading the answers: VHL Bulk Daily Entry does NOT use
-- the flock_sheds assignment at all. It lists every shed at the flock's farm
-- (laying_farm_id, else rearing_farm_id) where is_active is true. So assigning
-- sheds has no effect on that page - what matters is the flock's FARM and
-- whether that farm's sheds are active.
SELECT 1 AS warmup;

-- 1. The flock itself: is it flagged VHL, is it open, and which farm is it on
SELECT f.flock_no, f.status, f.is_vhl_contract, f.placement_date::text AS placement,
       f.paid_female, f.paid_male, f.total_placed_f, f.total_placed_m,
       COALESCE(lf.name,'(none)') AS laying_farm, COALESCE(rf.name,'(none)') AS rearing_farm,
       COALESCE(f.laying_farm_id::text, f.rearing_farm_id::text, 'BOTH NULL') AS farm_used_by_bulk_page
FROM public.flocks f
LEFT JOIN public.farms lf ON lf.id = f.laying_farm_id
LEFT JOIN public.farms rf ON rf.id = f.rearing_farm_id
WHERE f.flock_no = '24';

-- 2. The sheds the Bulk page would list: every ACTIVE shed at that farm.
--    An inactive shed is invisible there however it is assigned.
SELECT COALESCE(fa.name,'(no farm)') AS farm, count(*)::int AS sheds_total,
       count(*) FILTER (WHERE s.is_active)::int AS active_shown_on_bulk_page,
       count(*) FILTER (WHERE NOT s.is_active)::int AS inactive_hidden,
       COALESCE(string_agg(s.shed_no || CASE WHEN s.is_active THEN '' ELSE ' (INACTIVE)' END,
                ', ' ORDER BY s.shed_no), '-') AS shed_list
FROM public.sheds s
LEFT JOIN public.farms fa ON fa.id = s.farm_id
WHERE s.farm_id = (SELECT COALESCE(laying_farm_id, rearing_farm_id) FROM public.flocks WHERE flock_no = '24')
GROUP BY 1;

-- 3. What the Assign Flock to Sheds screen actually saved
SELECT count(*)::int AS sheds_assigned,
       COALESCE(string_agg(COALESCE(fa.name,'?') || ' Shed ' || s.shed_no, ', ' ORDER BY s.shed_no), '(none assigned)') AS assigned_to
FROM public.flock_sheds fs
JOIN public.sheds s ON s.id = fs.shed_id
LEFT JOIN public.farms fa ON fa.id = s.farm_id
WHERE fs.flock_id = (SELECT id FROM public.flocks WHERE flock_no = '24');

-- 4. Did the 14/09/2026 entry save? Every VHL daily row for this flock.
SELECT record_date::text AS record_date,
       COALESCE(shed_id::text,'(whole flock)') AS shed,
       opening_female, received_female, mortality_female, closing_female,
       opening_male, received_male, closing_male, age_weeks
FROM public.vhl_daily_entry
WHERE flock_id = (SELECT id FROM public.flocks WHERE flock_no = '24')
ORDER BY record_date, shed_id NULLS FIRST;
