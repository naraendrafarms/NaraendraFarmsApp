-- Migration 489's run showed "Done. Errors: 0" but printed no per-statement
-- output at all (unusual) — verify the table and RLS policy actually exist.
SELECT count(*) AS table_exists FROM information_schema.tables WHERE table_schema='public' AND table_name='medicine_allocations';
SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='medicine_allocations' ORDER BY ordinal_position;
SELECT count(*) AS policy_exists FROM pg_policies WHERE schemaname='public' AND tablename='medicine_allocations';
