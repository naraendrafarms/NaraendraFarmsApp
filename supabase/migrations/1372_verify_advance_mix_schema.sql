-- READ ONLY. Proves 1369, 1370 and 1371 actually took.
--
-- WHY THIS IS A SEPARATE FILE: run_sql.py prints only the FIRST 5 statements
-- (`if len(resp) > 0 and i < 5`). 1369 had 8 statements, so BOTH its
-- verification SELECTs fell outside the printed window and its "Errors: 0"
-- proved nothing - and the runner treats "already exists" and "does not exist"
-- as success, so a CREATE or an ADD CONSTRAINT can fail in total silence.
-- Every check below sits in the first five positions where it will be read.

SELECT 'table=' || (SELECT count(*)::int FROM information_schema.tables
                     WHERE table_schema='public' AND table_name='sale_advance_allocations')
    || ' cols=' || (SELECT count(*)::int FROM information_schema.columns
                     WHERE table_schema='public' AND table_name='sale_advance_allocations')
    || ' idx='  || (SELECT count(*)::int FROM pg_indexes
                     WHERE schemaname='public' AND indexname IN ('idx_saa_sale','idx_saa_advance'))
    || ' policies=' || (SELECT count(*)::int FROM pg_policies
                     WHERE schemaname='public' AND tablename='sale_advance_allocations')
    || ' rows=' || (SELECT count(*)::int FROM public.sale_advance_allocations)
    AS allocations_table;

SELECT 'authSelect=' || has_table_privilege('authenticated','public.sale_advance_allocations','SELECT')::text
    || ' authInsert=' || has_table_privilege('authenticated','public.sale_advance_allocations','INSERT')::text
    || ' authDelete=' || has_table_privilege('authenticated','public.sale_advance_allocations','DELETE')::text
    || ' anonSelect=' || has_table_privilege('anon','public.sale_advance_allocations','SELECT')::text
    AS allocations_grants;

SELECT 'triggers=' || (SELECT count(*)::int FROM pg_trigger
        WHERE tgname IN ('trg_del_he_sale_advance_allocations','trg_del_nhe_sale_advance_allocations')
          AND NOT tgisinternal)
    || ' functions=' || (SELECT count(*)::int FROM pg_proc
        WHERE proname IN ('fn_del_he_sale_advance_allocations','fn_del_nhe_sale_advance_allocations'))
    AS cleanup_triggers;

-- The widened CHECKs, read back from the catalogue rather than assumed.
SELECT 'heAllowsMix=' || (pg_get_constraintdef(oid) LIKE '%Advance+Cash%')::text
    || ' heAllowsBank=' || (pg_get_constraintdef(oid) LIKE '%Advance+Bank%')::text
    AS he_payment_mode_check
  FROM pg_constraint WHERE conname = 'he_dispatch_payment_mode_check';

SELECT 'nheAllowsMix=' || (pg_get_constraintdef(oid) LIKE '%Advance+Cash%')::text
    || ' nheAllowsBank=' || (pg_get_constraintdef(oid) LIKE '%Advance+Bank%')::text
    AS nhe_payment_mode_check
  FROM pg_constraint WHERE conname = 'nhe_sales_payment_mode_check';
