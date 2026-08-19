-- Migration 769: migration 768 failed with 5 errors because the task text
-- contained semicolons and run_sql.py splits statements on them. Same tasks,
-- written without a single semicolon inside the text.

INSERT INTO public.tasks (title, description, task_type, team, priority, status, created_at)
SELECT v.title, v.descr, 'development', v.team, v.priority, 'pending', now()
FROM (VALUES
  (
    'URGENT: service_role key is published in a public repository',
    'WAITING ON YOU — only you can do the first step.

Found 19-Aug-2026 while measuring plan usage.
  - The GitHub repository naraendrafarms/NaraendraFarmsApp is PUBLIC.
  - The file .env.example, committed to it, contains a real
    VITE_SUPABASE_SERVICE_ROLE_KEY issued in 2026 and valid to 2096. The
    service_role key ignores every row-level security policy, so anyone
    holding it can read, change or delete the whole database including
    salaries, bank entries and party ledgers.
  - src/lib/supabase.ts and src/pages/setup/SetupPage.tsx read that same
    variable, so if it is also set in the Cloudflare Pages build settings it
    is compiled into the public JavaScript the site serves to every visitor.

What has to happen, in order.
  1. YOU. Supabase dashboard, Settings, API, rotate the keys or roll the JWT
     secret. Deleting the file is not enough because the old key stays
     readable in the public git history for ever, so it must be made
     worthless.
  2. YOU. Decide whether the repository should be private. That decision also
     settles the next task about public backups.
  3. ME. Remove the keys from .env.example and stop the browser bundle from
     ever holding a service key, by moving user creation to a SECURITY
     DEFINER function or an edge function.
  4. YOU. Put the new anon key into Cloudflare Pages and make sure the
     service key is NOT among the Pages variables.',
    'Housekeeping', 'high'
  ),
  (
    'Nightly backup artifacts are public while the repository is public',
    'WAITING ON YOU — depends on the repository decision above.

The nightly backup works. First run 19-Aug-2026 exported 572,302 rows from
138 tables into a 34.5 MB artifact kept 90 days. But artifacts of a PUBLIC
repository can be downloaded by anyone with the run link, and the weekly
snapshot step commits a tarball of the same data into the repository itself,
permanently, in public history. That first commit only failed to land because
a push raced with it, which was luck rather than design.

Until the repository is private the weekly commit step must stay off. Say
which you want.
  a. Make the repository private, the simplest route, after which everything
     works as already built.
  b. Keep it public and move the backup somewhere private instead.

Also pending on the same workflow, the weekly push needs a
"git pull --rebase origin main" before "git push", or it fails whenever
anything else pushes during the export.',
    'Housekeeping', 'high'
  ),
  (
    'Move old audit entries into Supabase Storage (1 GB sitting unused)',
    'OPEN — your idea, and it works, with one limit worth knowing.

File storage is 288 KB of 1 GB used, while the database is 207 MB of 500 MB
and audit_log is 166 MB of that. Storage cannot hold a queryable table, but
it can hold files. The nightly job can write audit entries older than N days
out as one compressed CSV per month into a private bucket and delete those
rows from the database. The Audit Log page keeps showing recent history
instantly, and older months become files you download when you need them.

Limit. Undo only works on entries still in the database. Anything archived is
a read-only record, not something the app can put back with one click.

Not built. Waiting on the retention line you want, 90 days or 180, and on the
cheaper fix first, which is stopping attendance re-saves from writing an
audit entry when nothing actually changed. See the audit-log growth task.',
    'Housekeeping', 'medium'
  ),
  (
    'Usage panel on the Health Check page',
    'NOT BUILT — waiting on your go-ahead, and partly on tokens.

Can be shown live inside the app, admin only.
  - Database size against the 500 MB free-plan limit, and the biggest tables.
  - File storage used against 1 GB.
  - audit_log rows and growth per day.
  - When the nightly backup last ran and how many rows it wrote.

Cannot be shown without credentials the app does not have. GitHub Actions
minutes and artifact storage, and Cloudflare Pages builds and bandwidth, each
need an API token stored as a secret and a small function to read it. Say
whether that is wanted and the tokens can be added.',
    'Housekeeping', 'medium'
  ),
  (
    'From-To date range for Attendance, Salary and Electricity',
    'OPEN — small, mine to build once you say so.

Asked 19-Aug-2026. Every other area of the app can be viewed for a chosen
From-To range. Shed Performance covers feed, eggs and mortality across all
flocks, and HE Dispatch, NHE Sales, Cash Book, Inventory Ledger and the rest
all take a range. Two areas cannot.
  - Attendance and Salary. Every page is a single month, or a single date for
    Daily Attendance, and Salary Report is a financial-year picker.
  - Electricity. Bills are per month and Cost Analysis is a financial year.

Adding a From-To to those pages would make the app consistent.',
    'HR', 'medium'
  )
) AS v(title, descr, team, priority)
WHERE NOT EXISTS (
  SELECT 1 FROM public.tasks t
   WHERE t.title = v.title AND t.task_type = 'development'
);

SELECT 'seeded' AS chk,
       count(*) FILTER (WHERE title LIKE 'URGENT: service_role%')::int AS urgent,
       count(*) FILTER (WHERE title LIKE 'Nightly backup artifacts%')::int AS backup,
       count(*) FILTER (WHERE title LIKE 'Move old audit entries%')::int AS archive,
       count(*) FILTER (WHERE title LIKE 'Usage panel%')::int AS usage_panel,
       count(*) FILTER (WHERE title LIKE 'From-To date range%')::int AS date_range,
       count(*) FILTER (WHERE title LIKE 'Audit log is filling%')::int AS growth_task
FROM public.tasks WHERE task_type = 'development';
