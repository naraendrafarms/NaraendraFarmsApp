SELECT name, count(*) AS n, string_agg(id::text, ',') AS ids
FROM public.farms
GROUP BY name
ORDER BY name;
