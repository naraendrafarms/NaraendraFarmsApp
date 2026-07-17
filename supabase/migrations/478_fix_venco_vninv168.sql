-- VNINV/168 was paid via "Advance" mode (paid_amount=net_payable,
-- advance_adjusted=net_payable, vendor_advance_id set, account_type='Advance')
-- then reverted to Pending before the code fix (migration/commit de24b3c)
-- existed — so paid_amount/advance_adjusted/vendor_advance_id were left
-- stuck at the full amount, and the linked vendor_advances row never got
-- its amount_used given back. Fix this specific row directly.
DO $$
DECLARE
  v_bill_id UUID;
  v_advance_id UUID;
  v_adjusted NUMERIC;
BEGIN
  SELECT id, vendor_advance_id, advance_adjusted
    INTO v_bill_id, v_advance_id, v_adjusted
    FROM public.pending_payments
    WHERE vendor_name ILIKE '%Venco%' AND invoice_no = 'VNINV/168'
    AND payment_status <> 'Paid';

  IF v_bill_id IS NOT NULL THEN
    UPDATE public.pending_payments
      SET paid_amount = 0, advance_adjusted = 0, vendor_advance_id = NULL
      WHERE id = v_bill_id;

    IF v_advance_id IS NOT NULL AND v_adjusted > 0 THEN
      UPDATE public.vendor_advances
        SET amount_used = GREATEST(0, amount_used - v_adjusted)
        WHERE id = v_advance_id;
    END IF;
  END IF;
END $$;

-- Confirm
SELECT id, invoice_no, paid_amount, advance_adjusted, vendor_advance_id, payment_status
  FROM public.pending_payments WHERE vendor_name ILIKE '%Venco%' AND invoice_no = 'VNINV/168';
SELECT id, amount, amount_used FROM public.vendor_advances
  WHERE id = 'cf44a62f-1a7a-442e-95c9-ca44d3284331';
