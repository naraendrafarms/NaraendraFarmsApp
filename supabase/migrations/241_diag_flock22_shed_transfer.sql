SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='flocks' AND column_name='flock_no';
SELECT id, flock_no::text AS flock_no_text, status FROM public.flocks ORDER BY flock_no::text LIMIT 40;
