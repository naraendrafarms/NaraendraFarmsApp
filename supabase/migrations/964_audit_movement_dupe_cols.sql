-- Audit 964 (READ ONLY): rows where the same movement is stored twice in two columns.
SELECT 'movement_dupe_cols' AS chk,
       COALESCE(string_agg(txt, ' | ' ORDER BY txt), 'NONE') AS rows
FROM (
  SELECT f.flock_no
         || ' trc=tout n=' || SUM(CASE WHEN COALESCE(d.trcull_female,0) > 0 AND d.trcull_female = d.transfer_female THEN 1 ELSE 0 END)
         || ' cull=trc n=' || SUM(CASE WHEN COALESCE(d.cull_female,0) > 0 AND d.cull_female = d.trcull_female THEN 1 ELSE 0 END)
         || ' anyTrc=' || SUM(CASE WHEN COALESCE(d.trcull_female,0) > 0 THEN 1 ELSE 0 END)
         || ' anyTout=' || SUM(CASE WHEN COALESCE(d.transfer_female,0) > 0 THEN 1 ELSE 0 END)
         || ' anyCull=' || SUM(CASE WHEN COALESCE(d.cull_female,0) > 0 THEN 1 ELSE 0 END) AS txt
  FROM public.daily_records d
  JOIN public.flocks f ON f.id = d.flock_id
  GROUP BY f.flock_no
  HAVING SUM(CASE WHEN COALESCE(d.trcull_female,0) > 0 THEN 1 ELSE 0 END) > 0
      OR SUM(CASE WHEN COALESCE(d.transfer_female,0) > 0 THEN 1 ELSE 0 END) > 0
) t;
