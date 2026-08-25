SELECT string_agg(code || ':' || name, ', ' ORDER BY code) AS farms
FROM public.farms WHERE is_active = true;
