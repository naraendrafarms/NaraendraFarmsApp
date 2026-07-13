SELECT count(*) AS table_exists FROM information_schema.tables
WHERE table_schema='public' AND table_name='payment_plan_manual_items';
SELECT count(*) AS policy_count FROM pg_policies
WHERE schemaname='public' AND tablename='payment_plan_manual_items';
SELECT count(*) AS trigger_exists FROM pg_trigger
WHERE tgname='trg_audit' AND tgrelid = 'public.payment_plan_manual_items'::regclass;
