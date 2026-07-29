-- Diagnostic only (no schema changes) — user says Radheshyam Roy's partner
-- opening balance shows up in Bank Ledger's party dropdown/settle list, but
-- Amit Das's doesn't, even though Bank Ledger's dropdown is only supposed
-- to read from `parties` (not `partners`) per code inspection. Checking
-- whether Radheshyam Roy also happens to exist as a row in `parties` (name
-- match), which would explain the difference via the vendor_name fallback.
SELECT id, name, type, is_active FROM public.parties WHERE name ILIKE '%Radheshyam%' OR name ILIKE '%Amit Das%';

SELECT id, name, is_active FROM public.partners WHERE name ILIKE '%Radheshyam%' OR name ILIKE '%Amit Das%';

SELECT pp.id, pp.vendor_name, pp.party_id, pp.partner_id, pp.invoice_no, pp.invoice_amount, pp.is_opening
FROM public.pending_payments pp
WHERE pp.vendor_name ILIKE '%Radheshyam%' OR pp.vendor_name ILIKE '%Amit Das%';

SELECT 'sentinel' AS marker, 1 AS n;
