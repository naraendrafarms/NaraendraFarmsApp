-- Flock 16 Daily Records chunk 1/3
INSERT INTO public.daily_records (
  flock_id, farm_id, record_date, age_weeks,
  opening_female, opening_male,
  feed_female_kg, feed_male_kg,
  total_eggs, he_eggs,
  mortality_female, mortality_male,
  closing_female, closing_male
) VALUES
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2023-11-23', 0.0,
    0, 0,
    751.4, 119.8,
    0, 0,
    43, 10,
    25045, 3958
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2023-11-24', 0.1,
    25045, 3958,
    1370, 190.8,
    0, 0,
    42, 15,
    45675, 5466
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2023-11-25', 0.3,
    45675, 5466,
    1599.5, 191.4,
    0, 0,
    39, 7,
    45636, 5459
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2023-11-26', 0.4,
    45636, 5459,
    1599.5, 191.2,
    0, 0,
    36, 5,
    45600, 5454
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2023-11-27', 0.6,
    45600, 5454,
    1599.6, 191,
    0, 0,
    26, 4,
    45574, 5450
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2023-11-28', 0.7,
    45574, 5450,
    1600.1, 191.3,
    0, 0,
    32, 9,
    45542, 5441
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2023-11-29', 0.9,
    45542, 5441,
    1599.9, 191,
    0, 0,
    27, 5,
    45515, 5436
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2023-11-30', 1.0,
    NULL, NULL,
    11719.9, 1457.7,
    NULL, NULL,
    263, 59,
    NULL, NULL
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2023-12-01', 1.1,
    45497, 5432,
    1599.7, 191,
    0, 0,
    16, 2,
    45481, 5430
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2023-12-02', 1.3,
    45481, 5430,
    1599.6, 191,
    0, 0,
    14, 3,
    45467, 5427
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2023-12-03', 1.4,
    45467, 5427,
    1599.5, 190.9,
    0, 0,
    14, 2,
    45453, 5425
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2023-12-04', 1.6,
    45453, 5425,
    1599.9, 191,
    0, 0,
    12, 3,
    45441, 5422
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2023-12-05', 1.7,
    45441, 5422,
    1599.5, 190.9,
    0, 0,
    9, 4,
    45432, 5418
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2023-12-06', 1.9,
    45432, 5418,
    1726.4, 204.8,
    0, 0,
    12, 2,
    45420, 5416
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2023-12-07', 2.0,
    45420, 5416,
    1819.5, 220.4,
    0, 0,
    13, 3,
    45407, 5413
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2023-12-08', 2.1,
    45407, 5413,
    1760, 270,
    0, 0,
    14, 4,
    45393, 5409
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2023-12-09', 2.3,
    45393, 5409,
    1760, 270,
    0, 0,
    16, 3,
    45377, 5406
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2023-12-10', 2.4,
    45377, 5406,
    1760, 300,
    0, 0,
    9, 4,
    45368, 5402
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2023-12-11', 2.6,
    45368, 5402,
    1760, 300,
    0, 0,
    8, 3,
    45360, 5399
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2023-12-12', 2.7,
    45360, 5399,
    1760, 300,
    0, 0,
    10, 5,
    45350, 5394
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2023-12-13', 2.9,
    45350, 5394,
    1760, 330,
    0, 0,
    9, 6,
    45341, 5388
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2023-12-14', 3.0,
    45341, 5388,
    1760, 330,
    0, 0,
    8, 5,
    45333, 5383
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2023-12-15', 3.1,
    45333, 5383,
    1633, 205,
    0, 0,
    8, 4,
    45325, 5379
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2023-12-16', 3.3,
    45325, 5379,
    1633, 205,
    0, 0,
    9, 3,
    45316, 5376
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2023-12-17', 3.4,
    45316, 5376,
    1633, 205,
    0, 0,
    6, 2,
    45310, 5374
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2023-12-18', 3.6,
    45310, 5374,
    1633, 205,
    0, 0,
    8, 1,
    45302, 5373
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2023-12-19', 3.7,
    45302, 5373,
    1633, 205,
    0, 0,
    6, 2,
    45296, 5371
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2023-12-20', 3.9,
    45296, 5371,
    1633, 205,
    0, 0,
    8, 2,
    45288, 5369
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2023-12-21', 4.0,
    45288, 5369,
    1633, 242,
    0, 0,
    5, 0,
    45283, 5369
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2023-12-22', 4.1,
    45283, 5369,
    1813, 247,
    0, 0,
    8, 1,
    45275, 5368
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2023-12-23', 4.3,
    45275, 5368,
    1813, 247,
    0, 0,
    8, 1,
    45267, 5367
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2023-12-24', 4.4,
    45267, 5367,
    1813, 247,
    0, 0,
    6, 0,
    45261, 5367
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2023-12-25', 4.6,
    45261, 5367,
    1813, 247,
    0, 0,
    7, 1,
    45254, 5366
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2023-12-26', 4.7,
    45254, 5366,
    1813, 269,
    0, 0,
    5, 0,
    45249, 5366
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2023-12-27', 4.9,
    45249, 5366,
    1813, 269,
    0, 0,
    6, 0,
    45243, 5366
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2023-12-28', 5.0,
    45243, 5366,
    1813, 269,
    0, 0,
    9, 0,
    45234, 5366
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2023-12-29', 5.1,
    45234, 5366,
    2082, 312,
    0, 0,
    10, 1,
    45224, 5365
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2023-12-30', 5.3,
    45224, 5365,
    2082, 312,
    0, 0,
    7, 0,
    45217, 5365
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2023-12-31', 5.4,
    45217, 5365,
    2082, 339,
    0, 0,
    5, 1,
    45212, 5364
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-01-01', 5.6,
    45212, 5364,
    2082, 339,
    0, 0,
    7, 1,
    45205, 5363
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-01-02', 5.7,
    45205, 5363,
    2082, 339,
    0, 0,
    7, 0,
    45198, 5363
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-01-03', 5.9,
    45198, 5363,
    2082, 339,
    0, 0,
    6, 0,
    45192, 5363
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-01-04', 6.0,
    45192, 5363,
    2081, 339,
    0, 0,
    5, 1,
    45187, 5362
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-01-05', 6.1,
    45187, 5362,
    2262, 370,
    0, 0,
    9, 0,
    45178, 5362
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-01-06', 6.3,
    45178, 5362,
    2262, 370,
    0, 0,
    8, 0,
    45170, 5362
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-01-07', 6.4,
    45170, 5362,
    2262, 370,
    0, 0,
    7, 0,
    45163, 5362
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-01-08', 6.6,
    45163, 5362,
    2262, 370,
    0, 0,
    8, 0,
    45155, 5362
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-01-09', 6.7,
    45155, 5362,
    2262, 370,
    0, 0,
    6, 0,
    45149, 5362
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-01-10', 6.9,
    45149, 5362,
    2262, 370,
    0, 0,
    4, 1,
    45145, 5361
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-01-11', 7.0,
    45145, 5361,
    2262, 370,
    0, 0,
    3, 0,
    45142, 5361
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-01-12', 7.1,
    45142, 5361,
    2371, 401,
    0, 0,
    0, 0,
    45142, 5361
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-01-13', 7.3,
    45142, 5361,
    2371, 401,
    0, 0,
    2, 0,
    45140, 5361
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-01-14', 7.4,
    45140, 5361,
    2371, 401,
    0, 0,
    3, 0,
    45137, 5361
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-01-15', 7.6,
    45137, 5361,
    2371, 401,
    0, 0,
    3, 0,
    45134, 5361
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-01-16', 7.7,
    45134, 5361,
    2371, 401,
    0, 0,
    2, 0,
    45132, 5361
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-01-17', 7.9,
    45132, 5361,
    2371, 401,
    0, 0,
    1, 0,
    45131, 5361
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-01-18', 8.0,
    45131, 5361,
    2371, 401,
    0, 0,
    3, 0,
    45128, 5361
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-01-19', 8.1,
    45128, 5361,
    2455, 408,
    0, 0,
    2, 0,
    45126, 5361
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-01-20', 8.3,
    45126, 5361,
    2455, 408,
    0, 0,
    3, 0,
    45123, 5361
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-01-21', 8.4,
    45123, 5361,
    2455, 408,
    0, 0,
    4, 0,
    45119, 5361
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-01-22', 8.6,
    45119, 5361,
    2455, 408,
    0, 0,
    1, 1,
    45118, 5360
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-01-23', 8.7,
    45118, 5360,
    2455, 408,
    0, 0,
    2, 0,
    45116, 5360
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-01-24', 8.9,
    45116, 5360,
    2455, 408,
    0, 0,
    2, 0,
    45114, 5360
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-01-25', 9.0,
    45114, 5360,
    2455, 408,
    0, 0,
    2, 1,
    45112, 5359
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-01-26', 9.1,
    45112, 5359,
    2589, 431,
    0, 0,
    1, 0,
    45111, 5359
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-01-27', 9.3,
    45111, 5359,
    2589, 431,
    0, 0,
    2, 0,
    45109, 5359
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-01-28', 9.4,
    45109, 5359,
    2589, 431,
    0, 0,
    2, 0,
    45107, 5359
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-01-29', 9.6,
    45107, 5359,
    2589, 431,
    0, 0,
    1, 0,
    45106, 5359
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-01-30', 9.7,
    45106, 5359,
    2589, 431,
    0, 0,
    2, 0,
    45104, 5359
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-01-31', 9.9,
    45104, 5359,
    2589, 431,
    0, 0,
    2, 1,
    45102, 5358
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-02-01', 10.0,
    45102, 5358,
    2589, 431,
    0, 0,
    3, 1,
    45099, 5357
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-02-02', 10.1,
    45099, 5357,
    2725, 450,
    0, 0,
    3, 0,
    45096, 5357
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-02-03', 10.3,
    45096, 5357,
    2725, 450,
    0, 0,
    3, 1,
    45093, 5356
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-02-04', 10.4,
    45093, 5356,
    2725, 450,
    0, 0,
    1, 0,
    45092, 5356
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-02-05', 10.6,
    45092, 5356,
    2725, 450,
    0, 0,
    2, 0,
    45090, 5356
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-02-06', 10.7,
    45090, 5356,
    2725, 450,
    0, 0,
    2, 1,
    45088, 5355
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-02-07', 10.9,
    45088, 5355,
    2725, 450,
    0, 0,
    2, 0,
    45086, 5355
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-02-08', 11.0,
    45086, 5355,
    2725, 450,
    0, 0,
    0, 0,
    45086, 5355
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-02-09', 11.1,
    45086, 5355,
    2725, 450,
    0, 0,
    0, 0,
    45086, 5355
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-02-10', 11.3,
    45086, 5355,
    2725, 450,
    0, 0,
    1, 1,
    45085, 5354
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-02-11', 11.4,
    45085, 5354,
    2725, 450,
    0, 0,
    1, 0,
    45084, 5354
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-02-12', 11.6,
    45084, 5354,
    2725, 450,
    0, 0,
    1, 0,
    45083, 5354
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-02-13', 11.7,
    45083, 5354,
    2725, 450,
    0, 0,
    1, 0,
    45082, 5354
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-02-14', 11.9,
    45082, 5354,
    2725, 450,
    0, 0,
    2, 0,
    45080, 5354
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-02-15', 12.0,
    45080, 5354,
    2725, 450,
    0, 0,
    2, 0,
    45078, 5354
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-02-16', 12.1,
    45078, 5354,
    2890, 466,
    0, 0,
    1, 0,
    45077, 5354
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-02-17', 12.3,
    45077, 5354,
    2890, 466,
    0, 0,
    2, 1,
    45075, 5353
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-02-18', 12.4,
    45075, 5353,
    2890, 466,
    0, 0,
    2, 0,
    45073, 5353
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-02-19', 12.6,
    45073, 5353,
    2890, 466,
    0, 0,
    2, 0,
    45071, 5353
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-02-20', 12.7,
    45071, 5353,
    2890, 466,
    0, 0,
    0, 0,
    45071, 5353
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-02-21', 12.9,
    45071, 5353,
    2890, 466,
    0, 0,
    2, 1,
    45069, 5352
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-02-22', 13.0,
    45069, 5352,
    2890, 466,
    0, 0,
    1, 1,
    45068, 5351
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-02-23', 13.1,
    45068, 5351,
    2890, 466,
    0, 0,
    0, 0,
    45068, 5351
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-02-24', 13.3,
    45068, 5351,
    2890, 466,
    0, 0,
    0, 0,
    45068, 5351
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-02-25', 13.4,
    45068, 5351,
    2890, 466,
    0, 0,
    2, 0,
    45066, 5351
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-02-26', 13.6,
    45066, 5351,
    2890, 466,
    0, 0,
    2, 0,
    45064, 5351
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-02-27', 13.7,
    45064, 5351,
    2890, 466,
    0, 0,
    3, 0,
    45061, 5351
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-02-28', 13.9,
    45061, 5351,
    2890, 466,
    0, 0,
    2, 0,
    45059, 5351
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-02-29', 14.0,
    45059, 5351,
    2890, 466,
    0, 0,
    3, 0,
    45056, 5351
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-03-01', 14.1,
    45056, 5351,
    2894, 470,
    0, 0,
    2, 1,
    45054, 5350
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-03-02', 14.3,
    45054, 5350,
    2894, 470,
    0, 0,
    0, 2,
    45054, 5348
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-03-03', 14.4,
    45054, 5348,
    2894, 470,
    0, 0,
    2, 2,
    45052, 5346
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-03-04', 14.6,
    45052, 5346,
    2894, 470,
    0, 0,
    2, 1,
    45050, 5345
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-03-05', 14.7,
    45050, 5345,
    2894, 470,
    0, 0,
    1, 2,
    45049, 5343
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-03-06', 14.9,
    45049, 5343,
    2894, 470,
    0, 0,
    2, 0,
    45047, 5343
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-03-07', 15.0,
    45047, 5343,
    2894, 470,
    0, 0,
    2, 2,
    45045, 5341
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-03-08', 15.1,
    45045, 5341,
    3024, 482,
    0, 0,
    2, 1,
    45043, 5340
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-03-09', 15.3,
    45043, 5340,
    3024, 482,
    0, 0,
    2, 1,
    45041, 5339
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-03-10', 15.4,
    45041, 5339,
    3024, 482,
    0, 0,
    2, 1,
    45039, 5338
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-03-11', 15.6,
    45039, 5338,
    3024, 482,
    0, 0,
    2, 3,
    45037, 5335
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-03-12', 15.7,
    45037, 5335,
    3024, 482,
    0, 0,
    3, 2,
    45034, 5333
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-03-13', 15.9,
    45034, 5333,
    3024, 482,
    0, 0,
    0, 4,
    45034, 5329
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-03-14', 16.0,
    45034, 5329,
    3024, 482,
    0, 0,
    5, 4,
    45029, 5325
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-03-15', 16.1,
    45029, 5325,
    3239, 491,
    0, 0,
    3, 5,
    45026, 5320
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-03-16', 16.3,
    45026, 5320,
    3139, 491,
    0, 0,
    3, 8,
    45023, 5312
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-03-17', 16.4,
    45023, 5312,
    3139, 491,
    0, 0,
    4, 6,
    45019, 5306
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-03-18', 16.6,
    45019, 5306,
    3139, 491,
    0, 0,
    2, 6,
    45017, 5300
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-03-19', 16.7,
    45017, 5300,
    3139, 491,
    0, 0,
    3, 7,
    45014, 5293
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-03-20', 16.9,
    45014, 5293,
    3139, 491,
    0, 0,
    3, 4,
    45011, 5289
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-03-21', 17.0,
    45011, 5289,
    2997, 18,
    0, 0,
    4, 4,
    42967, 185
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-03-22', 17.1,
    42967, 185,
    2719, 19,
    0, 0,
    3, 2,
    33964, 183
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-03-23', 17.3,
    33964, 183,
    2009, 19,
    0, 0,
    1, 0,
    24963, 183
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-03-24', 17.4,
    24963, 183,
    1280, 19,
    0, 0,
    2, 0,
    15961, 183
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-03-25', 17.6,
    15961, 183,
    556, 19,
    0, 0,
    4, 1,
    6957, 182
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-03-26', 17.7,
    6957, 182,
    79, 19,
    0, 0,
    3, 0,
    954, 182
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-03-27', 17.9,
    954, 182,
    79, 19,
    0, 0,
    6, 4,
    948, 178
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-03-28', 18.0,
    948, 178,
    79, 19,
    0, 0,
    2, 7,
    618, 90
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-03-29', 18.1,
    618, 90,
    51, 10,
    0, 0,
    5, 2,
    613, 88
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-03-30', 18.3,
    613, 88,
    51, 10,
    0, 0,
    3, 2,
    610, 86
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-03-31', 18.4,
    610, 86,
    51, 10,
    0, 0,
    0, 3,
    610, 83
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-04-01', 18.6,
    44344, 5160,
    3991, 568,
    0, 0,
    3, 1,
    44341, 5159
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-04-01', 18.6,
    610, 83,
    51, 10,
    0, 0,
    0, 4,
    610, 79
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-04-02', 18.7,
    610, 79,
    51, 10,
    0, 0,
    3, 1,
    607, 78
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-04-02', 18.7,
    44341, 5159,
    3991, 568,
    0, 0,
    2, 4,
    44339, 5155
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-04-03', 18.9,
    607, 78,
    51, 10,
    0, 0,
    1, 0,
    606, 78
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-04-03', 18.9,
    44339, 5155,
    3991, 568,
    0, 0,
    2, 3,
    44337, 5152
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-04-04', 19.0,
    606, 78,
    51, 10,
    0, 0,
    0, 2,
    606, 76
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-04-04', 19.0,
    44337, 5152,
    3991, 568,
    0, 0,
    3, 2,
    44334, 5150
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-04-05', 19.1,
    606, 76,
    51, 10,
    0, 0,
    1, 3,
    605, 73
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-04-05', 19.1,
    44334, 5150,
    4256, 568,
    0, 0,
    3, 4,
    44331, 5146
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-04-06', 19.3,
    44331, 5146,
    4256, 568,
    0, 0,
    2, 4,
    44329, 5142
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-04-06', 19.3,
    605, 73,
    51, 10,
    0, 0,
    0, 0,
    605, 73
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-04-07', 19.4,
    605, 73,
    51, 10,
    0, 0,
    4, 1,
    575, 72
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-04-07', 19.4,
    44329, 5142,
    4256, 568,
    0, 0,
    3, 4,
    44326, 5138
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-04-08', 19.6,
    44326, 5138,
    4256, 568,
    0, 0,
    4, 2,
    44322, 5136
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-04-08', 19.6,
    575, 72,
    48, 8,
    0, 0,
    1, 0,
    574, 72
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-04-09', 19.7,
    44322, 5136,
    4256, 568,
    0, 0,
    2, 4,
    44320, 5132
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-04-09', 19.7,
    574, 72,
    48, 8,
    0, 0,
    0, 0,
    574, 72
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-04-10', 19.9,
    44320, 5132,
    4256, 568,
    0, 0,
    3, 3,
    44317, 5129
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-04-10', 19.9,
    574, 72,
    48, 8,
    0, 0,
    1, 0,
    573, 72
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-04-11', 20.0,
    573, 72,
    48, 8,
    0, 0,
    1, 1,
    572, 71
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-04-11', 20.0,
    44317, 5129,
    4256, 568,
    0, 0,
    2, 3,
    44315, 5126
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-04-12', 20.1,
    44315, 5126,
    4520, 589,
    0, 0,
    2, 3,
    44313, 5123
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-04-12', 20.1,
    572, 71,
    48, 8,
    0, 0,
    0, 3,
    572, 68
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-04-13', 20.3,
    572, 68,
    48, 8,
    0, 0,
    2, 1,
    570, 67
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-04-13', 20.3,
    44313, 5123,
    4520, 589,
    1, 0,
    3, 2,
    44310, 5121
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-04-14', 20.4,
    44310, 5121,
    4520, 589,
    1, 0,
    4, 2,
    44293, 5119
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-04-14', 20.4,
    570, 67,
    48, 8,
    0, 0,
    0, 1,
    570, 66
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-04-15', 20.6,
    570, 66,
    48, 8,
    0, 0,
    0, 1,
    570, 65
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-04-15', 20.6,
    44293, 5119,
    4520, 589,
    4, 0,
    3, 5,
    44290, 5114
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-04-16', 20.7,
    44290, 5114,
    4520, 589,
    6, 0,
    3, 4,
    44287, 5110
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-04-16', 20.7,
    570, 65,
    48, 8,
    0, 0,
    1, 3,
    569, 62
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-04-17', 20.9,
    44287, 5110,
    4520, 589,
    15, 0,
    4, 3,
    44283, 5107
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-04-17', 20.9,
    569, 62,
    48, 8,
    0, 0,
    1, 2,
    568, 60
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-04-18', 21.0,
    44283, 5107,
    4520, 589,
    29, 0,
    5, 4,
    44278, 5103
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-04-18', 21.0,
    568, 60,
    48, 8,
    0, 0,
    0, 2,
    568, 58
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-04-19', 21.1,
    44278, 5103,
    4520, 589,
    38, 0,
    5, 4,
    44273, 5099
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-04-19', 21.1,
    568, 58,
    47, 6,
    0, 0,
    1, 1,
    567, 57
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-04-20', 21.3,
    44273, 5099,
    4520, 589,
    76, 0,
    6, 5,
    44267, 5094
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-04-20', 21.3,
    567, 57,
    47, 6,
    0, 0,
    0, 2,
    567, 55
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-04-21', 21.4,
    44267, 5094,
    4520, 589,
    120, 0,
    3, 4,
    44264, 5090
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-04-21', 21.4,
    567, 55,
    47, 6,
    0, 0,
    0, 0,
    552, 55
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-04-22', 21.6,
    552, 55,
    46, 6,
    0, 0,
    1, 0,
    551, 55
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-04-22', 21.6,
    44264, 5090,
    4520, 589,
    212, 0,
    4, 3,
    44260, 5087
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-04-23', 21.7,
    44260, 5087,
    4520, 589,
    341, 0,
    5, 4,
    44255, 5083
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-04-23', 21.7,
    551, 55,
    46, 6,
    0, 0,
    2, 0,
    549, 55
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-04-24', 21.9,
    549, 55,
    46, 6,
    0, 0,
    0, 0,
    549, 55
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-04-24', 21.9,
    44255, 5083,
    4520, 589,
    526, 0,
    7, 5,
    44248, 5078
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-04-25', 22.0,
    549, 55,
    46, 6,
    0, 0,
    0, 0,
    32, 0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-04-25', 22.0,
    44248, 5078,
    4520, 589,
    749, 0,
    5, 5,
    44147, 4998
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-04-26', 22.1,
    32, 0,
    3, 0,
    0, 0,
    1, 0,
    24, 0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-04-26', 22.1,
    44147, 4998,
    4944, 625,
    1085, 0,
    3, 2,
    44144, 4996
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-04-27', 22.3,
    44144, 4996,
    4944, 625,
    1504, 0,
    4, 3,
    44140, 4993
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-04-27', 22.3,
    24, 0,
    2, 0,
    0, 0,
    0, 0,
    24, 0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    '2024-04-28', 22.4,
    24, 0,
    2, 0,
    0, 0,
    6, 0,
    0, 0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-04-28', 22.4,
    44140, 4993,
    4944, 625,
    2028, 0,
    3, 2,
    44137, 4991
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-04-29', 22.6,
    44137, 4991,
    4944, 625,
    2475, 63,
    4, 3,
    44133, 4988
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-04-30', 22.7,
    44133, 4988,
    5384, 648,
    3210, 105,
    5, 3,
    44128, 4985
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-05-01', 22.9,
    44128, 4985,
    5384, 648,
    4141, 196,
    6, 5,
    44122, 4980
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-05-02', 23.0,
    44122, 4980,
    5384, 648,
    4998, 309,
    7, 3,
    44115, 4977
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-05-03', 23.1,
    44115, 4977,
    5382, 648,
    6093, 415,
    5, 5,
    44110, 4972
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-05-04', 23.3,
    44110, 4972,
    5382, 648,
    7215, 572,
    7, 4,
    44103, 4968
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-05-05', 23.4,
    44103, 4968,
    5382, 648,
    8111, 814,
    9, 5,
    44094, 4963
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-05-06', 23.6,
    44094, 4963,
    5382, 648,
    8987, 1134,
    9, 5,
    44085, 4958
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-05-07', 23.7,
    44085, 4958,
    5382, 648,
    10703, 1456,
    8, 3,
    44077, 4955
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-05-08', 23.9,
    44077, 4955,
    5382, 648,
    11719, 2106,
    8, 4,
    44069, 4951
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-05-09', 24.0,
    44069, 4951,
    5382, 648,
    13746, 2747,
    6, 2,
    44063, 4949
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-05-10', 24.1,
    44063, 4949,
    5574, 644,
    14262, 3693,
    6, 3,
    44057, 4946
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-05-11', 24.3,
    44057, 4946,
    5574, 644,
    15508, 4630,
    9, 4,
    44048, 4942
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-05-12', 24.4,
    44048, 4942,
    5638, 644,
    16588, 5702,
    9, 3,
    44039, 4939
  )
ON CONFLICT (flock_id, record_date, farm_id) DO UPDATE SET
  opening_female = EXCLUDED.opening_female,
  opening_male = EXCLUDED.opening_male,
  feed_female_kg = EXCLUDED.feed_female_kg,
  feed_male_kg = EXCLUDED.feed_male_kg,
  total_eggs = EXCLUDED.total_eggs,
  he_eggs = EXCLUDED.he_eggs,
  mortality_female = EXCLUDED.mortality_female,
  mortality_male = EXCLUDED.mortality_male,
  closing_female = EXCLUDED.closing_female,
  closing_male = EXCLUDED.closing_male;
