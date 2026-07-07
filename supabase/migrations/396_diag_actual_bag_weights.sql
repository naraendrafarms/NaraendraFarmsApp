SELECT 'sentinel' AS marker, 1 AS n;

-- Real avg bag weight (qty/bags) per category+item, from actual GRN history
SELECT category, item_name, unit,
       count(*) AS grn_lines,
       sum(bags) AS total_bags,
       sum(qty) AS total_qty,
       round((sum(qty) / NULLIF(sum(bags),0))::numeric, 1) AS avg_bag_weight
FROM grn
WHERE bags IS NOT NULL AND bags > 0 AND qty IS NOT NULL
GROUP BY category, item_name, unit
ORDER BY total_bags DESC
LIMIT 30;
