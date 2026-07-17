SELECT count(*) AS table_exists FROM information_schema.tables WHERE table_schema='public' AND table_name='feed_allocations';
SELECT count(*) AS policy_exists FROM pg_policies WHERE schemaname='public' AND tablename='feed_allocations';
