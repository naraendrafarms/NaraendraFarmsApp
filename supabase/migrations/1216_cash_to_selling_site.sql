-- Owner-approved. 15 cash receipts sit at a site that did not make the sale:
-- 13 NHE (Rs 92,830) and 2 hatching-egg (Rs 23,914), 01/06/2026 to 29/08/2026.
-- The rule is the owner's own: the site a sale came FROM is answerable for the
-- money, whoever bought it and wherever they are posted. Every one of these was
-- sold from Bodjanampet-1 or Bodjanampet-2 with the cash parked elsewhere -
-- nothing runs the other way.
--
-- The selling site is the SHED's site where one is recorded, else the flock's
-- own farm - the same shed-then-flock rule the sales form now uses. Only
-- cash_book.farm_id is set; cash_account_id stays as it is so the tin keeps
-- deriving from the location, exactly as an ordinary receipt does.

CREATE TABLE IF NOT EXISTS public.cash_book_selling_site_1216 AS
SELECT cb.id, cb.txn_date, cb.description, cb.party_name, cb.amount_in,
       cb.farm_id AS old_farm_id, cb.cash_account_id AS old_cash_account_id,
       cb.nhe_sale_id, cb.he_dispatch_id, now() AS backed_up_at
FROM public.cash_book cb
LEFT JOIN public.nhe_sales s   ON s.id = cb.nhe_sale_id
LEFT JOIN public.sheds sh      ON sh.id = s.shed_id
LEFT JOIN public.flocks fls    ON fls.id = s.flock_id
LEFT JOIN public.he_dispatch d ON d.id = cb.he_dispatch_id
LEFT JOIN public.flocks fld    ON fld.id = d.flock_id
WHERE (cb.nhe_sale_id IS NOT NULL OR cb.he_dispatch_id IS NOT NULL)
  AND COALESCE(sh.farm_id, fls.laying_farm_id, fls.rearing_farm_id,
               fld.laying_farm_id, fld.rearing_farm_id) IS NOT NULL
  AND COALESCE(sh.farm_id, fls.laying_farm_id, fls.rearing_farm_id,
               fld.laying_farm_id, fld.rearing_farm_id) IS DISTINCT FROM cb.farm_id;

UPDATE public.cash_book cb
SET farm_id = b.selling_site
FROM (
  SELECT cb2.id,
         COALESCE(sh.farm_id, fls.laying_farm_id, fls.rearing_farm_id,
                  fld.laying_farm_id, fld.rearing_farm_id) AS selling_site
  FROM public.cash_book cb2
  LEFT JOIN public.nhe_sales s   ON s.id = cb2.nhe_sale_id
  LEFT JOIN public.sheds sh      ON sh.id = s.shed_id
  LEFT JOIN public.flocks fls    ON fls.id = s.flock_id
  LEFT JOIN public.he_dispatch d ON d.id = cb2.he_dispatch_id
  LEFT JOIN public.flocks fld    ON fld.id = d.flock_id
  WHERE cb2.nhe_sale_id IS NOT NULL OR cb2.he_dispatch_id IS NOT NULL
) b
WHERE b.id = cb.id
  AND b.selling_site IS NOT NULL
  AND b.selling_site IS DISTINCT FROM cb.farm_id;
