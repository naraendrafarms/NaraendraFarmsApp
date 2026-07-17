-- Optional reference to which formula/recipe an opening-stock/adjustment
-- quantity was made from -- purely informational, does not affect Balance
-- or cost calculations (those still come from Produced/Dispatched and the
-- rate typed on the entry itself).
ALTER TABLE public.finished_feed_adjustments
  ADD COLUMN IF NOT EXISTS formula_id UUID REFERENCES public.feed_formulas(id) ON DELETE SET NULL;

SELECT column_name FROM information_schema.columns
WHERE table_schema='public' AND table_name='finished_feed_adjustments' AND column_name='formula_id';
