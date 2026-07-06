-- Migration 374: true RLS-respecting test. The migration runner's own
-- connection is service_role, which bypasses RLS entirely — every earlier
-- "verify" query in this session ran with RLS effectively off, so none of
-- them could prove anything either way. SET ROLE actually switches the
-- privilege-checking role for this transaction, so this is the first test
-- that reflects what the real app (PostgREST, running as `authenticated`)
-- actually experiences.

SET ROLE authenticated;

UPDATE public.vhl_daily_entry
SET remarks = remarks
WHERE id = (SELECT id FROM public.vhl_daily_entry ORDER BY created_at DESC LIMIT 1);

RESET ROLE;

SELECT table_name, action, changed_at, summary
FROM audit_log
WHERE table_name = 'vhl_daily_entry'
ORDER BY changed_at DESC LIMIT 3;
