-- Diagnostic only (no schema changes) — checking whether the `partners`
-- table has any active rows, since Opening Balances' "Partner" toggle
-- pulls its dropdown from here (is_active=true) — if it's empty, the
-- toggle exists but nobody would show up to select.
SELECT count(*) AS total_partners FROM public.partners;
SELECT count(*) AS active_partners FROM public.partners WHERE is_active = true;
SELECT id, name, is_active FROM public.partners ORDER BY name LIMIT 20;

SELECT 'sentinel' AS marker, 1 AS n;
