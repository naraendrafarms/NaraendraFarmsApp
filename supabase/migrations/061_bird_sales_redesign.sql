-- Enhance nhe_sales to support weight-based bird sales with payment split
ALTER TABLE public.nhe_sales
  ADD COLUMN IF NOT EXISTS bird_sex        VARCHAR(20),
  ADD COLUMN IF NOT EXISTS bird_category   VARCHAR(20),
  ADD COLUMN IF NOT EXISTS avg_weight_kg   NUMERIC(6,3),
  ADD COLUMN IF NOT EXISTS total_weight_kg NUMERIC(10,3),
  ADD COLUMN IF NOT EXISTS rate_per_kg     NUMERIC(10,4),
  ADD COLUMN IF NOT EXISTS vehicle_no      TEXT,
  ADD COLUMN IF NOT EXISTS payment_cash    NUMERIC(14,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_online  NUMERIC(14,2) DEFAULT 0;

-- Widen sale_type check to include new unified bird_sale type
ALTER TABLE public.nhe_sales
  DROP CONSTRAINT IF EXISTS nhe_sales_sale_type_check;

ALTER TABLE public.nhe_sales
  ADD CONSTRAINT nhe_sales_sale_type_check
    CHECK (sale_type IN ('je','te','be','bird_sale','bird_cull','bird_lame','bird_weak','bird_sex_error','gas','manure','other'));

-- Backfill bird_category from legacy types
UPDATE public.nhe_sales SET bird_category = 'cull'       WHERE sale_type = 'bird_cull'       AND bird_category IS NULL;
UPDATE public.nhe_sales SET bird_category = 'lame'       WHERE sale_type = 'bird_lame'       AND bird_category IS NULL;
UPDATE public.nhe_sales SET bird_category = 'weak'       WHERE sale_type = 'bird_weak'       AND bird_category IS NULL;
UPDATE public.nhe_sales SET bird_category = 'sex_error'  WHERE sale_type = 'bird_sex_error'  AND bird_category IS NULL;

NOTIFY pgrst, 'reload schema';
