-- READ ONLY. No INSERT, UPDATE or DELETE anywhere in this file.
--
-- Receipts described "HE Egg Sale - F-20 - 4766" are reported as not linked.
-- That description is built by the Receive Payment form as
-- [type label, F-flock, dc_no or invoice_no], and the same form sets
-- nhe_sale_id or he_dispatch_id on the row it creates - so an unlinked one
-- means either the link never got written or it was lost afterwards.
--
-- Note the label is shared: an NHE sale of type he_sale AND an HE Dispatch
-- both produce "HE Egg Sale", so the row could belong to either table.

-- 1. How many of these receipts there are, and how many carry a link
SELECT count(*)::int AS he_egg_sale_receipts,
       count(*) FILTER (WHERE nhe_sale_id IS NOT NULL)::int AS linked_to_nhe,
       count(*) FILTER (WHERE he_dispatch_id IS NOT NULL)::int AS linked_to_he,
       count(*) FILTER (WHERE nhe_sale_id IS NULL AND he_dispatch_id IS NULL
                          AND linked_payment_id IS NULL)::int AS not_linked,
       round(sum(amount) FILTER (WHERE nhe_sale_id IS NULL AND he_dispatch_id IS NULL
                          AND linked_payment_id IS NULL))::int AS not_linked_amount
FROM public.bank_transactions
WHERE description ILIKE 'HE Egg Sale%';

-- 2. The unlinked ones, with the reference that should identify their sale
SELECT b.txn_date::text AS txn_date,
       round(b.amount)::int AS amount,
       COALESCE(b.reference_no,'-') AS ref_no,
       b.description,
       CASE WHEN b.party_id IS NULL THEN 'NO PARTY' ELSE 'has party' END AS party_state,
       to_char(b.created_at AT TIME ZONE 'Asia/Kolkata','DD/MM/YY HH24:MI') AS created_ist
FROM public.bank_transactions b
WHERE b.description ILIKE 'HE Egg Sale%'
  AND b.nhe_sale_id IS NULL AND b.he_dispatch_id IS NULL AND b.linked_payment_id IS NULL
ORDER BY b.txn_date;

-- 3. For each unlinked receipt, does a sale with that dc_no / invoice_no still
--    exist? That separates "link never written" from "the sale was deleted".
SELECT COALESCE(string_agg(t.ref || ' -> nhe:' || t.nhe_hits || ' he:' || t.he_hits, ' | '
                ORDER BY t.ref), 'none') AS reference_matches
FROM (
  SELECT COALESCE(b.reference_no,'') AS ref,
         (SELECT count(*)::int FROM public.nhe_sales n
          WHERE n.dc_no = b.reference_no OR n.invoice_no = b.reference_no) AS nhe_hits,
         (SELECT count(*)::int FROM public.he_dispatch d
          WHERE d.dc_no::text = b.reference_no OR d.invoice_no = b.reference_no) AS he_hits
  FROM public.bank_transactions b
  WHERE b.description ILIKE 'HE Egg Sale%'
    AND b.nhe_sale_id IS NULL AND b.he_dispatch_id IS NULL AND b.linked_payment_id IS NULL
) t;

-- 4. Whole-table context: how many bank rows carry no link at all, so the
--    scale of this is clear rather than assumed.
SELECT count(*)::int AS bank_rows,
       count(*) FILTER (WHERE nhe_sale_id IS NULL AND he_dispatch_id IS NULL
                          AND linked_payment_id IS NULL AND vendor_advance_id IS NULL)::int AS unlinked_any_kind,
       count(*) FILTER (WHERE category = 'Sale Receipt')::int AS sale_receipts,
       count(*) FILTER (WHERE category = 'Sale Receipt' AND nhe_sale_id IS NULL
                          AND he_dispatch_id IS NULL)::int AS sale_receipts_unlinked
FROM public.bank_transactions;
