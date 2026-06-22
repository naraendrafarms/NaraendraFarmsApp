-- Migration 125: CMS uploads tracking table

CREATE TABLE IF NOT EXISTS public.cms_uploads (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  upload_date     DATE NOT NULL,
  filename        TEXT,
  payment_date    DATE,
  total_payments  INTEGER DEFAULT 0,
  total_amount    NUMERIC(14,2) DEFAULT 0,
  applied         BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.cms_uploads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_all_cms_uploads" ON public.cms_uploads TO authenticated USING (true) WITH CHECK (true);

-- Also add payment_reference column to pending_payments if missing (used in CMS export)
ALTER TABLE public.pending_payments ADD COLUMN IF NOT EXISTS payment_reference TEXT;

-- Add branch column to parties if missing (used in CMS bank details)
ALTER TABLE public.parties ADD COLUMN IF NOT EXISTS branch TEXT;

-- Diagnostic
SELECT
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_name='cms_uploads') AS tbl_ok,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='pending_payments' AND column_name='payment_reference') AS col_ok;

NOTIFY pgrst, 'reload schema';
