-- Flock 20 Sales (NHE Sales)
-- 566 records

INSERT INTO public.nhe_sales (
  flock_id, sale_date, sale_type, party_id, dc_no,
  quantity, unit, rate, amount, remarks
) VALUES
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-08-01', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Jhanta Behera') LIMIT 1),
    '5444',
    3.6, 'nos',
    80.0, 288.0,
    'Lame Birds - 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-08-01', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Subhash Dehuri') LIMIT 1),
    '5445',
    3.8, 'nos',
    80.0, 304.0,
    'Lame Birds - 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-08-01', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Tapan Halder') LIMIT 1),
    '5446',
    3.7, 'nos',
    80.0, 296.0,
    'Lame Birds - 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-08-01', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bhagban Mahakur') LIMIT 1),
    '5447',
    3.9, 'nos',
    80.0, 312.0,
    'Lame Birds - 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-08-03', 'other',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '5448',
    NULL, 'nos',
    NULL, 6517.0,
    'F-17 BE+JE+TE'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-08-06', 'gas',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Baidyanath Maity') LIMIT 1),
    '4281',
    1, 'nos',
    1920.0, 1920.0,
    'HP Gas Cylinder 19 Kg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-08-06', 'gas',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Radhu Singh') LIMIT 1),
    '4282',
    1, 'nos',
    1920.0, 1920.0,
    'HP Gas Cylinder 19 Kg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-08-06', 'gas',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Rana Behera') LIMIT 1),
    '4283',
    1, 'nos',
    1920.0, 1920.0,
    'HP Gas Cylinder 19 Kg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-08-06', 'gas',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bhagban Mahakur') LIMIT 1),
    '4284',
    1, 'nos',
    1920.0, 1920.0,
    'HP Gas Cylinder 19 Kg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-08-14', 'gas',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Mita Ghorai') LIMIT 1),
    '4285',
    1, 'nos',
    1920.0, 1920.0,
    'HP Gas Cylinder 19 Kg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-08-14', 'gas',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Transfer To Ppally') LIMIT 1),
    '4286',
    4, 'nos',
    0.0, 0.0,
    'HP Gas Cylinder 19 Kg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-08-14', 'gas',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Transfer To Bpet1') LIMIT 1),
    '4287',
    6, 'nos',
    0.0, 0.0,
    'HP Gas Cylinder 19 Kg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-08-18', 'gas',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Rakesh Behera') LIMIT 1),
    '5450',
    1, 'nos',
    1920.0, 1920.0,
    'Hp Gas Cylinder 19 kg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-08-21', 'gas',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Anil Murmu') LIMIT 1),
    '5451',
    1, 'nos',
    1920.0, 1920.0,
    'Hp Gas Cylinder 19 kg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-08-29', 'gas',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Transfer To Bpet1') LIMIT 1),
    '4288',
    2, 'nos',
    0.0, 0.0,
    'HP Gas Cylinder 19 Kg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-09-09', 'gas',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Karunakarmunda') LIMIT 1),
    '5452',
    1, 'nos',
    1836.0, 1836.0,
    'Hp Gas Cylinder 19 kg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-09-09', 'gas',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Akash Bag') LIMIT 1),
    '5453',
    1, 'nos',
    1836.0, 1836.0,
    'Hp Gas Cylinder 19 kg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-09-09', 'gas',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Transfer To Bpet1') LIMIT 1),
    '4289',
    10, 'nos',
    0.0, 0.0,
    'HP Gas Cylinder 19 Kg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-09-09', 'gas',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Transfer To Ppally') LIMIT 1),
    '4290',
    4, 'nos',
    0.0, 0.0,
    'HP Gas Cylinder 19 Kg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-09-14', 'gas',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Shaktipadamandal') LIMIT 1),
    '5454',
    1, 'nos',
    1836.0, 1836.0,
    'HP Gas Cylinder 19 Kg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-09-14', 'gas',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bhagban Mahakur') LIMIT 1),
    '5455',
    1, 'nos',
    1836.0, 1836.0,
    'HP Gas Cylinder 19 Kg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-09-24', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('F-20 Birds Transfer') LIMIT 1),
    '3832',
    80, 'kg',
    14.0, 1120.0,
    'Grade A -'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-09-24', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('F-20 Birds Transfer') LIMIT 1),
    '3833',
    80, 'kg',
    14.0, 1120.0,
    'Grade A -'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-09-24', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('F-20 Birds Transfer') LIMIT 1),
    '3834',
    80, 'kg',
    14.0, 1120.0,
    'Grade A -'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-09-24', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('F-20 Birds Transfer') LIMIT 1),
    '3835',
    80, 'kg',
    14.0, 1120.0,
    'Grade A -'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-09-24', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('F-20 Birds Transfer') LIMIT 1),
    '3836',
    80, 'kg',
    14.0, 1120.0,
    'Grade A -'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-09-24', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('F-20 Birds Transfer') LIMIT 1),
    '3837',
    80, 'kg',
    14.0, 1120.0,
    'Grade A -'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-09-24', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('F-20 Birds Transfer') LIMIT 1),
    '3838',
    80, 'kg',
    14.0, 1120.0,
    'Grade A -'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-09-24', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('F-20 Birds Transfer') LIMIT 1),
    '3839',
    80, 'kg',
    14.0, 1120.0,
    'Grade A -'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-09-24', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('F-20 Birds Transfer') LIMIT 1),
    '3840',
    80, 'kg',
    14.0, 1120.0,
    'Grade A -'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-09-24', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('F-20 Birds Transfer') LIMIT 1),
    '3841',
    80, 'kg',
    14.0, 1120.0,
    'Grade A -'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-09-25', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('F-20 Birds Transfer') LIMIT 1),
    '3842',
    80, 'kg',
    14.0, 1120.0,
    'Grade A -'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-09-25', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('F-20 Birds Transfer') LIMIT 1),
    '3843',
    80, 'kg',
    14.0, 1120.0,
    'Grade A -'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-09-25', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('F-20 Birds Transfer') LIMIT 1),
    '3844',
    80, 'kg',
    14.0, 1120.0,
    'Grade A -'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-09-25', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('F-20 Birds Transfer') LIMIT 1),
    '3845',
    80, 'kg',
    14.0, 1120.0,
    'Grade A -'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-09-25', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('F-20 Birds Transfer') LIMIT 1),
    '3846',
    80, 'kg',
    14.0, 1120.0,
    'Grade A -'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-09-25', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('F-20 Birds Transfer') LIMIT 1),
    '3847',
    80, 'kg',
    14.0, 1120.0,
    'Grade A -'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-09-25', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('F-20 Birds Transfer') LIMIT 1),
    '3848',
    80, 'kg',
    14.0, 1120.0,
    'Grade A -'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-09-25', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('F-20 Birds Transfer') LIMIT 1),
    '3849',
    80, 'kg',
    14.0, 1120.0,
    'Grade A -'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-09-25', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('F-20 Birds Transfer') LIMIT 1),
    '3850',
    80, 'kg',
    14.0, 1120.0,
    'Grade A - 64 + Grade B -16'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-09-25', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('F-20 Birds Transfer') LIMIT 1),
    '4001',
    80, 'kg',
    14.0, 1120.0,
    'Grade B'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-09-27', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('F-20 Birds Transfer') LIMIT 1),
    '4002',
    80, 'kg',
    14.0, 1120.0,
    'Grade B'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-09-27', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('F-20 Birds Transfer') LIMIT 1),
    '4003',
    80, 'kg',
    14.0, 1120.0,
    'Grade B'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-09-27', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('F-20 Birds Transfer') LIMIT 1),
    '4004',
    80, 'kg',
    14.0, 1120.0,
    'Grade B'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-09-27', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('F-20 Birds Transfer') LIMIT 1),
    '4005',
    80, 'kg',
    14.0, 1120.0,
    'Grade B'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-09-27', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('F-20 Birds Transfer') LIMIT 1),
    '4006',
    80, 'kg',
    14.0, 1120.0,
    'Grade B'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-09-27', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('F-20 Birds Transfer') LIMIT 1),
    '4007',
    80, 'kg',
    14.0, 1120.0,
    'Grade C'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-09-27', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('F-20 Birds Transfer') LIMIT 1),
    '4008',
    80, 'kg',
    14.0, 1120.0,
    'Grade C'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-09-27', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('F-20 Birds Transfer') LIMIT 1),
    '4009',
    80, 'kg',
    14.0, 1120.0,
    'Grade C'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-09-28', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('F-20 Birds Transfer') LIMIT 1),
    '4010',
    80, 'kg',
    12.0, 960.0,
    'Grade A Male'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-09-28', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('F-20 Birds Transfer') LIMIT 1),
    '4011',
    80, 'kg',
    10.0, 800.0,
    'Grade A Male'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-09-28', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('F-20 Birds Transfer') LIMIT 1),
    '4012',
    80, 'kg',
    10.0, 800.0,
    'Grade A Male'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-09-28', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('F-20 Birds Transfer') LIMIT 1),
    '4013',
    80, 'kg',
    10.0, 800.0,
    'Grade A Male'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-09-28', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('F-20 Birds Transfer') LIMIT 1),
    '4014',
    NULL, 'nos',
    NULL, 767.0,
    'Grade A+B+C Male'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-09-28', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('F-20 Birds Transfer') LIMIT 1),
    '4015',
    80, 'kg',
    14.0, 1120.0,
    'Grade C'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-09-28', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('F-20 Birds Transfer') LIMIT 1),
    '4016',
    80, 'kg',
    14.0, 1120.0,
    'Grade C'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-09-28', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('F-20 Birds Transfer') LIMIT 1),
    '4017',
    NULL, 'nos',
    NULL, 1502.0,
    'Grade C'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-10-01', 'gas',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Saheb Ghorai') LIMIT 1),
    '4291',
    1, 'nos',
    1836.0, 1836.0,
    'Hp Gas Cylinder 19 kg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-10-01', 'gas',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Tapas Singh') LIMIT 1),
    '4292',
    1, 'nos',
    1836.0, 1836.0,
    'Hp Gas Cylinder 19 kg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-10-01', 'gas',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Arup Bisawas') LIMIT 1),
    '4293',
    1, 'nos',
    1836.0, 1836.0,
    'Hp Gas Cylinder 19 kg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-10-01', 'gas',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ranjan Biswas') LIMIT 1),
    '4294',
    1, 'nos',
    1836.0, 1836.0,
    'Hp Gas Cylinder 19 kg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-10-11', 'gas',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Kedar Singh') LIMIT 1),
    '4295',
    1, 'nos',
    1836.0, 1836.0,
    'Hp Gas Cylinder 19 kg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-10-11', 'gas',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Rakesh Behera') LIMIT 1),
    '4296',
    1, 'nos',
    1836.0, 1836.0,
    'Hp Gas Cylinder 19 kg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-10-11', 'gas',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Rabindra Lohar') LIMIT 1),
    '4297',
    1, 'nos',
    1836.0, 1836.0,
    'Hp Gas Cylinder 19 kg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-10-11', 'gas',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Burning Purpose') LIMIT 1),
    '4298',
    1, 'nos',
    0.0, 0.0,
    'Hp Gas Cylinder 19 kg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-10-13', 'gas',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Jhanta Behera') LIMIT 1),
    '4299',
    1, 'nos',
    1836.0, 1836.0,
    'Hp Gas Cylinder 19 kg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-10-13', 'gas',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Radhu Singh') LIMIT 1),
    '4300',
    1, 'nos',
    1836.0, 1836.0,
    'Hp Gas Cylinder 19 kg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-10-13', 'gas',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sanajit Bag') LIMIT 1),
    '5901',
    1, 'nos',
    1836.0, 1836.0,
    'Hp Gas Cylinder 19 kg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-10-18', 'gas',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Kakali Hansda') LIMIT 1),
    '5902',
    1, 'nos',
    1852.0, 1852.0,
    'Hp Gas Cylinder 19 kg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-10-18', 'gas',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ghaneswari Naik') LIMIT 1),
    '5903',
    1, 'nos',
    1852.0, 1852.0,
    'Hp Gas Cylinder 19 kg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-10-18', 'gas',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Palash Dolai') LIMIT 1),
    '5904',
    1, 'nos',
    1852.0, 1852.0,
    'Hp Gas Cylinder 19 kg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-10-19', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Nepa naik') LIMIT 1),
    '5456',
    2.5, 'nos',
    80.0, 200.0,
    'Sex Error Birds -1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-10-19', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Rakesh Behera') LIMIT 1),
    '5457',
    2.5, 'nos',
    80.0, 200.0,
    'Sex Error Birds -1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-10-19', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Kalicharan Behera') LIMIT 1),
    '5458',
    2.2, 'nos',
    80.0, 176.0,
    'Sex Error Birds -1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-10-23', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Goutham Gharai') LIMIT 1),
    '5459',
    3.1, 'nos',
    80.0, 248.0,
    'Sex Error Birds -1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-10-23', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Tapan Halder') LIMIT 1),
    '5460',
    3, 'nos',
    80.0, 240.0,
    'Sex Error Birds -1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-10-23', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Arun Khan') LIMIT 1),
    '5461',
    3, 'nos',
    80.0, 240.0,
    'Sex Error Birds -1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-10-26', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Rakesh Behera') LIMIT 1),
    '5462',
    2.5, 'nos',
    80.0, 200.0,
    'Sex Error Birds -1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-10-26', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Rabindra Lohar') LIMIT 1),
    '5463',
    2.6, 'nos',
    80.0, 208.0,
    'Sex Error Birds -1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-10-26', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Karunakar Munda') LIMIT 1),
    '5464',
    2.4, 'nos',
    80.0, 192.0,
    'Sex Error Birds -1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-11-02', 'gas',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ramdas Mahali') LIMIT 1),
    '5905',
    1, 'nos',
    1852.0, 1852.0,
    'Hp Gas Cylinder 19 kg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-11-02', 'gas',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Dubraj Hemrem') LIMIT 1),
    '5906',
    1, 'nos',
    1852.0, 1852.0,
    'Hp Gas Cylinder 19 kg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-11-02', 'gas',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bhagbam Mahakur') LIMIT 1),
    '5907',
    1, 'nos',
    1852.0, 1852.0,
    'Hp Gas Cylinder 19 kg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-11-02', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Rakesh Behera') LIMIT 1),
    '5465',
    2.8, 'nos',
    80.0, 224.0,
    'Sex Error Birds -1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-11-02', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bhaskar Hatai') LIMIT 1),
    '5466',
    3, 'nos',
    80.0, 240.0,
    'Sex Error Birds -1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-11-02', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Biju Lohar') LIMIT 1),
    '5467',
    2.8, 'nos',
    80.0, 224.0,
    'Sex Error Birds -1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-11-02', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Tapas Ganjan') LIMIT 1),
    '5468',
    2.5, 'nos',
    80.0, 200.0,
    'Sex Error Birds -1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-11-02', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bhola Khan') LIMIT 1),
    '5469',
    2.2, 'nos',
    80.0, 176.0,
    'Sex Error Birds -1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-11-02', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Santhosh Behera') LIMIT 1),
    '5470',
    3.2, 'nos',
    80.0, 256.0,
    'Sex Error Birds -1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-11-02', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Chatu Das') LIMIT 1),
    '5471',
    2.9, 'nos',
    80.0, 232.0,
    'Sex Error Birds -1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-11-02', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ganesh Khan') LIMIT 1),
    '5472',
    2.6, 'nos',
    80.0, 208.0,
    'Sex Error Birds -1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-11-02', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Saktipada Mandal') LIMIT 1),
    '5473',
    2.8, 'nos',
    80.0, 224.0,
    'Sex Error Birds -1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-11-05', 'manure',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('S Ramesh') LIMIT 1),
    '5908',
    2, 'kg',
    11000.0, 22000.0,
    'Poultry Manure Sale'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-11-09', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sahadeb Ganjan') LIMIT 1),
    '5474',
    2.9, 'nos',
    80.0, 232.0,
    'Sex Error Birds -1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-11-09', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Makara Dehuri') LIMIT 1),
    '5475',
    5.8, 'nos',
    80.0, 464.0,
    'Sex Error Birds -2'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-11-09', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Jhanata Behera') LIMIT 1),
    '5476',
    2.4, 'nos',
    80.0, 192.0,
    'Sex Error Birds -1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-11-12', 'bird_cull',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sathyanarayana') LIMIT 1),
    '234',
    2252.91, 'nos',
    70.0, 157704.0,
    'Cull birds Female - 699 F-20'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-11-12', 'bird_cull',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sathyanarayana') LIMIT 1),
    '234',
    170.821, 'nos',
    70.0, 11957.0,
    'Cull birds Male - 53 F-20'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-11-14', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '5477',
    300, 'nos',
    5.4, 1620.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-11-15', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Karunakar Munda') LIMIT 1),
    '5478',
    28, 'kg',
    5.4, 151.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-11-15', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Karunakar Munda') LIMIT 1),
    '5478',
    2, 'kg',
    5.4, 11.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-11-15', 'manure',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('S Ramesh') LIMIT 1),
    '5479',
    9, 'kg',
    2000.0, 18000.0,
    'Poultry Manure Sale'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-11-17', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sonali Ganjan') LIMIT 1),
    '5480',
    30, 'kg',
    5.4, 162.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-11-17', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Kakali Hansda') LIMIT 1),
    '5481',
    7, 'kg',
    5.4, 38.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-11-17', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Kakali Hansda') LIMIT 1),
    '5481',
    23, 'kg',
    5.4, 124.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-11-17', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Pradip Behera') LIMIT 1),
    '5482',
    10, 'kg',
    5.4, 54.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-11-17', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Pradip Behera') LIMIT 1),
    '5482',
    20, 'kg',
    5.4, 108.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-11-18', 'manure',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('S Ramesh') LIMIT 1),
    '5909',
    1, 'kg',
    11000.0, 11000.0,
    'Poultry Manure Sale'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-11-21', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bhagban Mahakur') LIMIT 1),
    '5483',
    30, 'kg',
    5.4, 162.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-11-21', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Lakshi Kanta Singh') LIMIT 1),
    '5484',
    15, 'kg',
    1.0, 15.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-11-23', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '5485',
    60, 'kg',
    1.0, 60.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-11-23', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '5485',
    210, 'nos',
    5.85, 1229.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-11-23', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '5485',
    9240, 'nos',
    5.85, 54054.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-11-23', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Arun Khan') LIMIT 1),
    '5486',
    9.7, 'nos',
    80.0, 776.0,
    'Sex Error Birds -3'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-11-23', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Anil Murmu') LIMIT 1),
    '5487',
    3.1, 'nos',
    80.0, 248.0,
    'Sex Error Birds -1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-11-23', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Karunakarmunda') LIMIT 1),
    '5488',
    30, 'kg',
    5.85, 176.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-11-23', 'manure',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Mudarath Teekga') LIMIT 1),
    '5489',
    2, 'kg',
    2000.0, 4000.0,
    'Poultry Manure Sale Tractor'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-11-24', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Anil Murmu') LIMIT 1),
    '5490',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-11-26', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sonali Ganjan') LIMIT 1),
    '5491',
    30, 'kg',
    5.85, 176.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-11-26', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Subhadera Behera') LIMIT 1),
    '5492',
    30, 'kg',
    5.85, 176.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-11-26', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Dinesh') LIMIT 1),
    '5493',
    60, 'kg',
    5.85, 351.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-11-26', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Deba Singh') LIMIT 1),
    '5494',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-11-27', 'manure',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Mudvath Tekaya') LIMIT 1),
    '5495',
    1, 'kg',
    2000.0, 2000.0,
    'Poultry Manure Sale Tractor'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-11-29', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Pushpendr Kumar') LIMIT 1),
    '5496',
    30, 'kg',
    5.85, 176.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-11-29', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Anil Murmu') LIMIT 1),
    '5497',
    100, 'kg',
    1.0, 100.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-11-29', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Arun Khan') LIMIT 1),
    '5498',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-11-30', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Santosh Behera') LIMIT 1),
    '5499',
    3.5, 'nos',
    80.0, 280.0,
    'Sex Error Birds -1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-11-30', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Anil Murmu') LIMIT 1),
    '5500',
    3.9, 'nos',
    80.0, 312.0,
    'Sex Error Birds -1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-11-30', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Rana Behera') LIMIT 1),
    '6101',
    3.9, 'nos',
    80.0, 312.0,
    'Sex Error Birds -1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-11-30', 'manure',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Mudvath Tekaya') LIMIT 1),
    '6102',
    1, 'kg',
    2000.0, 2000.0,
    'Poultry Manure Sale Tractor'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-01', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sahadeb Ganjan') LIMIT 1),
    '6103',
    30, 'kg',
    5.85, 176.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-02', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6104',
    210, 'nos',
    1.0, 210.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-02', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6104',
    2730, 'nos',
    5.8, 15834.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-02', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6104',
    30870, 'nos',
    5.8, 179046.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-02', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Manoranjan Bag') LIMIT 1),
    '6105',
    30, 'kg',
    5.8, 174.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-03', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Deba Singh') LIMIT 1),
    '6106',
    50, 'kg',
    1.0, 50.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-04', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sahadeb Ganjan') LIMIT 1),
    '6107',
    30, 'kg',
    5.91, 177.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-04', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Karunakar Munda') LIMIT 1),
    '6108',
    30, 'kg',
    5.91, 177.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-04', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bhagban Mahakur') LIMIT 1),
    '6109',
    50, 'kg',
    1.0, 50.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-05', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6110',
    840, 'nos',
    5.91, 4964.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-06', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Deba Singh') LIMIT 1),
    '6111',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-06', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bhim Ganjan') LIMIT 1),
    '6112',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-06', 'manure',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Penta Reddy') LIMIT 1),
    '6113',
    4, 'kg',
    9500.0, 38000.0,
    'Poultry Manure Sale Tripper'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-06', 'manure',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('N Prakash') LIMIT 1),
    '5910',
    1, 'kg',
    11000.0, 11000.0,
    'Poultry Manure Sale Tripper'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-06', 'manure',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('N Prakash') LIMIT 1),
    '5910',
    1, 'kg',
    2000.0, 2000.0,
    'Poultry Manure Sale Tractor'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-06', 'gas',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Nita Mohanta') LIMIT 1),
    '5911',
    1, 'nos',
    1852.0, 1852.0,
    'Hp Gas Cylinder 19 kg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-06', 'gas',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Karunakar Munda') LIMIT 1),
    '5912',
    1, 'nos',
    1852.0, 1852.0,
    'Hp Gas Cylinder 19 kg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-06', 'gas',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Dhiren Behera') LIMIT 1),
    '5913',
    1, 'nos',
    1852.0, 1852.0,
    'Hp Gas Cylinder 19 kg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-06', 'gas',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Rana Behera') LIMIT 1),
    '5914',
    1, 'nos',
    1852.0, 1852.0,
    'Hp Gas Cylinder 19 kg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-07', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Nepa Naik') LIMIT 1),
    '6114',
    30, 'kg',
    5.91, 177.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-07', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Dhiren Behera') LIMIT 1),
    '6115',
    30, 'kg',
    5.91, 177.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-07', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Rupa Singh') LIMIT 1),
    '6116',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-07', 'bird_weak',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Nintu Metari') LIMIT 1),
    '5915',
    8.7, 'nos',
    80.0, 696.0,
    'Weak Birds Male 2'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-07', 'bird_weak',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Prakash Mohanta') LIMIT 1),
    '5916',
    4.1, 'nos',
    80.0, 328.0,
    'Weak Birds Male 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-07', 'bird_weak',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Birbahadur Beshra') LIMIT 1),
    '5917',
    3.3, 'nos',
    80.0, 264.0,
    'Weak Birds Female 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-07', 'bird_weak',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sujan Kalsar') LIMIT 1),
    '5918',
    3, 'nos',
    80.0, 240.0,
    'Weak Birds Female 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-07', 'bird_weak',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Pabitra Nayak') LIMIT 1),
    '5919',
    3, 'nos',
    80.0, 240.0,
    'Weak Birds Female 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-07', 'bird_weak',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Brinda Khan') LIMIT 1),
    '5920',
    4.7, 'nos',
    80.0, 376.0,
    'Weak Birds Male 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-07', 'bird_weak',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Suchitra Kadma') LIMIT 1),
    '5921',
    3.7, 'nos',
    80.0, 296.0,
    'Weak Birds Male 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-07', 'bird_weak',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Manoj Majhi') LIMIT 1),
    '5922',
    3, 'nos',
    80.0, 240.0,
    'Weak Birds Male 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-07', 'bird_weak',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Dubraj Hemrem') LIMIT 1),
    '5923',
    3.3, 'nos',
    80.0, 264.0,
    'Weak Birds Female 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-07', 'bird_weak',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Jhanta Behera') LIMIT 1),
    '5924',
    5, 'nos',
    80.0, 400.0,
    'Weak Birds Male 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-07', 'bird_weak',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Abhagi Das') LIMIT 1),
    '5925',
    4.4, 'nos',
    80.0, 352.0,
    'Weak Birds Male 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-07', 'bird_weak',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Shaktipada Mandal') LIMIT 1),
    '5926',
    4, 'nos',
    80.0, 320.0,
    'Weak Birds Male 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-07', 'bird_weak',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Shambu Bag') LIMIT 1),
    '5927',
    3.1, 'nos',
    80.0, 248.0,
    'Weak Birds Female 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-07', 'bird_weak',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Khursed Malik') LIMIT 1),
    '5928',
    3.1, 'nos',
    80.0, 248.0,
    'Weak Birds Female 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-07', 'bird_weak',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Tapas Ghorai') LIMIT 1),
    '5929',
    3.9, 'nos',
    80.0, 312.0,
    'Weak Birds Female 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-07', 'bird_weak',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Mithun Bag') LIMIT 1),
    '5930',
    3.9, 'nos',
    80.0, 312.0,
    'Weak Birds Female 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-07', 'manure',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('N Prakash') LIMIT 1),
    '5931',
    1, 'kg',
    2000.0, 2000.0,
    'Poultry Manure Sale Tractor'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-08', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Napa Naik') LIMIT 1),
    '6117',
    50, 'kg',
    1.0, 50.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-09', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6118',
    420, 'nos',
    1.0, 420.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-09', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6118',
    4620, 'nos',
    5.91, 27304.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-09', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6118',
    25830, 'nos',
    5.91, 152655.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-09', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Baidynath Maity') LIMIT 1),
    '6119',
    20, 'kg',
    1.0, 20.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-09', 'manure',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Raju') LIMIT 1),
    '6120',
    2, 'kg',
    10300.0, 20600.0,
    'Poultry Manure Sale Tripper'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-10', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Jhanta Behera') LIMIT 1),
    '6121',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-10', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Kakali Hansda') LIMIT 1),
    '6122',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-10', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Deba Singh') LIMIT 1),
    '6123',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-11', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Karunakar Munda') LIMIT 1),
    '6124',
    30, 'kg',
    5.91, 177.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-11', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Deba Singh') LIMIT 1),
    '6125',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-11', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Santosi Behera') LIMIT 1),
    '6126',
    20, 'kg',
    1.0, 20.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-11', 'gas',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Flock 20 Burning') LIMIT 1),
    '5932',
    1, 'nos',
    0.0, 0.0,
    'Hp Gas Cylinder 19 kg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-12', 'manure',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sailu') LIMIT 1),
    '6127',
    1, 'kg',
    12000.0, 12000.0,
    'Poultry Manure Sale Tripper'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-13', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Deba Singh') LIMIT 1),
    '6128',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-13', 'manure',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sivayya') LIMIT 1),
    '6129',
    1, 'kg',
    2500.0, 2500.0,
    'Poultry Manure Sale Tractor'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-14', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6130',
    4410, 'nos',
    6.01, 26504.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-14', 'manure',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Penta Reddy') LIMIT 1),
    '6132',
    1, 'kg',
    9500.0, 9500.0,
    'Poultry Manure Sale Tripper'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-14', 'bird_weak',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Mangali Baitha') LIMIT 1),
    '5933',
    5.1, 'nos',
    80.0, 408.0,
    'Weak Birds Male 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-14', 'bird_weak',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ajit Das') LIMIT 1),
    '5934',
    3, 'nos',
    80.0, 240.0,
    'Weak Birds Male 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-14', 'bird_weak',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Gopal Bag') LIMIT 1),
    '5935',
    4.8, 'nos',
    80.0, 384.0,
    'Weak Birds Male 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-14', 'bird_weak',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Dipanwita Sarkar') LIMIT 1),
    '5936',
    5.8, 'nos',
    80.0, 464.0,
    'Weak Birds Male 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-14', 'bird_weak',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bhim Ganjan') LIMIT 1),
    '5937',
    4.5, 'nos',
    80.0, 360.0,
    'Weak Birds Male 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-15', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Karunakarmunda') LIMIT 1),
    '6133',
    140, 'nos',
    1.0, 140.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-15', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sonali Ganjan') LIMIT 1),
    '6134',
    30, 'kg',
    6.01, 180.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-16', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Rabindra Lohar') LIMIT 1),
    '6135',
    70, 'kg',
    1.0, 70.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-18', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6136',
    700, 'nos',
    1.0, 700.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-18', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6136',
    8190, 'nos',
    6.11, 50041.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-18', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6136',
    13020, 'nos',
    6.11, 79552.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-19', 'gas',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Dubraj Hemrem') LIMIT 1),
    '5938',
    1, 'nos',
    1852.0, 1852.0,
    'Hp Gas Cylinder 19 kg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-19', 'gas',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Khursed Malik') LIMIT 1),
    '5939',
    1, 'nos',
    1852.0, 1852.0,
    'Hp Gas Cylinder 19 kg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-19', 'gas',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hiranmoy Mondal') LIMIT 1),
    '5940',
    1, 'nos',
    1852.0, 1852.0,
    'Hp Gas Cylinder 19 kg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-19', 'manure',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Namiya') LIMIT 1),
    '6137',
    7, 'kg',
    2000.0, 14000.0,
    'Poultry Manure Sale Tractor'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-19', 'manure',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Krishnayya') LIMIT 1),
    '6138',
    2, 'kg',
    9500.0, 19000.0,
    'Poultry Manure Sale Tripper'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-19', 'manure',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ratan') LIMIT 1),
    '6139',
    6, 'kg',
    2000.0, 12000.0,
    'Poultry Manure Sale Tractor'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-20', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Pradeep Behera') LIMIT 1),
    '6140',
    100, 'kg',
    1.0, 100.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-21', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sonali Ganjan') LIMIT 1),
    '6141',
    30, 'kg',
    6.11, 183.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-21', 'bird_weak',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Avinath Rishi') LIMIT 1),
    '5941',
    5, 'nos',
    80.0, 400.0,
    'Weak Birds Male 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-21', 'bird_weak',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bangi Hansda') LIMIT 1),
    '5942',
    3, 'nos',
    80.0, 240.0,
    'Weak Birds Male 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-21', 'bird_weak',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Brinda Khan') LIMIT 1),
    '5943',
    4, 'nos',
    80.0, 320.0,
    'Weak Birds Female 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-21', 'bird_weak',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Soymen Das') LIMIT 1),
    '5944',
    5, 'nos',
    80.0, 400.0,
    'Weak Birds Male 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-21', 'bird_weak',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Malati Mohanta') LIMIT 1),
    '5945',
    4.7, 'nos',
    80.0, 376.0,
    'Weak Birds Male 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-21', 'bird_weak',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bijay Adhikary') LIMIT 1),
    '5946',
    3.9, 'nos',
    80.0, 312.0,
    'Weak Birds Male 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-21', 'bird_weak',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Suna Naik') LIMIT 1),
    '5947',
    4.5, 'nos',
    80.0, 360.0,
    'Weak Birds Female 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-21', 'bird_weak',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Raju Dewan') LIMIT 1),
    '5948',
    3.9, 'nos',
    80.0, 312.0,
    'Weak Birds Male 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-21', 'bird_weak',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sujan Kalsar') LIMIT 1),
    '5949',
    3.8, 'nos',
    80.0, 304.0,
    'Weak Birds Female 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-21', 'bird_weak',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Y Ramesh') LIMIT 1),
    '5950',
    5, 'nos',
    80.0, 400.0,
    'Weak Birds Male 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-21', 'bird_weak',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Jhanta Behera') LIMIT 1),
    '5951',
    3.7, 'nos',
    80.0, 296.0,
    'Weak Birds Female 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-21', 'bird_weak',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bhagban Mahakur') LIMIT 1),
    '5952',
    4.9, 'nos',
    80.0, 392.0,
    'Weak Birds Male 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-21', 'bird_weak',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Pradeep Behera') LIMIT 1),
    '5953',
    4.2, 'nos',
    80.0, 336.0,
    'Weak Birds Male 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-21', 'bird_weak',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Tapas Ganjan') LIMIT 1),
    '5954',
    5, 'nos',
    80.0, 400.0,
    'Weak Birds Male 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-21', 'bird_weak',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Karunakar Munda') LIMIT 1),
    '5955',
    3.5, 'nos',
    80.0, 280.0,
    'Weak Birds Male 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-21', 'bird_weak',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Anil Murmu') LIMIT 1),
    '5956',
    4.4, 'nos',
    80.0, 352.0,
    'Weak Birds Male 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-21', 'bird_weak',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Santanu Ganjan') LIMIT 1),
    '5957',
    3.2, 'nos',
    80.0, 256.0,
    'Weak Birds Female 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-21', 'bird_weak',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Tanu Mandal') LIMIT 1),
    '5958',
    9.4, 'nos',
    80.0, 752.0,
    'Weak Birds Male 2'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-21', 'bird_weak',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Tanu Mandal') LIMIT 1),
    '5958',
    3.2, 'nos',
    80.0, 256.0,
    'Weak Birds Female 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-21', 'bird_weak',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Prakash Chandra Mohanta') LIMIT 1),
    '5959',
    4.2, 'nos',
    80.0, 336.0,
    'Weak Birds Male 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-23', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Arun Khan') LIMIT 1),
    '6142',
    100, 'kg',
    1.0, 100.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-23', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Nepa Naik') LIMIT 1),
    '6143',
    30, 'kg',
    6.11, 183.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-23', 'manure',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('N Prakash') LIMIT 1),
    '5960',
    1, 'kg',
    2000.0, 2000.0,
    'Poultry Manure Sale Tractor'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-23', 'gas',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bhagban Mahakur') LIMIT 1),
    '5961',
    1, 'nos',
    1852.0, 1852.0,
    'Hp Gas Cylinder 19 kg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-23', 'gas',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Anil Murmu') LIMIT 1),
    '5962',
    1, 'nos',
    1852.0, 1852.0,
    'Hp Gas Cylinder 19 kg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-23', 'gas',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('F-19 Burning') LIMIT 1),
    '5963',
    1, 'nos',
    0.0, 0.0,
    'Hp Gas Cylinder 19 kg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-23', 'gas',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ranjit Khan') LIMIT 1),
    '5964',
    1, 'nos',
    1852.0, 1852.0,
    'Hp Gas Cylinder 19 kg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-24', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6144',
    550, 'nos',
    1.0, 550.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-24', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6144',
    4200, 'nos',
    6.15, 25830.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-24', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6144',
    9870, 'nos',
    6.15, 60701.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-24', 'manure',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('N Prakash') LIMIT 1),
    '5965',
    1, 'kg',
    2000.0, 2000.0,
    'Poultry Manure Sale Tractor'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-25', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Karunakarmunda') LIMIT 1),
    '6145',
    30, 'kg',
    6.15, 185.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-25', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Pradeep Behera') LIMIT 1),
    '6146',
    80, 'kg',
    1.0, 80.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-25', 'manure',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Penta Reddy') LIMIT 1),
    '6147',
    1, 'kg',
    9500.0, 9500.0,
    'Poultry Manure Sale Tripper'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-25', 'manure',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('N Prakash') LIMIT 1),
    '5966',
    1, 'kg',
    2000.0, 2000.0,
    'Poultry Manure Sale Tractor'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-28', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Karuna Kar Munda') LIMIT 1),
    '6148',
    3.6, 'nos',
    80.0, 288.0,
    'Lame Birds F-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-28', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Makara Dehuri') LIMIT 1),
    '6149',
    3.9, 'nos',
    80.0, 312.0,
    'Lame Birds M-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-28', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Arun Khan') LIMIT 1),
    '6150',
    3.5, 'nos',
    80.0, 280.0,
    'Lame Birds F-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-28', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Santanu Ganjan') LIMIT 1),
    '6151',
    3.2, 'nos',
    80.0, 256.0,
    'Lame Birds F-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-28', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Rahul Khan') LIMIT 1),
    '6152',
    3.7, 'nos',
    80.0, 296.0,
    'Lame Birds M-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-28', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ratikanta Mohanta') LIMIT 1),
    '6153',
    3.2, 'nos',
    80.0, 256.0,
    'Lame Birds F-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-28', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sonali Ganjan') LIMIT 1),
    '6154',
    30, 'kg',
    6.15, 185.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-28', 'manure',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('N Prakash') LIMIT 1),
    '5967',
    1, 'kg',
    2000.0, 2000.0,
    'Poultry Manure Sale Tractor'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-31', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6155',
    840, 'nos',
    1.0, 840.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-31', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6155',
    7560, 'nos',
    5.7, 43092.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-31', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6155',
    10500, 'nos',
    5.7, 59850.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2025-12-31', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Deba Singh') LIMIT 1),
    '6156',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-02', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Rabindra Lohar') LIMIT 1),
    '6157',
    30, 'kg',
    5.7, 171.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-02', 'gas',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Saheb Ghorai') LIMIT 1),
    '5968',
    1, 'nos',
    1852.0, 1852.0,
    'Hp Gas Cylinder 19 kg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-02', 'gas',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('F-20 Burning') LIMIT 1),
    '5969',
    1, 'nos',
    0.0, 0.0,
    'Hp Gas Cylinder 19 kg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-02', 'gas',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('F-19 Burning') LIMIT 1),
    '5970',
    1, 'nos',
    0.0, 0.0,
    'Hp Gas Cylinder 19 kg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-03', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Angad Nayak') LIMIT 1),
    '6158',
    90, 'kg',
    5.7, 513.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-03', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Chandan Nak') LIMIT 1),
    '6159',
    120, 'nos',
    5.7, 684.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-03', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Pabitra Nayak') LIMIT 1),
    '6160',
    120, 'nos',
    5.7, 684.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-03', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Anitha Ganjan') LIMIT 1),
    '6161',
    100, 'kg',
    1.0, 100.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-03', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Karunakar Munda') LIMIT 1),
    '6162',
    30, 'kg',
    5.7, 171.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-03', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sahadeb Ganjan') LIMIT 1),
    '6163',
    170, 'nos',
    1.0, 170.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-04', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Baidnath Maity') LIMIT 1),
    '6164',
    150, 'nos',
    5.7, 855.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-05', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Subhadra Behera') LIMIT 1),
    '6165',
    100, 'kg',
    1.0, 100.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-05', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Rani Dehuri') LIMIT 1),
    '6166',
    60, 'kg',
    1.0, 60.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-05', 'manure',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Penta Reddy') LIMIT 1),
    '6167',
    1, 'kg',
    9500.0, 9500.0,
    'Poultry Manure Sale Tripper'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-06', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sonali Ganjan') LIMIT 1),
    '6168',
    100, 'kg',
    1.0, 100.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-07', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6169',
    750, 'nos',
    1.0, 750.0,
    'Broken Egg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-07', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6169',
    9240, 'nos',
    5.2, 48048.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-07', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6169',
    11340, 'nos',
    5.2, 58968.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-07', 'gas',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('F-19 Burning') LIMIT 1),
    '5971',
    1, 'nos',
    0.0, 0.0,
    'Hp Gas Cylinder 19 kg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-08', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Rupa Singh') LIMIT 1),
    '6170',
    40, 'kg',
    1.0, 40.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-09', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Karunakar Munda') LIMIT 1),
    '6171',
    30, 'kg',
    5.2, 156.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-09', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bhagban Mahakur') LIMIT 1),
    '6172',
    50, 'kg',
    1.0, 50.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-12', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Subadra Behera') LIMIT 1),
    '6173',
    100, 'kg',
    1.0, 100.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-12', 'manure',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('N Prakash') LIMIT 1),
    '5972',
    1, 'kg',
    2000.0, 2000.0,
    'Poultry Manure Sale Tractor'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-13', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Karunakar Munda') LIMIT 1),
    '6174',
    30, 'kg',
    5.2, 156.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-14', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sahadeb Ganjan') LIMIT 1),
    '6175',
    6.2, 'nos',
    80.0, 496.0,
    'Lame Birds F-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-14', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Makara Dehuri') LIMIT 1),
    '6176',
    5.5, 'nos',
    80.0, 440.0,
    'Lame Birds F-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-14', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Goutham Ghadai') LIMIT 1),
    '6177',
    5.7, 'nos',
    80.0, 456.0,
    'Lame Birds F-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-14', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Surendera Bag') LIMIT 1),
    '6178',
    5.8, 'nos',
    80.0, 464.0,
    'Lame Birds F-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-14', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Susmita Singh') LIMIT 1),
    '6179',
    4.7, 'nos',
    80.0, 376.0,
    'Lame Birds F-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-14', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Arun Khan') LIMIT 1),
    '6180',
    5.4, 'nos',
    80.0, 432.0,
    'Lame Birds F-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-14', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bhaskar Hatui') LIMIT 1),
    '6181',
    5.1, 'nos',
    80.0, 408.0,
    'Lame Birds F-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-17', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6182',
    1470, 'nos',
    1.0, 1470.0,
    'Broken Egg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-17', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6182',
    8610, 'nos',
    4.8, 41328.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-17', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6182',
    16170, 'nos',
    4.8, 77616.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-17', 'manure',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Penta Reddy') LIMIT 1),
    '6183',
    1, 'kg',
    9500.0, 9500.0,
    'Poultry Manure Sale Tripper'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-18', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sonali Ganjan') LIMIT 1),
    '6184',
    30, 'kg',
    4.8, 144.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-18', 'manure',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Penta Reddy') LIMIT 1),
    '6185',
    1, 'kg',
    9500.0, 9500.0,
    'Poultry Manure Sale Tripper'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-21', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6186',
    700, 'nos',
    1.0, 700.0,
    'Broken Egg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-21', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6186',
    2100, 'nos',
    4.4, 9240.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-21', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6186',
    7980, 'nos',
    4.4, 35112.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-21', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Karunakar Munda') LIMIT 1),
    '6187',
    30, 'kg',
    4.4, 132.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-21', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Amiya Kadma') LIMIT 1),
    '6188',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-22', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Rajesh Karuva') LIMIT 1),
    '6189',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-24', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Suresh Patra') LIMIT 1),
    '6190',
    20, 'kg',
    1.0, 20.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-26', 'manure',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Naveen') LIMIT 1),
    '6191',
    1, 'kg',
    9500.0, 9500.0,
    'Poultry Manure Sale Tripper'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-26', 'gas',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ratikanta Mohanta') LIMIT 1),
    '5973',
    1, 'nos',
    1852.0, 1852.0,
    'Hp Gas Cylinder 19 kg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-26', 'gas',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('F-20 Burning') LIMIT 1),
    '5974',
    1, 'nos',
    0.0, 0.0,
    'Hp Gas Cylinder 19 kg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-26', 'gas',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('F-19 Burning') LIMIT 1),
    '5975',
    1, 'nos',
    0.0, 0.0,
    'Hp Gas Cylinder 19 kg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-27', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bhim Ganjan') LIMIT 1),
    '6192',
    40, 'kg',
    1.0, 40.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-27', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bhim Ganjan') LIMIT 1),
    '6193',
    50, 'kg',
    4.4, 220.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-28', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6194',
    1050, 'nos',
    1.0, 1050.0,
    'Broken Egg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-28', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6194',
    3360, 'nos',
    4.5, 15120.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-28', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6194',
    11760, 'nos',
    4.5, 52920.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-28', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Pushpender Kumar') LIMIT 1),
    '6195',
    40, 'kg',
    4.5, 180.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-28', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Tapas Ganjan') LIMIT 1),
    '6196',
    50, 'kg',
    1.0, 50.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-28', 'manure',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Raju') LIMIT 1),
    '6197',
    1, 'kg',
    11000.0, 11000.0,
    'Poultry Manure Sale Tripper'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-29', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sonali Ganjan') LIMIT 1),
    '6198',
    100, 'kg',
    1.0, 100.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-29', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Karunakarmunda') LIMIT 1),
    '6199',
    30, 'kg',
    4.5, 135.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-29', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Dinesh') LIMIT 1),
    '6200',
    60, 'kg',
    4.5, 270.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-30', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Arun Khan') LIMIT 1),
    '6701',
    100, 'kg',
    1.0, 100.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-30', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ganga Ghodai') LIMIT 1),
    '6702',
    50, 'kg',
    1.0, 50.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-29', 'gas',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('F-20 Burning') LIMIT 1),
    '5976',
    1, 'nos',
    0.0, 0.0,
    'Hp Gas Cylinder 19 kg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-29', 'gas',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('F-19 Burning') LIMIT 1),
    '5977',
    1, 'nos',
    0.0, 0.0,
    'Hp Gas Cylinder 19 kg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-01-31', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sonthshi Behera') LIMIT 1),
    '6703',
    50, 'kg',
    1.0, 50.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-01', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Kakali Hansda') LIMIT 1),
    '6704',
    20, 'kg',
    1.0, 20.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-03', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bhim Ganjan') LIMIT 1),
    '6705',
    20, 'kg',
    1.0, 20.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-03', 'gas',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Lakeshwar Jagat') LIMIT 1),
    '5978',
    1, 'nos',
    1946.0, 1946.0,
    'Hp Gas Cylinder 19 kg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-03', 'gas',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sanjib Mandal') LIMIT 1),
    '5979',
    1, 'nos',
    1946.0, 1946.0,
    'Hp Gas Cylinder 19 kg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-03', 'gas',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ramdas Mahali') LIMIT 1),
    '5980',
    1, 'nos',
    1946.0, 1946.0,
    'Hp Gas Cylinder 19 kg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-03', 'gas',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ranjit Patar') LIMIT 1),
    '5981',
    1, 'nos',
    1946.0, 1946.0,
    'Hp Gas Cylinder 19 kg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-03', 'gas',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('F-20 Burning') LIMIT 1),
    '5982',
    1, 'nos',
    0.0, 0.0,
    'Hp Gas Cylinder 19 kg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-04', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Suresh Patra') LIMIT 1),
    '6706',
    100, 'kg',
    1.0, 100.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-05', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sima Kadma') LIMIT 1),
    '6707',
    100, 'kg',
    1.0, 100.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-05', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sonali Ganjan') LIMIT 1),
    '6708',
    30, 'kg',
    4.5, 135.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-05', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Karunakar Munda') LIMIT 1),
    '6709',
    30, 'kg',
    4.5, 135.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-05', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Rajesh Karua') LIMIT 1),
    '6710',
    50, 'kg',
    1.0, 50.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-06', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Kaunakar Munda') LIMIT 1),
    '6711',
    110, 'nos',
    1.0, 110.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-07', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6712',
    1470, 'nos',
    1.0, 1470.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-07', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6712',
    5040, 'nos',
    4.35, 21924.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-07', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6712',
    4200, 'nos',
    4.35, 18270.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-07', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Venkatadri Hatcheries') LIMIT 1),
    '6713',
    7084, 'nos',
    29.0, 205436.0,
    'TE Above 60 Gms = 7226-2%(142)=7084'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-07', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Puja Hemrem') LIMIT 1),
    '6714',
    90, 'kg',
    1.0, 90.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-08', 'gas',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('F-19 Burning') LIMIT 1),
    '5983',
    1, 'nos',
    0.0, 0.0,
    'Hp Gas Cylinder 19 kg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-08', 'gas',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('F-20 Burning') LIMIT 1),
    '5984',
    1, 'nos',
    0.0, 0.0,
    'Hp Gas Cylinder 19 kg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-08', 'gas',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('F-20 Burning') LIMIT 1),
    '5985',
    1, 'nos',
    0.0, 0.0,
    'Hp Gas Cylinder 19 kg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-09', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bhagaban Mahakur') LIMIT 1),
    '6715',
    40, 'kg',
    1.0, 40.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-09', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Karunakar Munda') LIMIT 1),
    '6716',
    30, 'kg',
    4.35, 131.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-10', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Karunakar Munda') LIMIT 1),
    '6717',
    140, 'nos',
    1.0, 140.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-10', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Jhanta Behera') LIMIT 1),
    '6718',
    210, 'nos',
    4.35, 914.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-12', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('CH Raju') LIMIT 1),
    '6719',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-12', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('CH Raju') LIMIT 1),
    '6719',
    30, 'kg',
    4.35, 131.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-12', 'gas',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Suresh Patra') LIMIT 1),
    '6720',
    1, 'nos',
    1946.0, 1946.0,
    'Hp Gas Cylinder 19 kg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-12', 'gas',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Tagar Majhi') LIMIT 1),
    '6721',
    1, 'nos',
    1946.0, 1946.0,
    'Hp Gas Cylinder 19 kg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-12', 'gas',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bhagban Mahakur') LIMIT 1),
    '6722',
    1, 'nos',
    1946.0, 1946.0,
    'Hp Gas Cylinder 19 kg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-14', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Suresh Patra') LIMIT 1),
    '6723',
    20, 'kg',
    1.0, 20.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-17', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sahadeb Ganjan') LIMIT 1),
    '6724',
    30, 'kg',
    4.35, 131.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-18', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Amiya Kadma') LIMIT 1),
    '6725',
    30, 'kg',
    4.6, 138.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-18', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bhim Mandi') LIMIT 1),
    '6726',
    60, 'kg',
    1.0, 60.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-18', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Jhanta Behera') LIMIT 1),
    '6727',
    60, 'kg',
    1.0, 60.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-18', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Rakhi Ganjan') LIMIT 1),
    '6728',
    65, 'kg',
    1.0, 65.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-18', 'gas',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Kakali Hansda') LIMIT 1),
    '6729',
    1, 'nos',
    1946.0, 1946.0,
    'Hp Gas Cylinder 19 kg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-19', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6730',
    1890, 'nos',
    1.0, 1890.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-19', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6730',
    3150, 'nos',
    4.6, 14490.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-19', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6730',
    3780, 'nos',
    4.6, 17388.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-19', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Karunakar Munda') LIMIT 1),
    '6731',
    40, 'kg',
    1.0, 40.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-19', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Karunakar Munda') LIMIT 1),
    '6731',
    30, 'kg',
    4.6, 138.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-20', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Karunakar Munda') LIMIT 1),
    '6732',
    90, 'kg',
    1.0, 90.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-21', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sonali Ganjan') LIMIT 1),
    '6733',
    30, 'kg',
    4.6, 138.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-21', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Suresh') LIMIT 1),
    '6734',
    60, 'kg',
    4.6, 276.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-22', 'gas',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Karunakarmunda') LIMIT 1),
    '6735',
    1, 'nos',
    1946.0, 1946.0,
    'Hp Gas Cylinder 19 kg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-23', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Palash Ganjan') LIMIT 1),
    '6736',
    60, 'kg',
    1.0, 60.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-24', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Rani Dehuri') LIMIT 1),
    '6737',
    15, 'kg',
    1.0, 15.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-24', 'gas',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Chatu Das') LIMIT 1),
    '6738',
    1, 'nos',
    1946.0, 1946.0,
    'Hp Gas Cylinder 19 kg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-25', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Rupa Singh') LIMIT 1),
    '6739',
    15, 'kg',
    1.0, 15.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-27', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Amiya Kadma') LIMIT 1),
    '6740',
    30, 'kg',
    4.6, 138.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-27', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sahadeb Ganjan') LIMIT 1),
    '6741',
    30, 'kg',
    4.6, 138.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-02-27', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Santanu Ganjan') LIMIT 1),
    '6742',
    50, 'kg',
    1.0, 50.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-01', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6743',
    1890, 'nos',
    1.0, 1890.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-01', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6743',
    2100, 'nos',
    3.9, 8190.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-01', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6743',
    3150, 'nos',
    3.9, 12285.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-02', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bhim Ganjan') LIMIT 1),
    '6744',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-02', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Jhanta Behera') LIMIT 1),
    '6745',
    90, 'kg',
    3.9, 351.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-03', 'gas',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Rana Behera') LIMIT 1),
    '6746',
    1, 'nos',
    1946.0, 1946.0,
    'Hp Gas Cylinder 19 kg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-04', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sahadeb Ganjan') LIMIT 1),
    '6747',
    30, 'kg',
    3.9, 117.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-04', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Santosi Behera') LIMIT 1),
    '6748',
    100, 'kg',
    1.0, 100.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-04', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Arun Khan') LIMIT 1),
    '6749',
    30, 'kg',
    3.9, 117.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-04', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bapi Ganjan') LIMIT 1),
    '6750',
    5.8, 'nos',
    80.0, 464.0,
    'Lame Birds F-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-04', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bristi Kadma') LIMIT 1),
    '6751',
    4.3, 'nos',
    80.0, 344.0,
    'Lame Birds F-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-07', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sahadeb Ganjan') LIMIT 1),
    '6752',
    30, 'kg',
    3.9, 117.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-09', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Akash Bag') LIMIT 1),
    '6753',
    90, 'kg',
    3.9, 351.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-09', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Raju Driver') LIMIT 1),
    '6754',
    60, 'kg',
    1.0, 60.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-09', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Raju Driver') LIMIT 1),
    '6754',
    60, 'kg',
    3.9, 234.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-09', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Shivam Sardar') LIMIT 1),
    '6755',
    420, 'nos',
    3.6, 1512.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-09', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Rana Behera') LIMIT 1),
    '6756',
    130, 'nos',
    1.0, 130.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-10', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6757',
    1650, 'nos',
    1.0, 1650.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-10', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6757',
    810, 'nos',
    3.6, 2916.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-10', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6757',
    3360, 'nos',
    3.6, 12096.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-10', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sahadeb Ganjan') LIMIT 1),
    '6758',
    5.2, 'nos',
    80.0, 416.0,
    'Lame Birds F-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-10', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Makara Dehuri') LIMIT 1),
    '6759',
    60, 'kg',
    1.0, 60.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-11', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Abhaigi Das') LIMIT 1),
    '6760',
    30, 'kg',
    3.6, 108.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-11', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Subrata Ganjan') LIMIT 1),
    '6761',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-12', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Karunakar Munda') LIMIT 1),
    '6762',
    30, 'kg',
    3.6, 108.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-14', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Akash Roy') LIMIT 1),
    '6763',
    100, 'kg',
    1.0, 100.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-14', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bhim Mandi') LIMIT 1),
    '6764',
    50, 'kg',
    1.0, 50.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-14', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Tarun') LIMIT 1),
    '6765',
    420, 'nos',
    3.6, 1512.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-15', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Tapas Ganjan') LIMIT 1),
    '6766',
    5.1, 'nos',
    80.0, 408.0,
    'Lame Birds F-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-15', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Panmani Mandi') LIMIT 1),
    '6767',
    3.2, 'nos',
    80.0, 256.0,
    'Lame Birds F-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-15', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Santhosh Behera') LIMIT 1),
    '6768',
    4.4, 'nos',
    80.0, 352.0,
    'Lame Birds F-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-17', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Subrata Ganjan') LIMIT 1),
    '6769',
    130, 'nos',
    1.0, 130.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-18', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6770',
    1470, 'nos',
    1.0, 1470.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-18', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6770',
    420, 'nos',
    3.6, 1512.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-18', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6770',
    3570, 'nos',
    3.6, 12852.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-18', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Raju') LIMIT 1),
    '6771',
    60, 'kg',
    3.6, 216.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-18', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Karunakarmunda') LIMIT 1),
    '6772',
    110, 'nos',
    1.0, 110.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-20', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Champabati Nayak') LIMIT 1),
    '6773',
    100, 'kg',
    1.0, 100.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-20', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Suresan Patra') LIMIT 1),
    '6774',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-20', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bhim Mandi') LIMIT 1),
    '6775',
    100, 'kg',
    1.0, 100.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-21', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Chatu Das') LIMIT 1),
    '6776',
    30, 'kg',
    3.6, 108.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-21', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Rana Behera') LIMIT 1),
    '6777',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-22', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bapi Ganjan') LIMIT 1),
    '6778',
    5, 'nos',
    80.0, 400.0,
    'Lame Birds F-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-22', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bhola Khan') LIMIT 1),
    '6779',
    3.7, 'nos',
    80.0, 296.0,
    'Lame Birds F-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-22', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bikash Mandal') LIMIT 1),
    '6780',
    4, 'nos',
    80.0, 320.0,
    'Lame Birds F-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-22', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bhaskar Hatui') LIMIT 1),
    '6781',
    5, 'nos',
    80.0, 400.0,
    'Lame Birds F-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-22', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Pradip Behera') LIMIT 1),
    '6782',
    210, 'nos',
    3.6, 756.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-22', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Santhosh Behera') LIMIT 1),
    '6783',
    210, 'nos',
    3.6, 756.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-22', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Makara Dehuri') LIMIT 1),
    '6784',
    120, 'nos',
    3.6, 432.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-22', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sahadeb Ganjan') LIMIT 1),
    '6785',
    30, 'kg',
    3.6, 108.0,
    'Jumno Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-22', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Amiya kadma') LIMIT 1),
    '6786',
    30, 'kg',
    3.6, 108.0,
    'Jumno Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-22', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Subrata Ganajan') LIMIT 1),
    '6787',
    20, 'kg',
    1.0, 20.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-25', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Jhanta Behera') LIMIT 1),
    '6788',
    60, 'kg',
    3.6, 216.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-25', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Chatu Das') LIMIT 1),
    '6789',
    70, 'kg',
    1.0, 70.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-26', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6790',
    1680, 'nos',
    1.0, 1680.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-26', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6790',
    210, 'nos',
    3.2, 672.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-26', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6790',
    3150, 'nos',
    3.2, 10080.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-26', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Karunakarmunda') LIMIT 1),
    '6791',
    30, 'kg',
    3.2, 96.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-27', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Chatu Das') LIMIT 1),
    '6792',
    30, 'kg',
    3.2, 96.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-29', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Chatu Das') LIMIT 1),
    '6793',
    4.6, 'nos',
    80.0, 368.0,
    'Lame Birds F-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-29', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Suresan Patra') LIMIT 1),
    '6794',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-30', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Karunakarmunda') LIMIT 1),
    '6795',
    30, 'kg',
    3.2, 96.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-30', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Tapash Ganjan') LIMIT 1),
    '6796',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-30', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Krishna Khan') LIMIT 1),
    '6797',
    60, 'kg',
    1.0, 60.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-30', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Akash Roy') LIMIT 1),
    '6798',
    60, 'kg',
    1.0, 60.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-03-31', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Panmoni Mandi') LIMIT 1),
    '6901',
    100, 'kg',
    1.0, 100.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-01', 'manure',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('K Chandrayya') LIMIT 1),
    '6902',
    3, 'kg',
    0.0, 0.0,
    'Poultry Manure Sale Tripper'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-01', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Amiya Kadma') LIMIT 1),
    '6903',
    100, 'kg',
    1.0, 100.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-02', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Anita Ganjan') LIMIT 1),
    '6904',
    100, 'kg',
    1.0, 100.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-02', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bristi Kadma') LIMIT 1),
    '6905',
    30, 'kg',
    3.2, 96.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-02', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Karunakarmunda') LIMIT 1),
    '6906',
    3.1, 'nos',
    80.0, 248.0,
    'Lame Birds F-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-03', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bhagban Mahakur') LIMIT 1),
    '6907',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-05', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Arun Khan') LIMIT 1),
    '6908',
    4.1, 'nos',
    80.0, 328.0,
    'Lame Birds F-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-05', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Chatu Das') LIMIT 1),
    '6909',
    4.2, 'nos',
    80.0, 336.0,
    'Lame Birds F-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-05', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Palash Ganjan') LIMIT 1),
    '6910',
    3.2, 'nos',
    80.0, 256.0,
    'Lame Birds F-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-05', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Chatu Das') LIMIT 1),
    '6911',
    30, 'kg',
    3.2, 96.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-05', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Subrata Ganjan') LIMIT 1),
    '6912',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-07', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Champabati Naik') LIMIT 1),
    '6913',
    100, 'kg',
    1.0, 100.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-07', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Amiya Kadma') LIMIT 1),
    '6914',
    30, 'kg',
    3.2, 96.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-07', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Prasanta Porya') LIMIT 1),
    '6915',
    210, 'nos',
    3.2, 672.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-08', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6916',
    2730, 'nos',
    1.0, 2730.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-08', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6916',
    1050, 'nos',
    3.6, 3780.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-08', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6916',
    7980, 'nos',
    3.6, 28728.0,
    'Table eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-09', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Karunakar Munda') LIMIT 1),
    '6917',
    100, 'kg',
    1.0, 100.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-09', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Arun Khan') LIMIT 1),
    '6918',
    30, 'kg',
    3.6, 108.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-09', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Rana Behera') LIMIT 1),
    '6919',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-12', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Asit Kalsar') LIMIT 1),
    '6920',
    30, 'kg',
    3.6, 108.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-12', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Asit Kalsar') LIMIT 1),
    '6920',
    4.6, 'nos',
    80.0, 368.0,
    'Lame Birds F1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-12', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Jhantu Behera') LIMIT 1),
    '6921',
    30, 'kg',
    3.6, 108.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-12', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Jhantu Behera') LIMIT 1),
    '6921',
    4.1, 'nos',
    80.0, 328.0,
    'Lame Birds F1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-12', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Amiya Kadma') LIMIT 1),
    '6922',
    4.1, 'nos',
    80.0, 328.0,
    'Lame Birds F1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-12', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bhagban Mahakur') LIMIT 1),
    '6923',
    3.7, 'nos',
    80.0, 296.0,
    'Lame Birds F1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-12', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bikash Mandal') LIMIT 1),
    '6924',
    4.9, 'nos',
    80.0, 392.0,
    'Lame Birds F1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-13', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Jhantu Behera') LIMIT 1),
    '6925',
    210, 'nos',
    3.6, 756.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-13', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Saktipada Mandal') LIMIT 1),
    '6926',
    90, 'kg',
    3.6, 324.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-16', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bristi Kadma') LIMIT 1),
    '6927',
    30, 'kg',
    3.6, 108.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-16', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Abhagi Das') LIMIT 1),
    '6928',
    50, 'kg',
    1.0, 50.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-18', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Mayna Hatui') LIMIT 1),
    '6929',
    5.8, 'nos',
    80.0, 464.0,
    'Lame Birds F1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-18', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Arun Khan') LIMIT 1),
    '6930',
    4.5, 'nos',
    80.0, 360.0,
    'Lame Birds F1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-19', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Amiya Kadma') LIMIT 1),
    '6931',
    4.7, 'nos',
    80.0, 376.0,
    'Lame Birds F1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-19', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Manoranjan Bag') LIMIT 1),
    '6932',
    3.7, 'nos',
    80.0, 296.0,
    'Lame Birds F1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-19', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Rupa Singh') LIMIT 1),
    '6933',
    3.9, 'nos',
    80.0, 312.0,
    'Lame Birds F1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-19', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Chattu Das') LIMIT 1),
    '6934',
    5.1, 'nos',
    80.0, 408.0,
    'Lame Birds F1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-19', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Abhagi das') LIMIT 1),
    '6935',
    210, 'nos',
    3.6, 756.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-19', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bikash Mandal') LIMIT 1),
    '6936',
    50, 'kg',
    1.0, 50.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-20', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6937',
    3150, 'nos',
    1.0, 3150.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-20', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6937',
    420, 'nos',
    4.65, 1953.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-20', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6937',
    7860, 'nos',
    4.65, 36549.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-20', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Rakhi Ganjan') LIMIT 1),
    '6938',
    30, 'kg',
    4.65, 140.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-20', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Karunakar Munda') LIMIT 1),
    '6939',
    30, 'kg',
    4.65, 140.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-21', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Karunakar Munda') LIMIT 1),
    '6940',
    3.6, 'nos',
    80.0, 288.0,
    'Lame Birds F1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-23', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bhim Ganjan') LIMIT 1),
    '6941',
    3.4, 'nos',
    80.0, 272.0,
    'Lame Birds F1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-23', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Utpal Chatarjee') LIMIT 1),
    '6942',
    150, 'nos',
    4.65, 698.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-23', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Santosi Behera') LIMIT 1),
    '6943',
    50, 'kg',
    1.0, 50.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-23', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Champabati Nayak') LIMIT 1),
    '6944',
    100, 'kg',
    1.0, 100.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-24', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Dinesh') LIMIT 1),
    '6945',
    30, 'kg',
    4.65, 140.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-25', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Rajesh Karuva') LIMIT 1),
    '6946',
    40, 'kg',
    1.0, 40.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-26', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Palash Ganjan') LIMIT 1),
    '6947',
    3.3, 'nos',
    80.0, 264.0,
    'Lame Birds F1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-26', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Jhanta Behera') LIMIT 1),
    '6948',
    4, 'nos',
    80.0, 320.0,
    'Lame Birds F1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-26', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Santhosh Behera') LIMIT 1),
    '6949',
    4.5, 'nos',
    80.0, 360.0,
    'Lame Birds F1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-28', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Karunakar munda') LIMIT 1),
    '6950',
    30, 'kg',
    4.65, 140.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-28', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Amiya Kadma') LIMIT 1),
    '6951',
    140, 'nos',
    1.0, 140.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-28', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Rajesh Karuva') LIMIT 1),
    '6952',
    20, 'kg',
    4.65, 93.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-29', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Santhosh Behera') LIMIT 1),
    '6953',
    140, 'nos',
    1.0, 140.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-29', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Pradeep Behera') LIMIT 1),
    '6954',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-30', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Chandra Kanta Sandha') LIMIT 1),
    '6955',
    30, 'kg',
    4.65, 140.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-30', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Palash Ganjan') LIMIT 1),
    '6956',
    4.2, 'nos',
    80.0, 336.0,
    'Lame Birds F1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-04-30', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bhola Khan') LIMIT 1),
    '6957',
    3.9, 'nos',
    80.0, 312.0,
    'Lame Birds F1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-01', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bhaskar Hatuai') LIMIT 1),
    '6958',
    100, 'kg',
    1.0, 100.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-01', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Karunakar Munda') LIMIT 1),
    '6959',
    40, 'kg',
    1.0, 40.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-02', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Pabitra Khan') LIMIT 1),
    '6960',
    100, 'kg',
    1.0, 100.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-03', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Pradeep Behera') LIMIT 1),
    '6961',
    4.3, 'nos',
    80.0, 344.0,
    'Lame Birds F1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-03', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bhagban Mahakur') LIMIT 1),
    '6962',
    4.4, 'nos',
    80.0, 352.0,
    'Lame Birds F1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-03', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Santosi Behera') LIMIT 1),
    '6963',
    4.5, 'nos',
    80.0, 360.0,
    'Lame Birds F1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-03', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Karunakar Munda') LIMIT 1),
    '6964',
    3.5, 'nos',
    80.0, 280.0,
    'Lame Birds F1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-03', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Amiya Kadma') LIMIT 1),
    '6965',
    30, 'kg',
    4.65, 140.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-03', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Tapash Ganjan') LIMIT 1),
    '6966',
    50, 'kg',
    1.0, 50.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-05', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Santhoshi Behera') LIMIT 1),
    '6967',
    50, 'kg',
    1.0, 50.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-05', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Pradeep Behera') LIMIT 1),
    '6968',
    100, 'kg',
    1.0, 100.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-05', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Jhantu Behera') LIMIT 1),
    '6969',
    140, 'nos',
    1.0, 140.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-06', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6970',
    3570, 'nos',
    1.0, 3570.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-06', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6970',
    840, 'nos',
    4.65, 3906.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-06', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6970',
    10230, 'nos',
    4.65, 47569.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-06', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Anita Ganjan') LIMIT 1),
    '6971',
    91, 'kg',
    1.0, 91.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-07', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sahadeb Ganjan') LIMIT 1),
    '6972',
    30, 'kg',
    4.65, 140.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-07', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bristi Kadma') LIMIT 1),
    '6973',
    30, 'kg',
    4.65, 140.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-07', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Khurshed Malik') LIMIT 1),
    '6974',
    30, 'kg',
    4.65, 140.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-07', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Karunakar Munda') LIMIT 1),
    '6975',
    30, 'kg',
    4.65, 140.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-08', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Chandra Kanta Sandha') LIMIT 1),
    '6976',
    60, 'kg',
    1.0, 60.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-09', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Santhosh Behara') LIMIT 1),
    '6977',
    100, 'kg',
    1.0, 100.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-10', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bhim Ganjan') LIMIT 1),
    '6978',
    4.4, 'nos',
    80.0, 352.0,
    'Lame Birds F1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-10', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bhola Khan') LIMIT 1),
    '6979',
    4.6, 'nos',
    80.0, 368.0,
    'Lame Birds F1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-10', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Chandra Kanta Sandha') LIMIT 1),
    '6980',
    4.5, 'nos',
    80.0, 360.0,
    'Lame Birds F1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-10', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Rana Behera') LIMIT 1),
    '6981',
    4.4, 'nos',
    80.0, 352.0,
    'Lame Birds F1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-10', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Santosi Behera') LIMIT 1),
    '6982',
    4.7, 'nos',
    80.0, 376.0,
    'Lame Birds F1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-10', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sahadeb Ganajan') LIMIT 1),
    '6983',
    4.3, 'nos',
    80.0, 344.0,
    'Lame Birds F1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-10', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Amiya Kadma') LIMIT 1),
    '6984',
    30, 'kg',
    4.65, 140.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-10', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Tagari Majhi') LIMIT 1),
    '6985',
    50, 'kg',
    1.0, 50.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-12', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Abhagi Das') LIMIT 1),
    '6986',
    50, 'kg',
    1.0, 50.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-12', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Champabati Naik') LIMIT 1),
    '6987',
    50, 'kg',
    1.0, 50.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-13', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sahadeb Ganjan') LIMIT 1),
    '6988',
    30, 'kg',
    4.65, 140.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-13', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Arun Khan') LIMIT 1),
    '6989',
    30, 'kg',
    4.65, 140.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-13', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Trinath Birua') LIMIT 1),
    '6990',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-14', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Karunakar Munda') LIMIT 1),
    '6991',
    40, 'kg',
    1.0, 40.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-17', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Surendra Bag') LIMIT 1),
    '6992',
    4.2, 'nos',
    80.0, 336.0,
    'Lame Birds F1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-17', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sujay Kewra') LIMIT 1),
    '6993',
    4.5, 'nos',
    80.0, 360.0,
    'Lame Birds F1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-17', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Shishir Kewra') LIMIT 1),
    '6994',
    4.4, 'nos',
    80.0, 352.0,
    'Lame Birds F1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-17', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Dinesh') LIMIT 1),
    '6995',
    30, 'kg',
    4.65, 140.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-17', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bapi Ghorai') LIMIT 1),
    '6996',
    3.5, 'nos',
    80.0, 280.0,
    'Lame Birds F1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-17', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Pradeep Behera') LIMIT 1),
    '6997',
    100, 'kg',
    1.0, 100.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-18', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Lakeshwar Jagat') LIMIT 1),
    '6998',
    150, 'nos',
    4.65, 698.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-18', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sonali Ganjan') LIMIT 1),
    '6999',
    50, 'kg',
    1.0, 50.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-18', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '7000',
    3000, 'nos',
    1.0, 3000.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-18', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '7000',
    420, 'nos',
    4.65, 1953.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-18', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '7000',
    13650, 'nos',
    4.65, 63473.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-20', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Karunakar Munda') LIMIT 1),
    '7201',
    30, 'kg',
    4.65, 140.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-20', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Amiya Kadma') LIMIT 1),
    '7202',
    30, 'kg',
    4.65, 140.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-20', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Tapash Ganjan') LIMIT 1),
    '7203',
    80, 'kg',
    1.0, 80.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-21', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Subrata Ganjan') LIMIT 1),
    '7204',
    40, 'kg',
    1.0, 40.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-22', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bapi Ghorai') LIMIT 1),
    '7205',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-22', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sonali Ganjan') LIMIT 1),
    '7206',
    30, 'kg',
    4.65, 140.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-24', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Santhosh Behera') LIMIT 1),
    '7207',
    5.8, 'nos',
    80.0, 464.0,
    'Lame Birds F1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-24', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Chatu Das') LIMIT 1),
    '7208',
    4.1, 'nos',
    80.0, 328.0,
    'Lame Birds F1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-24', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bhola Khan') LIMIT 1),
    '7209',
    3.3, 'nos',
    80.0, 264.0,
    'Lame Birds F1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-24', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sahadev Ganjan') LIMIT 1),
    '7210',
    4, 'nos',
    80.0, 320.0,
    'Lame Birds F1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-25', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Subrata Ganjan') LIMIT 1),
    '7211',
    90, 'kg',
    1.0, 90.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-27', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Mayna Hayui') LIMIT 1),
    '7212',
    3.2, 'nos',
    80.0, 256.0,
    'Lame Birds F1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-26', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('santosh Behara') LIMIT 1),
    '7213',
    100, 'kg',
    1.0, 100.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-26', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Chandrakanta Sandha') LIMIT 1),
    '7214',
    50, 'kg',
    1.0, 50.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-26', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Subrata Ganjan') LIMIT 1),
    '7215',
    50, 'kg',
    1.0, 50.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-26', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Subrata Ganjan') LIMIT 1),
    '7216',
    3.1, 'nos',
    80.0, 248.0,
    'Lame Birds F1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-27', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Santanu Ganjan') LIMIT 1),
    '7217',
    3.5, 'nos',
    80.0, 280.0,
    'Lame Birds F1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-27', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Karunakar Munda') LIMIT 1),
    '7218',
    30, 'kg',
    4.65, 140.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-28', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sonali Ganjan') LIMIT 1),
    '7219',
    50, 'kg',
    1.0, 50.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='20'),
    '2026-05-28', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Subrata Ganjan') LIMIT 1),
    '7220',
    40, 'kg',
    1.0, 40.0,
    'Broken Eggs'
  )
ON CONFLICT ON CONSTRAINT nhe_sales_unique DO UPDATE SET
  amount = EXCLUDED.amount,
  rate = EXCLUDED.rate;
