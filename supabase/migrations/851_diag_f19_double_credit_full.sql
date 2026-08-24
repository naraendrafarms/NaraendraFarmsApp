-- Migration 851 (READ ONLY): find every daily_records row Flock 19 whose
-- transfer_in_female/male was auto-credited by trg_flock_transfer_credit
-- (migration 228) as a side effect of migration 842's flock_transfers inserts
-- -- all 10 of those had to_shed_id set, so all 10 are suspects regardless of
-- whether from_shed_id was also set.
SELECT 'f19_842_transfers' AS chk,
       string_agg(t, ' | ' ORDER BY t) AS rows
  FROM (
    SELECT (ft.transfer_date::text || ' to_sh=' || COALESCE(s.shed_no,'null')
            || ' f=' || COALESCE(ft.female_count,0) || ' m=' || COALESCE(ft.male_count,0)) AS t
      FROM public.flock_transfers ft
      LEFT JOIN public.sheds s ON s.id = ft.to_shed_id
      JOIN public.flocks f ON f.id = ft.flock_id
     WHERE f.flock_no::text = '19' AND ft.to_shed_id IS NOT NULL
       AND ft.from_farm_id = ft.to_farm_id
     ORDER BY ft.transfer_date
  ) x;

-- Current daily_records state on exactly those (destination shed, date) pairs.
SELECT 'f19_842_dest_rows_now' AS chk,
       string_agg(t, ' | ' ORDER BY t) AS rows
  FROM (
    SELECT DISTINCT (d.record_date::text || ' sh' || s.shed_no
            || ' transfer_in_f=' || COALESCE(d.transfer_in_female,0)
            || ' transfer_in_m=' || COALESCE(d.transfer_in_male,0)
            || ' close_f=' || COALESCE(d.closing_female,0)
            || ' close_m=' || COALESCE(d.closing_male,0)) AS t
      FROM public.flock_transfers ft
      JOIN public.flocks f ON f.id = ft.flock_id
      JOIN public.daily_records d ON d.flock_id = ft.flock_id
        AND d.shed_id = ft.to_shed_id AND d.record_date = ft.transfer_date
      JOIN public.sheds s ON s.id = d.shed_id
     WHERE f.flock_no::text = '19' AND ft.to_shed_id IS NOT NULL
       AND ft.from_farm_id = ft.to_farm_id
  ) x;
