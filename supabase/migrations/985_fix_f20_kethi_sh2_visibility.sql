-- Migration 985: Flock 20 has 90 real daily_records rows at Kethireddypally
-- shed 2 (2025-09-28 to 2025-12-26) but no flock_sheds/shed_allocations/
-- flock_transfers row -- the three tables Bulk Daily Entry actually reads --
-- so the shed never appears in the entry grid even though the data exists.
-- Adds the missing link row only; touches no daily_records data.
INSERT INTO public.flock_sheds (flock_id, shed_id)
SELECT fl.id, s.id
FROM public.flocks fl, public.sheds s, public.farms fm
WHERE fl.flock_no::text = '20' AND fm.name = 'Kethireddypally' AND s.shed_no = '2' AND s.farm_id = fm.id
  AND NOT EXISTS (
    SELECT 1 FROM public.flock_sheds fs2 WHERE fs2.flock_id = fl.id AND fs2.shed_id = s.id
  );

SELECT 'f20_kethi_sh2_linked' AS chk, count(*)::int AS rows
FROM public.flock_sheds fs
JOIN public.flocks fl ON fl.id = fs.flock_id
JOIN public.sheds s ON s.id = fs.shed_id
JOIN public.farms fm ON fm.id = s.farm_id
WHERE fl.flock_no::text = '20' AND fm.name = 'Kethireddypally' AND s.shed_no = '2';
