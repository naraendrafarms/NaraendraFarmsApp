-- Flock 19 HE Dispatch
-- 390 dispatch records

INSERT INTO public.he_dispatch (
  flock_id, dispatch_date, prod_date, dc_no, party_id,
  grade_a, grade_b, total_dispatched,
  free_eggs, invoice_eggs, rate, amount
) VALUES
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-18',
    '2025-08-18',
    3429,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Jaml Agro Agencies Pvt Ltd') LIMIT 1),
    0, 20160, 20160,
    403, 19757,
    14.14, 279364.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-24',
    '2025-08-24',
    3430,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Jaml Agro Agencies Pvt Ltd') LIMIT 1),
    0, 30240, 30240,
    605, 29635,
    15.76, 467048.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-29',
    '2025-08-29',
    3431,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Jaml Agro Agencies Pvt Ltd') LIMIT 1),
    0, 30240, 30240,
    605, 29635,
    15.76, 467048.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-01',
    '2025-09-01',
    3432,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    40320, 0, 40320,
    790, 39530,
    15.76, 622993.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-03',
    '2025-09-03',
    3433,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    30240, 0, 30240,
    593, 29647,
    15.76, 467237.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-08',
    '2025-09-08',
    3434,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Jaml Agro Agencies Pvt Ltd') LIMIT 1),
    0, 20160, 20160,
    403, 19757,
    24.25, 479107.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-10',
    '2025-09-03',
    3435,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    272, 0, 272,
    5, 267,
    15.76, 4209.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-10',
    '2025-09-04',
    3435,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    9884, 0, 9884,
    194, 9690,
    15.76, 152714.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-10',
    '2025-09-05',
    3435,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    11036, 0, 11036,
    216, 10820,
    15.76, 170523.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-10',
    '2025-09-06',
    3435,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    11319, 0, 11319,
    222, 11097,
    15.76, 174889.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-10',
    '2025-09-07',
    3435,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    11869, 0, 11869,
    233, 11636,
    15.76, 183383.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-10',
    '2025-09-08',
    3435,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    12060, 0, 12060,
    236, 11824,
    24.25, 286732.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-10',
    '2025-09-09',
    3435,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    4040, 0, 4040,
    79, 3961,
    24.25, 96054.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-13',
    '2025-09-09',
    3436,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    9236, 0, 9236,
    181, 9055,
    24.25, 219584.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-13',
    '2025-09-10',
    3436,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    13422, 0, 13422,
    263, 13159,
    24.25, 319106.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-13',
    '2025-09-11',
    3436,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    14025, 0, 14025,
    275, 13750,
    24.25, 333438.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-13',
    '2025-09-12',
    3436,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    13717, 0, 13717,
    269, 13448,
    24.25, 326114.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-16',
    '2025-09-12',
    3437,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    641, 0, 641,
    13, 628,
    24.25, 15229.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-16',
    '2025-09-13',
    3437,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    14723, 0, 14723,
    288, 14435,
    24.25, 350049.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-16',
    '2025-09-14',
    3437,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    14422, 0, 14422,
    283, 14139,
    26.25, 371149.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-16',
    '2025-09-15',
    3437,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    10534, 0, 10534,
    206, 10328,
    26.25, 271110.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-16',
    '2025-09-16',
    3438,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Jaml Agro Agencies Pvt Ltd') LIMIT 1),
    0, 20160, 20160,
    403, 19757,
    26.25, 518621.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-18',
    '2025-09-15',
    3439,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    4706, 0, 4706,
    92, 4614,
    26.25, 121118.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-18',
    '2025-09-16',
    3439,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    15678, 0, 15678,
    308, 15370,
    26.25, 403462.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-18',
    '2025-09-17',
    3439,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    9856, 0, 9856,
    193, 9663,
    26.25, 253654.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-20',
    '2025-09-17',
    3440,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    7487, 0, 7487,
    147, 7340,
    26.25, 192675.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-20',
    '2025-09-18',
    3440,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    17584, 0, 17584,
    344, 17240,
    26.25, 452550.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-20',
    '2025-09-19',
    3440,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    15249, 0, 15249,
    299, 14950,
    26.25, 392438.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-23',
    '2025-09-19',
    3441,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    2760, 0, 2760,
    54, 2706,
    26.25, 71033.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-23',
    '2025-09-20',
    3441,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    18322, 0, 18322,
    359, 17963,
    26.25, 471529.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-23',
    '2025-09-21',
    3441,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    18864, 0, 18864,
    370, 18494,
    26.25, 485468.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-23',
    '2025-09-22',
    3441,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    374, 0, 374,
    7, 367,
    26.25, 9634.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-25',
    '2025-09-22',
    3442,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    19403, 0, 19403,
    380, 19023,
    26.25, 499354.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-25',
    '2025-09-23',
    3442,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    19715, 0, 19715,
    386, 19329,
    26.25, 507386.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-25',
    '2025-09-24',
    3442,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    20022, 0, 20022,
    393, 19629,
    26.25, 515261.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-25',
    '2025-09-25',
    3442,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    11420, 0, 11420,
    224, 11196,
    26.25, 293895.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-26',
    '2025-09-26',
    3443,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Jaml Agro Agencies Pvt Ltd') LIMIT 1),
    0, 20160, 20160,
    403, 19757,
    26.25, 518621.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-30',
    '2025-09-25',
    3444,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    9880, 0, 9880,
    194, 9686,
    26.25, 254258.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-30',
    '2025-09-26',
    3444,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    21856, 0, 21856,
    428, 21428,
    26.25, 562485.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-30',
    '2025-09-27',
    3444,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    21535, 0, 21535,
    422, 21113,
    26.25, 554216.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-30',
    '2025-09-28',
    3444,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    17289, 0, 17289,
    339, 16950,
    26.25, 444937.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-02',
    '2025-09-28',
    3445,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    4516, 0, 4516,
    88, 4428,
    26.25, 116235.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-02',
    '2025-09-29',
    3445,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    22147, 0, 22147,
    434, 21713,
    26.25, 569966.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-02',
    '2025-09-30',
    3445,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    22016, 0, 22016,
    432, 21584,
    26.25, 566580.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-02',
    '2025-10-01',
    3445,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    11801, 0, 11801,
    231, 11570,
    26.25, 303713.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-05',
    '2025-10-01',
    3446,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    11146, 0, 11146,
    218, 10928,
    26.25, 286860.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-05',
    '2025-10-02',
    3446,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    22993, 0, 22993,
    451, 22542,
    26.25, 591728.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-05',
    '2025-10-03',
    3446,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    6181, 0, 6181,
    121, 6060,
    26.25, 159075.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-08',
    '2025-10-03',
    3447,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    16371, 0, 16371,
    321, 16050,
    26.25, 421313.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-08',
    '2025-10-04',
    3447,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    23100, 0, 23100,
    453, 22647,
    26.25, 594483.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-08',
    '2025-10-05',
    3447,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    25623, 0, 25623,
    502, 25121,
    27.25, 684547.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-08',
    '2025-10-06',
    3447,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    26070, 0, 26070,
    511, 25559,
    27.25, 696483.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-08',
    '2025-10-07',
    3447,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    26076, 0, 26076,
    511, 25565,
    27.25, 696646.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-08',
    '2025-10-08',
    3447,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    3720, 0, 3720,
    73, 3647,
    27.25, 99381.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-10',
    '2025-10-08',
    3448,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    22740, 0, 22740,
    446, 22294,
    27.25, 607512.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-10',
    '2025-10-09',
    3448,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    26637, 0, 26637,
    522, 26115,
    27.25, 711633.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-10',
    '2025-10-10',
    3448,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    1023, 0, 1023,
    20, 1003,
    27.25, 27332.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-10',
    '2025-10-11',
    3449,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Jaml Agro Agencies Pvt Ltd') LIMIT 1),
    0, 18060, 18060,
    362, 17698,
    27.25, 482271.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-14',
    '2025-10-10',
    3450,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    26034, 0, 26034,
    510, 25524,
    27.25, 695529.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-14',
    '2025-10-11',
    3450,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    27799, 0, 27799,
    545, 27254,
    27.25, 742672.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-14',
    '2025-10-12',
    3450,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    28077, 0, 28077,
    550, 27527,
    27.25, 750110.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-14',
    '2025-10-13',
    3450,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    28509, 0, 28509,
    559, 27950,
    27.25, 761638.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-14',
    '2025-10-14',
    3450,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    20621, 0, 20621,
    404, 20217,
    27.25, 550913.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-19',
    '2025-10-14',
    4101,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    8316, 0, 8316,
    163, 8153,
    27.25, 222169.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-19',
    '2025-10-15',
    4101,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    28066, 0, 28066,
    550, 27516,
    27.25, 749811.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-19',
    '2025-10-16',
    4101,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    28750, 0, 28750,
    564, 28186,
    27.25, 768069.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-19',
    '2025-10-17',
    4101,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    28956, 0, 28956,
    568, 28388,
    27.25, 773573.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-19',
    '2025-10-18',
    4101,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    22672, 0, 22672,
    444, 22228,
    27.25, 605713.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-22',
    '2025-10-18',
    4102,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    6590, 0, 6590,
    129, 6461,
    27.25, 176062.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-22',
    '2025-10-19',
    4102,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    29676, 0, 29676,
    582, 29094,
    27.25, 792812.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-22',
    '2025-10-20',
    4102,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    14134, 0, 14134,
    277, 13857,
    27.25, 377603.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-22',
    '2025-10-20',
    4103,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    15872, 0, 15872,
    311, 15561,
    27.25, 424037.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-22',
    '2025-10-21',
    4103,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    29466, 0, 29466,
    578, 28888,
    27.25, 787198.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-22',
    '2025-10-22',
    4103,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    25222, 0, 25222,
    494, 24728,
    27.25, 673838.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-27',
    '2025-10-22',
    4104,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    4481, 0, 4481,
    88, 4393,
    27.25, 119709.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-27',
    '2025-10-23',
    4104,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    29851, 0, 29851,
    585, 29266,
    27.25, 797498.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-27',
    '2025-10-24',
    4104,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    29927, 0, 29927,
    587, 29340,
    27.25, 799515.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-27',
    '2025-10-25',
    4104,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    6301, 0, 6301,
    123, 6178,
    27.25, 168351.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-28',
    '2025-10-25',
    4105,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    23846, 0, 23846,
    467, 23379,
    27.25, 637078.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-28',
    '2025-10-26',
    4105,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    30144, 0, 30144,
    591, 29553,
    28.25, 834872.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-28',
    '2025-10-27',
    4105,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    26650, 0, 26650,
    522, 26128,
    28.25, 738116.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-30',
    '2025-10-27',
    4106,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    3453, 0, 3453,
    68, 3385,
    28.25, 95626.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-30',
    '2025-10-28',
    4106,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    30541, 0, 30541,
    598, 29943,
    28.25, 845890.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-30',
    '2025-10-29',
    4106,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    26486, 0, 26486,
    519, 25967,
    28.25, 733568.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-02',
    '2025-10-29',
    4107,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    4017, 0, 4017,
    79, 3938,
    28.25, 111249.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-02',
    '2025-10-30',
    4107,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    31241, 0, 31241,
    612, 30629,
    28.25, 865269.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-02',
    '2025-10-31',
    4107,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    29916, 0, 29916,
    586, 29330,
    28.25, 828573.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-02',
    '2025-11-01',
    4107,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    25546, 0, 25546,
    501, 25045,
    28.25, 707521.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-05',
    '2025-11-01',
    4108,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    5442, 0, 5442,
    107, 5335,
    28.25, 150714.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-05',
    '2025-11-02',
    4108,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    30957, 0, 30957,
    607, 30350,
    29.25, 887738.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-05',
    '2025-11-03',
    4108,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    30567, 0, 30567,
    598, 29969,
    29.25, 876593.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-05',
    '2025-11-04',
    4108,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    23754, 0, 23754,
    466, 23288,
    29.25, 681174.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-07',
    '2025-11-04',
    4109,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    7147, 0, 7147,
    140, 7007,
    29.25, 204955.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-07',
    '2025-11-05',
    4109,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    30750, 0, 30750,
    603, 30147,
    29.25, 881800.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-07',
    '2025-11-06',
    4109,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    2423, 0, 2423,
    47, 2376,
    29.25, 69498.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-09',
    '2025-11-06',
    4110,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    28185, 0, 28185,
    552, 27633,
    29.25, 808265.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-09',
    '2025-11-07',
    4110,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    12135, 0, 12135,
    238, 11897,
    29.25, 347987.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-11',
    '2025-11-07',
    4111,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    18963, 0, 18963,
    372, 18591,
    29.25, 543787.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-11',
    '2025-11-08',
    4111,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    31271, 0, 31271,
    612, 30659,
    29.25, 896776.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-11',
    '2025-11-09',
    4111,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    31152, 0, 31152,
    611, 30541,
    29.25, 893324.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-11',
    '2025-11-10',
    4111,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    29494, 0, 29494,
    578, 28916,
    29.25, 845793.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-12',
    '2025-11-10',
    4112,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    1985, 0, 1985,
    39, 1946,
    29.25, 56921.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-12',
    '2025-11-11',
    4112,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    28255, 0, 28255,
    554, 27701,
    29.25, 810254.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-14',
    '2025-11-11',
    4113,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    2476, 0, 2476,
    49, 2427,
    29.25, 70990.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-14',
    '2025-11-12',
    4113,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    30617, 0, 30617,
    600, 30017,
    29.25, 877997.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-14',
    '2025-11-13',
    4113,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    30794, 0, 30794,
    603, 30191,
    29.25, 883086.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-14',
    '2025-11-14',
    4113,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    6673, 0, 6673,
    131, 6542,
    29.25, 191354.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-17',
    '2025-11-14',
    4114,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    24341, 0, 24341,
    477, 23864,
    29.25, 698022.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-17',
    '2025-11-15',
    4114,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    31036, 0, 31036,
    608, 30428,
    29.25, 890019.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-17',
    '2025-11-16',
    4114,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    25263, 0, 25263,
    495, 24768,
    30.25, 749232.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-20',
    '2025-11-16',
    4115,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    5707, 0, 5707,
    112, 5595,
    30.25, 169249.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-20',
    '2025-11-17',
    4115,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    31169, 0, 31169,
    610, 30559,
    30.25, 924410.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-20',
    '2025-11-18',
    4115,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    30792, 0, 30792,
    604, 30188,
    30.25, 913187.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-20',
    '2025-11-19',
    4115,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    23052, 0, 23052,
    452, 22600,
    30.25, 683650.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-24',
    '2025-11-19',
    4116,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    7854, 0, 7854,
    154, 7700,
    30.25, 232925.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-24',
    '2025-11-20',
    4116,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    30731, 0, 30731,
    602, 30129,
    30.25, 911401.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-24',
    '2025-11-21',
    4116,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    30684, 0, 30684,
    601, 30083,
    30.25, 910011.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-24',
    '2025-11-22',
    4116,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    30700, 0, 30700,
    602, 30098,
    30.25, 910465.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-24',
    '2025-11-23',
    4116,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    30579, 0, 30579,
    599, 29980,
    30.25, 906895.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-24',
    '2025-11-24',
    4116,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    492, 0, 492,
    10, 482,
    30.25, 14581.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-26',
    '2025-11-24',
    4117,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    30131, 0, 30131,
    591, 29540,
    30.25, 893585.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-26',
    '2025-11-25',
    4117,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    30349, 0, 30349,
    594, 29755,
    30.25, 900089.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-29',
    '2025-11-25',
    4118,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    586, 0, 586,
    11, 575,
    30.25, 17394.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-29',
    '2025-11-26',
    4118,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    31120, 0, 31120,
    610, 30510,
    30.25, 922928.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-29',
    '2025-11-27',
    4118,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    31025, 0, 31025,
    608, 30417,
    30.25, 920114.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-29',
    '2025-11-28',
    4118,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    17909, 0, 17909,
    352, 17557,
    30.25, 531099.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-30',
    '2025-11-28',
    4119,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    13271, 0, 13271,
    260, 13011,
    30.25, 393582.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-30',
    '2025-11-29',
    4119,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    6889, 0, 6889,
    135, 6754,
    30.25, 204309.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-03',
    '2025-11-29',
    4120,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    24005, 0, 24005,
    470, 23535,
    30.25, 711934.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-03',
    '2025-11-30',
    4120,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    30822, 0, 30822,
    604, 30218,
    30.25, 914094.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-03',
    '2025-12-01',
    4120,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    30647, 0, 30647,
    601, 30046,
    30.25, 908892.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-03',
    '2025-12-02',
    4120,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    5246, 0, 5246,
    103, 5143,
    30.25, 155576.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-06',
    '2025-12-02',
    4121,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    25139, 0, 25139,
    493, 24646,
    30.25, 745542.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-06',
    '2025-12-03',
    4121,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    30079, 0, 30079,
    590, 29489,
    30.25, 892042.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-06',
    '2025-12-04',
    4121,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    25422, 0, 25422,
    498, 24924,
    30.25, 753951.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-08',
    '2025-12-04',
    4122,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    5131, 0, 5131,
    101, 5030,
    30.25, 152158.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-08',
    '2025-12-05',
    4122,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    29755, 0, 29755,
    582, 29173,
    30.25, 882483.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-08',
    '2025-12-06',
    4122,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    30141, 0, 30141,
    591, 29550,
    30.25, 893888.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-08',
    '2025-12-07',
    4122,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    25693, 0, 25693,
    504, 25189,
    31.25, 787156.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-10',
    '2025-12-07',
    4123,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    4920, 0, 4920,
    96, 4824,
    31.25, 150750.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-10',
    '2025-12-08',
    4123,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    30720, 0, 30720,
    602, 30118,
    31.25, 941188.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-10',
    '2025-12-09',
    4123,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    24840, 0, 24840,
    487, 24353,
    31.25, 761031.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-12',
    '2025-12-09',
    4124,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    6272, 0, 6272,
    123, 6149,
    31.25, 192156.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-12',
    '2025-12-10',
    4124,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    30195, 0, 30195,
    592, 29603,
    31.25, 925093.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-12',
    '2025-12-11',
    4124,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    30125, 0, 30125,
    590, 29535,
    31.25, 922969.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-12',
    '2025-12-12',
    4124,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    3968, 0, 3968,
    78, 3890,
    31.25, 121563.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-14',
    '2025-12-12',
    4125,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    25959, 0, 25959,
    509, 25450,
    31.25, 795313.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-14',
    '2025-12-13',
    4125,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    24441, 0, 24441,
    479, 23962,
    31.25, 748812.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-17',
    '2025-12-13',
    4126,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    5255, 0, 5255,
    103, 5152,
    31.25, 161000.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-17',
    '2025-12-14',
    4126,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    29834, 0, 29834,
    585, 29249,
    31.25, 914031.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-17',
    '2025-12-15',
    4126,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    28945, 0, 28945,
    567, 28378,
    31.25, 886812.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-17',
    '2025-12-16',
    4126,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    6526, 0, 6526,
    128, 6398,
    31.25, 199938.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-19',
    '2025-12-16',
    4127,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    23085, 0, 23085,
    452, 22633,
    31.25, 707281.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-19',
    '2025-12-17',
    4127,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    29847, 0, 29847,
    585, 29262,
    31.25, 914438.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-19',
    '2025-12-18',
    4127,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    27708, 0, 27708,
    543, 27165,
    31.25, 848906.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-21',
    '2025-12-18',
    4128,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    2006, 0, 2006,
    39, 1967,
    31.25, 61469.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-21',
    '2025-12-19',
    4128,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    29532, 0, 29532,
    579, 28953,
    31.25, 904781.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-21',
    '2025-12-20',
    4128,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    28942, 0, 28942,
    567, 28375,
    31.25, 886719.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-23',
    '2025-12-20',
    4129,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    317, 0, 317,
    6, 311,
    31.25, 9719.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-23',
    '2025-12-21',
    4129,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    19843, 0, 19843,
    389, 19454,
    31.25, 607938.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-24',
    '2025-12-21',
    4130,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    9251, 0, 9251,
    182, 9069,
    31.25, 283406.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-24',
    '2025-12-22',
    4130,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    29043, 0, 29043,
    569, 28474,
    31.25, 889813.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-24',
    '2025-12-23',
    4130,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    12106, 0, 12106,
    237, 11869,
    31.25, 370906.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-27',
    '2025-12-23',
    4131,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    16247, 0, 16247,
    318, 15929,
    31.25, 497781.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-27',
    '2025-12-24',
    4131,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    28547, 0, 28547,
    560, 27987,
    31.25, 874594.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-27',
    '2025-12-25',
    4131,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    28520, 0, 28520,
    559, 27961,
    31.25, 873781.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-27',
    '2025-12-26',
    4131,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    7326, 0, 7326,
    144, 7182,
    31.25, 224438.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-29',
    '2025-12-26',
    4132,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    21235, 0, 21235,
    416, 20819,
    31.25, 650594.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-29',
    '2025-12-27',
    4132,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    28248, 0, 28248,
    554, 27694,
    31.25, 865437.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-29',
    '2025-12-28',
    4132,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    917, 0, 917,
    18, 899,
    31.25, 28094.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-30',
    '2025-12-28',
    4133,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    27650, 0, 27650,
    542, 27108,
    31.25, 847125.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-30',
    '2025-12-29',
    4133,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    12670, 0, 12670,
    248, 12422,
    31.25, 388188.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-01',
    '2025-12-29',
    4134,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    15502, 0, 15502,
    304, 15198,
    31.25, 474937.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-01',
    '2025-12-30',
    4134,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    4658, 0, 4658,
    91, 4567,
    31.25, 142719.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-02',
    '2025-12-30',
    4135,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    23521, 0, 23521,
    461, 23060,
    31.25, 720625.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-02',
    '2025-12-31',
    4135,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    28306, 0, 28306,
    554, 27752,
    31.25, 867250.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-02',
    '2026-01-01',
    4135,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    8653, 0, 8653,
    170, 8483,
    31.25, 265094.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-04',
    '2026-01-01',
    4136,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    19691, 0, 19691,
    386, 19305,
    31.25, 603281.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-04',
    '2026-01-02',
    4136,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    28673, 0, 28673,
    562, 28111,
    31.25, 878469.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-04',
    '2026-01-03',
    4136,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    22196, 0, 22196,
    435, 21761,
    31.25, 680031.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-06',
    '2026-01-03',
    4137,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    5888, 0, 5888,
    115, 5773,
    31.25, 180406.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-06',
    '2026-01-04',
    4137,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    28661, 0, 28661,
    562, 28099,
    31.25, 878094.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-06',
    '2026-01-05',
    4137,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    15851, 0, 15851,
    311, 15540,
    31.25, 485625.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-09',
    '2026-01-05',
    4138,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    12199, 0, 12199,
    239, 11960,
    31.25, 373750.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-09',
    '2026-01-06',
    4138,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    28299, 0, 28299,
    555, 27744,
    31.25, 867000.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-09',
    '2026-01-07',
    4138,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    9902, 0, 9902,
    194, 9708,
    31.25, 303375.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-11',
    '2026-01-07',
    4139,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    18087, 0, 18087,
    355, 17732,
    31.25, 554125.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-11',
    '2026-01-08',
    4139,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    28058, 0, 28058,
    549, 27509,
    31.25, 859656.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-11',
    '2026-01-09',
    4139,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    24415, 0, 24415,
    479, 23936,
    31.25, 748000.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-13',
    '2026-01-09',
    4141,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    3607, 0, 3607,
    71, 3536,
    31.25, 110500.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-13',
    '2026-01-10',
    4141,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    28137, 0, 28137,
    551, 27586,
    31.25, 862063.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-13',
    '2026-01-11',
    4141,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    28095, 0, 28095,
    550, 27545,
    33.25, 915871.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-13',
    '2026-01-12',
    4141,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    641, 0, 641,
    13, 628,
    33.25, 20881.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-14',
    '2026-01-12',
    4142,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    26983, 0, 26983,
    529, 26454,
    33.25, 879596.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-14',
    '2026-01-13',
    4142,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    13337, 0, 13337,
    261, 13076,
    33.25, 434777.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-15',
    '2026-01-13',
    4143,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    14709, 0, 14709,
    288, 14421,
    33.25, 479499.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-15',
    '2026-01-14',
    4143,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    25611, 0, 25611,
    502, 25109,
    33.25, 834874.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-18',
    '2026-01-14',
    4144,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    2068, 0, 2068,
    41, 2027,
    33.25, 67398.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-18',
    '2026-01-15',
    4144,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    28047, 0, 28047,
    550, 27497,
    33.25, 914275.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-18',
    '2026-01-16',
    4144,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    28440, 0, 28440,
    557, 27883,
    33.25, 927109.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-18',
    '2026-01-17',
    4144,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    12005, 0, 12005,
    235, 11770,
    33.25, 391353.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-20',
    '2026-01-17',
    4145,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    16155, 0, 16155,
    317, 15838,
    33.25, 526614.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-20',
    '2026-01-18',
    4145,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    28277, 0, 28277,
    554, 27723,
    36.25, 1004958.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-20',
    '2026-01-19',
    4145,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    26128, 0, 26128,
    512, 25616,
    36.25, 928580.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-23',
    '2026-01-19',
    4146,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    2382, 0, 2382,
    46, 2336,
    36.25, 84680.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-23',
    '2026-01-20',
    4146,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    28370, 0, 28370,
    556, 27814,
    36.25, 1008257.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-23',
    '2026-01-21',
    4146,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    28211, 0, 28211,
    553, 27658,
    36.25, 1002603.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-23',
    '2026-01-22',
    4146,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    1517, 0, 1517,
    30, 1487,
    36.25, 53904.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-25',
    '2026-01-22',
    4147,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    26687, 0, 26687,
    523, 26164,
    36.25, 948445.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-25',
    '2026-01-23',
    4147,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    28253, 0, 28253,
    554, 27699,
    36.25, 1004088.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-25',
    '2026-01-24',
    4147,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    15620, 0, 15620,
    306, 15314,
    36.25, 555133.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-27',
    '2026-01-24',
    4148,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    12622, 0, 12622,
    247, 12375,
    36.25, 448594.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-27',
    '2026-01-25',
    4148,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    28170, 0, 28170,
    552, 27618,
    37.75, 1042579.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-27',
    '2026-01-26',
    4148,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    27731, 0, 27731,
    544, 27187,
    37.75, 1026309.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-27',
    '2026-01-27',
    4148,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    2037, 0, 2037,
    40, 1997,
    37.75, 75387.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-30',
    '2026-01-27',
    4149,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    25847, 0, 25847,
    507, 25340,
    37.75, 956585.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-30',
    '2026-01-28',
    4149,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    27749, 0, 27749,
    544, 27205,
    37.75, 1026989.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-30',
    '2026-01-29',
    4149,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    16964, 0, 16964,
    332, 16632,
    37.75, 627858.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-02',
    '2026-01-29',
    4150,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    10988, 0, 10988,
    215, 10773,
    37.75, 406681.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-02',
    '2026-01-30',
    4150,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    27891, 0, 27891,
    547, 27344,
    37.75, 1032236.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-02',
    '2026-01-31',
    4150,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    27380, 0, 27380,
    537, 26843,
    37.75, 1013323.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-02',
    '2026-02-01',
    4150,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    4301, 0, 4301,
    84, 4217,
    37.75, 159192.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-04',
    '2026-02-01',
    4551,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    23404, 0, 23404,
    459, 22945,
    37.75, 866174.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-04',
    '2026-02-02',
    4551,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    27933, 0, 27933,
    547, 27386,
    37.75, 1033821.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-04',
    '2026-02-03',
    4551,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    9143, 0, 9143,
    179, 8964,
    37.75, 338391.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-06',
    '2026-02-03',
    4552,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    18519, 0, 18519,
    363, 18156,
    37.75, 685389.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-06',
    '2026-02-04',
    4552,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    27340, 0, 27340,
    536, 26804,
    37.75, 1011851.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-06',
    '2026-02-05',
    4552,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    24701, 0, 24701,
    484, 24217,
    37.75, 914192.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-07',
    '2026-02-07',
    6643,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Venkatadri Hatcheries') LIMIT 1),
    0, 3350, 3350,
    66, 3284,
    37.75, 123971.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-09',
    '2026-02-05',
    4553,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    2722, 0, 2722,
    53, 2669,
    37.75, 100755.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-09',
    '2026-02-06',
    4553,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    27223, 0, 27223,
    533, 26690,
    37.75, 1007547.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-09',
    '2026-02-07',
    4553,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    27579, 0, 27579,
    541, 27038,
    37.75, 1020684.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-09',
    '2026-02-08',
    4553,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    2956, 0, 2956,
    58, 2898,
    37.75, 109400.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-12',
    '2026-02-08',
    4554,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    24629, 0, 24629,
    483, 24146,
    37.75, 911512.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-12',
    '2026-02-09',
    4554,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    27646, 0, 27646,
    541, 27105,
    37.75, 1023213.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-12',
    '2026-02-10',
    4554,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    8205, 0, 8205,
    161, 8044,
    37.75, 303661.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-13',
    '2026-02-10',
    4555,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    19081, 0, 19081,
    374, 18707,
    37.75, 706189.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-13',
    '2026-02-11',
    4555,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    26982, 0, 26982,
    529, 26453,
    37.75, 998601.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-13',
    '2026-02-12',
    4555,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    24497, 0, 24497,
    480, 24017,
    37.75, 906642.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-16',
    '2026-02-12',
    4556,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    3023, 0, 3023,
    59, 2964,
    37.75, 111891.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-16',
    '2026-02-13',
    4556,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    27154, 0, 27154,
    532, 26622,
    37.75, 1004981.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-16',
    '2026-02-14',
    4556,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    27162, 0, 27162,
    532, 26630,
    37.75, 1005282.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-16',
    '2026-02-15',
    4556,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    3141, 0, 3141,
    62, 3079,
    37.75, 116232.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-18',
    '2026-02-15',
    4557,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    23829, 0, 23829,
    467, 23362,
    37.75, 881916.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-18',
    '2026-02-16',
    4557,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    27178, 0, 27178,
    533, 26645,
    37.75, 1005848.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-18',
    '2026-02-17',
    4557,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    19553, 0, 19553,
    383, 19170,
    37.75, 723668.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-18',
    '2026-02-18',
    53,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Venkatadri Hatcheries') LIMIT 1),
    0, 7140, 7140,
    140, 7000,
    37.75, 264250.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-20',
    '2026-02-17',
    4558,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    7604, 0, 7604,
    149, 7455,
    37.75, 281426.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-20',
    '2026-02-18',
    4558,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    26827, 0, 26827,
    525, 26302,
    37.75, 992900.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-20',
    '2026-02-19',
    4558,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    26049, 0, 26049,
    511, 25538,
    37.75, 964060.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-23',
    '2026-02-19',
    4559,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    1033, 0, 1033,
    20, 1013,
    37.75, 38241.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-23',
    '2026-02-20',
    4559,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    27015, 0, 27015,
    529, 26486,
    37.75, 999847.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-23',
    '2026-02-21',
    4559,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    27060, 0, 27060,
    531, 26529,
    37.75, 1001469.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-23',
    '2026-02-22',
    4559,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    15452, 0, 15452,
    303, 15149,
    38.75, 587024.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-26',
    '2026-02-22',
    4560,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    11424, 0, 11424,
    224, 11200,
    38.75, 434000.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-26',
    '2026-02-23',
    4560,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    26838, 0, 26838,
    526, 26312,
    38.75, 1019590.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-26',
    '2026-02-24',
    4560,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    26291, 0, 26291,
    515, 25776,
    38.75, 998820.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-26',
    '2026-02-25',
    4560,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    6007, 0, 6007,
    118, 5889,
    38.75, 228199.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-28',
    '2026-02-28',
    14,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Venkatadri Hatcheries') LIMIT 1),
    0, 5670, 5670,
    111, 5559,
    38.75, 215411.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-01',
    '2026-02-25',
    4561,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    20590, 0, 20590,
    404, 20186,
    38.75, 782208.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-01',
    '2026-02-26',
    4561,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    26642, 0, 26642,
    522, 26120,
    38.75, 1012150.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-01',
    '2026-02-27',
    4561,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    23328, 0, 23328,
    457, 22871,
    38.75, 886251.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-03',
    '2026-02-27',
    4562,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    3015, 0, 3015,
    59, 2956,
    38.75, 114545.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-03',
    '2026-02-28',
    4562,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    26053, 0, 26053,
    511, 25542,
    38.75, 989753.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-03',
    '2026-03-01',
    4562,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    26407, 0, 26407,
    517, 25890,
    40.75, 1055017.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-03',
    '2026-03-02',
    4562,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    15085, 0, 15085,
    296, 14789,
    40.75, 602652.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-05',
    '2026-03-02',
    4563,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    10935, 0, 10935,
    214, 10721,
    40.75, 436881.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-05',
    '2026-03-03',
    4563,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    25704, 0, 25704,
    504, 25200,
    40.75, 1026899.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-05',
    '2026-03-04',
    4563,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    23841, 0, 23841,
    467, 23374,
    40.75, 952491.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-08',
    '2026-03-04',
    4564,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    1977, 0, 1977,
    39, 1938,
    40.75, 78974.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-08',
    '2026-03-05',
    4564,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    26270, 0, 26270,
    514, 25756,
    40.75, 1049556.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-08',
    '2026-03-06',
    4564,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    26151, 0, 26151,
    513, 25638,
    40.75, 1044749.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-08',
    '2026-03-07',
    4564,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    6082, 0, 6082,
    119, 5963,
    40.75, 242992.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-10',
    '2026-03-07',
    4565,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    20035, 0, 20035,
    393, 19642,
    40.75, 800412.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-10',
    '2026-03-08',
    4565,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    26384, 0, 26384,
    517, 25867,
    40.75, 1054080.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-10',
    '2026-03-09',
    4565,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    24141, 0, 24141,
    473, 23668,
    40.75, 964471.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-11',
    '2026-03-11',
    55,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Akshaya Poultry and Hatchery') LIMIT 1),
    0, 5670, 5670,
    111, 5559,
    40.75, 226529.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-13',
    '2026-03-09',
    4566,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    141, 0, 141,
    3, 138,
    40.75, 5624.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-13',
    '2026-03-10',
    4566,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    24636, 0, 24636,
    483, 24153,
    40.75, 984235.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-13',
    '2026-03-11',
    4566,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    24825, 0, 24825,
    486, 24339,
    40.75, 991814.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-13',
    '2026-03-12',
    4566,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    20958, 0, 20958,
    411, 20547,
    40.75, 837290.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-16',
    '2026-03-12',
    4567,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    4839, 0, 4839,
    95, 4744,
    40.75, 193318.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-16',
    '2026-03-13',
    4567,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    25872, 0, 25872,
    507, 25365,
    40.75, 1033624.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-16',
    '2026-03-14',
    4567,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    26500, 0, 26500,
    519, 25981,
    40.75, 1058726.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-16',
    '2026-03-15',
    4567,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    13349, 0, 13349,
    262, 13087,
    40.75, 533295.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-19',
    '2026-03-15',
    4568,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    11528, 0, 11528,
    226, 11302,
    40.75, 460557.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-19',
    '2026-03-16',
    4568,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    25563, 0, 25563,
    501, 25062,
    40.75, 1021276.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-19',
    '2026-03-17',
    4568,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    23389, 0, 23389,
    458, 22931,
    40.75, 934438.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-21',
    '2026-03-17',
    4569,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    2312, 0, 2312,
    45, 2267,
    40.75, 92380.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-21',
    '2026-03-18',
    4569,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    25645, 0, 25645,
    503, 25142,
    40.75, 1024537.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-21',
    '2026-03-19',
    4569,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    23962, 0, 23962,
    470, 23492,
    40.75, 957299.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-21',
    '2026-03-20',
    4569,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    18641, 0, 18641,
    365, 18276,
    40.75, 744747.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-25',
    '2026-03-20',
    4570,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    6848, 0, 6848,
    134, 6714,
    40.75, 273596.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-25',
    '2026-03-21',
    4570,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    24763, 0, 24763,
    485, 24278,
    40.75, 989328.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-25',
    '2026-03-22',
    4570,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    24747, 0, 24747,
    485, 24262,
    40.75, 988677.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-25',
    '2026-03-23',
    4570,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    14202, 0, 14202,
    279, 13923,
    40.75, 567362.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-26',
    '2026-03-23',
    4571,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    11097, 0, 11097,
    218, 10879,
    40.75, 443319.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-26',
    '2026-03-24',
    4571,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    24917, 0, 24917,
    487, 24430,
    40.75, 995522.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-26',
    '2026-03-25',
    4571,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    24322, 0, 24322,
    477, 23845,
    40.75, 971684.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-26',
    '2026-03-26',
    4571,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    144, 0, 144,
    3, 141,
    40.75, 5746.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-29',
    '2026-03-26',
    4572,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    25438, 0, 25438,
    498, 24940,
    40.75, 1016305.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-29',
    '2026-03-27',
    4572,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    25083, 0, 25083,
    492, 24591,
    40.75, 1002083.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-29',
    '2026-03-28',
    4572,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    9959, 0, 9959,
    195, 9764,
    40.75, 397883.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-01',
    '2026-03-28',
    4573,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    14307, 0, 14307,
    280, 14027,
    40.75, 571600.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-01',
    '2026-03-29',
    4573,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    24697, 0, 24697,
    484, 24213,
    40.75, 986680.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-01',
    '2026-03-30',
    4573,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    24164, 0, 24164,
    474, 23690,
    40.75, 965368.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-01',
    '2026-03-31',
    4573,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    7392, 0, 7392,
    145, 7247,
    40.75, 295315.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-02',
    '2026-04-02',
    56,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Akshaya Poultry and Hatchery') LIMIT 1),
    0, 10814, 10814,
    212, 10602,
    40.75, 432032.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-04',
    '2026-03-31',
    4574,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    16980, 0, 16980,
    333, 16647,
    40.75, 678365.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-04',
    '2026-04-01',
    4574,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    24550, 0, 24550,
    481, 24069,
    40.75, 980812.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-04',
    '2026-04-02',
    4574,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    24971, 0, 24971,
    489, 24482,
    40.75, 997642.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-04',
    '2026-04-03',
    4574,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    4059, 0, 4059,
    80, 3979,
    40.75, 162144.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-06',
    '2026-04-03',
    4575,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    20157, 0, 20157,
    395, 19762,
    40.75, 805302.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-06',
    '2026-04-04',
    4575,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    24165, 0, 24165,
    474, 23691,
    40.75, 965408.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-06',
    '2026-04-05',
    4575,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    24007, 0, 24007,
    471, 23536,
    36.75, 864948.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-06',
    '2026-04-06',
    4575,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    2231, 0, 2231,
    44, 2187,
    36.75, 80372.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-09',
    '2026-04-06',
    4576,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    22416, 0, 22416,
    439, 21977,
    36.75, 807655.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-09',
    '2026-04-07',
    4576,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    24957, 0, 24957,
    489, 24468,
    36.75, 899199.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-09',
    '2026-04-08',
    4576,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    23187, 0, 23187,
    454, 22733,
    36.75, 835438.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-11',
    '2026-04-08',
    4577,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    1556, 0, 1556,
    30, 1526,
    36.75, 56081.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-11',
    '2026-04-09',
    4577,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    23689, 0, 23689,
    464, 23225,
    36.75, 853519.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-11',
    '2026-04-10',
    4577,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    23901, 0, 23901,
    468, 23433,
    36.75, 861163.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-11',
    '2026-04-11',
    4577,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    11334, 0, 11334,
    222, 11112,
    36.75, 408366.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-14',
    '2026-04-11',
    4578,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    12925, 0, 12925,
    253, 12672,
    36.75, 465696.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-14',
    '2026-04-12',
    4578,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    23569, 0, 23569,
    462, 23107,
    35.75, 826075.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-14',
    '2026-04-13',
    4578,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    23986, 0, 23986,
    470, 23516,
    35.75, 840697.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-18',
    '2026-04-13',
    4579,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    692, 0, 692,
    14, 678,
    35.75, 24239.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-18',
    '2026-04-14',
    4579,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    24045, 0, 24045,
    471, 23574,
    35.75, 842771.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-18',
    '2026-04-15',
    4579,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    23393, 0, 23393,
    459, 22934,
    35.75, 819891.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-18',
    '2026-04-16',
    4579,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    22430, 0, 22430,
    440, 21990,
    35.75, 786143.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-20',
    '2026-04-16',
    4580,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    524, 0, 524,
    10, 514,
    35.75, 18376.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-20',
    '2026-04-17',
    4580,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    24104, 0, 24104,
    472, 23632,
    35.75, 844844.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-20',
    '2026-04-18',
    4580,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    23854, 0, 23854,
    468, 23386,
    35.75, 836050.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-20',
    '2026-04-19',
    4580,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    22078, 0, 22078,
    433, 21645,
    32.75, 708874.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-22',
    '2026-04-20',
    57,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ellandula Srinivas Kamareddy') LIMIT 1),
    0, 8190, 8190,
    161, 8029,
    32.75, 262950.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-24',
    '2026-04-19',
    4581,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    1618, 0, 1618,
    32, 1586,
    32.75, 51942.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-24',
    '2026-04-20',
    4581,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    23715, 0, 23715,
    465, 23250,
    32.75, 761438.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-24',
    '2026-04-21',
    4581,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    24016, 0, 24016,
    471, 23545,
    32.75, 771099.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-24',
    '2026-04-22',
    4581,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    11131, 0, 11131,
    218, 10913,
    32.75, 357401.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-26',
    '2026-04-22',
    4582,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    12453, 0, 12453,
    244, 12209,
    32.75, 399845.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-26',
    '2026-04-23',
    4582,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    23949, 0, 23949,
    469, 23480,
    32.75, 768970.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-26',
    '2026-04-24',
    4582,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    23768, 0, 23768,
    466, 23302,
    32.75, 763141.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-26',
    '2026-04-25',
    4582,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    310, 0, 310,
    6, 304,
    32.75, 9956.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-28',
    '2026-04-25',
    4583,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    22582, 0, 22582,
    443, 22139,
    32.75, 725052.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-28',
    '2026-04-26',
    4583,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    23818, 0, 23818,
    467, 23351,
    26.75, 624639.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-28',
    '2026-04-27',
    4583,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    22870, 0, 22870,
    448, 22422,
    26.75, 599789.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-28',
    '2026-04-28',
    4583,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    1290, 0, 1290,
    25, 1265,
    26.75, 33839.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-01',
    '2026-04-28',
    4584,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    21672, 0, 21672,
    425, 21247,
    26.75, 568357.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-01',
    '2026-04-29',
    4584,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    23633, 0, 23633,
    463, 23170,
    26.75, 619798.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-01',
    '2026-04-30',
    4584,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    15175, 0, 15175,
    297, 14878,
    26.75, 397987.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-04',
    '2026-04-30',
    4585,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    8578, 0, 8578,
    168, 8410,
    26.75, 224968.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-04',
    '2026-05-01',
    4585,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    21660, 0, 21660,
    425, 21235,
    26.75, 568036.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-04',
    '2026-05-02',
    4585,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    23409, 0, 23409,
    459, 22950,
    26.75, 613913.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-04',
    '2026-05-03',
    4585,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    16913, 0, 16913,
    331, 16582,
    23.75, 393823.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-06',
    '2026-05-06',
    7070,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    0, 2100, 2100,
    0, 2100,
    23.75, 49875.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-07',
    '2026-05-03',
    4586,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    6082, 0, 6082,
    119, 5963,
    23.75, 141621.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-07',
    '2026-05-04',
    4586,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    22114, 0, 22114,
    433, 21681,
    23.75, 514924.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-07',
    '2026-05-05',
    4586,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    22922, 0, 22922,
    450, 22472,
    23.75, 533710.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-07',
    '2026-05-06',
    4586,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    19442, 0, 19442,
    381, 19061,
    23.75, 452699.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-07',
    '2026-05-07',
    58,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Raju Poultry Traders') LIMIT 1),
    0, 7980, 7980,
    156, 7824,
    23.75, 185820.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-10',
    '2026-05-06',
    4587,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    2608, 0, 2608,
    51, 2557,
    23.75, 60729.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-10',
    '2026-05-07',
    4587,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    22444, 0, 22444,
    439, 22005,
    23.75, 522618.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-10',
    '2026-05-08',
    4587,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    20448, 0, 20448,
    401, 20047,
    23.75, 476116.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-10',
    '2026-05-09',
    4588,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    14980, 0, 14980,
    294, 14686,
    23.75, 348793.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-13',
    '2026-05-09',
    4588,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    4115, 0, 4115,
    81, 4034,
    23.75, 95807.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-13',
    '2026-05-10',
    4588,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    20363, 0, 20363,
    398, 19965,
    21.75, 434239.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-13',
    '2026-05-11',
    4588,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    20660, 0, 20660,
    405, 20255,
    21.75, 440546.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-13',
    '2026-05-12',
    4588,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    15342, 0, 15342,
    301, 15041,
    21.75, 327142.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-16',
    '2026-05-12',
    4589,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    5421, 0, 5421,
    106, 5315,
    21.75, 115601.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-16',
    '2026-05-13',
    4589,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    20252, 0, 20252,
    397, 19855,
    21.75, 431846.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-16',
    '2026-05-14',
    4589,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    20756, 0, 20756,
    407, 20349,
    21.75, 442591.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-16',
    '2026-05-15',
    4589,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    14051, 0, 14051,
    275, 13776,
    21.75, 299628.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-18',
    '2026-05-18',
    59,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Raju Poultry Traders Egg') LIMIT 1),
    11760, 0, 11760,
    230, 11530,
    19.75, 227718.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-19',
    '2026-05-15',
    4590,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    6486, 0, 6486,
    127, 6359,
    21.75, 138308.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-19',
    '2026-05-16',
    4590,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    20161, 0, 20161,
    395, 19766,
    21.75, 429911.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-19',
    '2026-05-17',
    4590,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    19994, 0, 19994,
    392, 19602,
    19.75, 387139.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-19',
    '2026-05-18',
    4590,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    13839, 0, 13839,
    271, 13568,
    19.75, 267968.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-22',
    '2026-05-18',
    4591,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    6562, 0, 6562,
    128, 6434,
    19.75, 127072.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-22',
    '2026-05-19',
    4591,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    20192, 0, 20192,
    396, 19796,
    19.75, 390970.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-22',
    '2026-05-20',
    4591,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    20096, 0, 20096,
    394, 19702,
    19.75, 389115.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-22',
    '2026-05-21',
    4591,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    13630, 0, 13630,
    267, 13363,
    19.75, 263919.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-26',
    '2026-05-21',
    4592,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    7241, 0, 7241,
    142, 7099,
    19.75, 140205.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-26',
    '2026-05-22',
    4592,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    19374, 0, 19374,
    380, 18994,
    19.75, 375132.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-26',
    '2026-05-23',
    4592,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    20216, 0, 20216,
    395, 19821,
    19.75, 391464.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-26',
    '2026-05-24',
    4592,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    13649, 0, 13649,
    268, 13381,
    19.75, 264275.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-27',
    '2026-05-27',
    60,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    0, 15330, 15330,
    300, 15030,
    19.75, 296843.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-28',
    '2026-05-24',
    4593,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    6109, 0, 6109,
    120, 5989,
    19.75, 118283.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-28',
    '2026-05-25',
    4593,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    20087, 0, 20087,
    394, 19693,
    19.75, 388936.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-28',
    '2026-05-26',
    4593,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    20124, 0, 20124,
    393, 19731,
    19.75, 389687.0
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-28',
    '2026-05-27',
    4593,
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hitech Hatch Fresh Pvt Ltd') LIMIT 1),
    14160, 0, 14160,
    278, 13882,
    19.75, 274170.0
  )
ON CONFLICT DO NOTHING;
