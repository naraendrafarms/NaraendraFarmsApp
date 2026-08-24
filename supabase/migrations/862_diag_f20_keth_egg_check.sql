-- Migration 862 (READ ONLY): (1) real sheds/farms columns for shed-type/purpose;
-- (2) ANY daily_records at Kethireddypally in Aug-Nov 2025 regardless of flock,
-- to check if Flock 20's Kethireddypally-phase egg data exists under a different
-- flock_id/tag rather than being truly absent.

SELECT 'sheds_cols' AS chk, string_agg(column_name, ', ' ORDER BY ordinal_position) AS cols
  FROM information_schema.columns WHERE table_schema='public' AND table_name='sheds';

SELECT 'farms_cols' AS chk, string_agg(column_name, ', ' ORDER BY ordinal_position) AS cols
  FROM information_schema.columns WHERE table_schema='public' AND table_name='farms';

SELECT 'keth_aug_nov_2025_any_flock' AS chk,
       string_agg(t, ' | ' ORDER BY t) AS rows
  FROM (
    SELECT (fl.flock_no::text || ' sh' || s.shed_no || ' ' ||
            min(d.record_date)::text || '..' || max(d.record_date)::text ||
            ' n=' || count(*) || ' eggs_sum=' || sum(COALESCE(d.total_eggs,0))) AS t
      FROM public.daily_records d
      JOIN public.flocks fl ON fl.id = d.flock_id
      JOIN public.sheds s ON s.id = d.shed_id
      JOIN public.farms fm ON fm.id = s.farm_id
     WHERE fm.name = 'Kethireddypally'
       AND d.record_date BETWEEN '2025-08-01' AND '2025-11-30'
     GROUP BY fl.flock_no, s.shed_no
     ORDER BY 1
  ) x;
