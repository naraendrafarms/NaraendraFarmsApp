-- Audit 951 (READ ONLY): flock+date where BOTH flock-level (shed_id IS NULL) and
-- shed-level egg-type totals are nonzero => production reports double-count.
SELECT 'egg_double_count' AS chk,
       COALESCE(string_agg(txt, ' || ' ORDER BY txt), 'NONE') AS rows
FROM (
  SELECT f.flock_no || ' ' || d.record_date
         || ' flocklvl=' || SUM(CASE WHEN d.shed_id IS NULL THEN COALESCE(d.he_eggs,0)+COALESCE(d.je_eggs,0)+COALESCE(d.te_eggs,0)+COALESCE(d.be_eggs,0)+COALESCE(d.le_eggs,0) ELSE 0 END)
         || ' shedlvl=' || SUM(CASE WHEN d.shed_id IS NOT NULL THEN COALESCE(d.he_eggs,0)+COALESCE(d.je_eggs,0)+COALESCE(d.te_eggs,0)+COALESCE(d.be_eggs,0)+COALESCE(d.le_eggs,0) ELSE 0 END) AS txt
  FROM public.daily_records d
  JOIN public.flocks f ON f.id = d.flock_id
  GROUP BY f.flock_no, d.record_date
  HAVING SUM(CASE WHEN d.shed_id IS NULL THEN COALESCE(d.he_eggs,0)+COALESCE(d.je_eggs,0)+COALESCE(d.te_eggs,0)+COALESCE(d.be_eggs,0)+COALESCE(d.le_eggs,0) ELSE 0 END) > 0
     AND SUM(CASE WHEN d.shed_id IS NOT NULL THEN COALESCE(d.he_eggs,0)+COALESCE(d.je_eggs,0)+COALESCE(d.te_eggs,0)+COALESCE(d.be_eggs,0)+COALESCE(d.le_eggs,0) ELSE 0 END) > 0
) t;
