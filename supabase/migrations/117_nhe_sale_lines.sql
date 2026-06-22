CREATE TABLE IF NOT EXISTS public.nhe_sale_lines (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id     UUID NOT NULL REFERENCES public.nhe_sales(id) ON DELETE CASCADE,
  sale_type   TEXT NOT NULL DEFAULT 'je',
  quantity    NUMERIC(12,2),
  unit        TEXT DEFAULT 'nos',
  rate        NUMERIC(10,4),
  amount      NUMERIC(14,2),
  gst_pct     NUMERIC(5,2) DEFAULT 0,
  remarks     TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nhe_sale_lines_sale_id ON public.nhe_sale_lines(sale_id);

-- Backfill: one line per existing egg-type nhe_sales row
INSERT INTO public.nhe_sale_lines (sale_id, sale_type, quantity, unit, rate, amount, gst_pct)
SELECT id, sale_type, quantity, unit, rate, amount, COALESCE(gst_pct, 0)
FROM public.nhe_sales
WHERE sale_type IN ('je','te','be')
  AND id NOT IN (SELECT DISTINCT sale_id FROM public.nhe_sale_lines);

-- Diagnostic
SELECT COUNT(*) AS lines_created FROM public.nhe_sale_lines;

NOTIFY pgrst, 'reload schema';
