SELECT string_agg(v.name || ' -> ' || coalesce(f.code,'none'), ', ' ORDER BY v.name) AS vehicles
FROM public.vehicles v LEFT JOIN public.farms f ON f.id = v.farm_id;
