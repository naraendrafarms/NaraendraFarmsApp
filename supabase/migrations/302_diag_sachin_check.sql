-- User asked to check "Sachin" too, similar to the Sunways merge-duplicate
-- issue. Check for any name-variant duplicate party records (typos,
-- spacing, Pvt Ltd suffix differences) and any pending_payments rows under
-- different Sachin-ish vendor_name spellings.
SELECT id, name FROM public.parties
WHERE name ILIKE '%sachin%'
ORDER BY name;

SELECT vendor_name, COUNT(*) AS bill_count, array_agg(DISTINCT party_id::text) AS party_ids
FROM public.pending_payments
WHERE vendor_name ILIKE '%sachin%'
GROUP BY vendor_name
ORDER BY vendor_name;
