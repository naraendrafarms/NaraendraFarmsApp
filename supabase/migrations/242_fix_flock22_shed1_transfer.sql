-- Fix flock 22, Shed 1: the addTransferMut bug wrote the 6909-bird "transfer
-- OUT" deduction (meant for the source shed, Shed 10) onto the destination
-- shed's (Shed 1) own row instead, canceling its transfer_in credit. Undo just
-- that wrong deduction on Shed 1's 2026-06-29 row (the real transfer date).
-- trg_chain_cascade (migration 223) then auto-propagates the corrected closing
-- into 30.06 opening, and onward into every later day that already has a row.
UPDATE public.daily_records dr
SET transfer_female = GREATEST(0, dr.transfer_female - 6909)
FROM public.flocks f, public.sheds s
WHERE dr.flock_id = f.id AND dr.shed_id = s.id
  AND f.flock_no = '22' AND s.shed_no = '1' AND dr.record_date = '2026-06-29';

-- Diagnostic: confirm the fix and the cascade into 30.06 / 01.07
SELECT dr.record_date, dr.opening_female, dr.transfer_in_female, dr.transfer_female, dr.closing_female
FROM public.daily_records dr
JOIN public.flocks f ON f.id = dr.flock_id
LEFT JOIN public.sheds s ON s.id = dr.shed_id
WHERE f.flock_no = '22' AND s.shed_no = '1' AND dr.record_date BETWEEN '2026-06-29' AND '2026-07-01'
ORDER BY dr.record_date;
