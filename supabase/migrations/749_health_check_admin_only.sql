-- Migration 749: the health check is admin only.
--
-- It names items, bills, flocks and quantities that are WRONG. That is a list
-- of where the books do not agree, and it belongs with whoever answers for the
-- books — not with every logged-in user. Enforced by the row policy, not only
-- by hiding the page: a non-admin asking the database directly gets nothing.

DROP POLICY IF EXISTS "auth_read" ON public.health_check_results;

DROP POLICY IF EXISTS "auth_write" ON public.health_check_results;

CREATE POLICY "admin_read" ON public.health_check_results FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

CREATE POLICY "admin_write" ON public.health_check_results FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- Let an admin run the checks on demand from the page. The function runs as
-- the caller, so the policies above still decide who may write results.
GRANT EXECUTE ON FUNCTION public.fn_run_health_checks() TO authenticated;

SELECT 'policies' AS chk, COALESCE(string_agg(policyname, ', ' ORDER BY policyname), '(none)') AS on_results
FROM pg_policies WHERE schemaname = 'public' AND tablename = 'health_check_results';

NOTIFY pgrst, 'reload schema';
