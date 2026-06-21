-- Store TDS % rate on he_dispatch so TDS receivable report can group by rate
ALTER TABLE public.he_dispatch
  ADD COLUMN IF NOT EXISTS tds_pct NUMERIC(5,2) DEFAULT 0;
