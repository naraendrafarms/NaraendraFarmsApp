-- CORRECTION from user: Flock 21 is the VHL flock, not Flock 20.
-- Re-check rearing_farm_id / laying_farm_id against the confirmed VHL farm
-- "Bodjanampet - 2 (VHL)" (id a7883f96-fc7b-4e9b-80fd-25d45e9b1799).
SELECT f.flock_no, f.rearing_farm_id, f.laying_farm_id,
       rf.name AS rearing_farm_name, lf.name AS laying_farm_name
FROM public.flocks f
LEFT JOIN public.farms rf ON rf.id = f.rearing_farm_id
LEFT JOIN public.farms lf ON lf.id = f.laying_farm_id
WHERE f.flock_no = '21';

-- Also check whether Flock 21 has any he_dispatch rows with packaging data
SELECT dc_no, boxes_20lb, boxes_23lb, extra_trays_20lb, extra_trays_23lb
FROM public.he_dispatch d
JOIN public.flocks f ON f.id = d.flock_id
WHERE f.flock_no = '21'
ORDER BY d.dispatch_date;
