-- Add ot_hours column to attendance_daily so a day can be P/H + have overtime hours
ALTER TABLE public.attendance_daily ADD COLUMN IF NOT EXISTS ot_hours NUMERIC(4,1) DEFAULT 0;

NOTIFY pgrst, 'reload schema';
