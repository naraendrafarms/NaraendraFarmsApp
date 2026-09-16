-- READ ONLY. Why Flock 24's Opening does not carry from 13/09/2026 into
-- 14/09/2026 on VHL Bulk (Shed-wise) Daily Entry.
--
-- The screen fills Opening for a shed from the most recent EARLIER
-- vhl_daily_entry row FOR THAT SAME shed_id, reading its closing_female /
-- closing_male. So it goes blank if (a) no row exists for 13/09, (b) the row
-- exists but has shed_id NULL (entered on the whole-flock Daily Entry screen
-- rather than the shed grid), or (c) the row exists on the shed but its
-- closing is NULL. This tells us which.
SELECT 1 AS warmup;

SELECT count(*)::int                                                           AS all_rows_flock24,
       count(*) FILTER (WHERE d.record_date = '2026-09-13')::int               AS rows_on_13_09,
       count(*) FILTER (WHERE d.record_date = '2026-09-14')::int               AS rows_on_14_09,
       count(*) FILTER (WHERE d.shed_id IS NULL)::int                          AS rows_with_no_shed,
       count(*) FILTER (WHERE d.shed_id IS NOT NULL
                          AND d.closing_female IS NULL)::int                   AS shed_rows_null_closing_f,
       count(*) FILTER (WHERE d.shed_id IS NOT NULL
                          AND COALESCE(d.closing_female,0) = 0)::int           AS shed_rows_zero_closing_f
FROM public.vhl_daily_entry d
JOIN public.flocks f ON f.id = d.flock_id
WHERE f.flock_no::text = '24';

SELECT d.record_date::text                                    AS the_date,
       COALESCE(s.shed_no::text, 'NO SHED (flock-level row)')  AS shed,
       COALESCE(d.opening_female, -1)                          AS open_f,
       COALESCE(d.received_female, -1)                         AS recd_f,
       COALESCE(d.closing_female, -1)                          AS close_f,
       COALESCE(d.opening_male, -1)                            AS open_m,
       COALESCE(d.received_male, -1)                           AS recd_m,
       COALESCE(d.closing_male, -1)                            AS close_m
FROM public.vhl_daily_entry d
LEFT JOIN public.sheds s ON s.id = d.shed_id
JOIN public.flocks f ON f.id = d.flock_id
WHERE f.flock_no::text = '24'
ORDER BY d.record_date, shed;

-- Which sheds the grid will render for this flock, so a shed_id that exists
-- on a row but is NOT in this list would also show as a blank Opening.
SELECT count(*)::int AS active_sheds_on_flock24_farm,
       string_agg(s.shed_no::text, ', ' ORDER BY s.shed_no) AS shed_nos
FROM public.flocks f
JOIN public.sheds s ON s.farm_id = COALESCE(f.laying_farm_id, f.rearing_farm_id)
WHERE f.flock_no::text = '24' AND s.is_active = true;
