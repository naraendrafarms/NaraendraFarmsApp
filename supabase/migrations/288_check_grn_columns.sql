-- CRITICAL: migration 287 statement 1 referenced g.po_no and printed
-- nothing — possibly a silently-swallowed "column does not exist" error
-- (run_sql.py treats any error containing that phrase as success). If
-- grn.po_no doesn't exist, then migration 281's fix to fn_grn_to_payment()
-- (which also references v_row.po_no) is STILL broken for every new GRN,
-- not just the 4-row backfill. Check the real column list directly.
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema='public' AND table_name='grn'
ORDER BY ordinal_position;
