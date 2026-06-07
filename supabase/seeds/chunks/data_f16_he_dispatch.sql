-- Flock 16 HE Dispatch records
INSERT INTO public.he_dispatch (
  flock_id, dispatch_date, dc_no, party_id,
  grade_a, grade_b, total_dispatched
) VALUES
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-04-01', NULL, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Private Limited') LIMIT 1),
    0, 0, 0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-05-19', 2651, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Mallesh Eggs') LIMIT 1),
    0, 6300, 6300
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-05-20', 2652, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Private Limited') LIMIT 1),
    20160, 0, 20160
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-05-23', 2653, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    0, 6300, 6300
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-05-23', 2654, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Prasanta Rao - Eggs') LIMIT 1),
    0, 20160, 20160
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-05-27', 2655, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Private Limited') LIMIT 1),
    30240, 0, 30240
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-05-29', 2656, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Private Limited') LIMIT 1),
    30240, 0, 30240
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-05-31', 2657, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    0, 16800, 16800
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-06-03', 2658, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Private Limited') LIMIT 1),
    80640, 0, 80640
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-06-04', 2659, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    0, 18060, 18060
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-06-07', 2660, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Private Limited') LIMIT 1),
    60480, 0, 60480
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-06-07', 2661, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Kavali Vijay Kumar') LIMIT 1),
    0, 10080, 10080
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-06-07', 2662, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Kavali Vijay Kumar') LIMIT 1),
    0, 10080, 10080
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-06-10', 2663, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Private Limited') LIMIT 1),
    66990, 0, 66990
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-06-14', 2664, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    0, 18060, 18060
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-06-14', 2665, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Kavali Vijay Kumar') LIMIT 1),
    0, 10080, 10080
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-06-16', 2666, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Private Limited') LIMIT 1),
    130431, 0, 130431
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-06-19', 2667, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Private Limited') LIMIT 1),
    90720, 0, 90720
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-06-20', 2668, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    0, 18060, 18060
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-06-24', 2669, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Private Limited') LIMIT 1),
    110880, 0, 110880
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-06-25', 2670, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    0, 18060, 18060
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-06-26', 2671, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Private Limited') LIMIT 1),
    90720, 0, 90720
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-06-26', 2672, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('MD Shadulla') LIMIT 1),
    0, 30240, 30240
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-06-27', 2673, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('MB Enterprises') LIMIT 1),
    0, 10080, 10080
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-07-01', 2674, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Private Limited') LIMIT 1),
    131040, 0, 131040
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-07-01', 2675, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Prasanta Rao - Eggs') LIMIT 1),
    0, 18060, 18060
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-07-03', 2676, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Private Limited') LIMIT 1),
    30240, 0, 30240
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-07-03', 2677, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Jamal Agro Industries PVt LTD') LIMIT 1),
    0, 30240, 30240
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-07-03', 2678, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Private Limited') LIMIT 1),
    110880, 0, 110880
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-07-09', 2679, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Private Limited') LIMIT 1),
    131040, 0, 131040
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-07-13', 2680, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Private Limited') LIMIT 1),
    100800, 0, 100800
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-07-16', 2681, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Private Limited') LIMIT 1),
    90720, 0, 90720
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-07-20', 2682, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Private Limited') LIMIT 1),
    120960, 0, 120960
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-07-23', 2683, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Private Limited') LIMIT 1),
    90720, 0, 90720
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-07-26', 2684, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Private Limited') LIMIT 1),
    80640, 0, 80640
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-07-28', 2685, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Private Limited') LIMIT 1),
    40320, 0, 40320
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-07-30', 2686, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Private Limited') LIMIT 1),
    60480, 0, 60480
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-08-01', 2687, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Private Limited') LIMIT 1),
    131040, 0, 131040
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-08-06', 2688, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Private Limited') LIMIT 1),
    100800, 0, 100800
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-08-10', 2689, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Private Limited') LIMIT 1),
    131040, 0, 131040
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-08-15', 2690, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Private Limited') LIMIT 1),
    131040, 0, 131040
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-08-17', 2691, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Private Limited') LIMIT 1),
    60480, 0, 60480
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-08-20', 2692, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Private Limited') LIMIT 1),
    80640, 0, 80640
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-08-23', 2693, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Private Limited') LIMIT 1),
    100800, 0, 100800
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-08-26', 2694, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Private Limited') LIMIT 1),
    80640, 0, 80640
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-08-29', 2695, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Private Limited') LIMIT 1),
    90720, 0, 90720
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-09-01', 2696, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Private Limited') LIMIT 1),
    70560, 0, 70560
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-09-04', 2697, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Private Limited') LIMIT 1),
    110880, 0, 110880
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-09-08', 2698, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Private Limited') LIMIT 1),
    90720, 0, 90720
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-09-11', 2699, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Private Limited') LIMIT 1),
    80640, 0, 80640
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-09-15', 2700, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Private Limited') LIMIT 1),
    110880, 0, 110880
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-09-20', 3001, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Private Limited') LIMIT 1),
    131040, 0, 131040
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-09-22', 3002, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Private Limited') LIMIT 1),
    60480, 0, 60480
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-09-26', 3003, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Private Limited') LIMIT 1),
    80640, 0, 80640
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-09-28', 3004, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Private Limited') LIMIT 1),
    50400, 0, 50400
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-10-01', 3005, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Private Limited') LIMIT 1),
    110880, 0, 110880
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-10-04', 3006, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Private Limited') LIMIT 1),
    80640, 0, 80640
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-10-07', 3007, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Private Limited') LIMIT 1),
    70560, 0, 70560
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-10-10', 3008, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Private Limited') LIMIT 1),
    70560, 0, 70560
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-10-13', 3009, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Private Limited') LIMIT 1),
    80640, 0, 80640
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-10-15', 3010, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Private Limited') LIMIT 1),
    50400, 0, 50400
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-10-19', 3011, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Private Limited') LIMIT 1),
    110880, 0, 110880
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-10-19', 3012, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Private Limited') LIMIT 1),
    20160, 0, 20160
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-10-24', 3013, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Private Limited') LIMIT 1),
    70560, 0, 70560
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-10-26', 3014, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Private Limited') LIMIT 1),
    60480, 0, 60480
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-10-28', 3015, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Private Limited') LIMIT 1),
    60480, 0, 60480
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-10-30', 3016, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Private Limited') LIMIT 1),
    50400, 0, 50400
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-11-03', 3018, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Cancelled') LIMIT 1),
    0, 0, 0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-11-03', 3017, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Private Limited') LIMIT 1),
    50400, 0, 50400
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-11-04', 3019, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Private Limited') LIMIT 1),
    70560, 0, 70560
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-11-07', 3020, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Private Limited') LIMIT 1),
    50400, 0, 50400
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-11-08', 3021, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Private Limited') LIMIT 1),
    40320, 0, 40320
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-11-11', 3022, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Private Limited') LIMIT 1),
    60480, 0, 60480
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-11-13', 3023, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Private Limited') LIMIT 1),
    40320, 0, 40320
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-11-16', 3024, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Private Limited') LIMIT 1),
    60480, 0, 60480
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-11-17', 3025, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Private Limited') LIMIT 1),
    40320, 0, 40320
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-11-21', 3026, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Private Limited') LIMIT 1),
    60480, 0, 60480
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-11-24', 3027, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Private Limited') LIMIT 1),
    60480, 0, 60480
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-11-25', 3028, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Private Limited') LIMIT 1),
    60480, 0, 60480
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-11-28', 3029, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Private Limited') LIMIT 1),
    60480, 0, 60480
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-11-30', 3030, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Private Limited') LIMIT 1),
    50400, 0, 50400
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-12-02', 3031, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Private Limited') LIMIT 1),
    40320, 0, 40320
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-12-04', 3032, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Private Limited') LIMIT 1),
    50400, 0, 50400
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-12-08', 3033, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Private Limited') LIMIT 1),
    60480, 0, 60480
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-12-09', 3034, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Private Limited') LIMIT 1),
    40320, 0, 40320
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-12-11', 3035, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Private Limited') LIMIT 1),
    40320, 0, 40320
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-12-14', 3036, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Private Limited') LIMIT 1),
    60480, 0, 60480
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-12-16', 3037, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Private Limited') LIMIT 1),
    40320, 0, 40320
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-12-19', 3038, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Private Limited') LIMIT 1),
    50400, 0, 50400
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-12-21', 3039, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Private Limited') LIMIT 1),
    40320, 0, 40320
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-12-23', 3040, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Private Limited') LIMIT 1),
    40320, 0, 40320
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-12-26', 3041, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Private Limited') LIMIT 1),
    40320, 0, 40320
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-12-29', 3042, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Private Limited') LIMIT 1),
    60480, 0, 60480
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2024-12-30', 3093, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    46620, 0, 46620
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2025-01-03', 3093, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hatchman Enterprises') LIMIT 1),
    40320, 0, 40320
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2025-01-04', 3094, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Chickman Enterprises Haryana') LIMIT 1),
    40320, 0, 40320
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2025-01-06', 3095, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Chickman Enterprises Haryana') LIMIT 1),
    20160, 0, 20160
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2025-01-08', 3096, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Chickman Enterprises Haryana') LIMIT 1),
    10080, 0, 10080
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2025-01-10', 3097, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Chickman Enterprises Haryana') LIMIT 1),
    50400, 0, 50400
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2025-01-12', 3043, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    40320, 0, 40320
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2025-01-14', 3044, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    30240, 0, 30240
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2025-01-17', 3100, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Chickman Enterprises Haryana') LIMIT 1),
    50400, 0, 50400
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2025-01-18', 3045, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    10080, 0, 10080
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2025-01-21', 3046, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    50400, 0, 50400
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2025-01-25', 3047, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    80640, 0, 80640
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2025-01-29', 3048, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    50400, 0, 50400
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2025-02-01', 3049, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    40320, 0, 40320
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2025-02-03', 3050, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    40320, 0, 40320
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2025-02-06', 3401, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    50400, 0, 50400
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2025-02-08', 3402, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    40320, 0, 40320
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2025-02-11', 3403, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    30240, 0, 30240
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2025-02-13', 3404, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    50400, 0, 50400
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2025-02-17', 3405, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    30240, 0, 30240
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2025-02-19', 3406, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    40320, 0, 40320
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2025-02-21', 3407, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    30240, 0, 30240
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2025-02-24', 3408, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    40320, 0, 40320
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2025-02-27', 3409, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    40320, 0, 40320
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2025-03-01', 3410, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    40320, 0, 40320
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2025-03-04', 3411, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    40320, 0, 40320
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2025-03-06', 3412, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    30240, 0, 30240
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2025-03-09', 3413, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    30240, 0, 30240
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2025-03-12', 3414, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    30240, 0, 30240
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2025-03-16', 3415, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    50400, 0, 50400
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2025-03-18', 3416, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    50400, 0, 50400
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2025-03-20', 3417, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    30240, 0, 30240
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2025-03-23', 3418, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    30240, 0, 30240
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2025-03-26', 3419, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    40320, 0, 40320
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2025-03-29', 3421, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    50400, 0, 50400
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2025-04-01', 3422, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    40320, 0, 40320
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2025-04-03', 3423, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    20160, 0, 20160
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2025-04-05', 3424, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    40320, 0, 40320
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2025-04-09', 3425, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    30240, 0, 30240
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2025-04-12', 3426, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    40320, 0, 40320
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2025-04-16', 3427, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    10080, 0, 10080
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2025-04-22', 3428, (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    8670, 0, 8670
  )
ON CONFLICT DO NOTHING;
