-- Add the 06/08/2026 chick receipts to flock 23's daily records.
--
-- The chicks arrived over two days but the daily opening only ever carried
-- forward the 5th's closing, so the 6th's receipts were never in the counts:
--   placements  05/08  shed 10  22,538 F / 3,964 M   shed 11   2,208 F
--               06/08  shed 10   1,208 F /   462 M   shed 11  10,931 F
--   daily 06/08 shed 10 opened 22,529 / 3,961        shed 11   2,205
--
-- Target = previous day's closing + that day's receipt:
--   shed 10  F 22,529 + 1,208 = 23,737   M 3,961 + 462 = 4,423
--   shed 11  F  2,205 + 10,931 = 13,136  M 0
--
-- Closing is recomputed as opening - mortality. Verified there are no
-- transfers or culls on either row: today's closing equals opening minus
-- mortality exactly (22,529-16=22,513 and 2,205-5=2,200), so nothing else is
-- being silently dropped by this formula.
--
-- Targeted on flock + date + shed + the exact current opening, so it cannot
-- touch another row and cannot double-apply if run twice.

UPDATE public.daily_records d
SET opening_female = 23737,
    opening_male   = 4423,
    closing_female = 23737 - COALESCE(d.mortality_female,0)
                     - COALESCE(d.trcull_female,0) - COALESCE(d.cull_female,0) - COALESCE(d.transfer_female,0),
    closing_male   = 4423  - COALESCE(d.mortality_male,0)
                     - COALESCE(d.trcull_male,0) - COALESCE(d.cull_male,0) - COALESCE(d.transfer_male,0)
FROM public.flocks f, public.sheds s
WHERE f.id = d.flock_id AND s.id = d.shed_id
  AND f.flock_no = '23' AND s.shed_no = '10'
  AND d.record_date = '2026-08-06'
  AND d.opening_female = 22529;

UPDATE public.daily_records d
SET opening_female = 13136,
    closing_female = 13136 - COALESCE(d.mortality_female,0)
                     - COALESCE(d.trcull_female,0) - COALESCE(d.cull_female,0) - COALESCE(d.transfer_female,0)
FROM public.flocks f, public.sheds s
WHERE f.id = d.flock_id AND s.id = d.shed_id
  AND f.flock_no = '23' AND s.shed_no = '11'
  AND d.record_date = '2026-08-06'
  AND d.opening_female = 2205;

-- ── Verification ────────────────────────────────────────────────────────────
SELECT COALESCE(string_agg(
         d.record_date::text || ' shed=' || COALESCE(s.shed_no,'(flock)') ||
         ' openF=' || COALESCE(d.opening_female::text,'-') ||
         ' openM=' || COALESCE(d.opening_male::text,'-') ||
         ' mortF=' || COALESCE(d.mortality_female,0) ||
         ' closeF=' || COALESCE(d.closing_female::text,'-') ||
         ' closeM=' || COALESCE(d.closing_male::text,'-'),
         ' | ' ORDER BY d.record_date, s.shed_no), 'NO ROWS') AS flock23_after
FROM public.daily_records d
LEFT JOIN public.sheds s ON s.id = d.shed_id
JOIN public.flocks f ON f.id = d.flock_id
WHERE f.flock_no = '23';

-- Bird count the app will now show, against what was placed.
SELECT (SELECT COALESCE(current_female,0) FROM public.v_flock_summary WHERE flock_no='23') AS current_female,
       (SELECT COALESCE(current_male,0)   FROM public.v_flock_summary WHERE flock_no='23') AS current_male,
       (SELECT total_placed_f FROM public.flocks WHERE flock_no='23') AS placed_female,
       (SELECT total_placed_m FROM public.flocks WHERE flock_no='23') AS placed_male;

-- Placements, so the daily figures can be reconciled against them.
SELECT COALESCE(string_agg(
         sa.allocated_date::text || ' shed=' || COALESCE(s.shed_no,'-') ||
         ' f=' || sa.female_count || ' m=' || sa.male_count,
         ' | ' ORDER BY sa.allocated_date, s.shed_no), 'NONE') AS placements
FROM public.shed_allocations sa
LEFT JOIN public.sheds s ON s.id = sa.shed_id
JOIN public.flocks f ON f.id = sa.flock_id
WHERE f.flock_no = '23';
