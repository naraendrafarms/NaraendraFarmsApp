-- Migration 037: Link feed_formulas to feed_types master
ALTER TABLE public.feed_formulas ADD COLUMN IF NOT EXISTS feed_type_id UUID REFERENCES public.feed_types(id) ON DELETE SET NULL;

NOTIFY pgrst, 'reload schema';
