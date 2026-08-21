-- Migration 798 (READ ONLY): two separate reports to check against real data.
--
-- 1. Flock 19, 03/07/2026, cull sales -- possible duplicate.
-- 2. Dashboard Hatch Batches: Invoice/Hatchery/Hatch Date showing "Pending"
--    even where the batch says it is linked. Read the actual rows rather than
--    guess at either.

SELECT 'f19_cull_030726' AS chk,
       (SELECT string_agg(t, ' | ' ORDER BY t) FROM (
          SELECT n.id::text || ' type=' || n.sale_type || ' qty=' || COALESCE(n.quantity,0)
                 || ' free=' || COALESCE(n.free_qty,0) || ' amt=' || COALESCE(n.amount,0)
                 || ' dc=' || COALESCE(n.dc_no,'-') || ' party=' || COALESCE(p.name,'-')
                 || ' shed=' || COALESCE(s.shed_no,'-') || ' created=' || n.created_at::text AS t
            FROM public.nhe_sales n
            JOIN public.flocks f ON f.id = n.flock_id
            LEFT JOIN public.parties p ON p.id = n.party_id
            LEFT JOIN public.sheds s ON s.id = n.shed_id
           WHERE f.flock_no::text = '19' AND n.sale_date = '2026-07-03'
       ) x) AS rows_that_day;

-- Hatch batches: which ones show as "Pending" on the dashboard despite being
-- linked, and why. The dashboard almost certainly reads a specific set of
-- columns as its definition of "pending" -- find out what that set is by
-- reading the actual page logic separately; here just get the batch data.
SELECT 'hatch_pending' AS chk,
       (SELECT count(*) FROM public.hatch_batches) AS batches_total,
       (SELECT count(*) FROM public.hatch_batches WHERE dispatch_id IS NOT NULL) AS batches_linked,
       (SELECT count(*) FROM public.hatch_batches WHERE hatch_date IS NULL) AS batches_no_hatch_date,
       (SELECT count(*) FROM public.hatch_batches WHERE hatchery_name IS NULL AND hatchery_id IS NULL) AS batches_no_hatchery,
       (SELECT count(*) FROM public.hatch_batches WHERE invoice_no IS NULL) AS batches_no_invoice_no,
       (SELECT string_agg(t, ' | ' ORDER BY t) FROM (
          SELECT b.id::text
                 || ' inv=' || COALESCE(b.invoice_no, '(null)')
                 || ' hatchery_name=' || COALESCE(b.hatchery_name, '(null)')
                 || ' hatchery_id=' || COALESCE(b.hatchery_id::text, '(null)')
                 || ' hatch_date=' || COALESCE(b.hatch_date::text, '(null)')
                 || ' dispatch_id=' || COALESCE(b.dispatch_id::text, '(null)')
                 || ' setting=' || b.setting_date::text AS t
            FROM public.hatch_batches b
            WHERE b.dispatch_id IS NOT NULL
            ORDER BY b.setting_date DESC
            LIMIT 10
       ) y) AS sample_linked_batches;
