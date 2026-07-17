SELECT grp, value, label, sort_order FROM public.config_options WHERE grp = 'designation' ORDER BY sort_order;
SELECT DISTINCT designation, count(*) FROM public.employees WHERE is_active = true GROUP BY designation ORDER BY designation;
