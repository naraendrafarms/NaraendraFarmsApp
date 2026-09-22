-- READ ONLY.  No INSERT, UPDATE, DELETE or DDL.
--
-- daily_records carries THREE bird-out columns:
--   transfer_female  - birds moved (rearing -> laying), NOT a death
--   cull_female      - birds culled out
--   trcull_female    - the OLD combined column, split by migration 060 and
--                      still written as transfer + cull
-- Flock Lifetime reads trcull_female; the flock page's vs Standard tab reads
-- cull_female. How far apart are they on real data, and does trcull still
-- equal transfer + cull?

SELECT string_agg(line, '  ||  ' ORDER BY flock_no) AS cull_columns
FROM (
  SELECT f.flock_no,
         'F-' || f.flock_no
           || ' mort=' || COALESCE(SUM(d.mortality_female), 0)
           || ' cull=' || COALESCE(SUM(d.cull_female), 0)
           || ' transfer=' || COALESCE(SUM(d.transfer_female), 0)
           || ' trcull=' || COALESCE(SUM(d.trcull_female), 0)
           || ' trcullMinusSum=' || (COALESCE(SUM(d.trcull_female), 0)
                - COALESCE(SUM(d.transfer_female), 0) - COALESCE(SUM(d.cull_female), 0))
           AS line
    FROM public.flocks f JOIN public.daily_records d ON d.flock_id = f.id
   GROUP BY f.flock_no
) s;

-- How many rows disagree individually, not just in total.
SELECT 'rows where trcull <> transfer + cull: '
    || COUNT(*) FILTER (WHERE COALESCE(trcull_female,0)
         <> COALESCE(transfer_female,0) + COALESCE(cull_female,0))
    || ' of ' || COUNT(*)
    || ' | rows with a transfer: ' || COUNT(*) FILTER (WHERE COALESCE(transfer_female,0) > 0)
    || ' | rows with a cull: ' || COUNT(*) FILTER (WHERE COALESCE(cull_female,0) > 0)
    AS row_level
  FROM public.daily_records;
