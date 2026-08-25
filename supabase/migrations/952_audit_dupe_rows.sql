-- Audit 952 (READ ONLY): duplicate (flock_id, shed_id, record_date) rows.
SELECT 'dupe_daily_rows' AS chk,
       COALESCE(string_agg(txt, ' || ' ORDER BY txt), 'NONE') AS rows
FROM (
  SELECT f.flock_no || ' shed=' || COALESCE(s.shed_no,'FLOCKLVL') || ' ' || d.record_date || ' n=' || COUNT(*) AS txt
  FROM public.daily_records d
  JOIN public.flocks f ON f.id = d.flock_id
  LEFT JOIN public.sheds s ON s.id = d.shed_id
  GROUP BY f.flock_no, s.shed_no, d.shed_id, d.record_date
  HAVING COUNT(*) > 1
) t;
