-- Migration 011: Purchase Orders, Vendor Bank Details, and Pending Payments tables
-- Created for Naraendra Farms App

-- =========================================================
-- purchase_orders
-- =========================================================
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  po_no           TEXT NOT NULL,
  po_date         DATE,
  fiscal_year     TEXT NOT NULL,  -- '2024-25', '2025-26', etc.
  vendor_name     TEXT NOT NULL,
  item_name       TEXT,
  material_type   TEXT,           -- 'Feed Raw Material', 'Medicine', 'Vaccine', etc.
  quantity        NUMERIC(12,3),
  unit            TEXT,           -- 'Tons', 'KG', 'Liters', etc.
  rate            NUMERIC(10,4),
  gst_pct         NUMERIC(5,2),
  total_amount    NUMERIC(12,2),
  grn_no          TEXT,
  grn_date        DATE,
  material_status TEXT,           -- 'Received', 'Pending'
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(po_no, item_name)
);

ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read purchase_orders"
  ON public.purchase_orders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert purchase_orders"
  ON public.purchase_orders FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update purchase_orders"
  ON public.purchase_orders FOR UPDATE
  TO authenticated
  USING (true);

-- =========================================================
-- vendor_bank_details
-- =========================================================
CREATE TABLE IF NOT EXISTS public.vendor_bank_details (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  vendor_name     TEXT NOT NULL UNIQUE,
  bank_name       TEXT,
  branch          TEXT,
  ifsc            TEXT,
  account_no      TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.vendor_bank_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read vendor_bank_details"
  ON public.vendor_bank_details FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert vendor_bank_details"
  ON public.vendor_bank_details FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update vendor_bank_details"
  ON public.vendor_bank_details FOR UPDATE
  TO authenticated
  USING (true);

-- =========================================================
-- pending_payments
-- =========================================================
CREATE TABLE IF NOT EXISTS public.pending_payments (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  vendor_name     TEXT NOT NULL,
  po_no           TEXT,
  grn_no          TEXT,
  grn_date        DATE,
  invoice_date    DATE,
  invoice_amount  NUMERIC(12,2),
  payment_type    TEXT,
  payment_status  TEXT,           -- 'Paid', 'HOLD', 'Pending'
  paid_date       DATE,
  credit_limit    INTEGER,        -- days
  pay_before_date DATE,
  account_type    TEXT,           -- 'Online', 'Cash'
  po_raised_by    TEXT,
  payment_approved_by TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.pending_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read pending_payments"
  ON public.pending_payments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert pending_payments"
  ON public.pending_payments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update pending_payments"
  ON public.pending_payments FOR UPDATE
  TO authenticated
  USING (true);
