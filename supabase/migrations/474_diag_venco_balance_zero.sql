SELECT id, invoice_no, grn_no, invoice_amount, net_payable, paid_amount, discount_amount,
       advance_adjusted, vendor_advance_id, payment_status
  FROM public.pending_payments
  WHERE vendor_name ILIKE '%Venco%'
  ORDER BY grn_date DESC
  LIMIT 20;
