-- Migration 226: ensure bird_transfers is fully writable by authenticated (delete of
-- wrongly-entered transfers was failing silently — likely missing policy/grant).
ALTER TABLE public.bird_transfers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS bird_transfers_auth_all ON public.bird_transfers;
CREATE POLICY bird_transfers_auth_all ON public.bird_transfers
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bird_transfers TO authenticated;

SELECT 'bird_transfers' AS chk,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname='public' AND tablename='bird_transfers') AS policies,
  has_table_privilege('authenticated','public.bird_transfers','DELETE') AS del;
