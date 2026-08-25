SELECT left(detail, 550) AS d FROM public.health_check_results
WHERE check_key='birds_dont_balance' AND run_at = (SELECT max(run_at) FROM public.health_check_results);
