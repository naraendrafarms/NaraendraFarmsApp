-- Migration 725: put Flock 23's 17/08/2026 transfers into the shed
-- allocations, so the sheds the birds actually occupy are on record.
--
-- Scope is deliberately Flock 23 ONLY. Flocks 20 and 22 also have transfer
-- destinations with no allocation (7 and 10 sheds), but they already carry 700
-- and 484 daily records on those sheds — their history lives in daily_records
-- and writing placement rows for them now would change the "current birds"
-- figure those screens read from the latest allocation. Flock 23 has 3 daily
-- rows and is the flock being entered today.

SELECT 'before' AS chk, s.shed_no, a.allocated_date, a.female_count, a.male_count
FROM public.shed_allocations a JOIN public.sheds s ON s.id = a.shed_id
WHERE a.flock_id = (SELECT id FROM public.flocks WHERE flock_no::text = '23')
ORDER BY s.shed_no, a.allocated_date;

-- Destination sheds: one row per shed, carrying everything moved into it.
INSERT INTO public.shed_allocations (flock_id, shed_id, farm_id, allocated_date, female_count, male_count, notes)
SELECT t.flock_id, t.to_shed_id, t.to_farm_id, max(t.transfer_date),
       COALESCE(sum(t.female_count), 0), COALESCE(sum(t.male_count), 0),
       'Backfilled from the shed transfers of 17/08/2026'
FROM public.flock_transfers t
WHERE t.flock_id = (SELECT id FROM public.flocks WHERE flock_no::text = '23')
  AND t.to_shed_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.shed_allocations a
                  WHERE a.flock_id = t.flock_id AND a.shed_id = t.to_shed_id)
GROUP BY t.flock_id, t.to_shed_id, t.to_farm_id;

-- Source shed: take the same birds off its latest allocation, never below zero.
UPDATE public.shed_allocations a
SET female_count = GREATEST(0, a.female_count - x.f),
    male_count   = GREATEST(0, a.male_count - x.m),
    notes = COALESCE(a.notes || ' | ', '') || 'Reduced by the shed transfers of 17/08/2026'
FROM (
  SELECT t.from_shed_id AS shed_id,
         COALESCE(sum(t.female_count), 0) AS f, COALESCE(sum(t.male_count), 0) AS m
  FROM public.flock_transfers t
  WHERE t.flock_id = (SELECT id FROM public.flocks WHERE flock_no::text = '23')
    AND t.from_shed_id IS NOT NULL
  GROUP BY t.from_shed_id
) x
WHERE a.flock_id = (SELECT id FROM public.flocks WHERE flock_no::text = '23')
  AND a.shed_id = x.shed_id
  AND a.id = (SELECT a2.id FROM public.shed_allocations a2
              WHERE a2.flock_id = a.flock_id AND a2.shed_id = a.shed_id
              ORDER BY a2.allocated_date DESC LIMIT 1);

SELECT 'after' AS chk, s.shed_no, a.allocated_date, a.female_count, a.male_count, LEFT(COALESCE(a.notes,''), 40) AS notes
FROM public.shed_allocations a JOIN public.sheds s ON s.id = a.shed_id
WHERE a.flock_id = (SELECT id FROM public.flocks WHERE flock_no::text = '23')
ORDER BY s.shed_no, a.allocated_date;
