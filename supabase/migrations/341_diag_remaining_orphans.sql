-- Migration 340's orphan-count query returned "rows=10" but only printed
-- 5 due to output-length truncation. Get the remaining 5 explicitly, plus
-- the actual orphaned pending_payments.party_id row detail.
SELECT 'grn.item_id -> items' AS relationship, COUNT(*) AS orphan_count
FROM public.grn g WHERE g.item_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.items i WHERE i.id = g.item_id)
UNION ALL
SELECT 'flocks.laying_farm_id -> farms', COUNT(*)
FROM public.flocks f WHERE f.laying_farm_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.farms fa WHERE fa.id = f.laying_farm_id)
UNION ALL
SELECT 'nhe_sales.party_id -> parties', COUNT(*)
FROM public.nhe_sales n WHERE n.party_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.parties p WHERE p.id = n.party_id)
UNION ALL
SELECT 'he_dispatch.party_id -> parties', COUNT(*)
FROM public.he_dispatch h WHERE h.party_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.parties p WHERE p.id = h.party_id)
UNION ALL
SELECT 'grn.party_id -> parties', COUNT(*)
FROM public.grn g WHERE g.party_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.parties p WHERE p.id = g.party_id);

-- Show the one confirmed orphan from migration 340
SELECT id, vendor_name, invoice_no, party_id FROM public.pending_payments
WHERE party_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.parties p WHERE p.id = pending_payments.party_id);
