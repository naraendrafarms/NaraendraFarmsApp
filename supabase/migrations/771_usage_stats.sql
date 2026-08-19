-- Migration 771: let the app show its own Supabase usage, admin only.
--
-- Until now the only way to know how close the database was to the free plan's
-- 500 MB was to ask me to run a diagnostic. That is exactly the kind of thing
-- that should be on a screen: 166 MB of the 207 MB in use turned out to be the
-- audit log, and nobody could have seen it from inside the app.
--
-- Returns one JSON object rather than a row set, so the page can grow new
-- figures without a migration each time.

CREATE OR REPLACE FUNCTION public.fn_usage_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_out      JSONB;
BEGIN
  SELECT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
    INTO v_is_admin;
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Only an administrator can read usage figures';
  END IF;

  SELECT jsonb_build_object(
    'measured_at',   now(),
    'db_bytes',      pg_database_size(current_database()),
    'db_limit',      524288000,
    'storage_bytes', COALESCE((SELECT sum((metadata->>'size')::bigint) FROM storage.objects), 0),
    'storage_limit', 1073741824,
    'tables', (
      SELECT jsonb_agg(t) FROM (
        SELECT c.relname AS name,
               pg_total_relation_size(c.oid) AS bytes,
               COALESCE(s.n_live_tup, 0) AS rows
          FROM pg_class c
          JOIN pg_namespace n ON n.oid = c.relnamespace
          LEFT JOIN pg_stat_user_tables s ON s.relid = c.oid
         WHERE n.nspname = 'public' AND c.relkind = 'r'
         ORDER BY pg_total_relation_size(c.oid) DESC
         LIMIT 12
      ) t
    ),
    'audit', jsonb_build_object(
      'rows',        (SELECT count(*) FROM public.audit_log),
      'bytes',       pg_total_relation_size('public.audit_log'),
      'last_7d',     (SELECT count(*) FROM public.audit_log WHERE changed_at >= now() - INTERVAL '7 days'),
      'oldest',      (SELECT min(changed_at) FROM public.audit_log),
      'with_values', (SELECT count(*) FROM public.audit_log WHERE old_data IS NOT NULL OR new_data IS NOT NULL)
    )
  ) INTO v_out;

  RETURN v_out;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_usage_stats() TO authenticated;

NOTIFY pgrst, 'reload schema';
