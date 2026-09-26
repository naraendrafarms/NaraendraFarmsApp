-- READ ONLY. Sizes the multi-instalment problem before the fix is chosen.
--
-- The single Receive Payment window deletes EVERY cash_book and
-- bank_transactions row for a voucher before writing one. On a voucher paid in
-- instalments that destroys the earlier receipts. he_dispatch measured 0 such
-- vouchers (1362), so a hard block would cost nothing there - but nhe_sales
-- uses the same window, and if real NHE vouchers have instalment histories then
-- blocking the save would take away the ability to edit them at all. That is a
-- capability regression, so the behaviour must be chosen on the real numbers.

SELECT 'nheMultiCash=' || COUNT(*) AS nhe_multi_cash
  FROM ( SELECT nhe_sale_id FROM public.cash_book
          WHERE nhe_sale_id IS NOT NULL GROUP BY nhe_sale_id HAVING COUNT(*) > 1 ) x;

SELECT 'nheMultiBank=' || COUNT(*) AS nhe_multi_bank
  FROM ( SELECT nhe_sale_id FROM public.bank_transactions
          WHERE nhe_sale_id IS NOT NULL GROUP BY nhe_sale_id HAVING COUNT(*) > 1 ) x;

SELECT 'heMultiBank=' || COUNT(*) AS he_multi_bank
  FROM ( SELECT he_dispatch_id FROM public.bank_transactions
          WHERE he_dispatch_id IS NOT NULL GROUP BY he_dispatch_id HAVING COUNT(*) > 1 ) x;

-- Vouchers whose cash and bank rows TOGETHER number more than one - a split
-- receipt legitimately writes two rows, one of each, so this is the real
-- population a naive "more than one row" guard would catch.
SELECT 'bothLedgers_he=' || COUNT(*) AS he_rows_in_both
  FROM ( SELECT d.id FROM public.he_dispatch d
          WHERE (SELECT COUNT(*) FROM public.cash_book c WHERE c.he_dispatch_id = d.id) > 0
            AND (SELECT COUNT(*) FROM public.bank_transactions b WHERE b.he_dispatch_id = d.id) > 0 ) x;

SELECT 'bothLedgers_nhe=' || COUNT(*) AS nhe_rows_in_both
  FROM ( SELECT s.id FROM public.nhe_sales s
          WHERE (SELECT COUNT(*) FROM public.cash_book c WHERE c.nhe_sale_id = s.id) > 0
            AND (SELECT COUNT(*) FROM public.bank_transactions b WHERE b.nhe_sale_id = s.id) > 0 ) x;
