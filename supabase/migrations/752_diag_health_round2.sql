-- Migration 752: run the full set — round one and round two — and read the
-- result straight from the table.

SELECT public.fn_run_health_checks();

SELECT 'summary' AS chk, count(*)::int AS rules,
       count(*) FILTER (WHERE failed_count > 0)::int AS failing,
       count(*) FILTER (WHERE failed_count > 0 AND severity = 'critical')::int AS critical
FROM public.health_check_results
WHERE run_at = (SELECT max(run_at) FROM public.health_check_results);

SELECT 'failing' AS chk,
       COALESCE(string_agg(severity || ' | ' || module || ' | ' || title || ' = ' || failed_count::text, '  ///  ' ORDER BY severity, title), '(none failing)') AS list
FROM public.health_check_results
WHERE run_at = (SELECT max(run_at) FROM public.health_check_results) AND failed_count > 0;

SELECT 'passing' AS chk, count(*)::int AS n,
       COALESCE(string_agg(title, ', ' ORDER BY title), '(none)') AS titles
FROM public.health_check_results
WHERE run_at = (SELECT max(run_at) FROM public.health_check_results) AND failed_count = 0;
