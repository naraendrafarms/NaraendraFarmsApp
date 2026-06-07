-- Flock 17 HE Dispatch records from BPET1
INSERT INTO public.he_dispatch (
  flock_id, dispatch_date, dc_no,
  party_id,
  grade_a, grade_b, total_dispatched, free_eggs, invoice_eggs,
  rate, amount
) VALUES
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-09-27', 3051,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%jamal agro industries%' LIMIT 1),
    0, 20160, 20160, 403, 19757,
    14.0, 276598.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-10-02', 3052,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%jamal agro industries%' LIMIT 1),
    0, 20160, 20160, 403, 19757,
    14.5, 286477.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-10-08', 3053,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%jamal agro industries%' LIMIT 1),
    0, 30240, 30240, 605, 29635,
    14.5, 429708.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-10-09', 3054,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%jamal agro industries%' LIMIT 1),
    0, 15120, 15120, 302, 14818,
    14.5, 214861.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-10-10', 3055,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    20160, 0, 20160, 395, 19765,
    20.47, 404590.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-10-14', 3056,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    40320, 0, 40320, 790, 39530,
    20.47, 809179.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-10-14', 3057,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%jamal agro industries%' LIMIT 1),
    0, 20160, 20160, 403, 19757,
    14.5, 286477.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-10-15', 3058,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    30240, 0, 30240, 593, 29647,
    20.47, 606874.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-10-19', 3059,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    10080, 0, 10080, 198, 9882,
    20.47, 202285.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-10-19', 3060,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    40320, 0, 40320, 790, 39530,
    20.47, 809179.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-10-24', 3061,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    50400, 0, 50400, 988, 49412,
    32.5, 1605890.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-10-24', 3062,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%jamal agro industries%' LIMIT 1),
    0, 15120, 15120, 302, 14818,
    14.5, 214861.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-10-26', 3063,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    20160, 0, 20160, 395, 19765,
    32.5, 642363.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-10-28', 3064,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    60480, 0, 60480, 1185, 59295,
    32.5, 1927088.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-10-30', 3065,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    40320, 0, 40320, 790, 39530,
    32.5, 1284725.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-11-03', 3066,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    30240, 0, 30240, 593, 29647,
    32.5, 963528.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-11-04', 3067,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    50400, 0, 50400, 988, 49412,
    32.5, 1605890.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-11-07', 3068,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    40320, 0, 40320, 790, 39530,
    32.5, 1284725.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-11-08', 3069,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    50400, 0, 50400, 988, 49412,
    32.5, 1605890.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-11-11', 3070,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    50400, 0, 50400, 988, 49412,
    32.5, 1605890.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-11-13', 3071,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    40320, 0, 40320, 790, 39530,
    32.5, 1284725.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-11-16', 3072,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    60480, 0, 60480, 1185, 59295,
    32.5, 1927088.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-11-17', 3073,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    30240, 0, 30240, 593, 29647,
    32.5, 963528.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-11-21', 3074,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    60480, 0, 60480, 1185, 59295,
    32.5, 1927088.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-11-24', 3075,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    60480, 0, 60480, 1185, 59295,
    32.5, 1927088.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-11-25', 3076,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    70560, 0, 70560, 1383, 69177,
    32.5, 2248253.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-11-26', 3077,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%shadulla eggs bgrade%' LIMIT 1),
    0, 10080, 10080, 0, 10080,
    6.0, 60480.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-11-28', 3078,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    60480, 0, 60480, 1185, 59295,
    32.5, 1927088.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-11-30', 3079,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    50400, 0, 50400, 988, 49412,
    32.5, 1605890.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-12-02', 3080,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    50400, 0, 50400, 988, 49412,
    32.5, 1605890.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-12-04', 3081,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    50400, 0, 50400, 988, 49412,
    32.5, 1605890.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-12-08', 3082,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    60480, 0, 60480, 1185, 59295,
    31.5, 1867793.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-12-09', 3083,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    50400, 0, 50400, 988, 49412,
    31.5, 1556478.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-12-11', 3084,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    50400, 0, 50400, 988, 49412,
    31.5, 1556478.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-12-14', 3085,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    60480, 0, 60480, 1185, 59295,
    31.5, 1867793.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-12-16', 3086,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    60480, 0, 60480, 1185, 59295,
    31.5, 1867793.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-12-19', 3087,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    50400, 0, 50400, 988, 49412,
    31.5, 1556478.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-12-21', 3088,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    70560, 0, 70560, 1383, 69177,
    31.5, 2179076.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-12-23', 3089,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    50400, 0, 50400, 988, 49412,
    31.5, 1556478.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-12-26', 3090,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    60480, 0, 60480, 1185, 59295,
    31.5, 1867793.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-12-29', 3091,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    70560, 0, 70560, 1383, 69177,
    31.5, 2179076.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-12-30', 3092,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    53130, 0, 53130, 1041, 52089,
    31.5, 1640804.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2025-01-03', 3093,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hatchman enterprises%' LIMIT 1),
    60480, 0, 60480, 1185, 59295,
    31.5, 1867793.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2025-01-04', 3094,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%chickman enterprises haryana%' LIMIT 1),
    40320, 0, 40320, 790, 39530,
    31.5, 1245195.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2025-01-06', 3095,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%sneha farms pvt ltd%' LIMIT 1),
    30240, 0, 30240, 593, 29647,
    31.5, 933881.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2025-01-08', 3096,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%sneha farms pvt ltd%' LIMIT 1),
    40320, 0, 40320, 790, 39530,
    31.5, 1245195.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2025-01-10', 3097,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hatchman enterprises%' LIMIT 1),
    50400, 0, 50400, 988, 49412,
    31.5, 1556478.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2025-01-12', 3098,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    50400, 0, 50400, 988, 49412,
    31.5, 1556478.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2025-01-14', 3099,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    50400, 0, 50400, 988, 49412,
    31.5, 1556478.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2025-01-17', 3100,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hatchman enterprises%' LIMIT 1),
    50400, 0, 50400, 988, 49412,
    31.5, 1556478.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2025-01-18', 3451,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    40320, 0, 40320, 790, 39530,
    31.5, 1245195.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2025-01-21', 3452,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    50400, 0, 50400, 988, 49412,
    32.5, 1605890.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2025-01-25', 3453,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    131040, 0, 131040, 2568, 128472,
    32.5, 4175340.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2025-01-29', 3454,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    70560, 0, 70560, 1383, 69177,
    34.0, 2352018.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2025-02-01', 3455,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    40320, 0, 40320, 790, 39530,
    34.0, 1344020.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2025-02-03', 3456,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    60480, 0, 60480, 1185, 59295,
    34.0, 2016030.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2025-02-06', 3457,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    50400, 0, 50400, 988, 49412,
    34.0, 1680008.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2025-02-08', 3458,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    80640, 0, 80640, 1581, 79059,
    34.0, 2688006.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2025-02-11', 3459,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    40320, 0, 40320, 790, 39530,
    34.0, 1344020.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2025-02-13', 3460,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    60480, 0, 60480, 1185, 59295,
    34.0, 2016030.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2025-02-17', 3461,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    50400, 0, 50400, 988, 49412,
    34.0, 1680008.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2025-02-19', 3462,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    70560, 0, 70560, 1383, 69177,
    34.0, 2352018.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2025-02-21', 3463,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    40320, 0, 40320, 790, 39530,
    34.0, 1344020.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2025-02-24', 3464,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    60480, 0, 60480, 1185, 59295,
    34.0, 2016030.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2025-02-27', 3465,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    50400, 0, 50400, 988, 49412,
    34.0, 1680008.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2025-03-01', 3466,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    50400, 0, 50400, 988, 49412,
    34.0, 1680008.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2025-03-04', 3467,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    60480, 0, 60480, 1185, 59295,
    34.0, 2016030.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2025-03-06', 3468,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    50400, 0, 50400, 988, 49412,
    34.0, 1680008.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2025-03-09', 3469,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    60480, 0, 60480, 1185, 59295,
    34.0, 2016030.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2025-03-12', 3470,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    60480, 0, 60480, 1185, 59295,
    34.0, 2016030.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2025-03-16', 3471,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    60480, 0, 60480, 1185, 59295,
    34.0, 2016030.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2025-03-18', 3472,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    60480, 0, 60480, 1185, 59295,
    34.0, 2016030.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2025-03-20', 3473,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    50400, 0, 50400, 988, 49412,
    34.0, 1680008.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2025-03-23', 3474,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    60480, 0, 60480, 1185, 59295,
    34.0, 2016030.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2025-03-26', 3475,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    40320, 0, 40320, 790, 39530,
    34.0, 1344020.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2025-03-29', 3476,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    80640, 0, 80640, 1581, 79059,
    34.0, 2688006.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2025-04-01', 3477,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    50400, 0, 50400, 988, 49412,
    33.0, 1630596.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2025-04-03', 3478,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    70560, 0, 70560, 1383, 69177,
    33.0, 2282841.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2025-04-05', 3479,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    50400, 0, 50400, 988, 49412,
    33.0, 1630596.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2025-04-09', 3480,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    50400, 0, 50400, 988, 49412,
    34.0, 1680008.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2025-04-12', 3481,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    60480, 0, 60480, 1185, 59295,
    34.0, 2016030.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2025-04-16', 3482,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    80640, 0, 80640, 1581, 79059,
    34.0, 2688006.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2025-04-17', 3483,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    20160, 0, 20160, 395, 19765,
    34.0, 672010.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2025-04-22', 3484,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    112290, 0, 112290, 2201, 110089,
    35.0, 3853115.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2025-04-26', 3485,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    1680, 57540, 60480, 1185, 59295,
    35.0, 2075325.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2025-04-28', 3486,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    840, 59010, 60480, 1185, 59295,
    33.0, 1956735.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2025-05-01', 3487,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    1470, 47880, 50400, 988, 49412,
    33.0, 1630596.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2025-05-05', 3488,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    1680, 77700, 80640, 1581, 79059,
    30.0, 2371770.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2025-05-09', 3489,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    1680, 67200, 70560, 1383, 69177,
    30.0, 2075310.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2025-05-12', 3490,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    840, 58590, 60480, 1185, 59295,
    27.0, 1600965.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2025-05-18', 3491,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    1680, 117180, 120960, 2371, 118589,
    24.0, 2846136.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2025-05-21', 3492,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    840, 48300, 50400, 988, 49412,
    24.0, 1185888.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2025-05-25', 3493,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    1470, 67620, 70560, 1383, 69177,
    22.0, 1521894.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2025-05-28', 3494,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    1890, 57330, 60480, 1185, 59295,
    22.0, 1304490.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2025-06-01', 3495,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    1050, 58380, 60480, 1185, 59295,
    20.0, 1185900.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2025-06-04', 3496,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    840, 68670, 70560, 1383, 69177,
    20.0, 1383540.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2025-06-10', 3497,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    1680, 107100, 110880, 2173, 108707,
    18.0, 1956726.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2025-06-17', 3498,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    2520, 104370, 110880, 2173, 108707,
    16.0, 1739312.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2025-06-21', 3499,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    1260, 67200, 70560, 1383, 69177,
    16.0, 1106832.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2025-06-24', 3500,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    1050, 47880, 50400, 988, 49412,
    16.0, 790592.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2025-06-28', 3851,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    1470, 57330, 60480, 1185, 59295,
    16.0, 948720.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2025-06-30', 3852,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    840, 38640, 40320, 790, 39530,
    16.0, 632480.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2025-07-04', 3853,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    1470, 47040, 50400, 988, 49412,
    15.5, 765886.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2025-07-07', 3854,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    1050, 37800, 40320, 790, 39530,
    15.5, 612715.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2025-07-10', 3855,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    1050, 68250, 70560, 1383, 69177,
    15.5, 1072244.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2025-07-12', 3856,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    630, 28770, 30240, 593, 29647,
    15.5, 459529.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2025-07-17', 3857,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    1050, 57750, 60480, 1185, 59295,
    NULL, 962985.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2025-07-23', 3858,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    1470, 57540, 60480, 1185, 59295,
    NULL, 1002943.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2025-07-30', 3859,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    840, 38640, 40320, 790, 39530,
    NULL, 709685.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2025-08-05', 3860,
    (SELECT id FROM public.parties WHERE LOWER(name) LIKE '%hitech hatch fresh pvt ltd%' LIMIT 1),
    211, 6422, 6807, 133, 6674,
    19.75, 131812.0
  )
ON CONFLICT ON CONSTRAINT he_dispatch_unique DO UPDATE SET
  amount = EXCLUDED.amount,
  rate = EXCLUDED.rate,
  free_eggs = EXCLUDED.free_eggs,
  invoice_eggs = EXCLUDED.invoice_eggs;
