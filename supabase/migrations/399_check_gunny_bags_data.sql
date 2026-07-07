SELECT 'sentinel' AS marker, 1 AS n;

SELECT conname, pg_get_constraintdef(oid) AS definition
FROM pg_constraint WHERE conrelid = 'nhe_sales'::regclass AND contype = 'c';

SELECT count(*) AS gunny_bags_rows, sum(amount) AS total_amount,
       min(sale_date) AS earliest, max(sale_date) AS latest
FROM nhe_sales WHERE sale_type = 'gunny_bags';
