-- Line-level entry, step 5 of 5: the opt-in switch.
--
-- A shed is line-managed OR shed-managed, never both. Two doors into the same
-- daily_records row means silent overwrites -- the same class of failure as the
-- electricity payment that was deleted from the Cash Book while the bill still
-- read Paid.
--
-- Default FALSE, on all 27 sheds. Nothing changes for anybody until a shed is
-- deliberately switched on: Bulk Daily Entry keeps working exactly as it does
-- today for every shed, and no existing login, entry screen or report is
-- affected by this migration.
--
-- The roll-up trigger (planned migration 643) is deliberately NOT run yet.
-- There is nothing for it to roll up until real lines exist, and it must be
-- introduced one shed at a time with the daily record checked against the sum
-- of its lines on that shed's first day.

ALTER TABLE public.sheds
  ADD COLUMN IF NOT EXISTS line_managed BOOLEAN NOT NULL DEFAULT FALSE;

-- VERIFY (statement 2): the column exists, is NOT NULL, and defaults to false.
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'sheds' AND column_name = 'line_managed';

-- VERIFY (statement 3): the system is inert -- every shed is false, so no
-- behaviour has changed anywhere.
SELECT COUNT(*) AS sheds_total,
       COUNT(*) FILTER (WHERE is_active) AS active,
       COUNT(*) FILTER (WHERE line_managed) AS line_managed_should_be_zero,
       COUNT(*) FILTER (WHERE NOT line_managed) AS still_shed_managed
FROM public.sheds;

-- VERIFY (statement 4): the whole five-migration set landed. Each name should
-- appear; anything missing here failed silently and must be re-run.
SELECT COALESCE(string_agg(table_name, ', ' ORDER BY table_name), 'NOTHING CREATED') AS new_tables
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('shed_lines','profile_sheds','line_production','line_mortality','line_feed');

-- VERIFY (statement 5): and the two columns added to existing tables.
SELECT COALESCE(string_agg(table_name || '.' || column_name, ', ' ORDER BY table_name, column_name),
       'NO COLUMNS ADDED') AS new_columns
FROM information_schema.columns
WHERE table_schema = 'public'
  AND ((table_name = 'medicine_usage' AND column_name IN ('shed_id','line_id'))
    OR (table_name = 'sheds' AND column_name = 'line_managed'));
