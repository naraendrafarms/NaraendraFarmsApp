-- Migration 014: Add DELETE RLS policies for PO/payment tables
-- Allows authenticated users to delete records they manage

CREATE POLICY "Authenticated users can delete purchase_orders"
  ON public.purchase_orders FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete pending_payments"
  ON public.pending_payments FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete vendor_bank_details"
  ON public.vendor_bank_details FOR DELETE
  TO authenticated
  USING (true);

-- Also add NOT PAID as a valid payment_status value (no constraint change needed, just documenting)
-- payment_status is a free TEXT column — Paid, Pending, Not Paid, HOLD are all valid
