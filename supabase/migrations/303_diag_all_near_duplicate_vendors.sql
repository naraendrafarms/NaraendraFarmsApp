-- Broader check: my earlier pass (294/295) only found duplicates that
-- happened to share an identical grn_no — it would MISS a merge-leftover
-- duplicate whose GRNs have different grn_no's entirely. Do a real
-- app-wide sweep: normalize every party name (lowercase, strip
-- spaces/hyphens/punctuation) and find any two parties that collide after
-- normalization (this is exactly the "Sunways Bio Science" vs
-- "Sunways Bio-Science" pattern, generalized to all vendors).

SELECT norm, array_agg(name) AS name_variants, array_agg(id::text) AS party_ids, COUNT(*) AS n
FROM (
  SELECT id, name, regexp_replace(lower(name), '[^a-z0-9]', '', 'g') AS norm
  FROM public.parties
) x
GROUP BY norm
HAVING COUNT(*) > 1
ORDER BY norm;

-- Same check directly on pending_payments.vendor_name (denormalized text,
-- so it can drift independently of the parties table).
SELECT norm, array_agg(DISTINCT vendor_name) AS name_variants, COUNT(*) AS bill_count
FROM (
  SELECT vendor_name, regexp_replace(lower(vendor_name), '[^a-z0-9]', '', 'g') AS norm
  FROM public.pending_payments
) x
GROUP BY norm
HAVING COUNT(DISTINCT vendor_name) > 1
ORDER BY norm;
