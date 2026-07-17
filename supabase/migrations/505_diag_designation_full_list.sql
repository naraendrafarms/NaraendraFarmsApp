SELECT string_agg(value, ' | ' ORDER BY sort_order) AS all_designation_options
FROM public.config_options WHERE grp = 'designation';

SELECT string_agg(DISTINCT designation, ' | ') AS all_employee_designations
FROM public.employees WHERE is_active = true;
