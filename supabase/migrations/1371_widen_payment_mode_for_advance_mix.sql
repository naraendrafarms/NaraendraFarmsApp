-- Let payment_mode say "part advance, part money".
--
-- WITHOUT THIS THE NEW SAVE WOULD BE REJECTED OUTRIGHT. Both sale tables carry
-- a CHECK listing the labels allowed:
--   ('Cash','NEFT','RTGS','Bank Transfer','UPI','Cheque','Advance','Cash+NEFT')
-- he_dispatch from 621, nhe_sales from 455. A receipt that takes Rs 1,51,888
-- from two advances and Rs 7,466 in cash is neither 'Advance' nor 'Cash', and
-- writing any other label violates the constraint - PostgREST would refuse the
-- whole update and the receipt simply would not save.
--
-- Two new labels, not six: 'Advance+Cash' when the remainder comes in as cash,
-- 'Advance+Bank' for any of the bank modes. The ledger rows already carry each
-- component's own amount, so payment_mode stays a DISPLAY LABEL - exactly the
-- reasoning 621 wrote down when it added 'Cash+NEFT'.
--
-- Widening a CHECK cannot invalidate a row that already exists: every current
-- value stays in the list. Nothing is updated, so no backup table is needed.
--
-- Rule 1b: ADD CONSTRAINT can fail SILENTLY through run_sql.py, so these are
-- separate statements and 1372 reads pg_constraint back to prove they took.

ALTER TABLE public.he_dispatch DROP CONSTRAINT IF EXISTS he_dispatch_payment_mode_check;

ALTER TABLE public.he_dispatch ADD CONSTRAINT he_dispatch_payment_mode_check
  CHECK (payment_mode IS NULL OR payment_mode IN
    ('Cash','NEFT','RTGS','Bank Transfer','UPI','Cheque','Advance','Cash+NEFT',
     'Advance+Cash','Advance+Bank'));

ALTER TABLE public.nhe_sales DROP CONSTRAINT IF EXISTS nhe_sales_payment_mode_check;

ALTER TABLE public.nhe_sales ADD CONSTRAINT nhe_sales_payment_mode_check
  CHECK (payment_mode IS NULL OR payment_mode IN
    ('Cash','NEFT','RTGS','Bank Transfer','UPI','Cheque','Advance','Cash+NEFT',
     'Advance+Cash','Advance+Bank'));
