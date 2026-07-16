SELECT id, vendor_name, party_id, invoice_no, grn_no, payment_status
  FROM public.pending_payments
  WHERE vendor_name ILIKE '%Venco%'
  ORDER BY grn_date DESC
  LIMIT 20;
