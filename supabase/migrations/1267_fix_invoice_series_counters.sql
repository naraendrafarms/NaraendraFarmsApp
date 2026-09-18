-- Migration 1267: bring the HHF and HE invoice counters up to the numbers
-- actually in use, so Generate stops offering a number that is already filed.
--
-- MEASURED (1265, 1266), not assumed, for FY 26-27:
--   HHF  current_no 51, invoices run 1..77 with no gaps  -> next Generate would
--        have produced NF/HHF/26-27/52, which already exists. 26 duplicates
--        were queued up on the busiest series.
--   HE   current_no 7, highest used 14, numbers 2, 3 and 8 never used.
--
-- WHY THEY FELL BEHIND: migration 101 seeded these with the last-used numbers
-- from Tally. fn_next_invoice only advances when someone presses Generate, so
-- invoices typed by hand or imported since then moved the books on while the
-- counters stood still.
--
-- DELIBERATELY NOT TOUCHED:
--   CB    counter 15, only invoice 1 in the app. The 15 is the Tally last-used
--         figure - 15 cull-bird invoices are filed, the app holds one. The
--         counter is right and the app is simply incomplete. Changing it would
--         invent a gap.
--   NHE   counter 3, highest used 3. Already correct.
--   VHPL  counter 2, nothing issued in the app. Tally seed, left alone.
--
-- Nothing on any dispatch or sale is altered - only the two counters.
SELECT 1 AS warmup;

DO $$
BEGIN
  -- Backup before the update, per the no-data-loss rule. Reverses exactly.
  CREATE TABLE IF NOT EXISTS public.invoice_series_backup_1267 AS
  SELECT *, NOW() AS backed_up_at FROM public.invoice_series;

  -- Guarded by the current value, so re-running cannot push a counter further
  -- forward if someone has since raised an invoice through Generate.
  UPDATE public.invoice_series SET current_no = 77 WHERE code = 'HHF' AND current_no < 77;
  UPDATE public.invoice_series SET current_no = 14 WHERE code = 'HE'  AND current_no < 14;
END $$;

SELECT code, current_no,
       replace(replace(template,'{FY}',fy),'{N}',
         CASE WHEN pad > 0 THEN lpad((current_no+1)::text, pad, '0') ELSE (current_no+1)::text END) AS next_would_be
FROM public.invoice_series ORDER BY code;

-- Does the next number of every series now avoid everything already used?
WITH used AS (
  SELECT invoice_no FROM public.he_dispatch WHERE COALESCE(invoice_no,'') <> ''
  UNION ALL
  SELECT invoice_no FROM public.nhe_sales  WHERE COALESCE(invoice_no,'') <> ''
)
SELECT s.code,
       replace(replace(s.template,'{FY}',s.fy),'{N}',
         CASE WHEN s.pad > 0 THEN lpad((s.current_no+1)::text, s.pad, '0') ELSE (s.current_no+1)::text END) AS next_no,
       CASE WHEN EXISTS (
         SELECT 1 FROM used u WHERE u.invoice_no =
           replace(replace(s.template,'{FY}',s.fy),'{N}',
             CASE WHEN s.pad > 0 THEN lpad((s.current_no+1)::text, s.pad, '0') ELSE (s.current_no+1)::text END))
       THEN 'ALREADY USED - STILL WRONG' ELSE 'free' END AS next_number_check
FROM public.invoice_series s ORDER BY s.code;

SELECT (SELECT count(*)::int FROM public.invoice_series_backup_1267) AS rows_backed_up,
       (SELECT string_agg(code || '=' || current_no, ', ' ORDER BY code)
          FROM public.invoice_series_backup_1267) AS counters_before;
