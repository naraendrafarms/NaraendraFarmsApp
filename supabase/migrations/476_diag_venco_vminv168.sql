SELECT id, vendor_name, invoice_no, grn_no, invoice_amount, net_payable, paid_amount,
       discount_amount, advance_adjusted, vendor_advance_id, payment_status, paid_date,
       account_type, bank_account_id
  FROM public.pending_payments
  WHERE vendor_name ILIKE '%Venco%' AND invoice_no = 'VMINV/168';
