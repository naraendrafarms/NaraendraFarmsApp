-- Migration 067: Shed placement batches — allow staggered chick intake across days/sheds
-- total_placed_f/m currently GENERATED from paid_female+free_female.
-- Convert to regular columns and keep them updated via trigger from shed_allocations.

-- Step 1: Drop the GENERATED ALWAYS expression (PostgreSQL 12+)
ALTER TABLE public.flocks ALTER COLUMN total_placed_f DROP EXPRESSION;
ALTER TABLE public.flocks ALTER COLUMN total_placed_m DROP EXPRESSION;

-- Step 2: Seed initial values from original formula
UPDATE public.flocks
SET total_placed_f = paid_female + free_female,
    total_placed_m = paid_male   + free_male;

-- Step 3: Trigger function — recomputes totals whenever shed_allocations change
CREATE OR REPLACE FUNCTION public.fn_update_flock_placed_totals()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE v_flock_id UUID;
BEGIN
  v_flock_id := COALESCE(NEW.flock_id, OLD.flock_id);
  UPDATE public.flocks SET
    total_placed_f = CASE
      WHEN EXISTS (SELECT 1 FROM public.shed_allocations WHERE flock_id = v_flock_id)
      THEN (SELECT COALESCE(SUM(female_count), 0) FROM public.shed_allocations WHERE flock_id = v_flock_id)
      ELSE paid_female + free_female
    END,
    total_placed_m = CASE
      WHEN EXISTS (SELECT 1 FROM public.shed_allocations WHERE flock_id = v_flock_id)
      THEN (SELECT COALESCE(SUM(male_count),   0) FROM public.shed_allocations WHERE flock_id = v_flock_id)
      ELSE paid_male + free_male
    END
  WHERE id = v_flock_id;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_flock_placed_totals ON public.shed_allocations;
CREATE TRIGGER trg_flock_placed_totals
AFTER INSERT OR UPDATE OR DELETE ON public.shed_allocations
FOR EACH ROW EXECUTE FUNCTION public.fn_update_flock_placed_totals();

-- Step 4: Add notes column if missing
ALTER TABLE public.shed_allocations ADD COLUMN IF NOT EXISTS notes TEXT;

NOTIFY pgrst, 'reload schema';
