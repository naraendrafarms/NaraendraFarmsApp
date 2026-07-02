-- Unify the 3 disconnected vendor concepts (parties, free-text vendor_name,
-- vendor_bank_details) onto the one real master: public.parties.
-- Additive + backfill only — nothing is dropped or deleted.

-- 1. purchase_orders never had a party_id at all (GRN and pending_payments
--    already do). Add it so POs can be linked like everything else.
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS party_id UUID REFERENCES public.parties(id) ON DELETE SET NULL;

-- 2. Create a party for every distinct vendor_name (from purchase_orders and
--    pending_payments) that has no matching party yet (case/space-insensitive).
INSERT INTO public.parties (name, type)
SELECT DISTINCT trim(v.vendor_name), 'supplier'
FROM (
  SELECT vendor_name FROM public.purchase_orders WHERE vendor_name IS NOT NULL AND trim(vendor_name) <> ''
  UNION
  SELECT vendor_name FROM public.pending_payments WHERE vendor_name IS NOT NULL AND trim(vendor_name) <> ''
) v
WHERE NOT EXISTS (
  SELECT 1 FROM public.parties p WHERE lower(trim(p.name)) = lower(trim(v.vendor_name))
);

-- 3. Backfill party_id on purchase_orders and pending_payments by name match.
UPDATE public.purchase_orders po
SET party_id = p.id
FROM public.parties p
WHERE po.party_id IS NULL
  AND po.vendor_name IS NOT NULL
  AND lower(trim(p.name)) = lower(trim(po.vendor_name));

UPDATE public.pending_payments pp
SET party_id = p.id
FROM public.parties p
WHERE pp.party_id IS NULL
  AND pp.vendor_name IS NOT NULL
  AND lower(trim(p.name)) = lower(trim(pp.vendor_name));

-- 4. Merge legacy vendor_bank_details into parties (only where parties is
-- missing the info) so the old table can retire without losing data.
UPDATE public.parties p
SET bank_name  = COALESCE(p.bank_name, vbd.bank_name),
    account_no = COALESCE(p.account_no, vbd.account_no),
    ifsc       = COALESCE(p.ifsc, vbd.ifsc)
FROM public.vendor_bank_details vbd
WHERE lower(trim(vbd.vendor_name)) = lower(trim(p.name))
  AND (p.bank_name IS NULL OR p.account_no IS NULL OR p.ifsc IS NULL);

-- Diagnostic
SELECT
  (SELECT count(*) FROM public.parties) AS total_parties,
  (SELECT count(*) FROM public.purchase_orders WHERE party_id IS NULL AND vendor_name IS NOT NULL) AS po_unlinked,
  (SELECT count(*) FROM public.pending_payments WHERE party_id IS NULL AND vendor_name IS NOT NULL) AS pp_unlinked,
  (SELECT count(*) FROM public.parties WHERE bank_name IS NOT NULL) AS parties_with_bank;
