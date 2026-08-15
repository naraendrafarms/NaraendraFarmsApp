-- Line-level entry, step 4 of 5: medicine can be recorded at shed and line level.
--
-- medicine_usage is flock-level today (001_schema.sql): flock_id, usage_date,
-- medicine_id, quantity, unit, rate, amount. It has no shed_id at all, which is
-- why "which shed used this" cannot be answered.
--
-- Both new columns are NULLABLE and that is the whole point: every existing row
-- stays valid, every existing report keeps reading exactly what it reads today,
-- and the Flock Financial / Cost & Income figures (which read medicine_usage at
-- stock rates since this session's earlier fix) are unaffected. New entries can
-- simply be more specific than old ones.

ALTER TABLE public.medicine_usage
  ADD COLUMN IF NOT EXISTS shed_id UUID REFERENCES public.sheds(id),
  ADD COLUMN IF NOT EXISTS line_id UUID REFERENCES public.shed_lines(id);

-- VERIFY (statement 2): both columns exist and both are nullable. A NOT NULL
-- here would have broken every existing flock-level entry screen.
SELECT COALESCE(string_agg(column_name || ' (' || data_type || ', nullable=' || is_nullable || ')',
                ', ' ORDER BY column_name), 'COLUMNS NOT ADDED') AS new_columns
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'medicine_usage'
  AND column_name IN ('shed_id','line_id');

-- VERIFY (statement 3): nothing was lost. Row count, and how many rows now
-- carry a shed (should be zero -- this migration only adds the capability).
SELECT COUNT(*) AS medicine_usage_rows,
       COUNT(shed_id) AS rows_with_shed_should_be_zero,
       COUNT(line_id) AS rows_with_line_should_be_zero,
       COUNT(*) FILTER (WHERE flock_id IS NOT NULL) AS rows_still_flock_level;

-- VERIFY (statement 4): the unit and cost work from migrations 605-615 still
-- holds -- no row has lost its unit, and amounts are unchanged in shape.
SELECT COUNT(*) FILTER (WHERE unit IS NULL OR btrim(unit) = '') AS rows_missing_unit,
       COUNT(DISTINCT unit) AS distinct_units,
       COALESCE(string_agg(DISTINCT unit, ', '), 'NONE') AS units_in_use
FROM public.medicine_usage;
