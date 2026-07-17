SELECT string_agg(table_name, ' | ') AS tables_found
FROM information_schema.tables
WHERE table_schema='public' AND table_name IN ('plans','plan_lines');

SELECT string_agg(column_name, ' | ' ORDER BY ordinal_position) AS plans_columns
FROM information_schema.columns WHERE table_schema='public' AND table_name='plans';
