-- Migration 1155: a cash imprest per site, and a site on the NHE sale.
--
-- OWNER'S DESCRIPTION OF THE REAL FLOW:
--   The SITE INCHARGE holds the cash collected at his site, then passes it to
--   Mandal Imprest. So a site is a cash holder in its own right, and the
--   movement is Site Imprest -> Mandal Imprest, which the existing transfer
--   already handles once the accounts exist.
--   Under a site's imprest he wants to see how many vouchers were received in
--   CASH against how many were DEDUCTED FROM SALARY.
--
-- CORRECTION TO AN EARLIER MISREADING, recorded so it is not repeated: the
-- sale and its salary deduction are NOT unlinked. employee_deductions carries
-- nhe_sale_id (migration 124) and the NHE Sales form already has employee,
-- shed and deduct-from-salary. The earlier concern came from looking at the
-- egg advance on the Advances page, which is a different mechanism.
--
-- SITE IMPRESTS are created only for site_type 'rearing' or 'laying'. The farms
-- table also holds Head Office and the feed mill, and Head Office already has
-- its own HO Imprest -- creating a second one for it would split the same cash
-- across two accounts.
--
-- nhe_sales gains its OWN farm_id. The site was only ever derivable through the
-- flock's laying farm, but the owner notes sales such as sex-error birds happen
-- elsewhere, so the sale must be able to say where it happened.
--
-- Existing sales ARE backfilled to the flock's laying farm, because the owner
-- says that is the case for the large majority; the count is reported so the
-- exceptions can be corrected rather than silently assumed correct.

DO $$
BEGIN
  -- One imprest per real site, named from the farm so nothing is invented.
  INSERT INTO public.cash_accounts (name, acct_type, farm_id, sort_order)
  SELECT f.name || ' Site Imprest', 'site_petty', f.id, 10
  FROM public.farms f
  WHERE COALESCE(f.site_type, 'laying') IN ('rearing', 'laying')
  ON CONFLICT (name) DO NOTHING;

  -- Where the sale happened, and which imprest took the cash.
  ALTER TABLE public.nhe_sales
    ADD COLUMN IF NOT EXISTS farm_id UUID REFERENCES public.farms(id) ON DELETE SET NULL;
  ALTER TABLE public.nhe_sales
    ADD COLUMN IF NOT EXISTS cash_account_id UUID REFERENCES public.cash_accounts(id) ON DELETE SET NULL;

  -- History: the flock's laying farm, which the owner says covers the large
  -- majority. Only fills rows that have none, so a corrected row stays corrected.
  UPDATE public.nhe_sales s
  SET farm_id = fl.laying_farm_id
  FROM public.flocks fl
  WHERE fl.id = s.flock_id AND s.farm_id IS NULL AND fl.laying_farm_id IS NOT NULL;
END
$$;

-- VERIFY 1: which imprest accounts now exist, and that Head Office did not get
-- a second one alongside HO Imprest.
SELECT count(*)::int AS total_accounts,
       string_agg(name || '=' || acct_type, ' | ' ORDER BY sort_order, name) AS accounts,
       count(*) FILTER (WHERE acct_type = 'site_petty')::int AS site_imprests
FROM public.cash_accounts;

-- VERIFY 2: the sale columns exist and how many rows the backfill reached.
-- sales_without_site are the ones needing a site chosen by hand.
SELECT (SELECT count(*)::int FROM information_schema.columns
        WHERE table_schema='public' AND table_name='nhe_sales'
          AND column_name IN ('farm_id','cash_account_id')) AS new_sale_columns,
       (SELECT count(*)::int FROM public.nhe_sales) AS total_sales,
       (SELECT count(*)::int FROM public.nhe_sales WHERE farm_id IS NOT NULL) AS sales_with_site,
       (SELECT count(*)::int FROM public.nhe_sales WHERE farm_id IS NULL) AS sales_without_site,
       (SELECT count(*)::int FROM public.employee_deductions WHERE nhe_sale_id IS NOT NULL) AS salary_deduction_vouchers;
