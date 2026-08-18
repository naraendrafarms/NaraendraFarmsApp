-- Migration 735: record WHICH SHED birds were sold from.
--
-- A bird sale deducts the birds as culls on the flock's daily record, but
-- nhe_sales has never held a shed, so the sync writes them to the first record
-- it finds for that date — or, where none exists, to a new record with no shed
-- at all. Flock 19's 36,080 female and 3,471 male culls all sit on shed-less
-- rows, invisible in Bulk Daily Entry and absent from every shed's closing
-- count.
--
-- Nullable on purpose: the 69 sales already entered have no shed and must not
-- be given one by guesswork. They stay flock-level and are shown as such.

ALTER TABLE public.nhe_sales
  ADD COLUMN IF NOT EXISTS shed_id UUID REFERENCES public.sheds(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_nhe_sales_shed ON public.nhe_sales(shed_id) WHERE shed_id IS NOT NULL;

SELECT 'column' AS chk, count(*)::int AS n
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'nhe_sales' AND column_name = 'shed_id';

SELECT 'existing_sales' AS chk, count(*)::int AS bird_sales,
       count(*) FILTER (WHERE shed_id IS NULL)::int AS without_shed
FROM public.nhe_sales
WHERE sale_type IN ('bird_sale','bird_cull','bird_lame','bird_weak','bird_sex_error');

NOTIFY pgrst, 'reload schema';
