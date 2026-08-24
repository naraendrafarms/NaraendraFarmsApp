-- Migration 861 (READ ONLY): shed 7 remaining months + Kethireddypally row (short output).
SELECT 'f20_sh7' AS chk, string_agg(t, ' ~ ' ORDER BY t) AS rows
  FROM (
    SELECT (to_char(date_trunc('month', d.record_date),'YY-MM') || ',' ||
            to_char(min(d.record_date) OVER (PARTITION BY date_trunc('month', d.record_date)),'MMDD') || '-' ||
            to_char(max(d.record_date) OVER (PARTITION BY date_trunc('month', d.record_date)),'MMDD')) AS t
      FROM public.daily_records d
      JOIN public.flocks fl ON fl.id = d.flock_id
      JOIN public.sheds s ON s.id = d.shed_id
     WHERE fl.flock_no::text='20' AND s.shed_no='7'
  ) x LIMIT 1;

SELECT 'f20_sh7_agg' AS chk, string_agg(t, ' ~ ' ORDER BY t) AS rows
  FROM (
    SELECT (to_char(date_trunc('month', d.record_date),'YY-MM') || ':' ||
            min(d.opening_female) || '>' || max(d.closing_female) || ' m' ||
            sum(COALESCE(d.mortality_female,0)+COALESCE(d.mortality_male,0)) || ' c' ||
            sum(COALESCE(d.cull_female,0)+COALESCE(d.cull_male,0)) || ' e' ||
            sum(COALESCE(d.total_eggs,0))) AS t
      FROM public.daily_records d
      JOIN public.flocks fl ON fl.id = d.flock_id
      JOIN public.sheds s ON s.id = d.shed_id
     WHERE fl.flock_no::text='20' AND s.shed_no='7'
     GROUP BY date_trunc('month', d.record_date)
     ORDER BY 1
  ) x;

SELECT 'f20_keth_row' AS chk, string_agg(t, ' | ' ORDER BY t) AS rows
  FROM (
    SELECT (d.record_date::text || ' op' || d.opening_female || '/' || d.opening_male ||
            ' cl' || d.closing_female || '/' || d.closing_male ||
            ' m' || d.mortality_female || '/' || d.mortality_male ||
            ' tr' || d.transfer_female || '/' || d.transfer_male) AS t
      FROM public.daily_records d
      JOIN public.flocks fl ON fl.id = d.flock_id
      JOIN public.sheds s ON s.id = d.shed_id
      JOIN public.farms fm ON fm.id = s.farm_id
     WHERE fl.flock_no::text='20' AND fm.name='Kethireddypally'
  ) x;
