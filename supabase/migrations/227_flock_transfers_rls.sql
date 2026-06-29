-- Migration 227: ensure flock_transfers is fully writable by authenticated (delete of
-- wrongly-entered transfers in All Flocks Data → Transfers was failing / had no option).
ALTER TABLE public.flock_transfers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS flock_transfers_auth_all ON public.flock_transfers;
CREATE POLICY flock_transfers_auth_all ON public.flock_transfers
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.flock_transfers TO authenticated;

SELECT 'flock_transfers' AS chk,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname='public' AND tablename='flock_transfers') AS policies,
  has_table_privilege('authenticated','public.flock_transfers','DELETE') AS del;
