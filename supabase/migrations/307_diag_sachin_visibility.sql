-- User sees only ONE "Sachin" in Purchase > Suppliers (Parties Master) but
-- TWO in the Pending Payments vendor dropdown. Check both Sachin party
-- records' is_active/type to see if one is hidden from the Suppliers list
-- (e.g. is_active=false, or type != 'supplier') while pending_payments'
-- dropdown (built from raw vendor_name text, no is_active/type filter)
-- still shows both.
SELECT id, name, type, is_active, created_at FROM public.parties
WHERE name ILIKE '%sachin%'
ORDER BY name;
