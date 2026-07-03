-- User reports Packaging inventory shows 0 usage despite HE Dispatch
-- already having box/tray values entered. Likely cause: the trigger
-- (296/305) only fires on INSERT/UPDATE/DELETE going forward — existing
-- he_dispatch rows entered before the trigger existed were never backfilled
-- into stock_ledger (unlike the GRN trigger, which got an explicit backfill
-- in migration 154). Confirm: how many he_dispatch rows have non-zero
-- box/tray values, vs how many dispatch_out stock_ledger rows exist.
SELECT COUNT(*) AS dispatch_rows_with_packaging
FROM public.he_dispatch
WHERE COALESCE(boxes_20lb,0) > 0 OR COALESCE(boxes_23lb,0) > 0
   OR COALESCE(extra_trays_20lb,0) > 0 OR COALESCE(extra_trays_23lb,0) > 0;

SELECT COUNT(*) AS dispatch_out_ledger_rows
FROM public.stock_ledger WHERE txn_type = 'dispatch_out';
