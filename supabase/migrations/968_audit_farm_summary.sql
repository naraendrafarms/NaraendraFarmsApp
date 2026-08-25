-- Audit 968 (READ ONLY): last 30 days per farm - rows, flocks, eggs, closing birds.
SELECT 'farm_summary_30d' AS chk,
       COALESCE(string_agg(txt, ' | ' ORDER BY txt), 'NONE') AS rows
FROM (
  SELECT COALESCE(fa.name,'NULL_FARM') || ' rows=' || COUNT(*)
         || ' flocks=' || COUNT(DISTINCT d.flock_id)
         || ' eggs=' || SUM(COALESCE(d.he_eggs,0)+COALESCE(d.je_eggs,0)+COALESCE(d.te_eggs,0)+COALESCE(d.be_eggs,0)+COALESCE(d.le_eggs,0))
         || ' mort=' || SUM(COALESCE(d.mortality_female,0)+COALESCE(d.mortality_male,0)) AS txt
  FROM public.daily_records d
  LEFT JOIN public.farms fa ON fa.id = d.farm_id
  WHERE d.record_date >= DATE '2026-07-26'
  GROUP BY fa.name
) t;
