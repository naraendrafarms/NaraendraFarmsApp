-- How widespread is the missing-manufacturer data gap across Items Master?
SELECT category, count(*) AS total,
  count(*) FILTER (WHERE manufacturer IS NULL OR manufacturer = '') AS missing_manufacturer
FROM public.items
WHERE category IN ('Medicine', 'Vaccine', 'Disinfectant', 'Equipment')
GROUP BY category
ORDER BY category;

SELECT name, category FROM public.items
WHERE category IN ('Medicine', 'Vaccine', 'Disinfectant', 'Equipment')
  AND (manufacturer IS NULL OR manufacturer = '')
ORDER BY category, name;
