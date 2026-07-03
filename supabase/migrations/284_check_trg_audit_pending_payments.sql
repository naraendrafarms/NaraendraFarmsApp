-- Two backfill attempts (281 loop, 283 set-based INSERT) both ran with
-- Errors:0 but wrote zero rows for GRN 2758-2761. The only trigger on
-- pending_payments besides internal ones is trg_audit. If it's a BEFORE
-- trigger whose function can RETURN NULL, that silently cancels the INSERT
-- with no error at all. Check its timing/events and function body.

SELECT tgname, tgtype,
  CASE WHEN tgtype & 2 = 2 THEN 'BEFORE' ELSE 'AFTER' END AS timing,
  CASE WHEN tgtype & 4 = 4 THEN 'ROW' ELSE 'STATEMENT' END AS level,
  (tgtype & 8 = 8) AS on_insert,
  (tgtype & 16 = 16) AS on_delete,
  (tgtype & 32 = 32) AS on_update
FROM pg_trigger
WHERE tgrelid = 'public.pending_payments'::regclass AND NOT tgisinternal;

SELECT pg_get_functiondef(p.oid) AS fn_audit_def
FROM pg_trigger t
JOIN pg_proc p ON p.oid = t.tgfoid
WHERE t.tgrelid = 'public.pending_payments'::regclass AND t.tgname = 'trg_audit';
