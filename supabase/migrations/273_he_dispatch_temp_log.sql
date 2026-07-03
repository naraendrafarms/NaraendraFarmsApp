-- Temperature tracking for HE Dispatch shipments (attachment + summary +
-- compliance flag, not every raw per-minute logger reading).
ALTER TABLE public.he_dispatch
  ADD COLUMN IF NOT EXISTS vehicle_no TEXT,
  ADD COLUMN IF NOT EXISTS temp_log_url TEXT,
  ADD COLUMN IF NOT EXISTS temp_log_name TEXT,
  ADD COLUMN IF NOT EXISTS temp_min NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS temp_max NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS temp_avg NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS temp_safe_max NUMERIC(5,2) DEFAULT 25,
  ADD COLUMN IF NOT EXISTS temp_compliant BOOLEAN,
  ADD COLUMN IF NOT EXISTS temp_remarks TEXT;

INSERT INTO storage.buckets (id, name, public)
VALUES ('dispatch-attachments', 'dispatch-attachments', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS dispatch_attachments_read ON storage.objects;
CREATE POLICY dispatch_attachments_read ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'dispatch-attachments');
DROP POLICY IF EXISTS dispatch_attachments_write ON storage.objects;
CREATE POLICY dispatch_attachments_write ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'dispatch-attachments');

NOTIFY pgrst, 'reload schema';
SELECT 'ok' AS chk;
