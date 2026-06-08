-- Migration 022: Fix medicine_usage_unique constraint
-- The original constraint in 012 used column name 'quantity_used' which doesn't exist
-- (the actual column is 'quantity'). Drop and recreate with correct column name.
ALTER TABLE public.medicine_usage
  DROP CONSTRAINT IF EXISTS medicine_usage_unique;

ALTER TABLE public.medicine_usage
  ADD CONSTRAINT medicine_usage_unique
  UNIQUE (flock_id, usage_date, medicine_id, quantity);
