SELECT count(*) AS table_exists FROM information_schema.tables
WHERE table_schema='public' AND table_name='item_aliases';
SELECT count(*) AS total_aliases FROM public.item_aliases;
SELECT source, count(*) AS n FROM public.item_aliases GROUP BY source ORDER BY n DESC;
SELECT count(*) AS trigger_exists FROM pg_trigger WHERE tgname='trg_audit' AND tgrelid='public.item_aliases'::regclass;
