-- Saved snapshots of the CA-format "Analysis of Financial Result" statement
-- (Turnover -> Cost of Production -> Gross Profit -> Indirect Expenses ->
-- Net Profit -> Working Capital -> Ratios), matching the owner's real CA
-- statement layout. Fixed named columns (not the generic plans/plan_lines
-- shape) since every line item here is a specific, known CA head rather than
-- an open category list. Fields with no real data source in the app today
-- (RM Consumed, Other Direct/Indirect Expenses, Payment to Promoters,
-- Depreciation, Net Worth, Inventories valuation, Loans & Advances, Other
-- Current Assets, Current Liabilities-Expenses) are admin-entered; everything
-- else is computed from real transactional data at generation time.

CREATE TABLE IF NOT EXISTS public.ca_financial_statements (
  id                          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title                       TEXT NOT NULL,
  period_start                DATE NOT NULL,
  period_end                  DATE NOT NULL,
  status                      TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved','superseded')),
  -- Turnover
  product_sales               NUMERIC(16,2) DEFAULT 0,
  other_income                NUMERIC(16,2) DEFAULT 0,
  -- Cost of Production
  rm_consumed                 NUMERIC(16,2) DEFAULT 0,
  direct_wages                NUMERIC(16,2) DEFAULT 0,
  electricity                 NUMERIC(16,2) DEFAULT 0,
  other_direct_expenses       NUMERIC(16,2) DEFAULT 0,
  -- Indirect Expenses
  employee_benefits           NUMERIC(16,2) DEFAULT 0,
  payment_to_promoters        NUMERIC(16,2) DEFAULT 0,
  other_indirect_expenses     NUMERIC(16,2) DEFAULT 0,
  depreciation                NUMERIC(16,2) DEFAULT 0,
  -- Quantitative
  total_production_qty        NUMERIC(16,2) DEFAULT 0,
  -- Balance-sheet-ish (mostly manual — no ledger/fixed-asset register yet)
  net_worth                   NUMERIC(16,2) DEFAULT 0,
  inventories                 NUMERIC(16,2) DEFAULT 0,
  loans_advances              NUMERIC(16,2) DEFAULT 0,
  sundry_debtors              NUMERIC(16,2) DEFAULT 0,
  cash_bank                   NUMERIC(16,2) DEFAULT 0,
  other_current_assets        NUMERIC(16,2) DEFAULT 0,
  current_liabilities_goods    NUMERIC(16,2) DEFAULT 0,
  current_liabilities_expenses NUMERIC(16,2) DEFAULT 0,
  notes                       TEXT,
  created_by                  UUID REFERENCES auth.users(id),
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ca_statements_period ON public.ca_financial_statements(period_start, period_end);

ALTER TABLE public.ca_financial_statements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth_select" ON public.ca_financial_statements FOR SELECT USING (auth.role()='authenticated');
CREATE POLICY "auth_insert" ON public.ca_financial_statements FOR INSERT WITH CHECK (auth.role()='authenticated');
CREATE POLICY "auth_update" ON public.ca_financial_statements FOR UPDATE USING (auth.role()='authenticated');
CREATE POLICY "auth_delete" ON public.ca_financial_statements FOR DELETE USING (auth.role()='authenticated');
