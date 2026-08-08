-- Record flock 23's 06/08/2026 chick receipts as transfer_in, not opening.
--
-- Why opening cannot be used: trg_chain_daily_opening is a BEFORE INSERT OR
-- UPDATE trigger that does
--     IF a previous day exists THEN NEW.opening_female := prev.closing_female
-- so any opening written for 06/08 is silently replaced by the 5th's closing.
-- That is why the entry never saved from the app, and why migration 601
-- reported "Errors: 0" while changing nothing.
--
-- The same trigger already computes
--     closing = opening + transfer_in - mortality - cull - transfer_out
-- so transfer_in is the field built for birds arriving on a day. Writing there
-- works WITH the chain instead of against it, and trg_chain_cascade then
-- carries the new closing forward to every later day automatically.
--
-- Placements being reconciled to:
--   06/08 shed 10  1,208 F / 462 M      06/08 shed 11  10,931 F
-- Expected closings: shed 10  22,529 + 1,208 - 16 mort = 23,721 F
--                              3,961 +   462 -  4 mort =  4,419 M
--                    shed 11   2,205 + 10,931 - 5 mort = 13,131 F
--
-- Targeted on flock, date, shed and the current transfer_in being 0, so it
-- cannot double-apply if run again.

UPDATE public.daily_records d
SET transfer_in_female = 1208,
    transfer_in_male   = 462
FROM public.flocks f, public.sheds s
WHERE f.id = d.flock_id AND s.id = d.shed_id
  AND f.flock_no = '23' AND s.shed_no = '10'
  AND d.record_date = '2026-08-06'
  AND COALESCE(d.transfer_in_female,0) = 0;

UPDATE public.daily_records d
SET transfer_in_female = 10931
FROM public.flocks f, public.sheds s
WHERE f.id = d.flock_id AND s.id = d.shed_id
  AND f.flock_no = '23' AND s.shed_no = '11'
  AND d.record_date = '2026-08-06'
  AND COALESCE(d.transfer_in_female,0) = 0;

-- ── Verification ────────────────────────────────────────────────────────────
SELECT COALESCE(string_agg(
         d.record_date::text || ' shed=' || COALESCE(s.shed_no,'(flock)') ||
         ' openF=' || COALESCE(d.opening_female::text,'-') ||
         ' inF=' || COALESCE(d.transfer_in_female,0) ||
         ' inM=' || COALESCE(d.transfer_in_male,0) ||
         ' mortF=' || COALESCE(d.mortality_female,0) ||
         ' closeF=' || COALESCE(d.closing_female::text,'-') ||
         ' closeM=' || COALESCE(d.closing_male::text,'-'),
         ' | ' ORDER BY d.record_date, s.shed_no), 'NO ROWS') AS flock23_after
FROM public.daily_records d
LEFT JOIN public.sheds s ON s.id = d.shed_id
JOIN public.flocks f ON f.id = d.flock_id
WHERE f.flock_no = '23';

SELECT (SELECT COALESCE(current_female,0) FROM public.v_flock_summary WHERE flock_no='23') AS current_female,
       (SELECT COALESCE(current_male,0)   FROM public.v_flock_summary WHERE flock_no='23') AS current_male,
       (SELECT total_placed_f FROM public.flocks WHERE flock_no='23') AS placed_female,
       (SELECT total_placed_m FROM public.flocks WHERE flock_no='23') AS placed_male;
