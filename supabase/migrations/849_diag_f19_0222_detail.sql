SELECT 'f19_0222_rows' AS chk,
       string_agg(t, ' | ' ORDER BY t) AS rows
  FROM (
    SELECT (s.shed_no
            || ' open_f=' || COALESCE(d.opening_female,0)
            || ' transfer_in_f=' || COALESCE(d.transfer_in_female,0)
            || ' transfer_f=' || COALESCE(d.transfer_female,0)
            || ' cull_f=' || COALESCE(d.cull_female,0)
            || ' mort_f=' || COALESCE(d.mortality_female,0)
            || ' close_f=' || COALESCE(d.closing_female,0)) AS t
      FROM public.daily_records d
      JOIN public.flocks f ON f.id = d.flock_id
      JOIN public.sheds s ON s.id = d.shed_id
     WHERE f.flock_no::text = '19' AND d.record_date = '2025-02-22'
     ORDER BY s.shed_no
  ) x;
