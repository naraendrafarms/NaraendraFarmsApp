SELECT count(*) AS tables_exist FROM information_schema.tables
WHERE table_schema='public' AND table_name IN ('purchase_intents','purchase_intent_lines');

SELECT count(*) AS po_col_exists FROM information_schema.columns
WHERE table_schema='public' AND table_name='purchase_orders' AND column_name='intent_line_id';

SELECT count(*) AS policy_count FROM pg_policy
WHERE polrelid IN ('public.purchase_intents'::regclass, 'public.purchase_intent_lines'::regclass);

INSERT INTO purchase_intents (intent_no, intent_date) VALUES ('TEST-DIAG', '2026-01-01');
SELECT count(*) AS test_row_exists FROM purchase_intents WHERE intent_no = 'TEST-DIAG';
DELETE FROM purchase_intents WHERE intent_no = 'TEST-DIAG';
