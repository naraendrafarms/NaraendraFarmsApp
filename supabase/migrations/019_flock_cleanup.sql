-- Migration 019: Remove flock 18 if it exists (no data uploaded for it)
-- and clear chick_rate for F18/F20 that were set without actual cost data

-- Remove flock 18 entirely if it was accidentally created
DELETE FROM public.flocks WHERE flock_no = '18';

-- F20: user confirmed chick_rate = 320 is correct — no change needed
-- F19: chick_rate = 320 confirmed — no change needed
-- (Both handled via seed ON CONFLICT DO UPDATE)
