-- Clean up settlement links when the bank transaction they belong to is
-- deleted. A DELETE trigger rather than an FK CASCADE, per the repo rule:
-- ALTER TABLE ADD CONSTRAINT can fail silently through run_sql.py, while the
-- runner handles a dollar-quoted function body correctly.
--
-- Orphans would otherwise accumulate quietly and the edit modal would one day
-- name invoices against a receipt that no longer exists.

CREATE OR REPLACE FUNCTION public.fn_del_bank_txn_settlements()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.bank_txn_settlements WHERE bank_txn_id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_del_bank_txn_settlements ON public.bank_transactions;

CREATE TRIGGER trg_del_bank_txn_settlements
  BEFORE DELETE ON public.bank_transactions
  FOR EACH ROW EXECUTE FUNCTION public.fn_del_bank_txn_settlements();

-- ── Verification ─────────────────────────────────────────────────────────
SELECT (SELECT count(*)::int FROM pg_trigger
        WHERE tgname = 'trg_del_bank_txn_settlements' AND NOT tgisinternal) AS trigger_exists,
       (SELECT count(*)::int FROM pg_proc
        WHERE proname = 'fn_del_bank_txn_settlements') AS function_exists,
       (SELECT count(*)::int FROM public.bank_txn_settlements) AS settlement_rows,
       (SELECT count(*)::int FROM public.bank_transactions) AS bank_rows_untouched;
