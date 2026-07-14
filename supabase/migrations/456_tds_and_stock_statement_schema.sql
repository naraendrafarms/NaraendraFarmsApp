-- Schema for the two new monthly Accounts reports: TDS Payable (detailed,
-- bank/statutory format) and Stock Statement (bank submission format).
-- Nothing here is hardcoded in app code — every reference value (PAN,
-- Deductee Type, TDS Section + description, per-line rates) lives in the
-- database and is editable from the app, most of it from Admin Centre,
-- matching how every other config list in this app already works
-- (config_options via useConfigOptions).

-- ── 1. PAN + Deductee Type on every kind of TDS deductee ────────────────────
ALTER TABLE public.parties  ADD COLUMN IF NOT EXISTS pan_no TEXT;
ALTER TABLE public.parties  ADD COLUMN IF NOT EXISTS deductee_type TEXT DEFAULT 'Non-Company' CHECK (deductee_type IN ('Company','Non-Company'));
ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS deductee_type TEXT DEFAULT 'Non-Company' CHECK (deductee_type IN ('Company','Non-Company'));
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS pan_no TEXT;

-- ── 2. TDS Section on the actual transaction rows, so it's picked once per
-- bill/remuneration/salary line and remembered — not recomputed from a
-- fixed code->category mapping I'd otherwise have to hardcode ──────────────
ALTER TABLE public.pending_payments ADD COLUMN IF NOT EXISTS tds_section TEXT;
ALTER TABLE public.pending_payments ADD COLUMN IF NOT EXISTS tds_interest NUMERIC(12,2) DEFAULT 0;
ALTER TABLE public.salary_monthly   ADD COLUMN IF NOT EXISTS tds_section TEXT;
ALTER TABLE public.salary_monthly   ADD COLUMN IF NOT EXISTS tds_interest NUMERIC(12,2) DEFAULT 0;

-- ── 3. TDS Section master — code + what it's for, editable from Admin
-- Centre (config_options, same table/pattern as every other dropdown list
-- in this app). Seeded with exactly the sections already in use per the
-- uploaded TDS working file — add more from Admin Centre as needed, since
-- this is this business's own classification, not assumed by me.
INSERT INTO public.config_options (grp, value, label, sort_order, is_active)
SELECT * FROM (VALUES
  ('tds_section', '1002', 'Salary (Section 192)', 1, true),
  ('tds_section', '1023', 'Transport / Contractor (Section 393(1)-6(i).D(b))', 2, true),
  ('tds_section', '1027', 'Professional / Service (Section 393(1)-6(iii).D(b))', 3, true),
  ('tds_section', '1031', 'Purchase of Goods (Section 393(1)-8(ii))', 4, true),
  ('tds_section', '1067', 'Partner Remuneration (Section 393(3)-7)', 5, true),
  ('tds_section', '194Q', 'Purchase of Goods — Company Deductee (Section 194Q)', 6, true)
) AS v(grp, value, label, sort_order, is_active)
WHERE NOT EXISTS (
  SELECT 1 FROM public.config_options c WHERE c.grp = 'tds_section' AND c.value = v.value
);

-- ── 4. Stock Statement — user-entered rates, per line item per month,
-- auto-saved from the report itself (not hardcoded, not re-typed every
-- time — remembered per month once entered, editable any time after).
CREATE TABLE IF NOT EXISTS public.stock_statement_rates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period      TEXT NOT NULL,        -- 'YYYY-MM'
  line_key    TEXT NOT NULL,        -- e.g. 'live_birds:<farm_id>', 'hatching_eggs'
  rate        NUMERIC(12,4) NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (period, line_key)
);
ALTER TABLE public.stock_statement_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY ssr_select ON public.stock_statement_rates FOR SELECT TO authenticated USING (true);
CREATE POLICY ssr_insert ON public.stock_statement_rates FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY ssr_update ON public.stock_statement_rates FOR UPDATE TO authenticated USING (true);
CREATE POLICY ssr_delete ON public.stock_statement_rates FOR DELETE TO authenticated USING (true);
DROP TRIGGER IF EXISTS trg_audit ON public.stock_statement_rates;
CREATE TRIGGER trg_audit AFTER INSERT OR UPDATE OR DELETE ON public.stock_statement_rates
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();

SELECT count(*) AS tds_section_options FROM public.config_options WHERE grp = 'tds_section';
SELECT count(*) AS parties_cols FROM information_schema.columns
  WHERE table_name='parties' AND column_name IN ('pan_no','deductee_type');
SELECT count(*) AS ssr_table_exists FROM information_schema.tables WHERE table_name='stock_statement_rates';
