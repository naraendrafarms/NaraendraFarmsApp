-- Flock 20 HE Dispatch
-- 268 dispatch records

INSERT INTO public.he_dispatch (
  flock_id, dispatch_date, prod_date, dc_no, party_id,
  grade_a, grade_b, total_dispatched,
  free_eggs, invoice_eggs, rate, amount
) VALUES
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-03',
    '2025-12-01',
    3861,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    4318, 0, 4318,
    85, 4233,
    19.66, 83221.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-03',
    '2025-12-02',
    3861,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    5583, 0, 5583,
    109, 5474,
    19.66, 107618.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-03',
    '2025-12-03',
    3861,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    179, 0, 179,
    4, 175,
    19.66, 3441.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-05',
    '2025-12-05',
    3862,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    10150, 29330, 39480,
    790, 38690,
    19.66, 760645.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-06',
    '2025-12-03',
    3863,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    6222, 0, 6222,
    122, 6100,
    19.66, 119926.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-06',
    '2025-12-04',
    3863,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    7080, 0, 7080,
    139, 6941,
    19.66, 136460.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-06',
    '2025-12-05',
    3863,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    6858, 0, 6858,
    134, 6724,
    19.66, 132194.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-08',
    '2025-12-05',
    3864,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    1540, 0, 1540,
    30, 1510,
    19.66, 29687.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-08',
    '2025-12-06',
    3864,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    9588, 0, 9588,
    188, 9400,
    19.66, 184804.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-08',
    '2025-12-07',
    3864,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    9032, 0, 9032,
    177, 8855,
    20.31, 179845.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-10',
    '2025-12-07',
    3865,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    1186, 0, 1186,
    23, 1163,
    20.31, 23621.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-10',
    '2025-12-08',
    3865,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    11547, 0, 11547,
    226, 11321,
    20.31, 229929.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-10',
    '2025-12-09',
    3865,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    7427, 0, 7427,
    146, 7281,
    20.31, 147877.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-10',
    '2025-12-10',
    3866,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    0, 10080, 10080,
    202, 9878,
    20.31, 200622.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-12',
    '2025-12-09',
    3867,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    5336, 0, 5336,
    105, 5231,
    20.31, 106242.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-12',
    '2025-12-10',
    3867,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    14025, 0, 14025,
    275, 13750,
    20.31, 279263.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-12',
    '2025-12-11',
    3867,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    10879, 0, 10879,
    213, 10666,
    20.31, 216626.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-14',
    '2025-12-11',
    3868,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    3583, 0, 3583,
    70, 3513,
    20.31, 71349.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-14',
    '2025-12-12',
    3868,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    15210, 0, 15210,
    298, 14912,
    20.31, 302863.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-14',
    '2025-12-13',
    3868,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    11447, 0, 11447,
    225, 11222,
    20.31, 227919.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-14',
    '2025-12-14',
    3869,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    0, 10710, 10710,
    214, 10496,
    20.31, 213174.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-17',
    '2025-12-13',
    3870,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    4840, 0, 4840,
    95, 4745,
    20.31, 96371.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-17',
    '2025-12-14',
    3870,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    16583, 0, 16583,
    325, 16258,
    20.31, 330200.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-17',
    '2025-12-15',
    3870,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    8817, 0, 8817,
    173, 8644,
    20.31, 175561.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-19',
    '2025-12-15',
    3871,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    8458, 0, 8458,
    166, 8292,
    20.31, 168411.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-19',
    '2025-12-16',
    3871,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    17501, 0, 17501,
    342, 17159,
    20.31, 348499.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-19',
    '2025-12-17',
    3871,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    18722, 0, 18722,
    367, 18355,
    20.31, 372790.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-19',
    '2025-12-18',
    3871,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    5719, 0, 5719,
    112, 5607,
    20.31, 113878.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-21',
    '2025-12-18',
    3872,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    12756, 0, 12756,
    250, 12506,
    20.31, 253997.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-21',
    '2025-12-19',
    3872,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    19031, 0, 19031,
    373, 18658,
    20.31, 378944.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-21',
    '2025-12-20',
    3872,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    8533, 0, 8533,
    167, 8366,
    20.31, 169913.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-23',
    '2025-12-20',
    3873,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    10636, 0, 10636,
    208, 10428,
    20.31, 211793.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-23',
    '2025-12-21',
    3873,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    9524, 0, 9524,
    187, 9337,
    31.25, 291781.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-24',
    '2025-12-21',
    3874,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    9935, 0, 9935,
    195, 9740,
    31.25, 304375.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-24',
    '2025-12-22',
    3874,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    20949, 0, 20949,
    410, 20539,
    31.25, 641844.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-24',
    '2025-12-23',
    3874,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    19516, 0, 19516,
    383, 19133,
    31.25, 597906.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-27',
    '2025-12-23',
    3875,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    728, 0, 728,
    14, 714,
    31.25, 22313.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-27',
    '2025-12-24',
    3875,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    20652, 0, 20652,
    405, 20247,
    31.25, 632719.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-27',
    '2025-12-25',
    3875,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    21211, 0, 21211,
    416, 20795,
    31.25, 649844.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-27',
    '2025-12-26',
    3875,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    7809, 0, 7809,
    153, 7656,
    31.25, 239250.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-29',
    '2025-12-26',
    3876,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    14491, 0, 14491,
    284, 14207,
    31.25, 443969.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-29',
    '2025-12-27',
    3876,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    15749, 0, 15749,
    309, 15440,
    31.25, 482500.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-29',
    '2025-12-29',
    3877,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Jamal Agro Industries') LIMIT 1),
    0, 18900, 18900,
    378, 18522,
    31.25, 578813.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-30',
    '2025-12-27',
    3878,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    6341, 0, 6341,
    124, 6217,
    31.25, 194281.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-30',
    '2025-12-28',
    3878,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    22385, 0, 22385,
    439, 21946,
    31.25, 685813.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-30',
    '2025-12-29',
    3878,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    1514, 0, 1514,
    30, 1484,
    31.25, 46375.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-01',
    '2025-12-29',
    3879,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    20160, 0, 20160,
    395, 19765,
    31.25, 617656.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-02',
    '2025-12-29',
    3880,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    1017, 0, 1017,
    20, 997,
    31.25, 31156.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-02',
    '2025-12-30',
    3880,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    22957, 0, 22957,
    450, 22507,
    31.25, 703344.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-02',
    '2025-12-31',
    3880,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    16346, 0, 16346,
    320, 16026,
    31.25, 500813.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-04',
    '2025-12-31',
    3881,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    6923, 0, 6923,
    136, 6787,
    31.25, 212094.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-04',
    '2026-01-01',
    3881,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    23345, 0, 23345,
    457, 22888,
    31.25, 715250.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-04',
    '2026-01-02',
    3881,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    23509, 0, 23509,
    461, 23048,
    31.25, 720250.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-04',
    '2026-01-03',
    3881,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    6703, 0, 6703,
    131, 6572,
    31.25, 205375.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-06',
    '2026-01-03',
    3882,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    16849, 0, 16849,
    330, 16519,
    31.25, 516219.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-06',
    '2026-01-04',
    3882,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    23888, 0, 23888,
    468, 23420,
    31.25, 731875.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-06',
    '2026-01-05',
    3882,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    9663, 0, 9663,
    189, 9474,
    31.25, 296063.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-09',
    '2026-01-05',
    3883,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    14426, 0, 14426,
    283, 14143,
    31.25, 441969.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-09',
    '2026-01-06',
    3883,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    24088, 0, 24088,
    472, 23616,
    31.25, 738000.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-09',
    '2026-01-07',
    3883,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    11886, 0, 11886,
    233, 11653,
    31.25, 364156.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-11',
    '2026-01-07',
    3884,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    12615, 0, 12615,
    247, 12368,
    31.25, 386500.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-11',
    '2026-01-08',
    3884,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    24696, 0, 24696,
    484, 24212,
    31.25, 756625.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-11',
    '2026-01-09',
    3884,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    23169, 0, 23169,
    454, 22715,
    31.25, 709844.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-13',
    '2026-01-09',
    3885,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    1663, 0, 1663,
    33, 1630,
    31.25, 50938.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-13',
    '2026-01-10',
    3885,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    24852, 0, 24852,
    487, 24365,
    31.25, 761406.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-13',
    '2026-01-11',
    3885,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    23885, 0, 23885,
    468, 23417,
    33.25, 778615.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-15',
    '2026-01-11',
    3886,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    1128, 0, 1128,
    22, 1106,
    33.25, 36775.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-15',
    '2026-01-12',
    3886,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    24827, 0, 24827,
    487, 24340,
    33.25, 809305.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-15',
    '2026-01-13',
    3886,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    24647, 0, 24647,
    483, 24164,
    33.25, 803453.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-15',
    '2026-01-14',
    3886,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    24583, 0, 24583,
    482, 24101,
    33.25, 801358.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-15',
    '2026-01-15',
    3886,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    5455, 0, 5455,
    107, 5348,
    33.25, 177821.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-18',
    '2026-01-15',
    3887,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    19383, 0, 19383,
    380, 19003,
    33.25, 631850.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-18',
    '2026-01-16',
    3887,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    24836, 0, 24836,
    486, 24350,
    33.25, 809637.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-18',
    '2026-01-17',
    3887,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    16261, 0, 16261,
    319, 15942,
    33.25, 530072.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-20',
    '2026-01-17',
    3889,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    8530, 0, 8530,
    167, 8363,
    33.25, 278070.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-20',
    '2026-01-18',
    3889,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    25034, 0, 25034,
    491, 24543,
    36.25, 889683.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-20',
    '2026-01-19',
    3889,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    16836, 0, 16836,
    330, 16506,
    36.25, 598343.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-21',
    '2026-01-21',
    6186,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    0, 6501, 6501,
    0, 6501,
    36.25, 235661.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-23',
    '2026-01-19',
    3890,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    7967, 0, 7967,
    156, 7811,
    36.25, 283149.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-23',
    '2026-01-20',
    3890,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    24815, 0, 24815,
    486, 24329,
    36.25, 881926.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-23',
    '2026-01-21',
    3890,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    25012, 0, 25012,
    490, 24522,
    36.25, 888923.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-23',
    '2026-01-22',
    3890,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    2686, 0, 2686,
    53, 2633,
    36.25, 95446.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-25',
    '2026-01-22',
    3891,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    22517, 0, 22517,
    441, 22076,
    36.25, 800255.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-25',
    '2026-01-23',
    3891,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    24911, 0, 24911,
    488, 24423,
    36.25, 885334.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-25',
    '2026-01-24',
    3891,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    13052, 0, 13052,
    256, 12796,
    36.25, 463855.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-27',
    '2026-01-24',
    3892,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    11899, 0, 11899,
    233, 11666,
    36.25, 422893.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-27',
    '2026-01-25',
    3892,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    25049, 0, 25049,
    491, 24558,
    37.75, 927064.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-27',
    '2026-01-26',
    3892,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    23532, 0, 23532,
    461, 23071,
    37.75, 870930.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-30',
    '2026-01-26',
    3893,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    1285, 0, 1285,
    25, 1260,
    37.75, 47565.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-30',
    '2026-01-27',
    3893,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    24776, 0, 24776,
    486, 24290,
    37.75, 916947.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-30',
    '2026-01-28',
    3893,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    24959, 0, 24959,
    489, 24470,
    37.75, 923743.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-30',
    '2026-01-29',
    3893,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    9460, 0, 9460,
    185, 9275,
    37.75, 350131.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-02',
    '2026-01-29',
    3894,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    15511, 0, 15511,
    304, 15207,
    37.75, 574064.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-02',
    '2026-01-30',
    3894,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    24761, 0, 24761,
    485, 24276,
    37.75, 916419.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-02',
    '2026-01-31',
    3894,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    20208, 0, 20208,
    396, 19812,
    37.75, 747903.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-04',
    '2026-01-31',
    3895,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    4621, 0, 4621,
    91, 4530,
    37.75, 171008.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-04',
    '2026-02-01',
    3895,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    24681, 0, 24681,
    484, 24197,
    37.75, 913437.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-04',
    '2026-02-02',
    3895,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    25001, 0, 25001,
    489, 24512,
    37.75, 925327.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-04',
    '2026-02-03',
    3895,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    6177, 0, 6177,
    121, 6056,
    37.75, 228614.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-06',
    '2026-02-03',
    3896,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    18995, 0, 18995,
    372, 18623,
    37.75, 703018.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-06',
    '2026-02-04',
    3896,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    25061, 0, 25061,
    491, 24570,
    37.75, 927517.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-06',
    '2026-02-05',
    3896,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    16424, 0, 16424,
    322, 16102,
    37.75, 607851.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-07',
    '2026-02-07',
    3897,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Venkatadri Hatcheries') LIMIT 1),
    0, 4654, 4654,
    91, 4563,
    37.75, 172253.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-09',
    '2026-02-05',
    3898,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    8426, 0, 8426,
    165, 8261,
    37.75, 311853.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-09',
    '2026-02-06',
    3898,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    24754, 0, 24754,
    485, 24269,
    37.75, 916154.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-09',
    '2026-02-07',
    3898,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    24984, 0, 24984,
    490, 24494,
    37.75, 924649.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-09',
    '2026-02-08',
    3898,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    2316, 0, 2316,
    45, 2271,
    37.75, 85730.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-12',
    '2026-02-08',
    3899,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    23110, 0, 23110,
    453, 22657,
    37.75, 855302.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-12',
    '2026-02-09',
    3899,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    25264, 0, 25264,
    495, 24769,
    37.75, 935029.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-12',
    '2026-02-10',
    3899,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    12106, 0, 12106,
    237, 11869,
    37.75, 448055.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-13',
    '2026-02-10',
    3900,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    13139, 0, 13139,
    258, 12881,
    37.75, 486258.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-13',
    '2026-02-11',
    3900,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    25203, 0, 25203,
    493, 24710,
    37.75, 932802.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-13',
    '2026-02-12',
    3900,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    22138, 0, 22138,
    434, 21704,
    37.75, 819326.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-16',
    '2026-02-12',
    4601,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    3055, 0, 3055,
    60, 2995,
    37.75, 113061.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-16',
    '2026-02-13',
    4601,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    24947, 0, 24947,
    488, 24459,
    37.75, 923327.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-16',
    '2026-02-14',
    4601,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    24735, 0, 24735,
    485, 24250,
    37.75, 915438.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-16',
    '2026-02-15',
    4601,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    7743, 0, 7743,
    152, 7591,
    37.75, 286560.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-18',
    '2026-02-15',
    4602,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    16768, 0, 16768,
    329, 16439,
    37.75, 620572.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-18',
    '2026-02-16',
    4602,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    24471, 0, 24471,
    479, 23992,
    37.75, 905698.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-18',
    '2026-02-17',
    4602,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    9161, 0, 9161,
    180, 8981,
    37.75, 339033.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-18',
    '2026-02-18',
    53,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Venkatadri Hatcheries') LIMIT 1),
    0, 8610, 8610,
    169, 8441,
    37.75, 318648.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-20',
    '2026-02-17',
    4603,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    15130, 0, 15130,
    297, 14833,
    37.75, 559946.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-20',
    '2026-02-18',
    4603,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    24222, 0, 24222,
    474, 23748,
    37.75, 896486.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-20',
    '2026-02-19',
    4603,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    21128, 0, 21128,
    414, 20714,
    37.75, 781954.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-23',
    '2026-02-19',
    4604,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    2874, 0, 2874,
    56, 2818,
    37.75, 106380.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-23',
    '2026-02-20',
    4604,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    23838, 0, 23838,
    467, 23371,
    37.75, 882255.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-23',
    '2026-02-21',
    4604,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    23877, 0, 23877,
    468, 23409,
    37.75, 883689.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-23',
    '2026-02-22',
    4604,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    9891, 0, 9891,
    194, 9697,
    38.75, 375759.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-26',
    '2026-02-22',
    4605,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    14049, 0, 14049,
    275, 13774,
    38.75, 533743.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-26',
    '2026-02-23',
    4605,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    23675, 0, 23675,
    464, 23211,
    38.75, 899425.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-26',
    '2026-02-24',
    4605,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    22756, 0, 22756,
    446, 22310,
    38.75, 864513.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-28',
    '2026-02-28',
    14,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Venkatadri Hatcheries') LIMIT 1),
    0, 9660, 9660,
    190, 9470,
    38.75, 366963.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-01',
    '2026-02-24',
    4606,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    834, 0, 834,
    16, 818,
    38.75, 31698.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-01',
    '2026-02-25',
    4606,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    23909, 0, 23909,
    468, 23441,
    38.75, 908338.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-01',
    '2026-02-26',
    4606,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    23445, 0, 23445,
    460, 22985,
    38.75, 890669.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-01',
    '2026-02-27',
    4606,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    12292, 0, 12292,
    241, 12051,
    38.75, 466976.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-03',
    '2026-02-27',
    4607,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    11400, 0, 11400,
    223, 11177,
    38.75, 433109.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-03',
    '2026-02-28',
    4607,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    23688, 0, 23688,
    465, 23223,
    38.75, 899891.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-03',
    '2026-03-01',
    4607,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    23522, 0, 23522,
    460, 23062,
    40.75, 939776.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-03',
    '2026-03-02',
    4607,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    1870, 0, 1870,
    37, 1833,
    40.75, 74695.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-05',
    '2026-03-02',
    4608,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    21632, 0, 21632,
    424, 21208,
    40.75, 864226.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-05',
    '2026-03-03',
    4608,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    23547, 0, 23547,
    462, 23085,
    40.75, 940713.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-05',
    '2026-03-04',
    4608,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    23412, 0, 23412,
    458, 22954,
    40.75, 935376.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-05',
    '2026-03-05',
    4608,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    1969, 0, 1969,
    39, 1930,
    40.75, 78648.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-08',
    '2026-03-05',
    4609,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    21651, 0, 21651,
    424, 21227,
    40.75, 865000.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-08',
    '2026-03-06',
    4609,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    23816, 0, 23816,
    467, 23349,
    40.75, 951472.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-08',
    '2026-03-07',
    4609,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    15013, 0, 15013,
    294, 14719,
    40.75, 599799.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-10',
    '2026-03-07',
    4610,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    8403, 0, 8403,
    165, 8238,
    40.75, 335699.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-10',
    '2026-03-08',
    4610,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    23345, 0, 23345,
    458, 22887,
    40.75, 932645.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-10',
    '2026-03-09',
    4610,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    18652, 0, 18652,
    366, 18286,
    40.75, 745155.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-11',
    '2026-03-11',
    55,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Akshaya Poultry and Hatchery') LIMIT 1),
    0, 10080, 10080,
    198, 9882,
    40.75, 402692.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-13',
    '2026-03-09',
    4611,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    4897, 0, 4897,
    96, 4801,
    40.75, 195641.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-13',
    '2026-03-10',
    4611,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    22494, 0, 22494,
    440, 22054,
    40.75, 898700.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-13',
    '2026-03-11',
    4611,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    22343, 0, 22343,
    438, 21905,
    40.75, 892629.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-13',
    '2026-03-12',
    4611,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    10746, 0, 10746,
    211, 10535,
    40.75, 429301.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-16',
    '2026-03-12',
    4612,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    12117, 0, 12117,
    237, 11880,
    40.75, 484110.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-16',
    '2026-03-13',
    4612,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    22820, 0, 22820,
    447, 22373,
    40.75, 911700.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-16',
    '2026-03-14',
    4612,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    23301, 0, 23301,
    457, 22844,
    40.75, 930892.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-16',
    '2026-03-15',
    4612,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    2242, 0, 2242,
    44, 2198,
    40.75, 89569.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-19',
    '2026-03-15',
    4613,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    20849, 0, 20849,
    409, 20440,
    40.75, 832930.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-19',
    '2026-03-16',
    4613,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    22826, 0, 22826,
    447, 22379,
    40.75, 911944.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-19',
    '2026-03-17',
    4613,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    23035, 0, 23035,
    451, 22584,
    40.75, 920298.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-19',
    '2026-03-18',
    4613,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    3850, 0, 3850,
    76, 3774,
    40.75, 153791.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-21',
    '2026-03-18',
    4614,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    19493, 0, 19493,
    382, 19111,
    40.75, 778773.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-21',
    '2026-03-19',
    4614,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    23267, 0, 23267,
    456, 22811,
    40.75, 929548.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-21',
    '2026-03-20',
    4614,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    17720, 0, 17720,
    347, 17373,
    40.75, 707950.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-25',
    '2026-03-20',
    4615,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    4864, 0, 4864,
    95, 4769,
    40.75, 194337.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-25',
    '2026-03-21',
    4615,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    22597, 0, 22597,
    443, 22154,
    40.75, 902776.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-25',
    '2026-03-22',
    4615,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    22600, 0, 22600,
    443, 22157,
    40.75, 902897.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-25',
    '2026-03-23',
    4615,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    10419, 0, 10419,
    204, 10215,
    40.75, 416261.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-26',
    '2026-03-23',
    4616,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    12429, 0, 12429,
    244, 12185,
    40.75, 496539.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-26',
    '2026-03-24',
    4616,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    22974, 0, 22974,
    450, 22524,
    40.75, 917853.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-26',
    '2026-03-25',
    4616,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    22878, 0, 22878,
    448, 22430,
    40.75, 914023.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-26',
    '2026-03-26',
    4616,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    2199, 0, 2199,
    43, 2156,
    40.75, 87857.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-29',
    '2026-03-26',
    4617,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    20734, 0, 20734,
    406, 20328,
    40.75, 828366.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-29',
    '2026-03-27',
    4617,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    22721, 0, 22721,
    445, 22276,
    40.75, 907747.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-29',
    '2026-03-28',
    4617,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    17025, 0, 17025,
    334, 16691,
    40.75, 680158.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-01',
    '2026-03-28',
    4618,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    5531, 0, 5531,
    109, 5422,
    40.75, 220947.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-01',
    '2026-03-29',
    4618,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    22561, 0, 22561,
    442, 22119,
    40.75, 901349.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-01',
    '2026-03-30',
    4618,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    22620, 0, 22620,
    443, 22177,
    40.75, 903712.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-01',
    '2026-03-31',
    4618,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    9768, 0, 9768,
    191, 9577,
    40.75, 390263.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-02',
    '2026-04-02',
    56,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Akshaya Poultry and Hatchery') LIMIT 1),
    0, 8587, 8587,
    168, 8419,
    40.75, 343074.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-02',
    '2026-04-02',
    56,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Akshaya Poultry and Hatchery') LIMIT 1),
    0, 10209, 10209,
    200, 10009,
    40.75, 407867.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-04',
    '2026-03-31',
    4619,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    12785, 0, 12785,
    251, 12534,
    40.75, 510761.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-04',
    '2026-04-01',
    4619,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    22884, 0, 22884,
    448, 22436,
    40.75, 914266.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-04',
    '2026-04-02',
    4619,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    23033, 0, 23033,
    451, 22582,
    40.75, 920217.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-04',
    '2026-04-03',
    4619,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    1778, 0, 1778,
    35, 1743,
    40.75, 71027.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-06',
    '2026-04-03',
    4620,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    21072, 0, 21072,
    413, 20659,
    40.75, 841854.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-06',
    '2026-04-04',
    4620,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    22855, 0, 22855,
    448, 22407,
    40.75, 913085.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-06',
    '2026-04-05',
    4620,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    16553, 0, 16553,
    324, 16229,
    36.75, 596416.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-09',
    '2026-04-05',
    4621,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    6202, 0, 6202,
    122, 6080,
    36.75, 223440.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-09',
    '2026-04-06',
    4621,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    22512, 0, 22512,
    441, 22071,
    36.75, 811109.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-09',
    '2026-04-07',
    4621,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    22856, 0, 22856,
    448, 22408,
    36.75, 823494.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-09',
    '2026-04-08',
    4621,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    8910, 0, 8910,
    175, 8735,
    36.75, 321011.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-11',
    '2026-04-08',
    4622,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    14085, 0, 14085,
    276, 13809,
    36.75, 507481.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-11',
    '2026-04-09',
    4622,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    22672, 0, 22672,
    444, 22228,
    36.75, 816879.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-11',
    '2026-04-10',
    4622,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    22851, 0, 22851,
    448, 22403,
    36.75, 823310.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-11',
    '2026-04-11',
    4622,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    872, 0, 872,
    17, 855,
    36.75, 31421.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-14',
    '2026-04-11',
    4623,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    21829, 0, 21829,
    428, 21401,
    36.75, 786487.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-14',
    '2026-04-12',
    4623,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    22447, 0, 22447,
    440, 22007,
    35.75, 786750.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-14',
    '2026-04-13',
    4623,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    22674, 0, 22674,
    444, 22230,
    35.75, 794723.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-14',
    '2026-04-14',
    4623,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    3610, 0, 3610,
    71, 3539,
    35.75, 126519.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-18',
    '2026-04-14',
    4624,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    19168, 0, 19168,
    376, 18792,
    35.75, 671814.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-18',
    '2026-04-15',
    4624,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    22970, 0, 22970,
    450, 22520,
    35.75, 805090.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-18',
    '2026-04-16',
    4624,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    18342, 0, 18342,
    360, 17982,
    35.75, 642857.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-20',
    '2026-04-16',
    4625,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    5058, 0, 5058,
    99, 4959,
    35.75, 177284.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-20',
    '2026-04-17',
    4625,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    23126, 0, 23126,
    453, 22673,
    35.75, 810560.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-20',
    '2026-04-18',
    4625,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    23039, 0, 23039,
    452, 22587,
    35.75, 807485.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-20',
    '2026-04-19',
    4625,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    9257, 0, 9257,
    181, 9076,
    32.75, 297239.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-22',
    '2026-04-22',
    57,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ellandula Srinivas') LIMIT 1),
    0, 12390, 12390,
    242, 12148,
    32.75, 397847.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-24',
    '2026-04-19',
    4626,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    14170, 0, 14170,
    278, 13892,
    32.75, 454963.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-24',
    '2026-04-20',
    4626,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    23610, 0, 23610,
    463, 23147,
    32.75, 758064.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-24',
    '2026-04-21',
    4626,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    22700, 0, 22700,
    445, 22255,
    32.75, 728851.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-26',
    '2026-04-21',
    4626,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    514, 0, 514,
    10, 504,
    32.75, 16506.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-26',
    '2026-04-22',
    4627,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    23212, 0, 23212,
    455, 22757,
    32.75, 745292.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-26',
    '2026-04-23',
    4627,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    23071, 0, 23071,
    452, 22619,
    32.75, 740772.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-26',
    '2026-04-24',
    4627,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    23220, 0, 23220,
    455, 22765,
    32.75, 745554.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-26',
    '2026-04-25',
    4627,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    543, 0, 543,
    11, 532,
    32.75, 17423.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-28',
    '2026-04-25',
    4628,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    22671, 0, 22671,
    444, 22227,
    32.75, 727934.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-28',
    '2026-04-26',
    4628,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    22904, 0, 22904,
    449, 22455,
    26.75, 600671.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-28',
    '2026-04-27',
    4628,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    14905, 0, 14905,
    292, 14613,
    26.75, 390898.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-01',
    '2026-04-27',
    4629,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    7445, 0, 7445,
    146, 7299,
    26.75, 195248.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-01',
    '2026-04-28',
    4629,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    23047, 0, 23047,
    452, 22595,
    26.75, 604416.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-01',
    '2026-04-29',
    4629,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    22532, 0, 22532,
    442, 22090,
    26.75, 590908.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-01',
    '2026-04-30',
    4629,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    17536, 0, 17536,
    344, 17192,
    26.75, 459886.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-04',
    '2026-04-30',
    4630,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    5138, 0, 5138,
    101, 5037,
    26.75, 134740.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-04',
    '2026-05-01',
    4630,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    22328, 0, 22328,
    438, 21890,
    26.75, 585558.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-04',
    '2026-05-02',
    4630,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    23119, 0, 23119,
    453, 22666,
    26.75, 606316.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-04',
    '2026-05-03',
    4630,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    9895, 0, 9895,
    194, 9701,
    23.75, 230399.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-06',
    '2026-05-06',
    6970,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    0, 630, 630,
    0, 630,
    23.75, 14963.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-07',
    '2026-05-03',
    4631,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    12711, 0, 12711,
    249, 12462,
    23.75, 295973.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-07',
    '2026-05-04',
    4631,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    22759, 0, 22759,
    446, 22313,
    23.75, 529934.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-07',
    '2026-05-05',
    4631,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    23458, 0, 23458,
    460, 22998,
    23.75, 546203.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-07',
    '2026-05-06',
    4631,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    1552, 0, 1552,
    30, 1522,
    23.75, 36148.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-07',
    '2026-05-07',
    58,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Raju Poultry Traders') LIMIT 1),
    0, 12180, 12180,
    239, 11941,
    23.75, 283599.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-10',
    '2026-05-06',
    4632,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    21299, 0, 21299,
    417, 20882,
    23.75, 495948.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-10',
    '2026-05-07',
    4632,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    22338, 0, 22338,
    438, 21900,
    23.75, 520125.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-10',
    '2026-05-08',
    4632,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    22399, 0, 22399,
    439, 21960,
    23.75, 521550.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-10',
    '2026-05-09',
    4632,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    4524, 0, 4524,
    89, 4435,
    23.75, 105331.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-13',
    '2026-05-09',
    4633,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    18071, 0, 18071,
    354, 17717,
    23.75, 420779.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-13',
    '2026-05-10',
    4633,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    22688, 0, 22688,
    445, 22243,
    21.75, 483785.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-13',
    '2026-05-11',
    4633,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    22230, 0, 22230,
    436, 21794,
    21.75, 474020.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-13',
    '2026-05-12',
    4633,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    7571, 0, 7571,
    148, 7423,
    21.75, 161450.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-16',
    '2026-05-12',
    4634,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    14562, 0, 14562,
    285, 14277,
    21.75, 310525.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-16',
    '2026-05-13',
    4634,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    22536, 0, 22536,
    442, 22094,
    21.75, 480544.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-16',
    '2026-05-14',
    4634,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    22229, 0, 22229,
    436, 21793,
    21.75, 473998.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-16',
    '2026-05-15',
    4634,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    11233, 0, 11233,
    220, 11013,
    21.75, 239533.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-18',
    '2026-05-18',
    59,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Raju Poultry Traders') LIMIT 1),
    8400, 0, 8400,
    165, 8235,
    19.75, 162641.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-19',
    '2026-05-15',
    4635,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    10837, 0, 10837,
    213, 10624,
    21.75, 231072.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-19',
    '2026-05-16',
    4635,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    21704, 0, 21704,
    425, 21279,
    21.75, 462818.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-19',
    '2026-05-17',
    4635,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    22065, 0, 22065,
    432, 21633,
    19.75, 427252.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-19',
    '2026-05-18',
    4635,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    15954, 0, 15954,
    313, 15641,
    19.75, 308910.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-22',
    '2026-05-18',
    4636,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    6609, 0, 6609,
    130, 6479,
    19.75, 127960.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-22',
    '2026-05-19',
    4636,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    1341, 20204, 21545,
    422, 21123,
    19.75, 417179.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-22',
    '2026-05-20',
    4636,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    1450, 20429, 21879,
    429, 21450,
    19.75, 423638.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-22',
    '2026-05-21',
    4636,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    1399, 19118, 20517,
    402, 20115,
    19.75, 397271.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-22',
    '2026-05-22',
    4636,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    10, 0, 10,
    0, 10,
    19.75, 198.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-26',
    '2026-05-21',
    4637,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    0, 1842, 1842,
    36, 1806,
    19.75, 35669.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-26',
    '2026-05-22',
    4637,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    1094, 20579, 21673,
    424, 21249,
    19.75, 419667.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-26',
    '2026-05-23',
    4637,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    1264, 20395, 21659,
    425, 21234,
    19.75, 419371.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-26',
    '2026-05-24',
    4637,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    1145, 12834, 13979,
    274, 13705,
    19.75, 270674.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-26',
    '2026-05-25',
    4637,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    1327, 0, 1327,
    26, 1301,
    19.75, 25695.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-27',
    '2026-05-27',
    60,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    0, 4830, 4830,
    95, 4735,
    19.75, 93516.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-28',
    '2026-05-24',
    4638,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    0, 8321, 8321,
    163, 8158,
    19.75, 161121.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-28',
    '2026-05-25',
    4638,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    9, 21211, 21220,
    416, 20804,
    19.75, 410878.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-28',
    '2026-05-26',
    4638,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    1152, 20942, 22094,
    433, 21661,
    19.75, 427805.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-28',
    '2026-05-27',
    4638,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    1131, 17776, 18907,
    371, 18536,
    19.75, 366086.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-28',
    '2026-05-28',
    4638,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    18, 0, 18,
    0, 18,
    19.75, 356.0
  )
ON CONFLICT ON CONSTRAINT he_dispatch_unique DO UPDATE SET
  amount = EXCLUDED.amount,
  rate = EXCLUDED.rate,
  free_eggs = EXCLUDED.free_eggs,
  invoice_eggs = EXCLUDED.invoice_eggs;
