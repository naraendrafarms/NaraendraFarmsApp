-- Hatch Batches, step 1: two columns the new behaviour needs.
--
-- 1. hatcheries.provides_hatch_report
--    Only Hitech Hatch Fresh Pvt Ltd sends a hatchability report; the other
--    hatcheries never will. The Pipeline must chase only the ones that do.
--    This is a TICK BOX ON THE MASTER, not a name in the code -- nothing
--    anywhere tests for the word "Hitech". Default FALSE, so adding a new
--    hatchery never starts chasing a report by accident.
--
-- 2. hatch_batches.std_hatch_pct
--    STD Hatch % is entered by hand from the hatchery's report. It is NOT the
--    same figure as Hatch %, which the app works out itself as
--    chicks sold / setting eggs. Two different numbers, so two columns.
--
--    A NEW column, deliberately. hatchability_pct already exists and is read
--    elsewhere -- FlockPages.tsx line 2284 averages it on the flock's hatch
--    table -- so overwriting its meaning would silently change a figure on a
--    page nobody is looking at right now. It keeps its current meaning.
--
-- Both are additive and nullable. No existing row changes, no existing screen
-- behaves differently until the app is updated.

ALTER TABLE public.hatcheries
  ADD COLUMN IF NOT EXISTS provides_hatch_report BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.hatch_batches
  ADD COLUMN IF NOT EXISTS std_hatch_pct NUMERIC(6,2);

-- Hatch batches record which hatchery by free text today ("Paridhi Hatchery
-- Dankuni", typed). A comparison cannot group on typing, so the batch points at
-- the master. Nullable, and hatchery_name is left in place so the one existing
-- row keeps what it holds.
ALTER TABLE public.hatch_batches
  ADD COLUMN IF NOT EXISTS hatchery_id UUID REFERENCES public.hatcheries(id);

-- VERIFY (statement 4): all three columns exist, all nullable-or-defaulted.
SELECT COALESCE(string_agg(table_name || '.' || column_name || ' (' || data_type
                || ', null=' || is_nullable || COALESCE(', default ' || column_default, '') || ')',
                ' | ' ORDER BY table_name, column_name), 'NOTHING ADDED') AS new_columns
FROM information_schema.columns
WHERE table_schema = 'public'
  AND ((table_name = 'hatcheries'    AND column_name = 'provides_hatch_report')
    OR (table_name = 'hatch_batches' AND column_name IN ('std_hatch_pct','hatchery_id')));

-- VERIFY (statement 5): nothing was disturbed. The hatchery master is still
-- empty and awaiting your entries; the one hatch batch is untouched; and no
-- hatchery is yet ticked as sending reports.
SELECT (SELECT COUNT(*) FROM public.hatcheries) AS hatcheries_in_master,
       (SELECT COUNT(*) FROM public.hatcheries WHERE provides_hatch_report) AS ticked_as_reporting,
       (SELECT COUNT(*) FROM public.hatch_batches) AS hatch_batches,
       (SELECT COUNT(std_hatch_pct) FROM public.hatch_batches) AS batches_with_std_hatch_pct,
       (SELECT COUNT(*) FROM public.he_dispatch) AS he_dispatches;
