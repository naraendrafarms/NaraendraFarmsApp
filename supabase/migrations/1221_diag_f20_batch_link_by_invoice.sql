-- Read-only. The job is LINKING, not creating: Flock 20 already has 231
-- hatch_batches rows with the hatch results filled in by hand, but no
-- dispatch_id. The one the owner linked himself matches its dispatch on
-- INVOICE NUMBER - batch NF/HHF/25-26/76 to DC 3861, eggs_set 10,080 equal to
-- total_dispatched. Test that key across all 231 before writing anything.
SELECT 1 AS warmup;

-- 1. How cleanly invoice number matches, and whether the eggs agree
SELECT CASE
         WHEN d.id IS NULL THEN 'no dispatch with that invoice'
         WHEN hb.eggs_set = d.total_dispatched THEN 'matched, eggs agree'
         ELSE 'matched, eggs DIFFER'
       END AS verdict,
       count(*)::int AS batches,
       COALESCE(sum(hb.eggs_set),0)::bigint AS eggs_set
FROM public.hatch_batches hb
LEFT JOIN public.he_dispatch d
       ON d.flock_id = hb.flock_id AND d.invoice_no = hb.invoice_no
WHERE hb.flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'::uuid
  AND hb.dispatch_id IS NULL
GROUP BY 1 ORDER BY 2 DESC;

-- 2. Would any invoice match MORE than one dispatch, or one dispatch take more
--    than one batch? Either makes a blind update wrong.
SELECT count(*)::int AS invoices_on_more_than_one_dispatch
FROM (SELECT invoice_no FROM public.he_dispatch
      WHERE flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'::uuid AND invoice_no IS NOT NULL
      GROUP BY invoice_no HAVING count(*) > 1) t;

SELECT count(*)::int AS invoices_with_more_than_one_batch
FROM (SELECT invoice_no FROM public.hatch_batches
      WHERE flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'::uuid
        AND dispatch_id IS NULL AND invoice_no IS NOT NULL
      GROUP BY invoice_no HAVING count(*) > 1) t;

-- 3. The batches that would NOT link, so the remainder is a known list
SELECT COALESCE(hb.invoice_no,'(no invoice on the batch)') AS invoice_no,
       hb.hatchery_name, hb.setting_date::text, hb.eggs_set
FROM public.hatch_batches hb
LEFT JOIN public.he_dispatch d
       ON d.flock_id = hb.flock_id AND d.invoice_no = hb.invoice_no
WHERE hb.flock_id = '63f8e45a-d50b-4dad-ad71-90f634abc4f0'::uuid
  AND hb.dispatch_id IS NULL AND d.id IS NULL
ORDER BY hb.setting_date LIMIT 15;
