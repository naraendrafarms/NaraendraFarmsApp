-- Migration 432 reported Errors: 0 but its own verification SELECT (the
-- last of 25 statements) never printed in the log — verify directly as the
-- very first statement here so it isn't truncated.
SELECT count(DISTINCT event_object_table) AS tables_with_trigger,
       string_agg(DISTINCT event_object_table, ', ' ORDER BY event_object_table) AS tables
FROM information_schema.triggers
WHERE trigger_name = 'trg_audit' AND event_object_table IN (
  'chat_messages','salary_abstract','salary_allocation','feed_stock_adjustments',
  'stock_ledger','bank_accounts','invoice_series','opening_balances',
  'cms_uploads','he_dispatch_lines','nhe_sale_lines','he_rate_register'
);
