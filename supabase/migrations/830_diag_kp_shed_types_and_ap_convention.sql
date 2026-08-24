-- Migration 830 (READ ONLY): real shed_type per Kethireddypally shed number
-- (to map the Excel's B1-B5/G1-G7 labels onto real shed_no 1-12), plus the
-- convention used on the REAL first Agraharam Potlapally day in the app
-- (23-06-2025, not 2025-06-11 which is before the app's data starts).

SELECT 'kp_shed_types' AS chk,
       string_agg(t, ' | ' ORDER BY t) AS rows
  FROM (
    SELECT (s.shed_no || ':' || COALESCE(s.shed_type,'?')
            || ' capF=' || COALESCE(s.capacity_female,0)
            || ' capM=' || COALESCE(s.capacity_male,0)) AS t
      FROM public.sheds s JOIN public.farms fa ON fa.id = s.farm_id
     WHERE fa.name = 'Kethireddypally'
  ) x;

SELECT 'f19_ap_real_first_day' AS chk,
       string_agg(t, ' | ' ORDER BY t) AS rows
  FROM (
    SELECT (d.record_date::text || ' sh' || s.shed_no
            || ' open_f=' || COALESCE(d.opening_female,0)
            || ' recv_f=' || COALESCE(d.received_female,0)
            || ' trcull_f=' || COALESCE(d.trcull_female,0)
            || ' transfer_f=' || COALESCE(d.transfer_female,0)
            || ' transfer_in_f=' || COALESCE(d.transfer_in_female,0)
            || ' cull_f=' || COALESCE(d.cull_female,0)
            || ' mort_f=' || COALESCE(d.mortality_female,0)
            || ' close_f=' || COALESCE(d.closing_female,0)
            || ' farm_id_set=' || (d.farm_id IS NOT NULL)::text) AS t
      FROM public.daily_records d
      JOIN public.flocks f ON f.id = d.flock_id
      JOIN public.sheds s ON s.id = d.shed_id
      JOIN public.farms fa ON fa.id = s.farm_id
     WHERE f.flock_no::text = '19' AND fa.name = 'Agraharam Potlapally'
       AND d.record_date = '2025-06-23'
     ORDER BY s.shed_no
  ) x;
