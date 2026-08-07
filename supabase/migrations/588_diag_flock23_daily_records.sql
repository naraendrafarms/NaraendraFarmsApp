-- Diagnostic only (no schema changes).
--
-- Bird counts entered in Bulk Daily Entry for Flock 23 on 05/08 and 06/08 are
-- reported as still not saving. Establish whether the rows reached the
-- database at all, and whether any constraint would reject the insert.

-- 1. Every daily_records row for flock 23, whatever the date.
SELECT COALESCE(string_agg(
         d.record_date::text || ' shed=' || COALESCE(s.shed_no, '(flock-level)') ||
         ' openF=' || COALESCE(d.opening_female::text, '-') ||
         ' openM=' || COALESCE(d.opening_male::text, '-') ||
         ' closeF=' || COALESCE(d.closing_female::text, '-'),
         ' | ' ORDER BY d.record_date, s.shed_no), 'NO ROWS AT ALL') AS flock23_rows
FROM public.daily_records d
LEFT JOIN public.sheds s ON s.id = d.shed_id
JOIN public.flocks f ON f.id = d.flock_id
WHERE f.flock_no = '23';

-- 2. The flock itself — placement date and placed counts.
SELECT flock_no, placement_date::text AS placement_date, status,
       total_placed_f, total_placed_m, laying_farm_id, rearing_farm_id
FROM public.flocks WHERE flock_no = '23';

-- 3. Which sheds the app will offer for flock 23 (flock_sheds first, else
--    shed_allocations) — if this is empty the save loop has nothing to iterate
--    and would silently do nothing regardless of what was typed.
SELECT
  (SELECT COUNT(*) FROM public.flock_sheds fs
     JOIN public.flocks f ON f.id = fs.flock_id WHERE f.flock_no = '23') AS flock_sheds_rows,
  (SELECT COUNT(*) FROM public.shed_allocations sa
     JOIN public.flocks f ON f.id = sa.flock_id WHERE f.flock_no = '23') AS shed_allocation_rows;

-- 4. The placements actually recorded, to confirm the sheds involved.
SELECT COALESCE(string_agg(
         sa.allocated_date::text || ' shed=' || COALESCE(s.shed_no,'(none)') ||
         ' f=' || sa.female_count || ' m=' || sa.male_count, ' | '
         ORDER BY sa.allocated_date), 'NONE') AS placements
FROM public.shed_allocations sa
LEFT JOIN public.sheds s ON s.id = sa.shed_id
JOIN public.flocks f ON f.id = sa.flock_id
WHERE f.flock_no = '23';

-- 5. Every unique index on daily_records — a partial index can reject an
--    insert with an error the page only logs to the console.
SELECT COALESCE(string_agg(indexname || ': ' || indexdef, ' | '), 'NONE') AS unique_indexes
FROM pg_indexes
WHERE schemaname = 'public' AND tablename = 'daily_records'
  AND indexdef ILIKE '%UNIQUE%';
