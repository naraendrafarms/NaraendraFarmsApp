-- Diagnostic only. "Male Helper / Female Helper how many required" needs to be
-- built from what the employee records actually say, not from a guess about how
-- helpers are labelled. Two things to establish: what designations exist, and
-- whether gender is filled in -- if helper rows have no gender, splitting them
-- male/female is not possible from the data.
SELECT COALESCE(string_agg(designation || ' x' || n, ' | ' ORDER BY n DESC), 'NONE') AS designations
FROM (SELECT COALESCE(designation,'(not set)') AS designation, COUNT(*) AS n
      FROM public.employees WHERE is_active GROUP BY 1) x;

SELECT COALESCE(string_agg(g || ' x' || n, ' | ' ORDER BY n DESC), 'NONE') AS genders
FROM (SELECT COALESCE(gender,'(not set)') AS g, COUNT(*) AS n
      FROM public.employees WHERE is_active GROUP BY 1) y;

-- Helpers specifically, split by gender, which is exactly the figure asked for.
SELECT COALESCE(string_agg(line, ' | ' ORDER BY line), 'NO HELPERS FOUND') AS helpers_by_gender
FROM (SELECT COALESCE(gender,'(gender not set)') || ': ' || COUNT(*) AS line
      FROM public.employees
      WHERE is_active AND designation ILIKE '%helper%'
      GROUP BY COALESCE(gender,'(gender not set)')) z;

-- Is there any notion of a REQUIRED or sanctioned headcount anywhere? If not,
-- "how many required" cannot be answered from the database and needs a master.
SELECT COALESCE(string_agg(table_name || '.' || column_name, ', '), 'NO REQUIRED-STRENGTH COLUMN ANYWHERE') AS required_columns
FROM information_schema.columns
WHERE table_schema='public'
  AND (column_name ILIKE '%required%' OR column_name ILIKE '%sanction%' OR column_name ILIKE '%manpower%');
