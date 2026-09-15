-- Keep the task list true. The audit-log task was written on 15/09/2026 as a
-- question waiting on the owner's decision. The decision is made - 30 days in
-- the database, the rest to storage - and the mechanism is built and verified.
-- What is left is one thing only: firing the first real run, which deletes.
UPDATE public.tasks
   SET description =
       'OPEN - WAITING ON YOUR GO FOR THE FIRST RUN. The decision is made and the mechanism is built. '
    || 'MEASURED ON 15/09/2026: audit_log holds 584,602 rows in 240 MB, which is 82 percent of the '
    || '291 MB database. All the real farm data - every flock, sale, salary, invoice and cash entry - '
    || 'is about 51 MB. A 30-day cutoff falls on 16/08/2026: 469,548 rows move to storage and 115,054 '
    || 'stay. The database should fall from 291 MB to roughly 120 MB of the 500 MB limit. '
    || 'WHY 30 AND NOT 90: the heavy months are July (250,484 rows) and August (298,299), both bulk '
    || 'imports. A 90-day cutoff falls around 17 June, so both would stay and almost nothing would be '
    || 'freed. '
    || 'WHAT IS BUILT: a private audit-archive bucket, admin-read only, with no insert, update or '
    || 'delete policy for app users at all - so nobody signing in can erase a record of their own '
    || 'change. Plus a monthly job (1st, 03:00 IST) with a dry-run option. Its order is the whole '
    || 'safety of it: export, gzip, upload, download it back and compare the sha256, and ONLY then '
    || 'delete. Any failure before the last step exits with nothing deleted and every row still in '
    || 'the database. '
    || 'WHAT STAYS WORKING: Admin Centre undo reads the audit row in the database, so 30 days keeps '
    || 'undo working for the only window anyone undoes in. Older history stays readable as a '
    || 'downloadable file rather than a browsable page. '
    || 'TWO FIXES ALONG THE WAY, both from cancelled dry runs that deleted nothing: OFFSET paging made '
    || 'the database re-walk every earlier row (changed to keyset), and the real cost is the round '
    || 'trip to Supabase at several seconds each, so pages went from 5,000 to 25,000 - 19 trips '
    || 'instead of 94. Only the FIRST run is ever this big; a month after that is about 30,000 rows. '
    || 'WAITING ON YOU: say run it. Expect the reported size NOT to drop straight away - Postgres '
    || 'frees the space for reuse but only shrinks the file after a VACUUM FULL, which should follow '
    || 'immediately so the drop is actually visible.',
       updated_at = now()
 WHERE task_type = 'development'
   AND title = 'Audit log is 240 MB of the 291 MB database - 82 percent';

SELECT title, status, priority, left(description, 90) AS starts_with
FROM public.tasks
WHERE task_type = 'development' AND title LIKE 'Audit log is 240 MB%';
