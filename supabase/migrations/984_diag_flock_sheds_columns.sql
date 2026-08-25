SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema='public' AND table_name='flock_sheds'
ORDER BY ordinal_position;
