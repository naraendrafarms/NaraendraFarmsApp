-- Owner-approved. The 17 NHE cash receipts that carry no site - Rs 6,37,463,
-- 03/06/2026 to 22/07/2026 - are put back to the site their flock belongs to.
--
-- They lost the site through the form fault fixed today: nhe_sales has no
-- cash_farm_id column, so the edit screen always reopened on Head Office and
-- saving rewrote the cash book row with a blank site. A blank site derives to
-- HO Imprest, which is where all 17 are sitting (verified in migration 1208).
--
-- Only cash_book.farm_id is set. cash_account_id is deliberately left NULL so the
-- imprest keeps deriving from the location, exactly as an ordinary receipt does -
-- writing an account would claim a person held the cash, which no record says.
--
-- This moves the receipt's SITE as well as its tin, which is the point: the cash
-- was received at the site, and the blank was a bug rather than a Head Office
-- receipt.

CREATE TABLE IF NOT EXISTS public.cash_book_site_restore_1210 AS
SELECT cb.id, cb.txn_date, cb.description, cb.party_name, cb.amount_in,
       cb.farm_id AS old_farm_id, cb.cash_account_id AS old_cash_account_id,
       cb.nhe_sale_id, now() AS backed_up_at
FROM public.cash_book cb
JOIN public.nhe_sales s ON s.id = cb.nhe_sale_id
WHERE cb.farm_id IS NULL;

UPDATE public.cash_book cb
SET farm_id = COALESCE(fl.laying_farm_id, fl.rearing_farm_id)
FROM public.nhe_sales s
JOIN public.flocks fl ON fl.id = s.flock_id
WHERE s.id = cb.nhe_sale_id
  AND cb.farm_id IS NULL
  AND COALESCE(fl.laying_farm_id, fl.rearing_farm_id) IS NOT NULL;
