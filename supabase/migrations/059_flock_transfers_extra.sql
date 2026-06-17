-- Add extra columns to flock_transfers for birds not transferred
ALTER TABLE public.flock_transfers
  ADD COLUMN IF NOT EXISTS sex_error_female INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sex_error_male   INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sold_female      INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sold_male        INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS transfer_type    VARCHAR(20) DEFAULT 'transfer',
  ADD COLUMN IF NOT EXISTS is_final_transfer BOOLEAN DEFAULT FALSE;

NOTIFY pgrst, 'reload schema';
