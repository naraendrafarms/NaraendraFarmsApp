SELECT * FROM (
  SELECT id, name, category, unit FROM public.items WHERE category = 'Packaging' ORDER BY name
) x LIMIT 5 OFFSET 0;

SELECT * FROM (
  SELECT id, name, category, unit FROM public.items WHERE category = 'Packaging' ORDER BY name
) x LIMIT 5 OFFSET 5;
