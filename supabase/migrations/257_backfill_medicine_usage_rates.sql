-- Backfill rate/amount on medicine_usage rows saved before the rate fix
-- (they were saved with medicines_master.rate, which was often NULL/0).
-- Same logic as the DailyEntry.tsx fix: prefer weighted-average GRN
-- purchase cost, fall back to the Inventory Adjustments rate, then the
-- master rate as a last resort. Only touches rows with NULL/0 rate — never
-- overwrites a rate someone already corrected manually.
UPDATE public.medicine_usage mu
SET rate = v.real_rate,
    amount = mu.quantity * v.real_rate
FROM (
  SELECT medicine_id,
    COALESCE(
      NULLIF(purchase_value / NULLIF(purchased_qty, 0), 0),
      NULLIF(adjustment_rate, 0),
      NULLIF(master_rate, 0)
    ) AS real_rate
  FROM public.v_medicine_stock
) v
WHERE mu.medicine_id = v.medicine_id
  AND v.real_rate IS NOT NULL
  AND (mu.rate IS NULL OR mu.rate = 0);

SELECT 'flock22_after_backfill' AS chk, mm.name, mu.quantity, mu.rate, mu.amount
FROM public.medicine_usage mu
JOIN public.medicines_master mm ON mm.id = mu.medicine_id
JOIN public.flocks f ON f.id = mu.flock_id
WHERE f.flock_no = '22' AND mm.name IN ('Solucal','Famitone')
ORDER BY mu.usage_date DESC;

SELECT 'total_backfilled' AS chk, count(*) FROM public.medicine_usage WHERE rate IS NOT NULL AND rate > 0;
