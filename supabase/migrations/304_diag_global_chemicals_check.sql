-- 303 found a case-only vendor_name split in pending_payments:
-- "Global Chemicals Limited" vs "GLOBAL CHEMICALS LIMITED" (2 bills total).
-- The parties table itself has no matching duplicate, so this is likely a
-- casing inconsistency from manual Pending Payments entry (not a party
-- merge leftover). Check the actual rows before deciding whether/how to fix.
SELECT id, vendor_name, party_id, grn_no, invoice_no, invoice_amount, payment_status, created_at
FROM public.pending_payments
WHERE vendor_name ILIKE 'global chemicals limited'
ORDER BY created_at;

SELECT id, name FROM public.parties WHERE name ILIKE 'global chemicals limited';
