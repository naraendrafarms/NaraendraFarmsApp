-- Two new modules: Generator tracking (usage log + diesel purchases +
-- maintenance) and Empty Bags scrap sales. Both are new tables only — zero
-- changes to any existing table's data, except adding one nullable FK
-- column (bag_sale_id) to cash_book, matching the existing nhe_sale_id /
-- he_dispatch_id auto-entry pattern already used for NHE sales / HE dispatch.

-- ── GENERATORS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.generators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID REFERENCES public.farms(id),
  name TEXT NOT NULL,
  code TEXT,
  capacity_kva NUMERIC(8,2),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.generator_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generator_id UUID NOT NULL REFERENCES public.generators(id),
  log_date DATE NOT NULL,
  hours_run NUMERIC(6,2),
  diesel_consumed_ltr NUMERIC(8,2),
  opening_reading NUMERIC(10,2),
  closing_reading NUMERIC(10,2),
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.generator_diesel_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generator_id UUID REFERENCES public.generators(id),
  farm_id UUID REFERENCES public.farms(id),
  purchase_date DATE NOT NULL,
  qty_ltr NUMERIC(8,2) NOT NULL,
  rate NUMERIC(8,2),
  amount NUMERIC(10,2),
  supplier TEXT,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.generator_maintenance_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generator_id UUID NOT NULL REFERENCES public.generators(id),
  service_date DATE NOT NULL,
  work_done TEXT,
  cost NUMERIC(10,2),
  next_due_date DATE,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.generators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generator_usage_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generator_diesel_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generator_maintenance_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all" ON public.generators FOR ALL USING (auth.role()='authenticated') WITH CHECK (auth.role()='authenticated');
CREATE POLICY "auth_all" ON public.generator_usage_log FOR ALL USING (auth.role()='authenticated') WITH CHECK (auth.role()='authenticated');
CREATE POLICY "auth_all" ON public.generator_diesel_purchases FOR ALL USING (auth.role()='authenticated') WITH CHECK (auth.role()='authenticated');
CREATE POLICY "auth_all" ON public.generator_maintenance_log FOR ALL USING (auth.role()='authenticated') WITH CHECK (auth.role()='authenticated');

-- ── EMPTY BAGS (SCRAP SALES) ────────────────────────────────────
-- "Received" is NOT a new table — it's read live from SUM(grn.bags) per
-- farm, since that's already entered on every feed GRN. Only the sale side
-- is new.
CREATE TABLE IF NOT EXISTS public.bag_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_date DATE NOT NULL,
  farm_id UUID REFERENCES public.farms(id),
  buyer_name TEXT,
  qty INTEGER NOT NULL,
  rate NUMERIC(8,2),
  amount NUMERIC(10,2),
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.bag_sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all" ON public.bag_sales FOR ALL USING (auth.role()='authenticated') WITH CHECK (auth.role()='authenticated');

ALTER TABLE public.cash_book ADD COLUMN IF NOT EXISTS bag_sale_id UUID REFERENCES public.bag_sales(id);

-- Auto-clean the linked cash_book row if a bag sale is deleted directly
-- (bulk delete, import, manual SQL) — same pattern as NHE sales / HE dispatch.
CREATE OR REPLACE FUNCTION public.fn_delete_linked_cash_book_bag_sale()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  DELETE FROM public.cash_book WHERE bag_sale_id = OLD.id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_del_cash_book_bag_sale ON public.bag_sales;
CREATE TRIGGER trg_del_cash_book_bag_sale
  AFTER DELETE ON public.bag_sales
  FOR EACH ROW EXECUTE FUNCTION public.fn_delete_linked_cash_book_bag_sale();

NOTIFY pgrst, 'reload schema';
SELECT 'ok' AS chk;
