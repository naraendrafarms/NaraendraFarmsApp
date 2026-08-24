SELECT 'f19_shed5_0222_0225' AS chk,
       string_agg(t, ' | ' ORDER BY t) AS rows
  FROM (
    SELECT (d.record_date::text
            || ' open_f=' || COALESCE(d.opening_female,0)
            || ' transfer_in_f=' || COALESCE(d.transfer_in_female,0)
            || ' close_f=' || COALESCE(d.closing_female,0)) AS t
      FROM public.daily_records d
      JOIN public.flocks f ON f.id = d.flock_id
      JOIN public.sheds s ON s.id = d.shed_id
     WHERE f.flock_no::text = '19' AND s.shed_no = '5'
       AND d.record_date BETWEEN '2025-02-22' AND '2025-02-26'
     ORDER BY d.record_date
  ) x;
