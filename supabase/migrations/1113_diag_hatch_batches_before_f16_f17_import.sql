-- Migration 1113: read-only. What does the DB already hold for a Flock 16/17
-- hatch-report import, and can every Excel hatchery name be resolved?

-- 1. Do flocks 16 and 17 exist, and what are their ids?
SELECT string_agg(flock_no || '=' || id::text, ' | ' ORDER BY flock_no) AS flock_ids
FROM public.flocks WHERE flock_no::text IN ('16','17');

-- 2. Anything already in hatch_batches at all, and for these two flocks?
SELECT count(*)::int AS all_batches,
       count(*) FILTER (WHERE f.flock_no::text IN ('16','17'))::int AS f16_f17_batches
FROM public.hatch_batches hb
LEFT JOIN public.flocks f ON f.id = hb.flock_id;

-- 3. Existing rows in detail (duplicate risk before any insert).
SELECT COALESCE(string_agg(COALESCE(f.flock_no,'?') || ':' || COALESCE(hb.setting_no,'no-setting-no')
       || '@' || COALESCE(hb.setting_date::text,'no-date') || ' hatchery=' || COALESCE(hb.hatchery_name,'null'),
       ' | ' ORDER BY hb.setting_date), 'NONE') AS existing_rows
FROM public.hatch_batches hb LEFT JOIN public.flocks f ON f.id = hb.flock_id;

-- 4. The hatchery master — can HOWRAH / RUIYA / RUIYA GROUND FLOOR /
--    RUIYA TOP FLOOR / NILGUNJ / NILGANJ each be resolved to a row?
SELECT COALESCE(string_agg(name || ' [' || id::text || ']', ' | ' ORDER BY name), 'NO HATCHERIES') AS hatchery_master
FROM public.hatcheries;

-- 5. Is setting_no unique-constrained anywhere (would an import collide)?
SELECT COALESCE(string_agg(indexname || ': ' || indexdef, ' | '), 'NO INDEXES') AS hb_indexes
FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'hatch_batches';

-- 6. Full column list, so the insert names only columns that exist.
SELECT string_agg(column_name || '(' || data_type || ',null=' || is_nullable || ')', ', ' ORDER BY ordinal_position) AS hb_columns
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'hatch_batches';
