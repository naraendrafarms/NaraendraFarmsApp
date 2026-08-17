-- Diagnostic only. 921 ingredient lines across 34 batches never wrote a
-- production_out row. All 33 ingredient names DO exist in the items master, so
-- an unknown name is not the cause. The trigger swallows its own errors, so the
-- reason has to be inferred from the shape of the rows that failed.
--
-- Prime suspect: the same ingredient appearing TWICE in one batch. The trigger
-- matches ledger rows on (production_id, item_name), so a second line with the
-- same name has nothing distinct to write to -- and a consolidated April/May
-- entry, or any batch built from two formulas, would do exactly that.

-- 1. Constraints on stock_ledger that an insert could be failing against.
SELECT COALESCE(string_agg(conname || '=' || contype, ', '), 'NONE') AS stock_ledger_constraints
FROM pg_constraint WHERE conrelid = 'public.stock_ledger'::regclass;

SELECT COALESCE(string_agg(indexname, ', '), 'NONE') AS stock_ledger_indexes
FROM pg_indexes WHERE schemaname='public' AND tablename='stock_ledger';

-- 2. Are the missing lines duplicates of an ingredient within the same batch?
SELECT COUNT(*)::text AS batches_with_repeated_ingredient,
       COALESCE(SUM(extra_lines)::text,'0') AS extra_lines_from_repeats
FROM (
  SELECT production_id, ingredient_name, COUNT(*) - 1 AS extra_lines
  FROM public.feed_production_ingredients
  GROUP BY production_id, ingredient_name
  HAVING COUNT(*) > 1
) x;

-- 3. Of the 921 lines with no ledger row, how many are such repeats?
SELECT COUNT(*)::text AS missing_lines,
       COUNT(*) FILTER (WHERE dup_rank > 1)::text AS missing_because_repeated_in_batch,
       COUNT(*) FILTER (WHERE dup_rank = 1)::text AS missing_for_another_reason
FROM (
  SELECT i.id,
         ROW_NUMBER() OVER (PARTITION BY i.production_id, lower(i.ingredient_name) ORDER BY i.id) AS dup_rank
  FROM public.feed_production_ingredients i
  WHERE NOT EXISTS (
    SELECT 1 FROM public.stock_ledger s
    WHERE s.feed_prod_id = i.production_id AND s.txn_type='production_out'
      AND lower(s.item_name) = lower(COALESCE(i.ingredient_name,'')))
) y;

-- 4. Which months the 34 affected batches sit in (this did not print last time).
SELECT COALESCE(string_agg(mth || ': ' || n, ' | ' ORDER BY mth), 'NONE') AS affected_batches_by_month
FROM (
  SELECT to_char(date_trunc('month', l.production_date),'YYYY-MM') AS mth, COUNT(DISTINCT l.id) AS n
  FROM public.feed_production_log l
  JOIN public.feed_production_ingredients i ON i.production_id = l.id
  WHERE NOT EXISTS (
    SELECT 1 FROM public.stock_ledger s
    WHERE s.feed_prod_id = i.production_id AND s.txn_type='production_out'
      AND lower(s.item_name) = lower(COALESCE(i.ingredient_name,'')))
  GROUP BY 1
) z;
