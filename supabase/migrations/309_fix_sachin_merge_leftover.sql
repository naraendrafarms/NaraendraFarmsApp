-- CORRECTION: party 02068ea5 ("Sachin International Protiens Pvt Ltd",
-- typo) does NOT exist in parties anymore (confirmed 0 rows) — it was
-- already deleted, presumably by a past merge, but its 3 pending_payments
-- bills were never reconciled to the canonical survivor
-- "Sachin International Proteins Pvt Ltd" (90e39bd8...). This is a merge
-- leftover exactly like Sunways, not a live unmerged duplicate.
--
-- Rename in place where no grn_no collision exists with the canonical
-- vendor's existing bill(s); merge (keep Paid status, drop the duplicate)
-- where a collision does exist.

-- 1. Rename typo rows that don't collide with an existing canonical-name row
UPDATE public.pending_payments typo
SET vendor_name = 'Sachin International Proteins Pvt Ltd',
    party_id = '90e39bd8-1a82-42a4-8774-ecfba088d2f6'
WHERE typo.party_id = '02068ea5-d363-4fe1-ba4c-c7631877729b'
  AND NOT EXISTS (
    SELECT 1 FROM public.pending_payments canon
    WHERE canon.vendor_name = 'Sachin International Proteins Pvt Ltd'
      AND canon.grn_no = typo.grn_no
  );

-- 2. For any remaining typo rows that DID collide (same grn_no already
--    exists under the canonical name), carry over Paid status if needed
--    then delete the duplicate.
UPDATE public.pending_payments canon
SET payment_status = typo.payment_status,
    paid_date = typo.paid_date,
    account_type = typo.account_type,
    utr_no = typo.utr_no,
    cheque_no = typo.cheque_no,
    transaction_ref = typo.transaction_ref
FROM public.pending_payments typo
WHERE typo.party_id = '02068ea5-d363-4fe1-ba4c-c7631877729b'
  AND canon.vendor_name = 'Sachin International Proteins Pvt Ltd'
  AND canon.grn_no = typo.grn_no
  AND typo.payment_status = 'Paid'
  AND canon.payment_status <> 'Paid';

DELETE FROM public.pending_payments
WHERE party_id = '02068ea5-d363-4fe1-ba4c-c7631877729b';

-- Verify: no more typo rows, all bills now under the canonical name
SELECT vendor_name, grn_no, invoice_amount, payment_status
FROM public.pending_payments
WHERE vendor_name ILIKE '%sachin%'
ORDER BY grn_no;
