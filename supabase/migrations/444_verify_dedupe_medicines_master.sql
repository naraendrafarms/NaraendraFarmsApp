SELECT count(*) AS remaining_dup_groups FROM (
  SELECT lower(regexp_replace(trim(name), '\s+', ' ', 'g')) AS norm_name
  FROM public.medicines_master
  GROUP BY norm_name
  HAVING count(*) > 1
) x;
SELECT id, name FROM public.medicines_master WHERE name ILIKE '%vitalosin%';
