-- Migration 726: correct what 725 got wrong on Flock 23's shed 10.
--
-- 725 took the transferred birds off the LATEST allocation row only. Shed 10
-- was allocated twice — 22,538 females on 05/08 and 1,208 on 06/08, 23,746 in
-- all — and 17,327 females were transferred out on 17/08. Subtracting from the
-- 06/08 row alone floored it at 0 and left the 05/08 row untouched, so shed 10
-- still claimed 22,538 birds in a shed that has been all but emptied. Shed 11
-- was fine by luck: its newest row held more than the 4,495 that left it.
--
-- The reduction now works back through the rows. The 06/08 row is already at
-- zero, so the remainder comes off the 05/08 row: 23,746 - 17,327 = 6,419.
-- 23,746 is the pre-725 total, read from that migration's own "before" output.

UPDATE public.shed_allocations a
SET female_count = GREATEST(0, 23746 - (
      SELECT COALESCE(sum(t.female_count), 0) FROM public.flock_transfers t
      WHERE t.flock_id = a.flock_id AND t.from_shed_id = a.shed_id)),
    notes = 'Reduced by the shed transfers of 17/08/2026 (corrected)'
WHERE a.flock_id = (SELECT id FROM public.flocks WHERE flock_no::text = '23')
  AND a.shed_id = (SELECT s.id FROM public.sheds s
                   JOIN public.farms f ON f.id = s.farm_id
                   WHERE s.shed_no = '10' AND f.name = 'Kethireddypally')
  AND a.allocated_date = DATE '2026-08-05';

-- Shed totals against what the transfers say they should be. moved_out and
-- moved_in are computed from flock_transfers, so this is a real check, not a
-- restatement of the numbers above.
SELECT 'check' AS chk, s.shed_no,
       sum(a.female_count)::int AS allocated_female,
       (SELECT COALESCE(sum(t.female_count),0)::int FROM public.flock_transfers t
        WHERE t.flock_id = a.flock_id AND t.from_shed_id = a.shed_id) AS moved_out,
       (SELECT COALESCE(sum(t.female_count),0)::int FROM public.flock_transfers t
        WHERE t.flock_id = a.flock_id AND t.to_shed_id = a.shed_id) AS moved_in
FROM public.shed_allocations a JOIN public.sheds s ON s.id = a.shed_id
WHERE a.flock_id = (SELECT id FROM public.flocks WHERE flock_no::text = '23')
GROUP BY s.shed_no, a.flock_id, a.shed_id ORDER BY s.shed_no;

SELECT 'flock_total' AS chk, sum(a.female_count)::int AS allocated_female,
       sum(a.male_count)::int AS allocated_male
FROM public.shed_allocations a
WHERE a.flock_id = (SELECT id FROM public.flocks WHERE flock_no::text = '23');
