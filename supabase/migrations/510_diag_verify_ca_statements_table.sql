SELECT string_agg(table_name, ' | ') AS tables_found
FROM information_schema.tables
WHERE table_schema='public' AND table_name = 'ca_financial_statements';

SELECT count(*) AS col_count FROM information_schema.columns
WHERE table_schema='public' AND table_name='ca_financial_statements';
