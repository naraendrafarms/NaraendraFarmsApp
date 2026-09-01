-- Migration 1112: log the limitation found while making the Bank Ledger settle
-- picker net-of-TDS (migration 1111 + BankLedger.tsx).

INSERT INTO public.tasks (title, description, task_type, team, priority, status)
SELECT * FROM (VALUES
  ('NHE sales cannot record buyer-deducted TDS',
   'OPEN (mine to do, low urgency). Verified against information_schema: nhe_sales has NO tds column at all, while he_dispatch has tds_pct and tds_amount. '
   || 'The Bank Ledger settle picker and v_party_ledger were both made net-of-TDS on 01/09/2026, but only the HE side can benefit — NHE rows are normalised to zero TDS. '
   || 'Today that is harmless: no NHE buyer deducts TDS. The day one does, that sale will behave the way HE invoices did before this fix — the receipt will fall short of the invoice, it will sit Partial forever, and the shortfall will stay open in the party ledger with nowhere to book it. '
   || 'Fix when needed: add tds_pct/tds_amount to nhe_sales mirroring migrations 107/108, expose them on the NHE sale form, drop the hardcoded tds_amount:0 in BankLedger.tsx openReceivablesForParty, and add an NHE branch to the he_tds credit line in v_party_ledger.',
   'development', 'Accounts', 'normal', 'pending')
) AS v(title, description, task_type, team, priority, status)
WHERE NOT EXISTS (
  SELECT 1 FROM public.tasks t WHERE t.title = v.title AND t.task_type = 'development'
);

SELECT status AS nhe_tds_task
FROM public.tasks
WHERE task_type = 'development' AND title = 'NHE sales cannot record buyer-deducted TDS';
