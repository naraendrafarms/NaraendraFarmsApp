-- Migration 072: Clear all vaccination schedule records (fresh start)
-- No other tables reference vaccination_schedule so this is safe.
TRUNCATE TABLE public.vaccination_schedule RESTART IDENTITY;
