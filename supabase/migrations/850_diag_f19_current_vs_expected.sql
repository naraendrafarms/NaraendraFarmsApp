-- Migration 850 (READ ONLY): re-run the formula check across ALL 761 imported
-- Flock 19 rows against the CURRENT database state (not just right after
-- import) to see how many have drifted since, and where.
SELECT 'f19_formula_mismatches_now' AS chk, count(*)::int AS n
  FROM public.daily_records d
  JOIN public.flocks f ON f.id = d.flock_id
 WHERE f.flock_no::text = '19' AND d.record_date < '2025-06-23'
   AND d.closing_female <> GREATEST(0, COALESCE(d.opening_female,0) + COALESCE(d.transfer_in_female,0)
       - COALESCE(d.mortality_female,0) - COALESCE(d.cull_female,0) - COALESCE(d.transfer_female,0));

-- Rows where transfer_in_female/male is now nonzero on what should have been
-- a "first row, opening set directly" shed (i.e. genuinely suspicious, whether
-- or not the formula itself still balances).
SELECT 'f19_nonzero_transfer_in_rows' AS chk,
       string_agg(t, ' | ' ORDER BY t) AS rows
  FROM (
    SELECT (d.record_date::text || ' sh' || s.shed_no
            || ' open_f=' || COALESCE(d.opening_female,0)
            || ' transfer_in_f=' || COALESCE(d.transfer_in_female,0)
            || ' transfer_in_m=' || COALESCE(d.transfer_in_male,0)
            || ' close_f=' || COALESCE(d.closing_female,0)) AS t
      FROM public.daily_records d
      JOIN public.flocks f ON f.id = d.flock_id
      JOIN public.sheds s ON s.id = d.shed_id
     WHERE f.flock_no::text = '19' AND d.record_date < '2025-06-23'
       AND (COALESCE(d.transfer_in_female,0) > 0 OR COALESCE(d.transfer_in_male,0) > 0)
     ORDER BY d.record_date
  ) x;

-- audit_log entries touching daily_records for Flock 19 since the import finished
-- (833_6 completed 2026-08-24 12:57:30 UTC) -- to see if a human edit happened.
SELECT 'f19_audit_since_import' AS chk,
       string_agg(t, ' | ' ORDER BY t) AS rows
  FROM (
    SELECT (a.changed_at::text || ' ' || a.action || ' ' || COALESCE(a.summary,'?')
            || ' by ' || COALESCE(a.user_email,'?')) AS t
      FROM public.audit_log a
     WHERE a.table_name IN ('daily_records','flock_transfers')
       AND a.changed_at > '2026-08-24 12:57:30'
     ORDER BY a.changed_at
     LIMIT 30
  ) x;
