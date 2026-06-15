-- Add ON DELETE CASCADE to all flock FK constraints
-- so deleting a flock auto-removes all linked records

-- he_dispatch
ALTER TABLE public.he_dispatch
  DROP CONSTRAINT IF EXISTS he_dispatch_flock_id_fkey,
  ADD CONSTRAINT he_dispatch_flock_id_fkey
    FOREIGN KEY (flock_id) REFERENCES public.flocks(id) ON DELETE CASCADE;

-- nhe_sales
ALTER TABLE public.nhe_sales
  DROP CONSTRAINT IF EXISTS nhe_sales_flock_id_fkey,
  ADD CONSTRAINT nhe_sales_flock_id_fkey
    FOREIGN KEY (flock_id) REFERENCES public.flocks(id) ON DELETE CASCADE;

-- medicine_usage
ALTER TABLE public.medicine_usage
  DROP CONSTRAINT IF EXISTS medicine_usage_flock_id_fkey,
  ADD CONSTRAINT medicine_usage_flock_id_fkey
    FOREIGN KEY (flock_id) REFERENCES public.flocks(id) ON DELETE CASCADE;

-- medicine_monthly
ALTER TABLE public.medicine_monthly
  DROP CONSTRAINT IF EXISTS medicine_monthly_flock_id_fkey,
  ADD CONSTRAINT medicine_monthly_flock_id_fkey
    FOREIGN KEY (flock_id) REFERENCES public.flocks(id) ON DELETE CASCADE;

-- electricity_allocation
ALTER TABLE public.electricity_allocation
  DROP CONSTRAINT IF EXISTS electricity_allocation_flock_id_fkey,
  ADD CONSTRAINT electricity_allocation_flock_id_fkey
    FOREIGN KEY (flock_id) REFERENCES public.flocks(id) ON DELETE CASCADE;

-- hatchability
ALTER TABLE public.hatchability
  DROP CONSTRAINT IF EXISTS hatchability_flock_id_fkey,
  ADD CONSTRAINT hatchability_flock_id_fkey
    FOREIGN KEY (flock_id) REFERENCES public.flocks(id) ON DELETE CASCADE;

-- daily_feed (migration 016)
ALTER TABLE public.daily_feed
  DROP CONSTRAINT IF EXISTS daily_feed_flock_id_fkey,
  ADD CONSTRAINT daily_feed_flock_id_fkey
    FOREIGN KEY (flock_id) REFERENCES public.flocks(id) ON DELETE CASCADE;

-- he_dispatch_lines (migration 046)
ALTER TABLE public.he_dispatch_lines
  DROP CONSTRAINT IF EXISTS he_dispatch_lines_flock_id_fkey,
  ADD CONSTRAINT he_dispatch_lines_flock_id_fkey
    FOREIGN KEY (flock_id) REFERENCES public.flocks(id) ON DELETE CASCADE;

-- egg_conversions (migration 047)
ALTER TABLE public.egg_conversions
  DROP CONSTRAINT IF EXISTS egg_conversions_flock_id_fkey,
  ADD CONSTRAINT egg_conversions_flock_id_fkey
    FOREIGN KEY (flock_id) REFERENCES public.flocks(id) ON DELETE CASCADE;

-- hatch_batches (migration 048)
ALTER TABLE public.hatch_batches
  DROP CONSTRAINT IF EXISTS hatch_batches_flock_id_fkey,
  ADD CONSTRAINT hatch_batches_flock_id_fkey
    FOREIGN KEY (flock_id) REFERENCES public.flocks(id) ON DELETE CASCADE;

-- egg_opening_stock (migration 049)
ALTER TABLE public.egg_opening_stock
  DROP CONSTRAINT IF EXISTS egg_opening_stock_flock_id_fkey,
  ADD CONSTRAINT egg_opening_stock_flock_id_fkey
    FOREIGN KEY (flock_id) REFERENCES public.flocks(id) ON DELETE CASCADE;

-- farm_expenses (migration 051)
ALTER TABLE public.farm_expenses
  DROP CONSTRAINT IF EXISTS farm_expenses_flock_id_fkey,
  ADD CONSTRAINT farm_expenses_flock_id_fkey
    FOREIGN KEY (flock_id) REFERENCES public.flocks(id) ON DELETE CASCADE;

-- cash_book (migration 053)
ALTER TABLE public.cash_book
  DROP CONSTRAINT IF EXISTS cash_book_flock_id_fkey,
  ADD CONSTRAINT cash_book_flock_id_fkey
    FOREIGN KEY (flock_id) REFERENCES public.flocks(id) ON DELETE CASCADE;

-- vaccination_records (migration 052)
ALTER TABLE public.vaccination_records
  DROP CONSTRAINT IF EXISTS vaccination_records_flock_id_fkey,
  ADD CONSTRAINT vaccination_records_flock_id_fkey
    FOREIGN KEY (flock_id) REFERENCES public.flocks(id) ON DELETE CASCADE;

-- shed_allocations (migration 050)
ALTER TABLE public.shed_allocations
  DROP CONSTRAINT IF EXISTS shed_allocations_flock_id_fkey,
  ADD CONSTRAINT shed_allocations_flock_id_fkey
    FOREIGN KEY (flock_id) REFERENCES public.flocks(id) ON DELETE CASCADE;

NOTIFY pgrst, 'reload schema';
