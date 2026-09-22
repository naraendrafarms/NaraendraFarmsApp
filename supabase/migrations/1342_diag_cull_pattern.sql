-- READ ONLY. No INSERT, UPDATE, DELETE or DDL.
-- Are a flock's culls spread through the cycle (birds picked out as they go
-- weak) or bunched at the end (the flock being cleared out and sold)? If they
-- bunch, the app can tell the two apart and there is nothing to guess.
SELECT string_agg(line, '  ||  ' ORDER BY flock_no) AS cull_pattern
FROM (
  SELECT f.flock_no,
         'F-' || f.flock_no
           || ' daysWithCull=' || COUNT(*) FILTER (WHERE COALESCE(d.cull_female,0) > 0)
           || ' totalCull=' || COALESCE(SUM(d.cull_female), 0)
           || ' biggestDay=' || COALESCE(MAX(d.cull_female), 0)
           || ' top3DaysShare=' || COALESCE(ROUND(
                (SELECT SUM(x.cull_female)::numeric FROM (
                   SELECT d2.cull_female FROM public.daily_records d2
                    WHERE d2.flock_id = f.id AND COALESCE(d2.cull_female,0) > 0
                    ORDER BY d2.cull_female DESC LIMIT 3) x)
                / NULLIF(SUM(d.cull_female), 0) * 100, 0)::text, '-') || '%'
           || ' lastCullDate=' || COALESCE(MAX(d.record_date) FILTER (WHERE COALESCE(d.cull_female,0) > 0)::text, '-')
           || ' lastRecord=' || COALESCE(MAX(d.record_date)::text, '-')
           AS line
    FROM public.flocks f JOIN public.daily_records d ON d.flock_id = f.id
   GROUP BY f.flock_no, f.id
) s;
