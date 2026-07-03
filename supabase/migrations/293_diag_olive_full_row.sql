-- User's pasted Pending Payments row shows "1234" between Invoice Date and
-- GRN Date for Olive Enterprises/OE-26-27-0294 — that doesn't match grn_no
-- 2812 at all. Pull the FULL pending_payments row (all columns) to find
-- what "1234" actually is (credit_limit? some other stray column?).
SELECT * FROM public.pending_payments
WHERE vendor_name = 'Olive Enterprises' AND invoice_no = 'OE/26-27/0294';
