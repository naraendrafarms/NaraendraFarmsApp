-- Medicine purchase / GRN tracking table
CREATE TABLE IF NOT EXISTS public.medicine_purchases (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_date DATE NOT NULL,
  medicine_id   UUID REFERENCES public.medicines_master(id) ON DELETE SET NULL,
  farm_id       UUID REFERENCES public.farms(id) ON DELETE SET NULL,
  supplier_id   UUID REFERENCES public.parties(id) ON DELETE SET NULL,
  invoice_no    TEXT,
  invoice_date  DATE,
  qty           NUMERIC NOT NULL DEFAULT 0,
  unit          TEXT,
  rate          NUMERIC DEFAULT 0,
  gst_pct       NUMERIC DEFAULT 0,
  basic_amount  NUMERIC GENERATED ALWAYS AS (ROUND(qty * rate, 2)) STORED,
  gst_amount    NUMERIC GENERATED ALWAYS AS (ROUND(qty * rate * gst_pct / 100.0, 2)) STORED,
  total_amount  NUMERIC GENERATED ALWAYS AS (ROUND(qty * rate * (1 + gst_pct / 100.0), 2)) STORED,
  batch_no      TEXT,
  expiry_date   DATE,
  remarks       TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.medicine_purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all_mp" ON public.medicine_purchases FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Stock balance view per medicine
CREATE OR REPLACE VIEW public.v_medicine_stock AS
SELECT
  m.id          AS medicine_id,
  m.name,
  m.type,
  m.unit,
  m.rate        AS master_rate,
  m.is_active,
  COALESCE(p.purchased_qty,  0) AS purchased_qty,
  COALESCE(p.purchase_value, 0) AS purchase_value,
  COALESCE(u.used_qty,       0) AS used_qty,
  COALESCE(u.used_value,     0) AS used_value,
  COALESCE(p.purchased_qty,  0) - COALESCE(u.used_qty, 0) AS balance_qty,
  p.last_purchase_date,
  p.last_batch_no,
  p.last_expiry_date
FROM public.medicines_master m
LEFT JOIN (
  SELECT
    medicine_id,
    SUM(qty)           AS purchased_qty,
    SUM(total_amount)  AS purchase_value,
    MAX(purchase_date) AS last_purchase_date,
    MAX(batch_no)      AS last_batch_no,
    MAX(expiry_date)   AS last_expiry_date
  FROM public.medicine_purchases
  GROUP BY medicine_id
) p ON p.medicine_id = m.id
LEFT JOIN (
  SELECT
    medicine_id,
    SUM(quantity) AS used_qty,
    SUM(amount)   AS used_value
  FROM public.medicine_usage
  GROUP BY medicine_id
) u ON u.medicine_id = m.id;

NOTIFY pgrst, 'reload schema';
