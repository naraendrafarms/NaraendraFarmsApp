-- Migration 177: Link feed formulas to a finished feed type
-- Enables: (A) Production (by formula) → Finished Feed Stock (by feed type)
--          (C) Recipe cost per feed type → value flock feed consumption in P&L
--          (B) Dispatch vs consumption reconciliation per feed type

ALTER TABLE public.feed_formulas
  ADD COLUMN IF NOT EXISTS feed_type_id UUID REFERENCES public.feed_types(id) ON DELETE SET NULL;

-- Best-effort auto-map: if a formula_code matches a feed_type code, link it.
UPDATE public.feed_formulas f
SET feed_type_id = ft.id
FROM public.feed_types ft
WHERE f.feed_type_id IS NULL
  AND UPPER(TRIM(f.formula_code)) = UPPER(TRIM(ft.code));

-- Verify
SELECT f.formula_code, f.formula_name, ft.code AS feed_type
FROM public.feed_formulas f
LEFT JOIN public.feed_types ft ON ft.id = f.feed_type_id
ORDER BY f.formula_code;
