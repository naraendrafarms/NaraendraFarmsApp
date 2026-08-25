WITH f AS (SELECT id FROM public.flocks WHERE flock_no::text='20'),
ordered AS (
  SELECT d.id, d.record_date, d.shed_id, d.opening_female, d.opening_male,
         d.closing_female, d.closing_male,
         LAG(d.closing_female) OVER w AS prev_close_f,
         LAG(d.closing_male) OVER w AS prev_close_m,
         LAG(d.record_date) OVER w AS prev_date
  FROM public.daily_records d
  WHERE d.flock_id = (SELECT id FROM f)
  WINDOW w AS (PARTITION BY d.shed_id ORDER BY d.record_date, d.id)
)
SELECT string_agg(
  COALESCE(fm.name,'(flock-level)') || ' sh' || COALESCE(s.shed_no,'-') || ' ' ||
  to_char(o.record_date,'YYYY-MM-DD') || ': prevclose(' || o.prev_close_f || '/' || o.prev_close_m ||
  ') open(' || o.opening_female || '/' || o.opening_male || ') dF=' || (o.opening_female - o.prev_close_f) ||
  ' dM=' || (o.opening_male - o.prev_close_m),
  ' | ' ORDER BY o.record_date
) AS rows
FROM ordered o
LEFT JOIN public.sheds s ON s.id = o.shed_id
LEFT JOIN public.farms fm ON fm.id = s.farm_id
WHERE o.prev_close_f IS NOT NULL
  AND (o.opening_female <> o.prev_close_f OR o.opening_male <> o.prev_close_m)
  AND o.prev_close_f <> 0 AND o.opening_female <> 0
  AND o.prev_close_m <> 0 AND o.opening_male <> 0;
