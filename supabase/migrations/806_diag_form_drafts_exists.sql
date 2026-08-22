-- Migration 806 (READ ONLY): confirm form_drafts actually exists with its
-- columns and RLS policy, rather than trust run_sql.py's "Errors: 0".
SELECT 'form_drafts_check' AS chk,
       (SELECT count(*) FROM information_schema.columns
         WHERE table_schema='public' AND table_name='form_drafts') AS col_count,
       (SELECT string_agg(column_name, ',' ORDER BY ordinal_position)
          FROM information_schema.columns
         WHERE table_schema='public' AND table_name='form_drafts') AS columns,
       (SELECT count(*) FROM pg_policies WHERE schemaname='public' AND tablename='form_drafts') AS policy_count,
       (SELECT relrowsecurity FROM pg_class WHERE relname='form_drafts') AS rls_enabled;
