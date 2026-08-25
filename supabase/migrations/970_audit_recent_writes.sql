-- Audit 970 (READ ONLY): daily_records created since the chain triggers were re-enabled.
SELECT 'recent_writes' AS chk,
       COALESCE(string_agg(txt, ' | ' ORDER BY txt), 'NONE') AS rows
FROM (
  SELECT f.flock_no || ' ' || d.record_date || ' shed=' || COALESCE(s.shed_no,'FL')
         || ' oF=' || COALESCE(d.opening_female,0) || ' cF=' || COALESCE(d.closing_female,0)
         || ' at=' || to_char(d.created_at,'MM-DD HH24:MI') AS txt
  FROM public.daily_records d
  JOIN public.flocks f ON f.id = d.flock_id
  LEFT JOIN public.sheds s ON s.id = d.shed_id
  WHERE d.created_at >= TIMESTAMPTZ '2026-08-24 00:00:00+00'
) t;
