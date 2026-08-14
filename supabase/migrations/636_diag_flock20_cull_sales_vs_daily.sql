-- Diagnostic only. The narrow question, and nothing else:
--
--   For Flock 20, are the culls/birds sold in NHE Sales also deducted in the
--   daily records — and does the report show them?
--
-- I have twice reported flock-level totals that did not match what the app
-- shows. Those broader reconciliations depend on assumptions (which opening to
-- start from, how the view aggregates sheds) that I have got wrong once
-- already. This file makes no such assumption: it lists the two sides by date
-- and lets them be compared directly.

-- 1. Every bird sale on Flock 20 — what is actually stored on each row.
--    If qty is null/0 on most of them, the sale records weight and money but
--    not head count, which changes what "deducted" can even mean.
SELECT COUNT(*) AS bird_sale_rows,
       COUNT(*) FILTER (WHERE COALESCE(female_qty,0) + COALESCE(male_qty,0) > 0) AS rows_with_a_bird_count,
       COALESCE(SUM(female_qty),0) AS total_female_qty,
       COALESCE(SUM(male_qty),0) AS total_male_qty,
       COALESCE(SUM(net_weight_kg), 0) AS total_net_kg,
       COALESCE(SUM(amount),0) AS total_amount
FROM public.nhe_sales s JOIN public.flocks f ON f.id = s.flock_id
WHERE f.flock_no = '20' AND s.sale_type = 'bird_sale';

-- 2. Bird sales BY DATE, with quantity and weight, most recent first.
SELECT COALESCE(string_agg(line, ' | ' ORDER BY d DESC), 'NO BIRD SALES') AS sales_by_date
FROM (
  SELECT s.sale_date AS d,
         s.sale_date::text || ': ♀' || COALESCE(s.female_qty,0) || ' ♂' || COALESCE(s.male_qty,0)
         || ' / ' || COALESCE(s.net_weight_kg,0) || 'kg / ' || COALESCE(s.amount,0) AS line
  FROM public.nhe_sales s JOIN public.flocks f ON f.id = s.flock_id
  WHERE f.flock_no = '20' AND s.sale_type = 'bird_sale'
  ORDER BY s.sale_date DESC LIMIT 20
) x;

-- 3. The daily side on the SAME dates — cull and transfer-out per date, summed
--    across every shed of the flock, so the two lists can be read together.
SELECT COALESCE(string_agg(line, ' | ' ORDER BY d DESC), 'NONE') AS daily_by_date
FROM (
  SELECT d.record_date AS d,
         d.record_date::text || ': cull ♀' || SUM(COALESCE(d.cull_female,0))
         || ' ♂' || SUM(COALESCE(d.cull_male,0))
         || ' / out ♀' || SUM(COALESCE(d.transfer_female,0))
         || ' ♂' || SUM(COALESCE(d.transfer_male,0)) AS line
  FROM public.daily_records d JOIN public.flocks f ON f.id = d.flock_id
  WHERE f.flock_no = '20'
    AND (COALESCE(d.cull_female,0) > 0 OR COALESCE(d.cull_male,0) > 0
         OR COALESCE(d.transfer_female,0) > 0 OR COALESCE(d.transfer_male,0) > 0)
  GROUP BY d.record_date
  ORDER BY d.record_date DESC LIMIT 20
) y;

-- 4. Dates where a bird SALE exists but the daily record shows NO cull and NO
--    transfer out — a sale that was never deducted from the flock.
SELECT COUNT(*) AS sale_dates_with_no_daily_deduction,
       COALESCE(string_agg(sd::text, ', ' ORDER BY sd DESC), 'NONE') AS which_dates
FROM (
  SELECT DISTINCT s.sale_date AS sd
  FROM public.nhe_sales s JOIN public.flocks f ON f.id = s.flock_id
  WHERE f.flock_no = '20' AND s.sale_type = 'bird_sale'
    AND COALESCE(s.female_qty,0) + COALESCE(s.male_qty,0) > 0
    AND NOT EXISTS (
      SELECT 1 FROM public.daily_records d
      WHERE d.flock_id = s.flock_id AND d.record_date = s.sale_date
        AND (COALESCE(d.cull_female,0) > 0 OR COALESCE(d.cull_male,0) > 0
             OR COALESCE(d.transfer_female,0) > 0 OR COALESCE(d.transfer_male,0) > 0))
) z;

-- 5. What the app itself reports for this flock right now, straight from the
--    view every screen reads — so my figures can be checked against the app's
--    rather than against my own arithmetic.
SELECT current_female, current_male, total_placed_f, total_placed_m,
       last_record_date::text AS last_record_date, status
FROM public.v_flock_summary WHERE flock_no = '20';
