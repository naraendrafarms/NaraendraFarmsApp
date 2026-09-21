-- Link the 7 "HE Egg Sale" bank receipts that lost their he_dispatch_id.
--
-- MEASURED FIRST (1323, 1324). Of 38 such receipts, 31 carry a link and 7 do
-- not, worth Rs 1,19,99,545. All 7 are flock F-20, DC 4639 onwards, dated
-- 02/06 to 29/06/2026 and all created within two minutes on 24/06/2026 - one
-- bulk entry session, not seven separate slips.
--
-- WHY THIS IS SAFE, and why the opposite fix would have been a disaster:
-- every one of the 7 dispatches exists, is already marked Received, and
-- already carries amount_received EQUAL TO THE RUPEE to its bank receipt, and
-- NO other bank row is linked to any of them. So these seven ARE those
-- receipts with a missing pointer - not duplicates. Had the dispatches been
-- unpaid, or had another receipt already claimed them, linking would have
-- double-counted a crore.
--
-- NO MONEY MOVES. Only bank_transactions.he_dispatch_id is written.
-- he_dispatch is not touched at all: amount_received and payment_status are
-- already correct. v_party_ledger reads receipts from he_dispatch, never from
-- bank_transactions, so no ledger balance changes anywhere.
--
-- Backup of the 7 rows AS THEY ARE taken before the write, per the standing
-- rule. To reverse: UPDATE bank_transactions SET he_dispatch_id = NULL FROM
-- bank_transactions_backup_1325 b WHERE bank_transactions.id = b.id.

CREATE TABLE IF NOT EXISTS public.bank_transactions_backup_1325 AS
SELECT * FROM public.bank_transactions
WHERE description ILIKE 'HE Egg Sale%'
  AND nhe_sale_id IS NULL AND he_dispatch_id IS NULL AND linked_payment_id IS NULL;

-- The write. Guarded three ways so it can only touch a row whose dispatch
-- already holds exactly this receipt and is claimed by nothing else.
WITH unl AS (
  SELECT b.id, b.amount, (regexp_match(b.description, '([0-9]+)\s*$'))[1] AS dc_txt
  FROM public.bank_transactions b
  WHERE b.description ILIKE 'HE Egg Sale%'
    AND b.nhe_sale_id IS NULL AND b.he_dispatch_id IS NULL AND b.linked_payment_id IS NULL
), m AS (
  SELECT u.id AS bank_id, d.id AS dispatch_id
  FROM unl u
  JOIN public.he_dispatch d ON d.dc_no::text = u.dc_txt
  WHERE d.payment_status = 'Received'
    AND d.amount_received = u.amount
    AND NOT EXISTS (SELECT 1 FROM public.bank_transactions b2 WHERE b2.he_dispatch_id = d.id)
)
UPDATE public.bank_transactions b
SET he_dispatch_id = m.dispatch_id
FROM m
WHERE b.id = m.bank_id;

-- ── Verification ─────────────────────────────────────────────────────────
SELECT (SELECT count(*)::int FROM public.bank_transactions_backup_1325) AS backed_up,
       (SELECT count(*)::int FROM public.bank_transactions
        WHERE description ILIKE 'HE Egg Sale%' AND he_dispatch_id IS NOT NULL) AS linked_now,
       (SELECT count(*)::int FROM public.bank_transactions
        WHERE description ILIKE 'HE Egg Sale%'
          AND nhe_sale_id IS NULL AND he_dispatch_id IS NULL AND linked_payment_id IS NULL) AS still_unlinked,
       (SELECT count(*)::int FROM public.bank_transactions) AS bank_rows_total,
       (SELECT round(sum(amount))::int FROM public.bank_transactions
        WHERE description ILIKE 'HE Egg Sale%') AS he_receipts_amount;

-- he_dispatch must be exactly as it was: nothing here wrote to it.
SELECT count(*)::int AS dispatches,
       count(*) FILTER (WHERE payment_status = 'Received')::int AS received,
       round(sum(COALESCE(amount_received,0)))::int AS received_total
FROM public.he_dispatch;

-- No dispatch may end up with two bank receipts pointing at it.
SELECT COALESCE(count(*), 0)::int AS dispatches_with_two_or_more_receipts
FROM (
  SELECT he_dispatch_id FROM public.bank_transactions
  WHERE he_dispatch_id IS NOT NULL
  GROUP BY he_dispatch_id HAVING count(*) > 1
) x;
