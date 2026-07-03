-- Understand exactly how "Dendi Srinath Reddy Rent" ended up with
-- paid_amount = net_payable but payment_status stuck at Pending — should
-- be impossible via the Pay button (handlePay flips status to Paid
-- whenever balance <= 0.01), so check the precise numbers.
SELECT id, vendor_name, invoice_no, net_payable, invoice_amount, discount_amount,
       paid_amount, paid_date, payment_status, account_type, bank_account_id, created_at
FROM public.pending_payments
WHERE id = 'e784ea50-c90c-4693-b884-53d8616e4f8b';
