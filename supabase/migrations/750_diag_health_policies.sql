-- Migration 750: verify 749. The runner reports "already exists" as success, so
-- confirm the old open policies are gone and only the admin ones remain.

SELECT 'policies' AS chk,
       COALESCE(string_agg(policyname || CASE WHEN qual LIKE '%admin%' THEN ' [admin]' ELSE ' [OPEN]' END, ', ' ORDER BY policyname), '(none)') AS on_results
FROM pg_policies WHERE schemaname = 'public' AND tablename = 'health_check_results';
