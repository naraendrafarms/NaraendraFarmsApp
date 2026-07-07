SELECT 'sentinel' AS marker, 1 AS n;

SELECT relrowsecurity, relforcerowsecurity FROM pg_class WHERE oid = 'public.flocks'::regclass;

SELECT polname, polcmd, polroles::regrole[], pg_get_expr(polqual, polrelid) AS using_expr
FROM pg_policy WHERE polrelid = 'public.flocks'::regclass;
