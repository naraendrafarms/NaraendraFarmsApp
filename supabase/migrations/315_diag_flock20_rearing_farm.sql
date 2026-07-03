-- 314 showed Flock 20's laying_farm_id = "Bodjanampet - 1" (BPET1), NOT the
-- VHL site "Bodjanampet - 2 (VHL)" (BPET2, id a7883f96...) — but the user
-- says Flock 20 IS a VHL flock. Check rearing_farm_id too (flocks may
-- track rearing vs laying farm separately), and also check flock_transfers
-- in case Flock 20 moved between sites.
SELECT flock_no, rearing_farm_id, laying_farm_id FROM public.flocks WHERE flock_no = '20';

SELECT rf.name AS rearing_farm_name, lf.name AS laying_farm_name
FROM public.flocks f
LEFT JOIN public.farms rf ON rf.id = f.rearing_farm_id
LEFT JOIN public.farms lf ON lf.id = f.laying_farm_id
WHERE f.flock_no = '20';
