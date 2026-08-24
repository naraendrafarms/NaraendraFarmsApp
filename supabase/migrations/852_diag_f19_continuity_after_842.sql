-- Migration 852 (READ ONLY): true scope of the damage from migration 842's
-- trigger-driven double-credit -- continuity breaks (opening != previous
-- day's closing) across Flock 19's WHOLE history, which the earlier
-- formula-only check (850) could not reveal.
WITH chained AS (
  SELECT d.id, d.shed_id, d.record_date, d.opening_female,
         LAG(d.closing_female) OVER (PARTITION BY d.shed_id ORDER BY d.record_date, d.id) AS prev_close
    FROM public.daily_records d
    JOIN public.flocks f ON f.id = d.flock_id
   WHERE f.flock_no::text = '19'
)
SELECT 'f19_continuity_breaks_now' AS chk, COUNT(*)::int AS n
  FROM chained WHERE prev_close IS NOT NULL AND opening_female <> prev_close;

-- Per affected shed: first break date and how many rows after it (i.e. the
-- true blast radius per shed).
WITH chained AS (
  SELECT d.id, d.shed_id, d.record_date, d.opening_female, d.closing_female,
         LAG(d.closing_female) OVER (PARTITION BY d.shed_id ORDER BY d.record_date, d.id) AS prev_close
    FROM public.daily_records d
    JOIN public.flocks f ON f.id = d.flock_id
   WHERE f.flock_no::text = '19'
),
breaks AS (
  SELECT shed_id, MIN(record_date) AS first_break
    FROM chained WHERE prev_close IS NOT NULL AND opening_female <> prev_close
   GROUP BY shed_id
)
SELECT 'f19_break_scope_by_shed' AS chk,
       string_agg(t, ' | ' ORDER BY t) AS rows
  FROM (
    SELECT (s.shed_no || ' first_break=' || b.first_break::text
            || ' rows_after=' || (SELECT count(*) FROM public.daily_records d2
                                    JOIN public.flocks f2 ON f2.id = d2.flock_id
                                   WHERE f2.flock_no::text='19' AND d2.shed_id = b.shed_id
                                     AND d2.record_date >= b.first_break)) AS t
      FROM breaks b JOIN public.sheds s ON s.id = b.shed_id
  ) x;
