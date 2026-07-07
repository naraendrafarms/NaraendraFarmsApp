SELECT 'sentinel' AS marker, 1 AS n;

SELECT item_name, category,
       round((sum(qty) / NULLIF(sum(bags),0))::numeric, 1) AS avg_wt,
       sum(bags) AS bags
FROM grn WHERE bags IS NOT NULL AND bags > 0 AND qty IS NOT NULL
GROUP BY item_name, category ORDER BY sum(bags) DESC LIMIT 10;

SELECT item_name, category,
       round((sum(qty) / NULLIF(sum(bags),0))::numeric, 1) AS avg_wt,
       sum(bags) AS bags
FROM grn WHERE bags IS NOT NULL AND bags > 0 AND qty IS NOT NULL
GROUP BY item_name, category ORDER BY sum(bags) DESC LIMIT 10 OFFSET 10;

SELECT item_name, category,
       round((sum(qty) / NULLIF(sum(bags),0))::numeric, 1) AS avg_wt,
       sum(bags) AS bags
FROM grn WHERE bags IS NOT NULL AND bags > 0 AND qty IS NOT NULL
GROUP BY item_name, category ORDER BY sum(bags) DESC LIMIT 10 OFFSET 20;
