-- Migration 063: Add deposit_interest and meter_rent to electricity_bills
-- deposit_interest = annual interest income credited by APEPDCL/TSSPDCL on security deposit
-- meter_rent = monthly meter rent if charged separately
-- Also fix electricity_allocation FK to cascade-delete when bill is deleted

ALTER TABLE public.electricity_bills
  ADD COLUMN IF NOT EXISTS deposit_interest NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS meter_rent       NUMERIC(10,2) DEFAULT 0;

-- Fix FK to allow deleting bills that have allocations
ALTER TABLE public.electricity_allocation
  DROP CONSTRAINT IF EXISTS electricity_allocation_bill_id_fkey;

ALTER TABLE public.electricity_allocation
  ADD CONSTRAINT electricity_allocation_bill_id_fkey
  FOREIGN KEY (bill_id) REFERENCES public.electricity_bills(id) ON DELETE CASCADE;
