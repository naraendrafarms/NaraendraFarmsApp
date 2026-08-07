-- Verification only (no schema changes) for 578.
-- 578 reported "25 statements / Errors: 0" but printed no result rows: its
-- first five statements were ALTERs and UPDATEs returning nothing, and
-- run_sql.py only echoes the first five. The checks that mattered were never
-- shown, so they are repeated here as the leading statements.

-- 1. Nothing should still carry the old name anywhere.
SELECT COALESCE(string_agg(src || '=' || rows, ', ' ORDER BY src), 'none') AS still_stale
FROM (
  SELECT 'pending_payments.vendor_name' AS src, COUNT(*) AS rows
    FROM public.pending_payments WHERE vendor_name ILIKE '%G Parmita Das%'
  UNION ALL SELECT 'cash_book.party_name', COUNT(*)
    FROM public.cash_book WHERE party_name ILIKE '%G Parmita Das%'
  UNION ALL SELECT 'cash_book.description', COUNT(*)
    FROM public.cash_book WHERE description ILIKE '%G Parmita Das%'
  UNION ALL SELECT 'bank_transactions.description', COUNT(*)
    FROM public.bank_transactions WHERE description ILIKE '%G Parmita Das%'
) a WHERE rows > 0;

-- 2. The new name should be present in the same places instead.
SELECT
  (SELECT COUNT(*) FROM public.pending_payments WHERE vendor_name = 'Gottipati Parmita Das') AS pp_new,
  (SELECT COUNT(*) FROM public.cash_book WHERE party_name = 'Gottipati Parmita Das') AS cb_new,
  (SELECT COUNT(*) FROM public.cash_book WHERE description ILIKE '%Gottipati Parmita Das%') AS cb_desc_new,
  (SELECT COUNT(*) FROM public.bank_transactions WHERE description ILIKE '%Gottipati Parmita Das%') AS bt_desc_new;

-- 3. The permanent part: all four triggers must exist. A silent CREATE failure
--    would leave the data looking corrected while nothing protects the future.
SELECT COALESCE(string_agg(tgname, ', ' ORDER BY tgname), 'NONE — TRIGGERS MISSING') AS triggers_created
FROM pg_trigger
WHERE NOT tgisinternal
  AND tgname IN ('trg_parties_rename', 'trg_partners_rename',
                 'trg_mirror_name_pending_payments', 'trg_mirror_name_cash_book');

-- 4. cash_book link columns exist and how many rows the backfill linked.
SELECT
  (SELECT COUNT(*) FROM information_schema.columns
     WHERE table_schema='public' AND table_name='cash_book'
       AND column_name IN ('party_id','partner_id')) AS link_cols_present,
  (SELECT COUNT(*) FROM public.cash_book WHERE party_id IS NOT NULL) AS cb_party_linked,
  (SELECT COUNT(*) FROM public.cash_book WHERE partner_id IS NOT NULL) AS cb_partner_linked,
  (SELECT COUNT(*) FROM public.cash_book) AS cb_total;

-- 5. Both functions compiled.
SELECT COALESCE(string_agg(proname, ', ' ORDER BY proname), 'NONE — FUNCTIONS MISSING') AS functions_created
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND proname IN ('fn_propagate_master_rename', 'fn_mirror_name_from_master');
