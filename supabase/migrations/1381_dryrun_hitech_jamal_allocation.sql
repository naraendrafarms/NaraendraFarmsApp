-- READ ONLY DRY RUN. Shows what linking WOULD do. Writes nothing.
--
-- The statement is now in (1380: 957 rows, Errors: 0). The remaining half is
-- applying those credits to invoices. Rs 32.55 cr across 217 invoices is not
-- something to run and then look at, so this models it first.
--
-- THE RULE MODELLED: oldest invoice first, each invoice settled to its NET
-- balance (amount - TDS - already received), money taken from the credits in
-- date order. That is the same rule Bulk Receipt already uses, and the same
-- net-of-TDS convention the app already follows - measured earlier, of 79 TDS
-- invoices with a receipt, amount_received equals amount minus TDS in all 79.

SELECT 'hitechMoney=' || ROUND(COALESCE(SUM(amount),0)/10000000.0, 2) || 'Cr'
    || ' credits=' || COUNT(*)
    AS hitech_money_available
  FROM public.bank_transactions
 WHERE party_id = '436decba-1b4f-4dbe-91fa-e8c9d794e095' AND txn_type = 'Credit'
   AND he_dispatch_id IS NULL AND nhe_sale_id IS NULL;

SELECT 'hitechOwed=' || ROUND(COALESCE(SUM(d.amount - COALESCE(d.tds_amount,0) - COALESCE(d.amount_received,0)),0)/10000000.0, 2) || 'Cr'
    || ' invoices=' || COUNT(*)
    || ' oldest=' || COALESCE(MIN(d.dispatch_date)::text,'-')
    AS hitech_owed_net
  FROM public.he_dispatch d
 WHERE d.party_id = '436decba-1b4f-4dbe-91fa-e8c9d794e095'
   AND (d.amount - COALESCE(d.tds_amount,0) - COALESCE(d.amount_received,0)) > 0.005;

SELECT 'jamalMoney=' || ROUND(COALESCE(SUM(amount),0)/100000.0, 2) || 'L'
    || ' credits=' || COUNT(*)
    AS jamal_money_available
  FROM public.bank_transactions
 WHERE party_id = 'cee3b3da-6f55-41aa-828b-9fbdd8d2e7f0' AND txn_type = 'Credit'
   AND he_dispatch_id IS NULL AND nhe_sale_id IS NULL;

SELECT 'jamalOwed=' || ROUND(COALESCE(SUM(d.amount - COALESCE(d.tds_amount,0) - COALESCE(d.amount_received,0)),0)/100000.0, 2) || 'L'
    || ' invoices=' || COUNT(*)
    AS jamal_owed_net
  FROM public.he_dispatch d
 WHERE d.party_id = 'cee3b3da-6f55-41aa-828b-9fbdd8d2e7f0'
   AND (d.amount - COALESCE(d.tds_amount,0) - COALESCE(d.amount_received,0)) > 0.005;

-- The decisive comparison: money in hand against money owed, both net of TDS.
-- A surplus means some credits belong to invoices that are already settled or
-- to a flock outside 19 and 20; a shortfall means some invoices stay part-paid.
SELECT 'hitechSurplus=' || ROUND((
         (SELECT COALESCE(SUM(amount),0) FROM public.bank_transactions
           WHERE party_id='436decba-1b4f-4dbe-91fa-e8c9d794e095' AND txn_type='Credit'
             AND he_dispatch_id IS NULL AND nhe_sale_id IS NULL)
       - (SELECT COALESCE(SUM(d.amount - COALESCE(d.tds_amount,0) - COALESCE(d.amount_received,0)),0)
            FROM public.he_dispatch d WHERE d.party_id='436decba-1b4f-4dbe-91fa-e8c9d794e095'
             AND (d.amount - COALESCE(d.tds_amount,0) - COALESCE(d.amount_received,0)) > 0.005)
       )/10000000.0, 2) || 'Cr'
    || ' jamalSurplus=' || ROUND((
         (SELECT COALESCE(SUM(amount),0) FROM public.bank_transactions
           WHERE party_id='cee3b3da-6f55-41aa-828b-9fbdd8d2e7f0' AND txn_type='Credit'
             AND he_dispatch_id IS NULL AND nhe_sale_id IS NULL)
       - (SELECT COALESCE(SUM(d.amount - COALESCE(d.tds_amount,0) - COALESCE(d.amount_received,0)),0)
            FROM public.he_dispatch d WHERE d.party_id='cee3b3da-6f55-41aa-828b-9fbdd8d2e7f0'
             AND (d.amount - COALESCE(d.tds_amount,0) - COALESCE(d.amount_received,0)) > 0.005)
       )/100000.0, 2) || 'L'
    AS money_vs_owed;
