-- The site restore shipped. An untrue task list is worse than none.
SELECT 1 AS warmup;

UPDATE public.tasks
SET status = 'done',
    description = description || E'\n\nDONE 08/09/2026 by migrations 1210/1211. All 17 rows moved to their flock''s '
      || 'site: Agraharam Potlapally 11 (Rs 4,29,160), Bodjanampet-2 (VHL) 5 (Rs 2,08,108), '
      || 'Bodjanampet-1 1 (Rs 195). Verified after: NHE cash book rows with no site = 0, and the '
      || 'imprest ledger now counts all 17 in those three site imprests instead of HO Imprest. '
      || 'HO Imprest went from Rs 11,90,998 over 930 entries to Rs 5,53,535 over 913 - exactly '
      || 'the 17 rows and the Rs 6,37,463. Only cash_book.farm_id was set; cash_account_id was '
      || 'left NULL so the tin keeps deriving from the location, since no record says a person '
      || 'held the cash. The previous farm and account of every row are kept in '
      || 'cash_book_site_restore_1210 so it can be reversed exactly.'
WHERE task_type = 'development'
  AND title = '17 NHE cash receipts lost their site - Rs 6,37,463 sitting in HO Imprest';

SELECT title, status FROM public.tasks
WHERE task_type = 'development'
  AND title = '17 NHE cash receipts lost their site - Rs 6,37,463 sitting in HO Imprest';
