-- Flock 16 Daily Records chunk 2/3
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
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-05-13', 24.6,
    44039, 4939,
    5638, 644,
    17763, 6794,
    9, 3,
    44030, 4936
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-05-14', 24.7,
    44030, 4936,
    5638, 644,
    18815, 8263,
    14, 4,
    44016, 4932
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-05-15', 24.9,
    44016, 4932,
    5634, 644,
    19458, 8856,
    17, 2,
    43999, 4930
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-05-16', 25.0,
    43999, 4930,
    5634, 644,
    19664, 9849,
    17, 1,
    43982, 4929
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-05-17', 25.1,
    43982, 4929,
    5762, 641,
    20644, 11016,
    14, 0,
    43968, 4929
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-05-18', 25.3,
    43968, 4929,
    5964, 641,
    21421, 11813,
    16, 2,
    43952, 4927
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-05-19', 25.4,
    43952, 4927,
    5964, 641,
    22169, 13301,
    9, 1,
    43943, 4926
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-05-20', 25.6,
    43943, 4926,
    6169, 641,
    22643, 13978,
    17, 2,
    43926, 4924
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-05-21', 25.7,
    43926, 4924,
    6169, 641,
    23082, 14305,
    33, 1,
    43893, 4923
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-05-22', 25.9,
    43893, 4923,
    6230, 641,
    22984, 14729,
    47, 2,
    43846, 4921
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-05-23', 26.0,
    43846, 4921,
    6230, 641,
    24602, 15482,
    54, 2,
    43792, 4919
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-05-24', 26.1,
    43792, 4919,
    6216, 639,
    24776, 16438,
    42, 5,
    43750, 4914
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-05-25', 26.3,
    43750, 4914,
    6296, 639,
    24104, 16424,
    24, 4,
    43726, 4910
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-05-26', 26.4,
    43726, 4910,
    6520, 639,
    22649, 15847,
    31, 5,
    43695, 4905
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-05-27', 26.6,
    43695, 4905,
    6520, 639,
    23756, 17515,
    21, 2,
    43674, 4903
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-05-28', 26.7,
    43674, 4903,
    6520, 639,
    24745, 17847,
    41, 6,
    43633, 4897
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-05-29', 26.9,
    43633, 4897,
    6719, 639,
    25012, 19068,
    49, 7,
    43584, 4890
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-05-30', 27.0,
    43584, 4890,
    6719, 639,
    25354, 19155,
    109, 4,
    43475, 4886
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-05-31', 27.1,
    43475, 4886,
    6704, 635,
    26186, 19272,
    213, 2,
    43262, 4884
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-06-01', 27.3,
    43262, 4884,
    6704, 635,
    26607, 20449,
    95, 4,
    43167, 4880
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-06-02', 27.4,
    43167, 4880,
    6704, 635,
    26822, 19426,
    50, 2,
    43117, 4878
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-06-03', 27.6,
    43117, 4878,
    6704, 635,
    28049, 21569,
    24, 1,
    43093, 4877
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-06-04', 27.7,
    43093, 4877,
    6704, 635,
    27985, 22991,
    24, 3,
    43069, 4874
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-06-05', 27.9,
    43069, 4874,
    6704, 635,
    27964, 23374,
    26, 2,
    43043, 4872
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-06-06', 28.0,
    43043, 4872,
    7059, 635,
    28456, 24371,
    17, 4,
    43026, 4868
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-06-07', 28.1,
    43026, 4868,
    7059, 635,
    29147, 25062,
    22, 5,
    43004, 4863
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-06-08', 28.3,
    43004, 4863,
    7059, 635,
    29582, 25761,
    16, 2,
    42988, 4861
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-06-09', 28.4,
    42988, 4861,
    7059, 635,
    29770, 25833,
    15, 3,
    42973, 4858
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-06-10', 28.6,
    42973, 4858,
    7059, 635,
    30288, 26274,
    19, 4,
    42954, 4854
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-06-11', 28.7,
    42954, 4854,
    7059, 635,
    30365, 26381,
    25, 4,
    42929, 4850
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-06-12', 28.9,
    42929, 4850,
    7059, 635,
    29866, 25947,
    19, 2,
    42910, 4848
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-06-13', 29.0,
    42910, 4848,
    7059, 635,
    30726, 26937,
    35, 5,
    42875, 4843
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-06-14', 29.1,
    42875, 4843,
    7031, 630,
    31491, 27850,
    29, 1,
    42846, 4842
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-06-15', 29.3,
    42846, 4842,
    7031, 630,
    31543, 28249,
    27, 3,
    42819, 4839
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-06-16', 29.4,
    42819, 4839,
    7031, 630,
    31608, 28222,
    26, 4,
    42790, 4835
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-06-17', 29.6,
    42790, 4835,
    7031, 630,
    31293, 27995,
    36, 3,
    42754, 4832
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-06-18', 29.7,
    42754, 4832,
    7031, 630,
    31804, 28408,
    24, 3,
    42730, 4829
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-06-19', 29.9,
    42730, 4829,
    7031, 630,
    31838, 28482,
    28, 4,
    42702, 4825
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-06-20', 30.0,
    42702, 4825,
    7031, 630,
    31999, 28755,
    20, 6,
    42682, 4819
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-06-21', 30.1,
    42682, 4819,
    6999, 626,
    32204, 28972,
    23, 5,
    42659, 4814
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-06-22', 30.3,
    42659, 4814,
    6999, 626,
    32193, 29189,
    27, 4,
    42632, 4810
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-06-23', 30.4,
    42632, 4810,
    6999, 626,
    32322, 29401,
    28, 4,
    42593, 4806
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-06-24', 30.6,
    42593, 4806,
    6999, 626,
    32541, 29636,
    26, 4,
    42567, 4802
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-06-25', 30.7,
    42567, 4802,
    6999, 626,
    32767, 29931,
    29, 6,
    42538, 4796
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-06-26', 30.9,
    42538, 4796,
    6999, 626,
    31322, 28543,
    27, 4,
    42511, 4792
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-06-27', 31.0,
    42511, 4792,
    6999, 626,
    32096, 29259,
    30, 3,
    42481, 4789
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-06-28', 31.1,
    42481, 4789,
    6967, 623,
    32174, 29336,
    26, 3,
    42455, 4786
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-06-29', 31.3,
    42455, 4786,
    6967, 623,
    32383, 29096,
    35, 0,
    42420, 4786
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-06-30', 31.4,
    42420, 4786,
    6967, 623,
    32551, 30199,
    23, 2,
    42390, 4784
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-07-01', 31.6,
    42390, 4784,
    0, 0,
    0, 0,
    0, 0,
    42390, 4784
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-07-02', 31.7,
    42359, 4780,
    6967, 623,
    31747, 29489,
    29, 1,
    42330, 4779
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-07-03', 31.9,
    42330, 4779,
    6967, 623,
    32036, 29711,
    24, 3,
    42306, 4776
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-07-04', 32.0,
    42306, 4776,
    6967, 623,
    32503, 29929,
    19, 1,
    42287, 4775
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-07-05', 32.1,
    42287, 4775,
    6935, 621,
    32117, 29589,
    23, 1,
    42264, 4774
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-07-06', 32.3,
    42264, 4774,
    6935, 621,
    32366, 29834,
    16, 0,
    42248, 4774
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-07-07', 32.4,
    42248, 4774,
    6935, 621,
    32189, 29695,
    19, 3,
    42225, 4771
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-07-08', 32.6,
    42225, 4771,
    6935, 621,
    32522, 30039,
    24, 4,
    42201, 4767
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-07-09', 32.7,
    42201, 4767,
    6935, 621,
    32749, 30085,
    22, 2,
    42179, 4765
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-07-10', 32.9,
    42179, 4765,
    6935, 621,
    32765, 30021,
    23, 3,
    42156, 4762
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-07-11', 33.0,
    42156, 4762,
    6935, 621,
    32137, 29308,
    22, 3,
    42134, 4759
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-07-12', 33.1,
    42134, 4759,
    6911, 620,
    32673, 29991,
    20, 4,
    42114, 4755
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-07-13', 33.3,
    42114, 4755,
    6911, 620,
    31751, 29084,
    13, 6,
    42101, 4749
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-07-14', 33.4,
    42101, 4749,
    6911, 620,
    30738, 28404,
    22, 3,
    42072, 4746
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-07-15', 33.6,
    42072, 4746,
    6911, 620,
    31932, 29769,
    23, 4,
    42049, 4742
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-07-16', 33.7,
    42049, 4742,
    6911, 620,
    32041, 29712,
    20, 5,
    42029, 4737
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-07-17', 33.9,
    42029, 4737,
    6911, 620,
    32482, 29993,
    27, 2,
    42002, 4735
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-07-18', 34.0,
    42002, 4735,
    6762, 615,
    33078, 30645,
    28, 4,
    41974, 4731
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-07-19', 34.1,
    41974, 4731,
    6758, 615,
    33583, 31335,
    26, 3,
    41948, 4728
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-07-20', 34.3,
    41948, 4728,
    6758, 615,
    33340, 31032,
    22, 1,
    41926, 4727
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-07-21', 34.4,
    41926, 4727,
    6758, 615,
    32485, 30371,
    19, 5,
    41895, 4722
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-07-22', 34.6,
    41895, 4722,
    6758, 615,
    32185, 29974,
    20, 4,
    41875, 4718
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-07-23', 34.7,
    41875, 4718,
    6758, 615,
    31784, 29593,
    26, 3,
    41849, 4715
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-07-24', 34.9,
    41849, 4715,
    6758, 615,
    32119, 30192,
    22, 4,
    41827, 4711
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-07-25', 35.0,
    41827, 4711,
    6758, 615,
    32281, 30404,
    22, 2,
    41805, 4709
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-07-26', 35.1,
    41805, 4709,
    6730, 612,
    32385, 30535,
    22, 3,
    41783, 4706
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-07-27', 35.3,
    41783, 4706,
    6730, 612,
    31882, 29910,
    22, 2,
    41761, 4704
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-07-28', 35.4,
    41761, 4704,
    6730, 612,
    31901, 30155,
    21, 3,
    41729, 4701
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-07-29', 35.6,
    41729, 4701,
    6730, 612,
    31726, 29990,
    25, 3,
    41704, 4698
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-07-30', 35.7,
    41704, 4698,
    6730, 612,
    31760, 29987,
    25, 3,
    41679, 4695
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-07-31', 35.9,
    41679, 4695,
    6730, 612,
    32000, 30169,
    22, 2,
    41657, 4693
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-08-01', 36.0,
    41657, 4693,
    6730, 612,
    31799, 29897,
    18, 4,
    41639, 4689
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-08-02', 36.1,
    41639, 4689,
    6704, 609,
    31262, 29339,
    19, 2,
    41620, 4687
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-08-03', 36.3,
    41620, 4687,
    6704, 609,
    31651, 29551,
    19, 3,
    41601, 4684
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-08-04', 36.4,
    41601, 4684,
    6704, 609,
    31500, 29412,
    18, 4,
    41573, 4680
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-08-05', 36.6,
    41573, 4680,
    6704, 609,
    31707, 29429,
    17, 3,
    41556, 4677
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-08-06', 36.7,
    41556, 4677,
    6704, 609,
    32011, 30192,
    18, 2,
    41538, 4675
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-08-07', 36.9,
    41538, 4675,
    6704, 609,
    32232, 30045,
    17, 4,
    41521, 4671
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-08-08', 37.0,
    41521, 4671,
    6704, 609,
    31494, 29299,
    17, 2,
    41504, 4669
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-08-09', 37.1,
    41504, 4669,
    6682, 608,
    31645, 28587,
    14, 2,
    41490, 4667
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-08-10', 37.3,
    41490, 4667,
    6682, 608,
    31899, 29280,
    17, 1,
    41473, 4666
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-08-11', 37.4,
    41473, 4666,
    6682, 608,
    32149, 29820,
    18, 2,
    41455, 4664
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-08-12', 37.6,
    41455, 4664,
    6682, 608,
    29978, 27884,
    20, 3,
    41435, 4661
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-08-13', 37.7,
    41435, 4661,
    6682, 608,
    30078, 28405,
    28, 4,
    41407, 4657
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-08-14', 37.9,
    41407, 4657,
    6682, 608,
    30038, 28192,
    19, 3,
    41388, 4654
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-08-15', 38.0,
    41388, 4654,
    6682, 608,
    30274, 28384,
    21, 4,
    41367, 4650
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-08-16', 38.1,
    41367, 4650,
    6660, 605,
    31253, 29110,
    15, 3,
    41352, 4647
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-08-17', 38.3,
    41352, 4647,
    6660, 605,
    32747, 30356,
    25, 1,
    41327, 4646
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-08-18', 38.4,
    41327, 4646,
    6570, 605,
    32530, 30101,
    22, 1,
    41305, 4645
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-08-19', 38.6,
    41305, 4645,
    6570, 605,
    32722, 30179,
    20, 1,
    41285, 4644
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-08-20', 38.7,
    41285, 4644,
    6570, 605,
    32153, 29927,
    24, 3,
    41261, 4641
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-08-21', 38.9,
    41261, 4641,
    6570, 605,
    32245, 30151,
    19, 3,
    41242, 4638
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-08-22', 39.0,
    41242, 4638,
    6570, 605,
    31933, 29768,
    21, 3,
    41221, 4635
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-08-23', 39.1,
    41221, 4635,
    6554, 602,
    31466, 29403,
    19, 4,
    41202, 4631
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-08-24', 39.3,
    41202, 4631,
    6469, 602,
    31600, 29818,
    22, 3,
    41180, 4628
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-08-25', 39.4,
    41180, 4628,
    6469, 602,
    30571, 28656,
    22, 1,
    41158, 4627
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-08-26', 39.6,
    41158, 4627,
    6469, 602,
    30242, 28345,
    24, 4,
    41134, 4623
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-08-27', 39.7,
    41134, 4623,
    6469, 602,
    30429, 28866,
    22, 2,
    41112, 4621
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-08-28', 39.9,
    41112, 4621,
    6469, 602,
    30508, 28779,
    24, 3,
    41088, 4618
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-08-29', 40.0,
    41088, 4618,
    6469, 602,
    30446, 28286,
    19, 4,
    41069, 4614
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-08-30', 40.1,
    41069, 4614,
    6448, 600,
    30542, 28170,
    26, 4,
    41043, 4610
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-08-31', 40.3,
    41043, 4610,
    6448, 600,
    30424, 28316,
    24, 3,
    41019, 4607
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-09-01', 40.4,
    41019, 4607,
    6448, 600,
    30140, 28041,
    21, 1,
    40987, 4606
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-09-02', 40.6,
    40987, 4606,
    6448, 600,
    28902, 26889,
    25, 3,
    40962, 4603
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-09-03', 40.7,
    40962, 4603,
    6448, 600,
    29821, 27531,
    22, 3,
    40940, 4600
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-09-04', 40.9,
    40940, 4600,
    6448, 600,
    29849, 27688,
    26, 4,
    40914, 4596
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-09-05', 41.0,
    40914, 4596,
    6448, 600,
    30123, 27776,
    29, 4,
    40885, 4592
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-09-06', 41.1,
    40885, 4592,
    6419, 597,
    29831, 27519,
    23, 4,
    40862, 4588
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-09-07', 41.3,
    40862, 4588,
    6419, 597,
    29524, 27037,
    25, 3,
    40837, 4585
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-09-08', 41.4,
    40837, 4585,
    6419, 597,
    29548, 27454,
    26, 4,
    40811, 4581
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-09-09', 41.6,
    40811, 4581,
    6419, 597,
    28616, 26357,
    28, 4,
    40774, 4577
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-09-10', 41.7,
    40774, 4577,
    6419, 597,
    28985, 26936,
    26, 3,
    40748, 4574
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-09-11', 41.9,
    40748, 4574,
    6419, 597,
    28749, 26817,
    25, 2,
    40723, 4572
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-09-12', 42.0,
    40723, 4572,
    6419, 597,
    29509, 27422,
    26, 0,
    40697, 4572
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-09-13', 42.1,
    40697, 4572,
    6389, 594,
    29284, 27348,
    25, 1,
    40672, 4571
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-09-14', 42.3,
    40672, 4571,
    6389, 594,
    28537, 26538,
    20, 2,
    40652, 4569
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-09-15', 42.4,
    40652, 4569,
    6389, 594,
    28001, 26205,
    19, 2,
    40628, 4567
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-09-16', 42.6,
    40628, 4567,
    6389, 594,
    28386, 26622,
    23, 3,
    40605, 4564
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-09-17', 42.7,
    40605, 4564,
    6389, 594,
    29009, 27166,
    26, 2,
    40579, 4562
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-09-18', 42.9,
    40579, 4562,
    6389, 594,
    29409, 27460,
    26, 3,
    40553, 4559
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-09-19', 43.0,
    40553, 4559,
    6389, 594,
    29617, 27714,
    29, 3,
    40524, 4556
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-09-20', 43.1,
    40524, 4556,
    6362, 592,
    29832, 28117,
    28, 3,
    40496, 4553
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-09-21', 43.3,
    40496, 4553,
    6362, 592,
    29432, 27693,
    25, 1,
    40471, 4552
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-09-22', 43.4,
    40471, 4552,
    6362, 592,
    29050, 27153,
    22, 2,
    40433, 4550
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-09-23', 43.6,
    40433, 4550,
    6362, 592,
    28439, 26534,
    21, 2,
    40412, 4548
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-09-24', 43.7,
    40412, 4548,
    6264, 592,
    29149, 27377,
    26, 2,
    40386, 4546
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-09-25', 43.9,
    40386, 4546,
    6264, 592,
    28985, 27290,
    24, 2,
    40362, 4544
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-09-26', 44.0,
    40362, 4544,
    6264, 592,
    28244, 26516,
    23, 3,
    40339, 4541
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-09-27', 44.1,
    40339, 4541,
    6252, 590,
    28201, 26570,
    22, 3,
    40317, 4538
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-09-28', 44.3,
    40317, 4538,
    6252, 590,
    27938, 26066,
    25, 3,
    40292, 4535
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-09-29', 44.4,
    40292, 4535,
    6252, 590,
    28420, 26549,
    26, 3,
    40258, 4532
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-09-30', 44.6,
    40258, 4532,
    6252, 590,
    28630, 26669,
    27, 3,
    40231, 4529
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-10-01', 44.7,
    40231, 4529,
    0, 0,
    0, 0,
    0, 0,
    40231, 4529
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-10-02', 44.9,
    40200, 4527,
    6252, 590,
    28689, 26472,
    26, 3,
    40174, 4524
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-10-03', 45.0,
    40174, 4524,
    6252, 590,
    28729, 26538,
    25, 3,
    40149, 4521
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-10-04', 45.1,
    40149, 4521,
    6223, 588,
    28828, 26720,
    23, 4,
    40126, 4517
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-10-05', 45.3,
    40126, 4517,
    6223, 588,
    27383, 25742,
    22, 3,
    40104, 4514
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-10-06', 45.4,
    40104, 4514,
    6223, 588,
    28367, 26461,
    20, 3,
    40075, 4511
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-10-07', 45.6,
    40075, 4511,
    6223, 588,
    28569, 26671,
    19, 4,
    40056, 4507
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-10-08', 45.7,
    40056, 4507,
    6223, 588,
    28374, 26268,
    19, 4,
    40037, 4503
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-10-09', 45.9,
    40037, 4503,
    6223, 588,
    28087, 26287,
    20, 4,
    40017, 4499
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-10-10', 46.0,
    40017, 4499,
    6223, 588,
    27982, 26251,
    21, 3,
    39996, 4496
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-10-11', 46.1,
    39996, 4496,
    6199, 584,
    27445, 25853,
    23, 4,
    39973, 4492
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-10-12', 46.3,
    39973, 4492,
    6199, 584,
    27527, 25842,
    22, 3,
    39945, 4489
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-10-13', 46.4,
    39945, 4489,
    6199, 584,
    27423, 25640,
    25, 3,
    39920, 4486
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-10-14', 46.6,
    39920, 4486,
    6199, 584,
    27746, 26032,
    24, 2,
    39896, 4484
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-10-15', 46.7,
    39896, 4484,
    6199, 584,
    27535, 25641,
    28, 3,
    39868, 4481
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-10-16', 46.9,
    39868, 4481,
    6199, 584,
    26703, 25034,
    25, 4,
    39843, 4477
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-10-17', 47.0,
    39843, 4477,
    6199, 584,
    26812, 25350,
    27, 5,
    39816, 4472
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-10-18', 47.1,
    39816, 4472,
    6171, 581,
    26230, 24430,
    28, 3,
    39788, 4469
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-10-19', 47.3,
    39788, 4469,
    6171, 581,
    26200, 24490,
    34, 2,
    39754, 4467
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-10-20', 47.4,
    39754, 4467,
    6171, 581,
    25203, 23351,
    39, 5,
    39698, 4462
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-10-21', 47.6,
    39698, 4462,
    6171, 581,
    25998, 24350,
    27, 4,
    39671, 4458
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-10-22', 47.7,
    39671, 4458,
    6171, 581,
    25865, 23949,
    29, 4,
    39642, 4454
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-10-23', 47.9,
    39642, 4454,
    6171, 581,
    25568, 23459,
    28, 5,
    39614, 4449
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-10-24', 48.0,
    39614, 4449,
    6171, 581,
    25175, 23097,
    25, 3,
    39589, 4446
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-10-25', 48.1,
    39589, 4446,
    6136, 581,
    26216, 24186,
    24, 2,
    39565, 4444
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-10-26', 48.3,
    39565, 4444,
    6136, 581,
    25453, 23337,
    27, 2,
    39538, 4442
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-10-27', 48.4,
    39538, 4442,
    6136, 581,
    25425, 23206,
    28, 3,
    39502, 4439
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-10-28', 48.6,
    39502, 4439,
    6136, 581,
    25073, 22902,
    24, 3,
    39478, 4436
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-10-29', 48.7,
    39478, 4436,
    6136, 581,
    24921, 22910,
    25, 4,
    39453, 4432
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-10-30', 48.9,
    39453, 4432,
    6136, 581,
    24726, 22685,
    27, 1,
    39426, 4431
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-10-31', 49.0,
    39426, 4431,
    6136, 581,
    24637, 23110,
    25, 3,
    39393, 4428
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-11-01', 49.1,
    39393, 4428,
    6106, 578,
    24152, 22720,
    23, 4,
    39370, 4424
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-11-02', 49.3,
    39370, 4424,
    6106, 578,
    24092, 22794,
    23, 3,
    39347, 4421
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-11-03', 49.4,
    39347, 4421,
    6106, 578,
    24639, 23213,
    25, 4,
    39309, 4417
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-11-04', 49.6,
    39309, 4417,
    6106, 578,
    25214, 23512,
    19, 2,
    39290, 4415
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-11-05', 49.7,
    39290, 4415,
    6106, 578,
    25280, 23539,
    23, 1,
    39267, 4414
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-11-06', 49.9,
    39267, 4414,
    6106, 578,
    25087, 23246,
    21, 3,
    39246, 4411
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-11-07', 50.0,
    39246, 4411,
    6106, 578,
    24923, 23105,
    23, 5,
    39223, 4406
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-11-08', 50.1,
    39223, 4406,
    6079, 572,
    25169, 23326,
    24, 2,
    39199, 4404
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-11-09', 50.3,
    39199, 4404,
    6079, 572,
    25264, 23325,
    21, 3,
    39178, 4401
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-11-10', 50.4,
    39178, 4401,
    6079, 572,
    24990, 23231,
    23, 2,
    39150, 4399
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-11-11', 50.6,
    39150, 4399,
    6079, 572,
    24828, 22969,
    22, 3,
    39128, 4396
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-11-12', 50.7,
    39128, 4396,
    6079, 572,
    25270, 23351,
    24, 2,
    39104, 4394
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-11-13', 50.9,
    39104, 4394,
    5982, 572,
    25479, 23797,
    24, 2,
    38781, 4361
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-11-14', 51.0,
    38781, 4361,
    5982, 572,
    25324, 23475,
    21, 3,
    38760, 4358
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-11-15', 51.1,
    38760, 4358,
    5930, 566,
    25361, 23567,
    23, 4,
    38737, 4354
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-11-16', 51.3,
    38737, 4354,
    5930, 566,
    24515, 22816,
    21, 4,
    38716, 4350
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-11-17', 51.4,
    38716, 4350,
    5930, 566,
    24759, 23173,
    21, 4,
    38684, 4346
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-11-18', 51.6,
    38684, 4346,
    5930, 566,
    25070, 23391,
    19, 4,
    38665, 4342
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-11-19', 51.7,
    38665, 4342,
    5930, 566,
    24703, 22921,
    20, 3,
    38645, 4339
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-11-20', 51.9,
    38645, 4339,
    5930, 566,
    24282, 22501,
    23, 4,
    38622, 4335
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-11-21', 52.0,
    38622, 4335,
    5930, 566,
    24577, 22719,
    22, 4,
    38600, 4331
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-11-22', 52.1,
    38600, 4331,
    5906, 563,
    23813, 21881,
    25, 4,
    38575, 4327
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-11-23', 52.3,
    38575, 4327,
    5906, 563,
    23941, 22031,
    24, 3,
    38551, 4324
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-11-24', 52.4,
    38551, 4324,
    5906, 563,
    23563, 21644,
    20, 5,
    38526, 4319
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-11-25', 52.6,
    38526, 4319,
    5906, 563,
    23663, 21962,
    24, 4,
    38502, 4315
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-11-26', 52.7,
    38502, 4315,
    5906, 563,
    23452, 21729,
    24, 4,
    38478, 4311
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-11-27', 52.9,
    38478, 4311,
    5906, 563,
    23552, 21870,
    24, 3,
    38454, 4308
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    (SELECT id FROM public.farms WHERE code='PPALLY'),
    '2024-11-28', 53.0,
    38454, 4308,
    5906, 563,
    23392, 21528,
    20, 4,
    38434, 4304
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
