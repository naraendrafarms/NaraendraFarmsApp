SELECT public.fn_run_health_checks();

SELECT string_agg(check_key || ':' || failed_count, ' | ' ORDER BY severity, check_key) AS rows
FROM public.health_check_results
WHERE run_at = (SELECT max(run_at) FROM public.health_check_results);
