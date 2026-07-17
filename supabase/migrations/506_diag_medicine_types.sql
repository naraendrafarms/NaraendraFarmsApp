SELECT string_agg(DISTINCT type, ' | ') AS all_medicine_types FROM public.medicines_master;
SELECT grp, string_agg(value, ' | ' ORDER BY sort_order) AS options FROM public.config_options WHERE grp ILIKE '%medicine%' GROUP BY grp;
SELECT grp, string_agg(value, ' | ' ORDER BY sort_order) AS options FROM public.config_options WHERE grp ILIKE '%vaccine%' OR grp ILIKE '%route%' GROUP BY grp;
