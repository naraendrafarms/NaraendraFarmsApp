-- Owner instruction 15/09/2026: keep 30 days of audit log in the database and
-- archive the rest to file storage.
--
-- WHY 30 AND NOT 90: the heavy months are July (250,484 rows) and August
-- (298,299), both from bulk imports. A 90-day cutoff today falls around 17 June,
-- so both would STAY and almost nothing would be freed. A 30-day cutoff reaches
-- into August and frees roughly 170 MB of the 240 MB the audit log occupies.
--
-- WHAT STAYS BEHIND, and it is the part that matters: Admin Centre -> Audit Log
-- -> Undo calls fn_undo_audit(p_audit_id), a DATABASE function that reads the
-- audit row in place. A row in a file cannot be undone. Keeping 30 days keeps
-- Undo working for everything recent, which is the only window anyone undoes in.
-- Older history stays readable as a downloadable file, not a browsable page.
--
-- THE FARM'S OWN DATA IS NOT INVOLVED AT ALL. Flocks, sales, salaries, invoices,
-- cash book - none of it is touched, now or ever, by any of this. The audit log
-- is a diary ABOUT changes, not the records themselves.
--
-- PRIVATE BUCKET, unlike chat-attachments which is public: this holds who
-- changed what, with old and new values, across salaries and bank entries.

INSERT INTO storage.buckets (id, name, public)
VALUES ('audit-archive', 'audit-archive', false)
ON CONFLICT (id) DO NOTHING;

-- Admins only, matching the audit_log table's own policy. The archiving job
-- itself runs with the service role and bypasses these.
DROP POLICY IF EXISTS audit_archive_admin_read ON storage.objects;
CREATE POLICY audit_archive_admin_read ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'audit-archive' AND EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- Deliberately NO insert, update or delete policy for ordinary users. Nobody
-- signing in to the app can add to, alter or remove an archive - that would let
-- a record of a change be erased by whoever made it.

NOTIFY pgrst, 'reload schema';

-- VERIFY: the bucket exists and is PRIVATE. A public audit archive would put
-- every salary and bank change on the open internet.
SELECT id, name, public,
       (SELECT count(*)::int FROM pg_policies
        WHERE schemaname = 'storage' AND tablename = 'objects'
          AND policyname LIKE 'audit_archive%') AS policies
FROM storage.buckets WHERE id = 'audit-archive';

-- VERIFY: what a 30-day cutoff would archive today, and what would remain.
-- Nothing is deleted by this migration - this is the size of the job only.
SELECT count(*)::int AS total_rows,
       count(*) FILTER (WHERE changed_at <  now() - interval '30 days')::int AS would_archive,
       count(*) FILTER (WHERE changed_at >= now() - interval '30 days')::int AS would_stay,
       min(changed_at)::date::text AS oldest,
       max(changed_at)::date::text AS newest,
       pg_size_pretty(pg_total_relation_size('public.audit_log')) AS current_size
FROM public.audit_log;
