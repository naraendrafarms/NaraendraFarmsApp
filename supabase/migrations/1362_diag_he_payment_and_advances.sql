-- READ ONLY. Answers three questions the owner asked, with measured figures
-- instead of a guess. Nothing is written.
--
-- 1. WHY "ADVANCE" DOES NOT APPEAR AS A PAYMENT MODE UNDER HE DISPATCH.
--    The Receive Payment window only offers it when the BUYER ON THAT ROW has
--    an unused advance: paymentModeOptions adds 'Advance' only if
--    totalAdvanceBalance > 0, summed from party_advances for sale.party_id.
--    he_dispatch is NOT the problem - it has both advance_adjusted and
--    party_advance_id (migration 167) and the page selects *, so party_id is
--    there. So the question is whether any buyer actually has a balance.
--
-- 2. WHETHER ANY HE DISPATCH IS IN THE INCONSISTENT STATE that reversing a
--    payment can leave: payment_status 'Pending' while amount_received still
--    holds a figure. The balance shown everywhere is amount - amount_received,
--    so such a row reads as settled while its status says unpaid.
--
-- 3. HOW MANY HE VOUCHERS WERE PAID IN MORE THAN ONE INSTALMENT. These are the
--    ones where re-opening the single Receive Payment window is destructive:
--    it deletes EVERY cash_book/bank row for the voucher before writing one,
--    so the earlier instalments' ledger rows go.

SELECT 'advances=' || COUNT(*)
    || ' withBalance=' || COUNT(*) FILTER (WHERE (amount - amount_used) > 0.005)
    || ' buyersWithBalance=' || COUNT(DISTINCT party_id) FILTER (WHERE (amount - amount_used) > 0.005)
    || ' balanceTotal=' || COALESCE(ROUND(SUM(GREATEST(amount - amount_used, 0))::numeric, 2), 0)
    AS party_advance_state
  FROM public.party_advances;

SELECT 'heRows=' || COUNT(*)
    || ' received=' || COUNT(*) FILTER (WHERE payment_status = 'Received')
    || ' partial='  || COUNT(*) FILTER (WHERE payment_status = 'Partial')
    || ' pending='  || COUNT(*) FILTER (WHERE payment_status = 'Pending' OR payment_status IS NULL)
    || ' PENDING_BUT_HAS_RECEIPT=' || COUNT(*) FILTER (
         WHERE (payment_status = 'Pending' OR payment_status IS NULL)
           AND COALESCE(amount_received, 0) > 0.005)
    AS he_payment_states
  FROM public.he_dispatch
 WHERE COALESCE(amount, 0) > 0;

SELECT 'heUsingAdvance=' || COUNT(*) FILTER (WHERE party_advance_id IS NOT NULL)
    || ' heAdvanceAmt=' || COALESCE(ROUND(SUM(COALESCE(advance_adjusted, 0))::numeric, 2), 0)
    AS he_advance_usage
  FROM public.he_dispatch;

-- Vouchers with more than one cash book receipt row: the multi-instalment ones.
SELECT 'heMultiInstalment=' || COUNT(*) AS he_multi_instalment
  FROM ( SELECT he_dispatch_id
           FROM public.cash_book
          WHERE he_dispatch_id IS NOT NULL
          GROUP BY he_dispatch_id
         HAVING COUNT(*) > 1 ) x;
