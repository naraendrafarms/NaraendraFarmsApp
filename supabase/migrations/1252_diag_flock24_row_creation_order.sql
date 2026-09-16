-- READ ONLY. 1251 showed both rows exist on shed 1 but 14/09 has
-- opening_female NULL. The screen only carries Opening forward from the
-- previous day WHEN NO ROW YET EXISTS for the date being edited, so the
-- order the two rows were created in decides whether that could have
-- happened. created_at settles it.
SELECT 1 AS warmup;

SELECT d.record_date::text AS the_date,
       d.created_at::text  AS created_at,
       COALESCE(d.opening_female, -1) AS open_f,
       COALESCE(d.received_female, -1) AS recd_f,
       COALESCE(d.closing_female, -1) AS close_f
FROM public.vhl_daily_entry d
JOIN public.flocks f ON f.id = d.flock_id
WHERE f.flock_no::text = '24'
ORDER BY d.created_at;

-- Was the 14/09 row ever UPDATEd after insert, or only inserted once?
SELECT count(*)::int AS audit_rows_for_flock24_vhl_daily,
       count(*) FILTER (WHERE a.action = 'INSERT')::int AS inserts,
       count(*) FILTER (WHERE a.action = 'UPDATE')::int AS updates,
       min(a.changed_at)::text AS first_change,
       max(a.changed_at)::text AS last_change
FROM public.audit_log a
WHERE a.table_name = 'vhl_daily_entry'
  AND a.changed_at >= '2026-09-15';
