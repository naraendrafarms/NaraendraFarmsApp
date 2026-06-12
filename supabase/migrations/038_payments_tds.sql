ALTER TABLE public.pending_payments ADD COLUMN IF NOT EXISTS tds_pct NUMERIC(5,2) DEFAULT 0;
ALTER TABLE public.pending_payments ADD COLUMN IF NOT EXISTS tds_amount NUMERIC(14,2) DEFAULT 0;
ALTER TABLE public.pending_payments ADD COLUMN IF NOT EXISTS net_payable NUMERIC(14,2);
NOTIFY pgrst, 'reload schema';
