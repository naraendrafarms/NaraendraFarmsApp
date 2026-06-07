-- Flock 19 Sales (Egg Sales + Cull Sales)
-- 1291 records

INSERT INTO public.nhe_sales (
  flock_id, sale_date, sale_type, party_id, dc_no,
  quantity, unit, rate, amount, remarks
) VALUES
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-06-22', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Jaydev Paramanik') LIMIT 1),
    '5138',
    2.2, 'nos',
    80.0, 176.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-06-22', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Prabir Ghorai') LIMIT 1),
    '5139',
    3.4, 'nos',
    80.0, 272.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-06-22', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Jayanta Bag') LIMIT 1),
    '5140',
    2.9, 'nos',
    80.0, 232.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-06-22', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ramdas Mahali') LIMIT 1),
    '5141',
    3, 'nos',
    80.0, 240.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-07-06', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Shishir Kalasar') LIMIT 1),
    '5142',
    3.5, 'nos',
    80.0, 280.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-07-06', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Dubaraj Hemram') LIMIT 1),
    '5143',
    3.2, 'nos',
    80.0, 256.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-07-06', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Pitambara Mahanta') LIMIT 1),
    '5144',
    3.1, 'nos',
    80.0, 248.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-07-06', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Serfa Hembram') LIMIT 1),
    '5145',
    3.3, 'nos',
    80.0, 264.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-07-06', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Dasarath Mohanta') LIMIT 1),
    '5146',
    3.4, 'nos',
    80.0, 272.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-07-06', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Shambu Chatar') LIMIT 1),
    '5147',
    3.4, 'nos',
    80.0, 272.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-07-06', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sujit Kumar Mohanta') LIMIT 1),
    '5148',
    3.2, 'nos',
    80.0, 256.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-07-13', 'gas',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ratikanta Mohanta') LIMIT 1),
    '5149',
    1, 'nos',
    2003.0, 2003.0,
    'Hp Gas Cylinder 19 Kg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-07-13', 'gas',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sanajit Bag') LIMIT 1),
    '5150',
    1, 'nos',
    2003.0, 2003.0,
    'Hp Gas Cylinder 19 Kg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-07-13', 'gas',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Burning Purpose') LIMIT 1),
    '5151',
    1, 'nos',
    0.0, 0.0,
    'Hp Gas Cylinder 19 Kg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-07-13', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ramdas Mahali') LIMIT 1),
    '5152',
    3.4, 'nos',
    80.0, 272.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-07-13', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Gopal Bag') LIMIT 1),
    '5153',
    3.4, 'nos',
    80.0, 272.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-07-20', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sujan Kalsar') LIMIT 1),
    '5154',
    3.5, 'nos',
    80.0, 280.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-07-20', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Prabir Ghorai') LIMIT 1),
    '5155',
    3.6, 'nos',
    80.0, 288.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-07-20', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Anam Naik') LIMIT 1),
    '5156',
    3.6, 'nos',
    80.0, 288.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-07-20', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Pabithra Naik') LIMIT 1),
    '5157',
    3.4, 'nos',
    80.0, 272.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-07-20', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ramesh Chandra Mohanta') LIMIT 1),
    '5158',
    3.7, 'nos',
    80.0, 296.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-07-20', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Dulari Mahali') LIMIT 1),
    '5159',
    3.9, 'nos',
    80.0, 312.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-07-20', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Karunakar Munda') LIMIT 1),
    '5160',
    3.2, 'nos',
    80.0, 256.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-07-25', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '5161',
    420, 'nos',
    3.65, 1533.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-07-25', 'gas',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Dubaraj Hemram') LIMIT 1),
    '5162',
    1, 'nos',
    2003.0, 2003.0,
    'Hp Gas Cylinder 19 Kg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-07-25', 'gas',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Serfa Hembram') LIMIT 1),
    '5163',
    1, 'nos',
    2003.0, 2003.0,
    'Hp Gas Cylinder 19 Kg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-07-27', 'gas',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Lokesh Jagat') LIMIT 1),
    '5164',
    1, 'nos',
    2003.0, 2003.0,
    'Hp Gas Cylinder 19 Kg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-07-27', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sujit Khan') LIMIT 1),
    '5165',
    30, 'kg',
    3.65, 110.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-07-27', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Rupa Bindhani') LIMIT 1),
    '5166',
    3.7, 'nos',
    80.0, 296.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-07-27', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Jaydev Paramanik') LIMIT 1),
    '5167',
    4, 'nos',
    80.0, 320.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-07-27', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ranjit Khan') LIMIT 1),
    '5168',
    3.3, 'nos',
    80.0, 264.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-07-27', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Balmik Mohanta') LIMIT 1),
    '5169',
    3.2, 'nos',
    80.0, 256.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-07-27', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Apin Mahakur') LIMIT 1),
    '5170',
    3.7, 'nos',
    80.0, 296.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-07-27', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Lokesh Jagat') LIMIT 1),
    '5171',
    2.8, 'nos',
    80.0, 224.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-07-27', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Chandan Kalsar') LIMIT 1),
    '5172',
    4, 'nos',
    80.0, 320.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-07-29', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Laxmi Mahali') LIMIT 1),
    '5173',
    30, 'kg',
    3.65, 110.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-07-29', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Nita Mohanta') LIMIT 1),
    '5174',
    10, 'kg',
    3.65, 37.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-07-30', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Arjun Kumar Mohanta') LIMIT 1),
    '5175',
    30, 'kg',
    3.65, 110.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-07-30', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Balmik Mohanta') LIMIT 1),
    '5176',
    30, 'kg',
    3.65, 110.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-01', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Prakash Chandra Mohanta') LIMIT 1),
    '5177',
    30, 'kg',
    3.65, 110.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-01', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Rakesh Das') LIMIT 1),
    '5178',
    30, 'kg',
    3.65, 110.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-01', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Chandan Kalsar') LIMIT 1),
    '5179',
    30, 'kg',
    3.65, 110.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-01', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Tulu Patar') LIMIT 1),
    '5180',
    30, 'kg',
    3.65, 110.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-01', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ramdas Mahali') LIMIT 1),
    '5181',
    30, 'kg',
    3.65, 110.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-02', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sanjay Beshra') LIMIT 1),
    '5182',
    30, 'kg',
    3.65, 110.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-02', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sanjay Beshra') LIMIT 1),
    '5182',
    30, 'kg',
    3.65, 110.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-03', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '5184',
    3780, 'nos',
    3.7, 13986.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-03', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Malati Mohanta') LIMIT 1),
    '5185',
    30, 'kg',
    3.7, 111.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-03', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Lalitha Nayak') LIMIT 1),
    '5186',
    10, 'kg',
    3.7, 37.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-03', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Prakash Chandra Mohanta') LIMIT 1),
    '5187',
    3.7, 'nos',
    80.0, 296.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-03', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Chatu Das') LIMIT 1),
    '5188',
    3.2, 'nos',
    80.0, 256.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-03', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Mita Soren') LIMIT 1),
    '5189',
    3.6, 'nos',
    80.0, 288.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-03', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Karunakar Munda') LIMIT 1),
    '5190',
    3, 'nos',
    80.0, 240.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-03', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Nashmoni Mahali') LIMIT 1),
    '5191',
    3.7, 'nos',
    80.0, 296.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-03', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sujan Kalsar') LIMIT 1),
    '5192',
    3.9, 'nos',
    80.0, 312.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-03', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ramdas Mahali') LIMIT 1),
    '5193',
    4, 'nos',
    80.0, 320.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-03', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Gopal Bag') LIMIT 1),
    '5194',
    7.4, 'nos',
    80.0, 592.0,
    'sex Error Birds-2'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-03', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Gamha HO') LIMIT 1),
    '5195',
    2.9, 'nos',
    80.0, 232.0,
    'sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-04', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Anam Nayak') LIMIT 1),
    '5196',
    30, 'kg',
    3.7, 111.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-04', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Rakesh Das') LIMIT 1),
    '5197',
    30, 'kg',
    3.7, 111.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-04', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Rakesh Das') LIMIT 1),
    '5197',
    30, 'kg',
    3.7, 111.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-04', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ranjit Khan') LIMIT 1),
    '5198',
    20, 'kg',
    3.7, 74.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-05', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Nita Mohanta') LIMIT 1),
    '5199',
    15, 'kg',
    3.7, 56.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-05', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Laxmi Bag') LIMIT 1),
    '5200',
    15, 'kg',
    3.7, 56.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-06', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Chandan Kalsar') LIMIT 1),
    '5501',
    30, 'kg',
    3.7, 111.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-06', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Padmabati Mohanta') LIMIT 1),
    '5502',
    30, 'kg',
    3.7, 111.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-06', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Balmik Mohanta') LIMIT 1),
    '5503',
    30, 'kg',
    3.7, 111.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-06', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ratikanta Mohanta') LIMIT 1),
    '5504',
    10, 'kg',
    3.7, 37.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-06', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Phakira Mohan Sidu') LIMIT 1),
    '5505',
    30, 'kg',
    3.7, 111.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-06', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bulti Dewan') LIMIT 1),
    '5506',
    30, 'kg',
    3.7, 111.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-06', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ramdas Mahali') LIMIT 1),
    '5507',
    30, 'kg',
    3.7, 111.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-06', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Malati Mohanta') LIMIT 1),
    '5508',
    30, 'kg',
    3.7, 111.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-06', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sonali Ganjan') LIMIT 1),
    '5509',
    30, 'kg',
    3.7, 111.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-07', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Prabir Ghorai') LIMIT 1),
    '5510',
    30, 'kg',
    3.7, 111.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-07', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Chandan Kalsar') LIMIT 1),
    '5511',
    30, 'kg',
    3.7, 111.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-07', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Karunakar Munda') LIMIT 1),
    '5512',
    30, 'kg',
    3.7, 111.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-07', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sanjib Mondal') LIMIT 1),
    '5513',
    15, 'kg',
    3.7, 56.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-07', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Prakash Chandara Mohanta') LIMIT 1),
    '5514',
    30, 'kg',
    3.7, 111.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-08', 'other',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Somayya') LIMIT 1),
    '4708',
    5000, 'nos',
    10.5, 52500.0,
    'Maize Bags'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-08', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Mamoni Ashikari') LIMIT 1),
    '5515',
    30, 'kg',
    3.7, 111.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-08', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Tulu Patar') LIMIT 1),
    '5516',
    30, 'kg',
    3.7, 111.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-08', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bulti Dewan') LIMIT 1),
    '5517',
    30, 'kg',
    3.7, 111.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-08', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ratikanta Mohanata') LIMIT 1),
    '5518',
    20, 'kg',
    3.7, 74.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-08', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ananta Hembrem') LIMIT 1),
    '5519',
    30, 'kg',
    3.7, 111.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-08', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Anil Murmu') LIMIT 1),
    '5520',
    30, 'kg',
    3.7, 111.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-08', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Subhash Dehuri') LIMIT 1),
    '5521',
    30, 'kg',
    3.7, 111.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-09', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Deepa Naik') LIMIT 1),
    '5522',
    30, 'kg',
    3.7, 111.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-09', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Lokesh Jagat') LIMIT 1),
    '5523',
    30, 'kg',
    3.7, 111.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-10', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Chandana Kalsar') LIMIT 1),
    '5524',
    30, 'kg',
    3.7, 111.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-10', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Dubraj Hembrem') LIMIT 1),
    '5525',
    27, 'kg',
    3.7, 100.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-10', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Karunakar Munda') LIMIT 1),
    '5526',
    30, 'kg',
    3.7, 111.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-11', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '5528',
    210, 'nos',
    4.1, 861.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-11', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '5528',
    13440, 'nos',
    4.1, 55104.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-11', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Prabir Ghorai') LIMIT 1),
    '5529',
    30, 'kg',
    4.1, 123.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-12', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Anam Naik') LIMIT 1),
    '5530',
    30, 'kg',
    4.1, 123.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-12', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Nintu Metari') LIMIT 1),
    '5531',
    30, 'kg',
    4.1, 123.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-12', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Phakira Mohan Sidu') LIMIT 1),
    '5532',
    30, 'kg',
    4.1, 123.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-12', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sujan Kalsar') LIMIT 1),
    '5533',
    50, 'kg',
    1.0, 50.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-13', 'other',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Somayya') LIMIT 1),
    '4709',
    2750, 'nos',
    0.75, 2063.0,
    'Sellgrit Bags'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-13', 'other',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Somayya') LIMIT 1),
    '4709',
    2100, 'nos',
    2.0, 4200.0,
    'Dorb Bags'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-13', 'other',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Somayya') LIMIT 1),
    '4709',
    700, 'nos',
    2.5, 1750.0,
    'Soya Bags'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-13', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Tulu Patar') LIMIT 1),
    '5534',
    30, 'kg',
    4.1, 123.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-14', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bulti Dewan') LIMIT 1),
    '5535',
    30, 'kg',
    4.1, 123.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-14', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Prabir Ghorai') LIMIT 1),
    '5536',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-14', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Jhantu Behera') LIMIT 1),
    '5537',
    30, 'kg',
    4.1, 123.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-14', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Serfa Hembram') LIMIT 1),
    '5538',
    30, 'kg',
    4.1, 123.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-14', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sujan Kalsar') LIMIT 1),
    '5539',
    30, 'kg',
    4.1, 123.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-14', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Rakesh Das') LIMIT 1),
    '5540',
    60, 'kg',
    4.1, 246.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-15', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Pabithra Naik') LIMIT 1),
    '5541',
    30, 'kg',
    4.1, 123.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-16', 'gas',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Tulu Patar') LIMIT 1),
    '5542',
    1, 'nos',
    1920.0, 1920.0,
    'Hp Gas Cylinder 19 Kg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-16', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sanjb Mondal') LIMIT 1),
    '5543',
    15, 'kg',
    1.0, 15.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-16', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Nita Mohanta') LIMIT 1),
    '5544',
    10, 'kg',
    4.1, 41.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-16', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bsanti Ghorai') LIMIT 1),
    '5545',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-16', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Banasmita Mohanta') LIMIT 1),
    '5546',
    15, 'kg',
    1.0, 15.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-16', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Banasmita Mohanta') LIMIT 1),
    '5546',
    15, 'kg',
    4.1, 62.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-17', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sujit Kumar Mohanta') LIMIT 1),
    '5547',
    30, 'kg',
    4.1, 123.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-18', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Nintu Metari') LIMIT 1),
    '5548',
    30, 'kg',
    4.1, 123.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-19', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Lalita Nayak') LIMIT 1),
    '5549',
    30, 'kg',
    4.1, 123.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-19', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Serfa Hembram') LIMIT 1),
    '5550',
    30, 'kg',
    4.1, 123.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-19', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bulti Dewan') LIMIT 1),
    '5551',
    50, 'kg',
    1.0, 50.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-19', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sahadeb Ganjan') LIMIT 1),
    '5552',
    30, 'kg',
    4.1, 123.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-19', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ananta Hembrem') LIMIT 1),
    '5553',
    24, 'kg',
    4.1, 98.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-19', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Jagabandhu Mohanta') LIMIT 1),
    '5554',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-20', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Basanti Bag') LIMIT 1),
    '5555',
    30, 'kg',
    4.1, 123.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-20', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Phakira Mohan Sidu') LIMIT 1),
    '5556',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-20', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Laxmi Bag') LIMIT 1),
    '5557',
    15, 'kg',
    4.1, 62.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-20', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Dipa Nayak') LIMIT 1),
    '5558',
    30, 'kg',
    4.1, 123.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-21', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '5559',
    2100, 'nos',
    4.35, 9135.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-21', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '5559',
    20160, 'nos',
    4.35, 87696.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-21', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Prabir Ghorai') LIMIT 1),
    '5560',
    50, 'kg',
    1.0, 50.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-21', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Suresh Patra') LIMIT 1),
    '5561',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-21', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Tulu Patar') LIMIT 1),
    '5562',
    30, 'kg',
    4.35, 131.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-21', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Jhanta Behera') LIMIT 1),
    '5563',
    30, 'kg',
    4.35, 131.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-21', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bhaskar Hatui') LIMIT 1),
    '5564',
    30, 'kg',
    4.35, 131.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-21', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ratikanta Mohanta') LIMIT 1),
    '5565',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-22', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Karunakar Munda') LIMIT 1),
    '5566',
    30, 'kg',
    4.35, 131.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-22', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ranjit Khan') LIMIT 1),
    '5567',
    17, 'kg',
    4.35, 74.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-22', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Phakira Mohan Sidu') LIMIT 1),
    '5568',
    30, 'kg',
    4.35, 131.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-22', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Mamuni Adhikari') LIMIT 1),
    '5569',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-23', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bachu Midya') LIMIT 1),
    '5570',
    30, 'kg',
    4.35, 131.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-23', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Tapas Singh') LIMIT 1),
    '5571',
    30, 'kg',
    4.35, 131.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-23', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sagar Ghorai') LIMIT 1),
    '5572',
    30, 'kg',
    4.35, 131.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-23', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Palash Samanta') LIMIT 1),
    '5573',
    30, 'kg',
    4.35, 131.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-23', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Mithun Khan') LIMIT 1),
    '5574',
    30, 'kg',
    4.35, 131.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-23', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Dasarath Mohanta') LIMIT 1),
    '5575',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-23', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bulti Dewan') LIMIT 1),
    '5576',
    30, 'kg',
    4.35, 131.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-23', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Malati Mohanata') LIMIT 1),
    '5577',
    30, 'kg',
    4.35, 131.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-23', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Serfa Hembrem') LIMIT 1),
    '5578',
    30, 'kg',
    4.35, 131.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-23', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Muktamani Mohanta') LIMIT 1),
    '5579',
    30, 'kg',
    4.35, 131.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-23', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Dipa Naik') LIMIT 1),
    '5580',
    30, 'kg',
    4.35, 131.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-24', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Phakira Mohan Sidu') LIMIT 1),
    '5581',
    4.5, 'nos',
    80.0, 360.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-24', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Makta Mohanta') LIMIT 1),
    '5582',
    3.3, 'nos',
    80.0, 264.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-24', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Pabitra Nayak') LIMIT 1),
    '5583',
    3.5, 'nos',
    80.0, 280.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-24', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ramdas Mahali') LIMIT 1),
    '5584',
    3.5, 'nos',
    80.0, 280.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-24', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Shisar Kalsar') LIMIT 1),
    '5585',
    4, 'nos',
    80.0, 320.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-24', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Lokesh Jagat') LIMIT 1),
    '5586',
    3.7, 'nos',
    80.0, 296.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-24', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Jaydeb Pramanik') LIMIT 1),
    '5587',
    4.1, 'nos',
    80.0, 328.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-24', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Puja Naik') LIMIT 1),
    '5588',
    3.6, 'nos',
    80.0, 288.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-24', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Anam Nayak') LIMIT 1),
    '5589',
    4.1, 'nos',
    80.0, 328.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-24', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Raju Dewan') LIMIT 1),
    '5590',
    3.9, 'nos',
    80.0, 312.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-24', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Nantu Metari') LIMIT 1),
    '5591',
    4, 'nos',
    80.0, 320.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-24', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Karunakar Munda') LIMIT 1),
    '5592',
    3, 'nos',
    80.0, 240.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-24', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Lokesh Jagat') LIMIT 1),
    '5593',
    30, 'kg',
    4.35, 131.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-24', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bulti Dewan') LIMIT 1),
    '5594',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-24', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Nita Mohanta') LIMIT 1),
    '5595',
    10, 'kg',
    1.0, 10.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-29', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Dubraj Hembrem') LIMIT 1),
    '5600',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-29', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Trinatha Birua') LIMIT 1),
    '5601',
    30, 'kg',
    4.35, 131.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-29', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Nantu Metari') LIMIT 1),
    '5602',
    30, 'kg',
    4.35, 131.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-29', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Gopal Bag') LIMIT 1),
    '5603',
    30, 'kg',
    4.35, 131.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-29', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sujan Kalsar') LIMIT 1),
    '5604',
    110, 'nos',
    1.0, 110.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-29', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sujan Kalsar') LIMIT 1),
    '5604',
    6, 'kg',
    4.35, 26.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-29', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Phakira Mohan Sidu') LIMIT 1),
    '5605',
    60, 'kg',
    1.0, 60.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-29', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Manoj Majhi') LIMIT 1),
    '5606',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-30', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Basanta Ghorai') LIMIT 1),
    '5607',
    40, 'kg',
    1.0, 40.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-30', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Babulu Kalsar') LIMIT 1),
    '5608',
    30, 'kg',
    4.35, 131.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-30', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Pabitra Nayak') LIMIT 1),
    '5609',
    30, 'kg',
    4.35, 131.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-30', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sagar Ghorai') LIMIT 1),
    '5610',
    30, 'kg',
    4.35, 131.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-30', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sahadeb Ganjan') LIMIT 1),
    '5611',
    30, 'kg',
    4.35, 131.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-30', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ganjan') LIMIT 1),
    '5612',
    60, 'kg',
    1.0, 60.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-30', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Pabitra Nayak') LIMIT 1),
    '5613',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-30', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Phakira Mohan Sidu') LIMIT 1),
    '5614',
    30, 'kg',
    4.35, 131.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-31', 'gas',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ganesh Puja Usage') LIMIT 1),
    '5615',
    2, 'nos',
    0.0, 0.0,
    'Hp Gas Cylinder 19 Kg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-31', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Angad Nayak') LIMIT 1),
    '5616',
    8.2, 'nos',
    80.0, 656.0,
    'Sex Error Birds-2'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-31', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Karunakar Munda') LIMIT 1),
    '5617',
    30, 'kg',
    4.35, 131.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-01', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '5618',
    210, 'nos',
    1.0, 210.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-01', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '5618',
    2730, 'nos',
    4.65, 12695.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-01', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '5618',
    16590, 'nos',
    4.65, 77143.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-01', 'gas',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Jayanta Bag') LIMIT 1),
    '5619',
    1, 'nos',
    1920.0, 1920.0,
    'Hp Gas Cylinder 19 Kg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-01', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bijay Adhikari') LIMIT 1),
    '5620',
    20, 'kg',
    1.0, 20.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-02', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Tapan Halder') LIMIT 1),
    '5621',
    100, 'kg',
    4.65, 465.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-02', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Chandan Nayak') LIMIT 1),
    '5622',
    30, 'kg',
    4.65, 140.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-02', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Nintu Metari') LIMIT 1),
    '5623',
    30, 'kg',
    4.65, 140.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-02', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Mandira Ghorai') LIMIT 1),
    '5624',
    30, 'kg',
    4.65, 140.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-02', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hiralala khan') LIMIT 1),
    '5625',
    30, 'kg',
    4.65, 140.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-02', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Deepa Naik') LIMIT 1),
    '5626',
    30, 'kg',
    4.65, 140.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-02', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Tulu Patar') LIMIT 1),
    '5627',
    30, 'kg',
    4.65, 140.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-02', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Banasmita  Mahanta') LIMIT 1),
    '5628',
    30, 'kg',
    4.65, 140.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-02', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Manoj Majhi') LIMIT 1),
    '5629',
    30, 'kg',
    4.65, 140.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-02', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ramdas Mahali') LIMIT 1),
    '5630',
    30, 'kg',
    4.65, 140.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-02', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Raju Mahali') LIMIT 1),
    '5631',
    15, 'kg',
    4.65, 70.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-02', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Kairi Banara') LIMIT 1),
    '5632',
    30, 'kg',
    4.65, 140.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-02', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Dasarath Mohanta') LIMIT 1),
    '5633',
    10, 'kg',
    1.0, 10.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-02', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Malati Mahanta') LIMIT 1),
    '5634',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-02', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Malati Mahanta') LIMIT 1),
    '5634',
    30, 'kg',
    4.65, 140.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-03', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ratikanta Mohanta') LIMIT 1),
    '5635',
    20, 'kg',
    1.0, 20.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-03', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Jhanta Behera') LIMIT 1),
    '5636',
    30, 'kg',
    4.65, 140.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-03', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Rakesh Behera') LIMIT 1),
    '5637',
    30, 'kg',
    4.65, 140.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-03', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Basanti Ghorai') LIMIT 1),
    '5638',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-03', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Phakirmohan Sidu') LIMIT 1),
    '5639',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-03', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Phakirmohan Sidu') LIMIT 1),
    '5639',
    30, 'kg',
    4.65, 140.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-04', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Palash Dolai') LIMIT 1),
    '5640',
    30, 'kg',
    4.65, 140.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-04', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sagar Ghorai') LIMIT 1),
    '5641',
    30, 'kg',
    4.65, 140.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-04', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Mithun Khan') LIMIT 1),
    '5642',
    30, 'kg',
    4.65, 140.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-04', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Pitambara Mahanta 1') LIMIT 1),
    '5643',
    30, 'kg',
    4.65, 140.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-04', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Basanti Ghorai') LIMIT 1),
    '5644',
    10, 'kg',
    1.0, 10.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-05', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Gopal bag') LIMIT 1),
    '5645',
    30, 'kg',
    4.65, 140.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-05', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Mandira Ghorai') LIMIT 1),
    '5646',
    30, 'kg',
    4.65, 140.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-05', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Karunakar Munda') LIMIT 1),
    '5647',
    30, 'kg',
    4.65, 140.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-05', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Paikiray Ho') LIMIT 1),
    '5648',
    30, 'kg',
    4.65, 140.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-06', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bulti Dewan') LIMIT 1),
    '5649',
    30, 'kg',
    4.65, 140.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-06', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Tulu patar') LIMIT 1),
    '5650',
    30, 'kg',
    4.65, 140.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-07', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Palash Samanta') LIMIT 1),
    '5651',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-07', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Raju Dewan') LIMIT 1),
    '5652',
    30, 'kg',
    4.65, 140.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-07', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Pabitra Nayak') LIMIT 1),
    '5653',
    30, 'kg',
    4.65, 140.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-07', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Gopal Bag') LIMIT 1),
    '5654',
    4.6, 'nos',
    80.0, 368.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-07', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Dubaraj Hemram') LIMIT 1),
    '5655',
    5.1, 'nos',
    80.0, 408.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-07', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Phakirmohan Sidu') LIMIT 1),
    '5656',
    4.8, 'nos',
    80.0, 384.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-07', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ratikanta Mohanta') LIMIT 1),
    '5657',
    4.5, 'nos',
    80.0, 360.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-07', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Jhanata Behera') LIMIT 1),
    '5658',
    3, 'nos',
    80.0, 240.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-07', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sahadeb Ganjan') LIMIT 1),
    '5659',
    4.8, 'nos',
    80.0, 384.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-07', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bhim Ganjan') LIMIT 1),
    '5660',
    3.8, 'nos',
    80.0, 304.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-07', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Serfa Hembram') LIMIT 1),
    '5661',
    4.1, 'nos',
    80.0, 328.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-07', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sukanti Mohanta') LIMIT 1),
    '5662',
    3.9, 'nos',
    80.0, 312.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-08', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ramdas Mahali') LIMIT 1),
    '5663',
    40, 'kg',
    1.0, 40.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-08', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sanjib Mondal') LIMIT 1),
    '5664',
    15, 'kg',
    1.0, 15.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-09', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '5665',
    210, 'nos',
    1.0, 210.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-09', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '5665',
    2100, 'nos',
    4.75, 9975.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-09', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '5665',
    11340, 'nos',
    4.75, 53865.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-09', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Basanti Ghorai') LIMIT 1),
    '5666',
    30, 'kg',
    4.75, 143.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-09', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Phakirmohan Sidu') LIMIT 1),
    '5667',
    30, 'kg',
    4.75, 143.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-09', 'gas',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ananta Hembrem') LIMIT 1),
    '5668',
    1, 'nos',
    1920.0, 1920.0,
    'Hp Gas Cylinder 19 Kg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-10', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Manoj Majhi') LIMIT 1),
    '5669',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-10', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sahadeb Ganjan') LIMIT 1),
    '5670',
    30, 'kg',
    4.75, 143.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-10', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Nita Mohanta') LIMIT 1),
    '5671',
    10, 'kg',
    1.0, 10.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-11', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ananta Hembrem') LIMIT 1),
    '5672',
    60, 'kg',
    1.0, 60.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-11', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Gopal Bag') LIMIT 1),
    '5673',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-12', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Phakirmohan Sidu') LIMIT 1),
    '5674',
    30, 'kg',
    4.75, 143.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-13', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Prabir Ghorai') LIMIT 1),
    '5675',
    30, 'kg',
    4.75, 143.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-13', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Balmik Mohanta') LIMIT 1),
    '5676',
    90, 'kg',
    4.75, 428.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-13', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Phakirmohan Sidu') LIMIT 1),
    '5677',
    90, 'kg',
    4.75, 428.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-13', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Malati Mahanta') LIMIT 1),
    '5678',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-13', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Malati Mahanta') LIMIT 1),
    '5678',
    30, 'kg',
    4.75, 143.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-13', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Gopal Bag') LIMIT 1),
    '5679',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-13', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ramdas mahali') LIMIT 1),
    '5680',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-13', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Manoj Majhi') LIMIT 1),
    '5681',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-14', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Balmik Mohanta') LIMIT 1),
    '5682',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-14', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Palash Ganjan') LIMIT 1),
    '5683',
    100, 'kg',
    1.0, 100.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-14', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Palash Ganjan') LIMIT 1),
    '5684',
    4.8, 'nos',
    80.0, 384.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-14', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Rakesh Behera') LIMIT 1),
    '5685',
    5.3, 'nos',
    80.0, 424.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-14', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ranjit Kadma') LIMIT 1),
    '5686',
    4.5, 'nos',
    80.0, 360.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-14', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bangi Hansda') LIMIT 1),
    '5687',
    5, 'nos',
    80.0, 400.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-14', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Prabir Ghorai') LIMIT 1),
    '5688',
    5.1, 'nos',
    80.0, 408.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-14', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Anam Nayak') LIMIT 1),
    '5689',
    4.8, 'nos',
    80.0, 384.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-14', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Balmik Mohanta') LIMIT 1),
    '5690',
    5.5, 'nos',
    80.0, 440.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-14', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ratikanta Mohanta') LIMIT 1),
    '5691',
    8.4, 'nos',
    80.0, 672.0,
    'Sex Error Birds-2'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-14', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bhagban Mahakur') LIMIT 1),
    '5692',
    4.2, 'nos',
    80.0, 336.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-14', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Tapas Singh') LIMIT 1),
    '5693',
    4.9, 'nos',
    80.0, 392.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-15', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Basanti Ghorai') LIMIT 1),
    '5694',
    150, 'nos',
    1.0, 150.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-15', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sanjib Mondal') LIMIT 1),
    '5695',
    15, 'kg',
    4.75, 71.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-15', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Basanta Nayak') LIMIT 1),
    '5696',
    30, 'kg',
    4.75, 143.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-15', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sagar Ghorai') LIMIT 1),
    '5697',
    90, 'kg',
    1.0, 90.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-16', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Laxmi Mahali') LIMIT 1),
    '5698',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-16', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bhagban Mahakur') LIMIT 1),
    '5699',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-16', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Karunakarmunda') LIMIT 1),
    '5700',
    30, 'kg',
    4.75, 143.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-17', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '5701',
    210, 'nos',
    1.0, 210.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-17', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '5701',
    3570, 'nos',
    4.8, 17136.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-17', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '5701',
    14070, 'nos',
    4.8, 67536.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-17', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Balmik Mohanta') LIMIT 1),
    '5702',
    30, 'kg',
    4.8, 144.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-17', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Muktamani Mohanta') LIMIT 1),
    '5703',
    30, 'kg',
    4.8, 144.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-17', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sahadeb Ganjan') LIMIT 1),
    '5704',
    100, 'kg',
    1.0, 100.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-18', 'gas',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Dubaraj Hemram') LIMIT 1),
    '5705',
    1, 'nos',
    1920.0, 1920.0,
    'Hp Gas Cylinder 19 Kg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-18', 'gas',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sanjib Mondal') LIMIT 1),
    '5706',
    1, 'nos',
    1920.0, 1920.0,
    'Hp Gas Cylinder 19 Kg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-18', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Tulu Patar') LIMIT 1),
    '5707',
    30, 'kg',
    4.8, 144.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-18', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ranjit Kadma') LIMIT 1),
    '5708',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-18', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Dulari Mahali') LIMIT 1),
    '5709',
    20, 'kg',
    1.0, 20.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-18', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Serfa Hembram') LIMIT 1),
    '5710',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-19', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Balmik Mohanta') LIMIT 1),
    '5711',
    100, 'kg',
    1.0, 100.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-19', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Manoj Majhi') LIMIT 1),
    '5712',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-19', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Raimat Majhi') LIMIT 1),
    '5713',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-19', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Tapan Halder') LIMIT 1),
    '5714',
    100, 'kg',
    1.0, 100.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-20', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Nintu Metari') LIMIT 1),
    '5715',
    10, 'kg',
    4.8, 48.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-20', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sujit Khan') LIMIT 1),
    '5716',
    10, 'kg',
    1.0, 10.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-21', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ghasia Hemram') LIMIT 1),
    '5717',
    4.8, 'nos',
    80.0, 384.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-21', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Balmik Mohanta') LIMIT 1),
    '5718',
    5.1, 'nos',
    80.0, 408.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-21', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Lalita Nayak') LIMIT 1),
    '5719',
    3.6, 'nos',
    80.0, 288.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-21', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Rakesh Behera') LIMIT 1),
    '5720',
    4.9, 'nos',
    80.0, 392.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-21', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Tapan Halder') LIMIT 1),
    '5721',
    4.1, 'nos',
    80.0, 328.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-21', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bhaskar Hatai') LIMIT 1),
    '5722',
    8.4, 'nos',
    80.0, 672.0,
    'Sex Error Birds-2'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-21', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bhaskar Hatai') LIMIT 1),
    '5723',
    50, 'kg',
    1.0, 50.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-21', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Anil Murmu') LIMIT 1),
    '5724',
    30, 'kg',
    4.8, 144.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-21', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Dhiren Behera') LIMIT 1),
    '5725',
    30, 'kg',
    4.8, 144.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-21', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Karunakar Munda') LIMIT 1),
    '5726',
    30, 'kg',
    4.8, 144.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-22', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Rupa Singh') LIMIT 1),
    '5727',
    100, 'kg',
    1.0, 100.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-22', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Dhiren Behera') LIMIT 1),
    '5728',
    60, 'kg',
    4.8, 288.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-22', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Lokesh Jagat') LIMIT 1),
    '5729',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-22', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ratikanta Mohanta') LIMIT 1),
    '5730',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-23', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Basanta Ghorai') LIMIT 1),
    '5731',
    90, 'kg',
    1.0, 90.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-23', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hiranmoy Mandal') LIMIT 1),
    '5732',
    270, 'nos',
    4.8, 1296.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-23', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Manoj Majhi') LIMIT 1),
    '5733',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-23', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Kaman Bagar HI') LIMIT 1),
    '5734',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-24', 'other',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Cash Sales') LIMIT 1),
    '4710',
    52, 'nos',
    5.0, 260.0,
    'Maize Damage Bags'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-24', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Basanti Bag') LIMIT 1),
    '5735',
    30, 'kg',
    4.8, 144.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-24', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Balmik Mohanta') LIMIT 1),
    '5736',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-24', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bhagwan Mahakur') LIMIT 1),
    '5737',
    30, 'kg',
    4.8, 144.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-24', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bulti Dewan') LIMIT 1),
    '5738',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-24', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ranjit Kadma') LIMIT 1),
    '5739',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-25', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '5740',
    630, 'nos',
    1.0, 630.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-25', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '5740',
    4620, 'nos',
    4.8, 22176.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-25', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '5740',
    9660, 'nos',
    4.8, 46368.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-25', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Gopal Bag') LIMIT 1),
    '5741',
    30, 'kg',
    4.8, 144.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-25', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Karunakarmunda') LIMIT 1),
    '5742',
    100, 'kg',
    1.0, 100.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-25', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Trinath Birua') LIMIT 1),
    '5743',
    30, 'kg',
    4.8, 144.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-26', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Balmik Mohanta') LIMIT 1),
    '5744',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-26', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Tulu Patar') LIMIT 1),
    '5745',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-26', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Manoj Majhi') LIMIT 1),
    '5746',
    30, 'kg',
    4.8, 144.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-26', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Raimat Majhi') LIMIT 1),
    '5747',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-26', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Pabitra Nayak') LIMIT 1),
    '5748',
    30, 'kg',
    4.8, 144.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-27', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Palash Samanta') LIMIT 1),
    '5749',
    60, 'kg',
    1.0, 60.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-27', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Balmik Mohanta') LIMIT 1),
    '5750',
    30, 'kg',
    4.8, 144.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-27', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Dasarath Mohanta') LIMIT 1),
    '5751',
    10, 'kg',
    1.0, 10.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-27', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ramdas Mahali') LIMIT 1),
    '5752',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-28', 'other',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Somayya') LIMIT 1),
    '4711',
    5000, 'nos',
    10.75, 53750.0,
    'Maize Bags'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-28', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bulti Dewan') LIMIT 1),
    '5753',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-28', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sanjib Mondal') LIMIT 1),
    '5754',
    60, 'kg',
    4.8, 288.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-28', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Tapas Singh') LIMIT 1),
    '5755',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-28', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Mandira Gharai') LIMIT 1),
    '5756',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-28', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Lalitha Nayak') LIMIT 1),
    '5757',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-28', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Rupa Bindhani 2') LIMIT 1),
    '5758',
    30, 'kg',
    4.8, 144.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-28', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Rakesh Behera') LIMIT 1),
    '5759',
    30, 'kg',
    4.8, 144.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-28', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Rakesh Behera') LIMIT 1),
    '5760',
    4.3, 'nos',
    80.0, 344.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-28', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Rupa Singh') LIMIT 1),
    '5761',
    3, 'nos',
    80.0, 240.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-28', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Anil Murmu') LIMIT 1),
    '5762',
    7.5, 'nos',
    80.0, 600.0,
    'Sex Error Birds-2'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-28', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Nashomoni Mahali') LIMIT 1),
    '5763',
    4.3, 'nos',
    80.0, 344.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-28', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Jaydev Paramanik') LIMIT 1),
    '5764',
    4.6, 'nos',
    80.0, 368.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-28', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ghaneswari Nayak') LIMIT 1),
    '5765',
    4, 'nos',
    80.0, 320.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-28', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sujan Kalsar') LIMIT 1),
    '5766',
    4, 'nos',
    80.0, 320.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-28', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Jayanta Bag') LIMIT 1),
    '5767',
    3, 'nos',
    80.0, 240.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-28', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Laxmi bag') LIMIT 1),
    '5768',
    10, 'nos',
    80.0, 800.0,
    'Sex Error Birds-3'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-28', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Serfa Hembram') LIMIT 1),
    '5769',
    4, 'nos',
    80.0, 320.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-28', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Balmik Mohanta') LIMIT 1),
    '5770',
    7.5, 'nos',
    80.0, 600.0,
    'Sex Error Birds-2'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-29', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Suna Naik') LIMIT 1),
    '5771',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-09-30', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Phakirmohan Sidu') LIMIT 1),
    '5772',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-01', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Phakirmohan Sidu') LIMIT 1),
    '5773',
    30, 'kg',
    4.8, 144.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-01', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Basanti Ghorai') LIMIT 1),
    '5774',
    50, 'kg',
    1.0, 50.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-01', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Balmik Mohanta') LIMIT 1),
    '5775',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-01', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Rabindra Lohar') LIMIT 1),
    '5776',
    60, 'kg',
    4.8, 288.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-01', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Manoj Majhi') LIMIT 1),
    '5777',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-01', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sahadeb Ganjan') LIMIT 1),
    '5778',
    60, 'kg',
    1.0, 60.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-02', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ranjit kadma') LIMIT 1),
    '5779',
    40, 'kg',
    1.0, 40.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-02', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Gopal Bag') LIMIT 1),
    '5780',
    30, 'kg',
    4.8, 144.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-02', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Shiba Sing') LIMIT 1),
    '5781',
    60, 'kg',
    1.0, 60.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-02', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Arun Khan') LIMIT 1),
    '5782',
    100, 'kg',
    1.0, 100.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-03', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Karunakar Munda') LIMIT 1),
    '5783',
    100, 'kg',
    1.0, 100.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-03', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Phakirmohan Sidu') LIMIT 1),
    '5784',
    100, 'kg',
    1.0, 100.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-03', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Serfa Hembrem') LIMIT 1),
    '5785',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-03', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Malati Mohanta') LIMIT 1),
    '5786',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-03', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Tulu Patar') LIMIT 1),
    '5787',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-04', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ratikanta Mohanta') LIMIT 1),
    '5788',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-04', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sonali Ganjan') LIMIT 1),
    '5789',
    100, 'kg',
    1.0, 100.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-05', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bhim Ganjan') LIMIT 1),
    '5790',
    4.6, 'nos',
    80.0, 368.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-05', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Jhanta Behera') LIMIT 1),
    '5791',
    4.1, 'nos',
    80.0, 328.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-05', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Goutham Ghorai') LIMIT 1),
    '5792',
    3.8, 'nos',
    80.0, 304.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-05', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Arun Khan') LIMIT 1),
    '5793',
    4.6, 'nos',
    80.0, 368.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-05', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Karunakarmunda') LIMIT 1),
    '5794',
    4.6, 'nos',
    80.0, 368.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-05', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Rakesh Behera') LIMIT 1),
    '5795',
    3.9, 'nos',
    80.0, 312.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-05', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Pradip Behera') LIMIT 1),
    '5796',
    3.7, 'nos',
    80.0, 296.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-05', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Subash Dehuri') LIMIT 1),
    '5797',
    8, 'nos',
    80.0, 640.0,
    'Sex Error Birds-2'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-05', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bholanath Ghorai') LIMIT 1),
    '5798',
    4.5, 'nos',
    80.0, 360.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-05', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Shaktipadamandal') LIMIT 1),
    '5799',
    3.6, 'nos',
    80.0, 288.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-05', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Phakirmohan Sidu') LIMIT 1),
    '5800',
    4.7, 'nos',
    80.0, 376.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-05', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ratikanta Mohanta') LIMIT 1),
    '5801',
    2.3, 'nos',
    80.0, 184.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-05', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Lokesh Jagat') LIMIT 1),
    '5802',
    4.6, 'nos',
    80.0, 368.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-05', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Manoj Majhi') LIMIT 1),
    '5803',
    4, 'nos',
    80.0, 320.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-05', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Basanta Nayak') LIMIT 1),
    '5804',
    4.2, 'nos',
    80.0, 336.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-05', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bijay Adhikary') LIMIT 1),
    '5805',
    60, 'kg',
    1.0, 60.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-05', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Raju Singh') LIMIT 1),
    '5806',
    30, 'kg',
    4.8, 144.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-05', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Pradeep Behera') LIMIT 1),
    '5807',
    30, 'kg',
    4.8, 144.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-06', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Anam Naik') LIMIT 1),
    '5808',
    30, 'kg',
    4.8, 144.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-06', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bangi Hansda') LIMIT 1),
    '5809',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-07', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '5810',
    1050, 'nos',
    1.0, 1050.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-07', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '5810',
    3360, 'nos',
    4.55, 15288.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-07', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '5810',
    11550, 'nos',
    4.55, 52553.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-07', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ghaneswari Nayak') LIMIT 1),
    '5811',
    80, 'kg',
    1.0, 80.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-07', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Balmik Mohanta') LIMIT 1),
    '5812',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-07', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bhagban Mahakur') LIMIT 1),
    '5813',
    30, 'kg',
    4.55, 137.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-09', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Serfa Hembrem') LIMIT 1),
    '5814',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-09', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Tulu Patar') LIMIT 1),
    '5815',
    40, 'kg',
    1.0, 40.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-09', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Arjun Kumar Mohanta') LIMIT 1),
    '5816',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-09', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Phakirmohan Sidu') LIMIT 1),
    '5817',
    100, 'kg',
    1.0, 100.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-09', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bulti Dewan') LIMIT 1),
    '5818',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-09', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Madhu HO') LIMIT 1),
    '5819',
    30, 'kg',
    4.55, 137.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-09', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Vambal Ganjan') LIMIT 1),
    '5820',
    100, 'kg',
    1.0, 100.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-09', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Kairi Banara') LIMIT 1),
    '5821',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-09', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Jayanta Bag') LIMIT 1),
    '5822',
    60, 'kg',
    4.55, 273.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-10', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sagar Ghorai') LIMIT 1),
    '5823',
    100, 'kg',
    1.0, 100.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-10', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sahadeb Ghorai') LIMIT 1),
    '5824',
    30, 'kg',
    4.55, 137.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-10', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Raju Dewan') LIMIT 1),
    '5825',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-11', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Balmik Mohanta') LIMIT 1),
    '5826',
    90, 'kg',
    4.55, 410.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-11', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ramesh Chandra Mohanta') LIMIT 1),
    '5827',
    90, 'kg',
    4.55, 410.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-11', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Muktamani Mohanta') LIMIT 1),
    '5828',
    90, 'kg',
    4.55, 410.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-11', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Birbahadur Beshra') LIMIT 1),
    '5829',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-12', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sahadeb Ganjan') LIMIT 1),
    '5830',
    4.7, 'nos',
    80.0, 376.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-12', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Radhu Singh') LIMIT 1),
    '5831',
    4, 'nos',
    80.0, 320.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-12', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Kalali Hansda') LIMIT 1),
    '5832',
    3.5, 'nos',
    80.0, 280.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-12', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Phakir Mohan Sidu') LIMIT 1),
    '5833',
    4.2, 'nos',
    80.0, 336.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-12', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bhagban Mahakur') LIMIT 1),
    '5834',
    4.3, 'nos',
    80.0, 344.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-12', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Jhanta Behera') LIMIT 1),
    '5835',
    3.5, 'nos',
    80.0, 280.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-12', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Tapan Halder') LIMIT 1),
    '5836',
    3.8, 'nos',
    80.0, 304.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-12', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Swadesh Murmu') LIMIT 1),
    '5837',
    4.1, 'nos',
    80.0, 328.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-12', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Madhaba Munda') LIMIT 1),
    '5838',
    4.2, 'nos',
    80.0, 336.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-12', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Lokesh Jagat') LIMIT 1),
    '5839',
    9, 'nos',
    80.0, 720.0,
    'Sex Error Birds-2'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-12', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Karunakarmunda') LIMIT 1),
    '5840',
    30, 'kg',
    4.55, 137.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-12', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ramdas Mahali') LIMIT 1),
    '5841',
    110, 'nos',
    1.0, 110.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-13', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Mandira Ghorai') LIMIT 1),
    '5842',
    60, 'kg',
    1.0, 60.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-14', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Basanti Ghorai') LIMIT 1),
    '5843',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-14', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Mita Ghorai') LIMIT 1),
    '5844',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-14', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Saheb Ghorai') LIMIT 1),
    '5845',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-14', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ramdas Mahali') LIMIT 1),
    '5846',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-15', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Basanti Ghorai') LIMIT 1),
    '5847',
    20, 'kg',
    1.0, 20.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-15', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Dulari Mahali') LIMIT 1),
    '5848',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-15', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Puja Niak') LIMIT 1),
    '5849',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-15', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Phakirmohan Sidu') LIMIT 1),
    '5850',
    100, 'kg',
    1.0, 100.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-15', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Arun Khan') LIMIT 1),
    '5851',
    80, 'kg',
    1.0, 80.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-15', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Manoj Majhi') LIMIT 1),
    '5852',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-15', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Jayanta Bag') LIMIT 1),
    '5853',
    60, 'kg',
    1.0, 60.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-15', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Gopal Bag') LIMIT 1),
    '5854',
    30, 'kg',
    4.55, 137.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-16', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '5855',
    2100, 'nos',
    1.0, 2100.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-16', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '5855',
    4200, 'nos',
    4.6, 19320.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-16', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '5855',
    6930, 'nos',
    4.6, 31878.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-18', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Tulu Patar') LIMIT 1),
    '5856',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-18', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Mithun Khan') LIMIT 1),
    '5857',
    100, 'kg',
    1.0, 100.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-18', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Arjun Kumar Mohanta') LIMIT 1),
    '5858',
    30, 'kg',
    4.6, 138.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-18', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Raimat Majhi') LIMIT 1),
    '5859',
    30, 'kg',
    4.6, 138.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-19', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Santosh Behera') LIMIT 1),
    '5860',
    4.6, 'nos',
    80.0, 368.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-19', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Raimat Majhi') LIMIT 1),
    '5861',
    4.1, 'nos',
    80.0, 328.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-19', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Gopal Bag') LIMIT 1),
    '5862',
    5, 'nos',
    80.0, 400.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-19', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Phakir Mohan Sidu') LIMIT 1),
    '5863',
    3.8, 'nos',
    80.0, 304.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-19', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ramdas Mahali') LIMIT 1),
    '5864',
    30, 'kg',
    4.6, 138.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-20', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Basanta Nayak') LIMIT 1),
    '5865',
    60, 'kg',
    1.0, 60.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-20', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Kabira Sing  Danga') LIMIT 1),
    '5866',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-21', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bijay Adhikary') LIMIT 1),
    '5867',
    30, 'kg',
    4.6, 138.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-21', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sujan Kalsar') LIMIT 1),
    '5868',
    100, 'kg',
    1.0, 100.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-21', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sujit Khan') LIMIT 1),
    '5869',
    60, 'kg',
    1.0, 60.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-21', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ramdas Mahali') LIMIT 1),
    '5870',
    60, 'kg',
    4.6, 276.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-22', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bulti Dewan') LIMIT 1),
    '5871',
    80, 'kg',
    1.0, 80.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-22', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sahadev Ganjan') LIMIT 1),
    '5872',
    100, 'kg',
    1.0, 100.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-23', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Balmik Mohanta') LIMIT 1),
    '5873',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-23', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Tulu Patar') LIMIT 1),
    '5874',
    5, 'nos',
    80.0, 400.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-24', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Lokesh Jagat') LIMIT 1),
    '5875',
    5, 'nos',
    80.0, 400.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-24', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Phakir Mohan Sidu') LIMIT 1),
    '5876',
    4.3, 'nos',
    80.0, 344.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-24', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sujan Kalsar') LIMIT 1),
    '5877',
    3.8, 'nos',
    80.0, 304.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-24', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Basanti Ghorai') LIMIT 1),
    '5878',
    4, 'nos',
    80.0, 320.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-24', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Rambhabati Nayak') LIMIT 1),
    '5879',
    54, 'kg',
    1.0, 54.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-24', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bhagban Mahakur') LIMIT 1),
    '5880',
    30, 'kg',
    4.6, 138.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-24', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Rupa Singh') LIMIT 1),
    '5881',
    60, 'kg',
    4.6, 276.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-24', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sonali Ganjan') LIMIT 1),
    '5882',
    30, 'kg',
    4.6, 138.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-24', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sukmar Sing') LIMIT 1),
    '5883',
    60, 'kg',
    4.6, 276.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-25', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '5884',
    2730, 'nos',
    1.0, 2730.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-25', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '5884',
    7560, 'nos',
    4.9, 37044.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-25', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '5884',
    7980, 'nos',
    4.9, 39102.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-25', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Tapas Sing') LIMIT 1),
    '5885',
    30, 'kg',
    4.9, 147.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-25', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bulti Sing') LIMIT 1),
    '5886',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-25', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Nintu Metari') LIMIT 1),
    '5887',
    15, 'kg',
    4.9, 74.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-26', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ghaneswari Nayak') LIMIT 1),
    '5888',
    20, 'kg',
    1.0, 20.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-26', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Phakir Mohan Sidu') LIMIT 1),
    '5889',
    5, 'nos',
    80.0, 400.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-26', 'bird_sex_error',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Raju Dewan') LIMIT 1),
    '5890',
    4.4, 'nos',
    80.0, 352.0,
    'Sex Error Birds-1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-27', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bulti Dewan') LIMIT 1),
    '5891',
    120, 'nos',
    1.0, 120.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-27', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Tulu Patar') LIMIT 1),
    '5892',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-28', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Phakir mohan Sidu') LIMIT 1),
    '5893',
    100, 'kg',
    1.0, 100.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-28', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Saheb Ghorai') LIMIT 1),
    '5894',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-28', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Mandira Ghorai') LIMIT 1),
    '5895',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-28', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Anam Naik') LIMIT 1),
    '5896',
    30, 'kg',
    4.9, 147.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-29', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Karunakar Munda') LIMIT 1),
    '5897',
    30, 'kg',
    4.9, 147.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-29', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Vamoli ganjan') LIMIT 1),
    '5898',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-30', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ramdas Mahali') LIMIT 1),
    '5899',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-31', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sanjib Mandal') LIMIT 1),
    '5900',
    10, 'kg',
    1.0, 10.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-31', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bijay Adhikari') LIMIT 1),
    '6001',
    100, 'kg',
    1.0, 100.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-10-31', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Laxmi Mahali') LIMIT 1),
    '6002',
    15, 'kg',
    4.9, 74.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-01', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Basanti Ghorai') LIMIT 1),
    '6003',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-01', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bir Bahadur Beshra') LIMIT 1),
    '6004',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-01', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Palash Samanta') LIMIT 1),
    '6005',
    60, 'kg',
    1.0, 60.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-01', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Arun Khan') LIMIT 1),
    '6006',
    100, 'kg',
    1.0, 100.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-01', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Rakesh Behera') LIMIT 1),
    '6007',
    100, 'kg',
    1.0, 100.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-01', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Karunakarmunda') LIMIT 1),
    '6008',
    30, 'kg',
    4.9, 147.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-02', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Phakir Mohan Sidu') LIMIT 1),
    '6009',
    5, 'nos',
    80.0, 400.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-02', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bangi Hansda') LIMIT 1),
    '6010',
    3.8, 'nos',
    80.0, 304.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-02', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Anam Nayak') LIMIT 1),
    '6011',
    3.7, 'nos',
    80.0, 296.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-02', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Jasna Metari') LIMIT 1),
    '6012',
    4.2, 'nos',
    80.0, 336.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-02', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Avinath Rishi') LIMIT 1),
    '6013',
    5.3, 'nos',
    80.0, 424.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-03', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Pradip Patra') LIMIT 1),
    '6014',
    210, 'nos',
    4.9, 1029.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-03', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Saheb Ghorai') LIMIT 1),
    '6015',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-03', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bijay Adhikari') LIMIT 1),
    '6016',
    30, 'kg',
    4.9, 147.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-03', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Serfa Hembrem') LIMIT 1),
    '6017',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-04', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Phakir Mohan Sidu') LIMIT 1),
    '6018',
    100, 'kg',
    1.0, 100.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-04', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Basanta Nayak') LIMIT 1),
    '6019',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-04', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ashtami Khan') LIMIT 1),
    '6020',
    30, 'kg',
    4.9, 147.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-04', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Manoj Majhi') LIMIT 1),
    '6021',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-04', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sonali Ganjan') LIMIT 1),
    '6022',
    100, 'kg',
    1.0, 100.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-04', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Mandira Ghorai') LIMIT 1),
    '6023',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-05', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6024',
    2310, 'nos',
    1.0, 2310.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-05', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6024',
    3990, 'nos',
    5.1, 20349.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-05', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6024',
    8190, 'nos',
    5.1, 41769.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-05', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Palasha Samanta') LIMIT 1),
    '6025',
    100, 'kg',
    1.0, 100.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-05', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bir Bahadur Beshra') LIMIT 1),
    '6026',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-05', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Jhanta Behera') LIMIT 1),
    '6027',
    30, 'kg',
    5.1, 153.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-05', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Biju Lohar') LIMIT 1),
    '6028',
    60, 'kg',
    5.1, 306.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-06', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Rupa Bindhani') LIMIT 1),
    '6029',
    30, 'kg',
    5.1, 153.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-06', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Tulu Patar') LIMIT 1),
    '6030',
    40, 'kg',
    1.0, 40.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-06', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Basanti Ghorai') LIMIT 1),
    '6031',
    20, 'kg',
    1.0, 20.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-07', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ramdas Mahali') LIMIT 1),
    '6032',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-07', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bulti Dewan') LIMIT 1),
    '6033',
    40, 'kg',
    1.0, 40.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-07', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Pabitra Nayak') LIMIT 1),
    '6034',
    30, 'kg',
    5.1, 153.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-08', 'other',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Somayya') LIMIT 1),
    '4712',
    5000, 'nos',
    10.75, 53750.0,
    'Maize Bags'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-08', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sona Nayak') LIMIT 1),
    '6035',
    20, 'kg',
    1.0, 20.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-08', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Saheb Ghorai') LIMIT 1),
    '6036',
    90, 'kg',
    5.1, 459.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-08', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Astami Khan') LIMIT 1),
    '6037',
    120, 'nos',
    5.1, 612.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-08', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Palash Dolai') LIMIT 1),
    '6038',
    60, 'kg',
    5.1, 306.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-08', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Kedar Singh') LIMIT 1),
    '6039',
    30, 'kg',
    5.1, 153.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-08', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Mandira Ghorai') LIMIT 1),
    '6040',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-09', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Pabitra Nayak') LIMIT 1),
    '6041',
    3.7, 'nos',
    80.0, 296.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-09', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Phakir Mohan Sidu') LIMIT 1),
    '6042',
    5, 'nos',
    80.0, 400.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-09', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ranjit Patar') LIMIT 1),
    '6043',
    4.6, 'nos',
    80.0, 368.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-09', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Dubraj Hemram') LIMIT 1),
    '6044',
    5.3, 'nos',
    80.0, 424.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-09', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Phakir Mohan Sidu') LIMIT 1),
    '6045',
    100, 'kg',
    1.0, 100.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-09', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bachu Midya') LIMIT 1),
    '6046',
    30, 'kg',
    5.1, 153.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-11', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Kabirasing Danga') LIMIT 1),
    '6047',
    60, 'kg',
    1.0, 60.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-11', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Serfa Hembrem') LIMIT 1),
    '6048',
    60, 'kg',
    1.0, 60.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-11', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sadananda Lohar') LIMIT 1),
    '6049',
    30, 'kg',
    5.1, 153.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-12', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bulti Sing') LIMIT 1),
    '6050',
    60, 'kg',
    5.1, 306.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-12', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Basanta Nayak') LIMIT 1),
    '6051',
    50, 'kg',
    1.0, 50.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-12', 'bird_cull',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sathyanarayana') LIMIT 1),
    '234',
    206.27, 'nos',
    70.0, 14439.0,
    'Cull birds Female - 64 F-19'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-13', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Mandira Ghorai') LIMIT 1),
    '6052',
    50, 'kg',
    1.0, 50.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-13', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sanjib Mandal') LIMIT 1),
    '6053',
    10, 'kg',
    1.0, 10.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-13', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Basanti Bag') LIMIT 1),
    '6054',
    30, 'kg',
    5.1, 153.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-13', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bhagban Mahakur') LIMIT 1),
    '6055',
    30, 'kg',
    5.1, 153.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-14', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6056',
    1680, 'nos',
    1.0, 1680.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-14', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6056',
    2310, 'nos',
    5.4, 12474.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-14', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6056',
    9240, 'nos',
    5.4, 49896.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-14', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Manoj Majhi') LIMIT 1),
    '6057',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-15', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ranjan Biswas') LIMIT 1),
    '6058',
    20, 'kg',
    1.0, 20.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-15', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ghasia Hemrem') LIMIT 1),
    '6059',
    30, 'kg',
    5.4, 162.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-15', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ghungura Naik') LIMIT 1),
    '6060',
    30, 'kg',
    5.4, 162.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-15', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Tulu Patar') LIMIT 1),
    '6061',
    30, 'kg',
    5.4, 162.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-16', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Balmik Mohanta') LIMIT 1),
    '6062',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-16', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Lokesh Jagat') LIMIT 1),
    '6063',
    4, 'nos',
    80.0, 320.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-16', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Birbahadur Beshra') LIMIT 1),
    '6064',
    4.7, 'nos',
    80.0, 376.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-16', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Lahari Farms') LIMIT 1),
    '6065',
    11.2, 'nos',
    80.0, 896.0,
    'Lame Birds 3'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-17', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Balmik Mohanta') LIMIT 1),
    '6066',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-18', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bijay Adhikari') LIMIT 1),
    '6067',
    70, 'kg',
    1.0, 70.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-19', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Balmik Mohanta') LIMIT 1),
    '6068',
    120, 'nos',
    1.0, 120.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-19', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bulti Dewan') LIMIT 1),
    '6069',
    160, 'nos',
    1.0, 160.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-19', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Birbahadur Beshra') LIMIT 1),
    '6070',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-20', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Manoj Majhi') LIMIT 1),
    '6071',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-20', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sanjib Mandal') LIMIT 1),
    '6072',
    10, 'kg',
    1.0, 10.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-21', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Arjun Kumar Mohanta') LIMIT 1),
    '6073',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-21', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Birbahadur Beshra') LIMIT 1),
    '6074',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-22', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Balmik Mohanata') LIMIT 1),
    '6075',
    10, 'kg',
    1.0, 10.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-23', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6076',
    1890, 'nos',
    1.0, 1890.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-23', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6076',
    840, 'nos',
    5.85, 4914.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-23', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6076',
    8400, 'nos',
    5.85, 49140.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-23', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ramdas Mahali') LIMIT 1),
    '6077',
    3, 'nos',
    80.0, 240.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-23', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Birbahadur Beshra') LIMIT 1),
    '6078',
    3.6, 'nos',
    80.0, 288.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-23', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Goutham Ghorai') LIMIT 1),
    '6079',
    3.6, 'nos',
    80.0, 288.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-23', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Lakhi Kanata Singh') LIMIT 1),
    '6080',
    3.8, 'nos',
    80.0, 304.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-23', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Tapas Ganajan') LIMIT 1),
    '6081',
    3, 'nos',
    80.0, 240.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-23', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Chatu Das') LIMIT 1),
    '6082',
    3.9, 'nos',
    80.0, 312.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-23', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Shaktipadamandal') LIMIT 1),
    '6083',
    4.4, 'nos',
    80.0, 352.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-23', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Prakash Mohanta') LIMIT 1),
    '6084',
    60, 'kg',
    1.0, 60.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-25', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Basanta Nayak') LIMIT 1),
    '6085',
    60, 'kg',
    1.0, 60.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-25', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Birbahadur Beshra') LIMIT 1),
    '6086',
    60, 'kg',
    1.0, 60.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-25', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ramdas Mahali') LIMIT 1),
    '6087',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-25', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ranjit Kadma') LIMIT 1),
    '6088',
    30, 'kg',
    5.85, 176.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-26', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Basanthi Ghorai') LIMIT 1),
    '6089',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-26', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Birbahadur Beshra') LIMIT 1),
    '6090',
    60, 'kg',
    5.85, 351.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-26', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Tapas Sing') LIMIT 1),
    '6091',
    30, 'kg',
    5.85, 176.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-27', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Tulu Patar') LIMIT 1),
    '6092',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-28', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bhamana Kajan') LIMIT 1),
    '6093',
    90, 'kg',
    1.0, 90.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-28', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Brinda Kha') LIMIT 1),
    '6094',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-28', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Brinda Kha') LIMIT 1),
    '6094',
    30, 'kg',
    5.85, 176.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-30', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Birbahadur Beshra') LIMIT 1),
    '6095',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-30', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bulti Dewan') LIMIT 1),
    '6096',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-30', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Soymen Das') LIMIT 1),
    '6097',
    30, 'kg',
    5.85, 176.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-30', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sadananda Lohar') LIMIT 1),
    '6098',
    30, 'kg',
    5.85, 176.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-30', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Prakash Chandra Mohanta') LIMIT 1),
    '6099',
    4.9, 'nos',
    80.0, 392.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-30', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Birbahadur Beshra') LIMIT 1),
    '6100',
    5.2, 'nos',
    80.0, 416.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-30', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Brinda Kha') LIMIT 1),
    '6201',
    4.3, 'nos',
    80.0, 344.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-30', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Anam Naik') LIMIT 1),
    '6202',
    4.3, 'nos',
    80.0, 344.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-30', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ranjit Kadma') LIMIT 1),
    '6203',
    6.2, 'nos',
    80.0, 496.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-30', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Radhu Singh') LIMIT 1),
    '6204',
    4.5, 'nos',
    80.0, 360.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-30', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Dhiren Behera') LIMIT 1),
    '6205',
    3.7, 'nos',
    80.0, 296.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-30', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Arun Khan') LIMIT 1),
    '6206',
    3.6, 'nos',
    80.0, 288.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-11-30', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Karunakar Munda') LIMIT 1),
    '6207',
    3.6, 'nos',
    80.0, 288.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-01', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Serfa Hembrem') LIMIT 1),
    '6208',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-01', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Basanthi Ghorai') LIMIT 1),
    '6209',
    10, 'kg',
    1.0, 10.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-01', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bangi Hansda') LIMIT 1),
    '6210',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-02', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Basanta Nayak') LIMIT 1),
    '6211',
    145, 'nos',
    1.0, 145.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-02', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Birbahadur Beshra') LIMIT 1),
    '6212',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-03', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ghasia Hemrem') LIMIT 1),
    '6213',
    30, 'kg',
    5.85, 176.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-04', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6214',
    2310, 'nos',
    1.0, 2310.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-04', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6214',
    2940, 'nos',
    5.91, 17376.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-04', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6214',
    9870, 'nos',
    5.91, 58332.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-04', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ratikanta Mohanta') LIMIT 1),
    '6215',
    30, 'kg',
    5.91, 177.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-04', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Lokesh Jagat') LIMIT 1),
    '6216',
    30, 'kg',
    5.91, 177.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-04', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ajit Das') LIMIT 1),
    '6217',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-05', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Basanta Nayak') LIMIT 1),
    '6218',
    100, 'kg',
    1.0, 100.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-05', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Manoj Majhi') LIMIT 1),
    '6219',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-05', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Anam Naik') LIMIT 1),
    '6220',
    30, 'kg',
    5.91, 177.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-06', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bulti Dewan') LIMIT 1),
    '6221',
    20, 'kg',
    1.0, 20.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-09', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Birbahadur Beshra') LIMIT 1),
    '6222',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-09', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Basanti Ghorai') LIMIT 1),
    '6223',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-09', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Tulu Patar') LIMIT 1),
    '6224',
    30, 'kg',
    5.91, 177.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-10', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6225',
    1470, 'nos',
    1.0, 1470.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-10', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6225',
    6720, 'nos',
    5.91, 39715.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-10', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Laxmi Mahali') LIMIT 1),
    '6226',
    40, 'kg',
    1.0, 40.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-10', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Dipanwita Sarkar') LIMIT 1),
    '6227',
    90, 'kg',
    5.91, 532.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-11', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Birbahadur Beshra') LIMIT 1),
    '6228',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-11', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Palasha Samanta') LIMIT 1),
    '6229',
    100, 'kg',
    1.0, 100.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-11', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Balmik Mohanta') LIMIT 1),
    '6230',
    30, 'kg',
    5.91, 177.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-11', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Manoj Majhi') LIMIT 1),
    '6231',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-13', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Basanti Ghorai') LIMIT 1),
    '6232',
    70, 'kg',
    1.0, 70.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-15', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bablu Kalsar') LIMIT 1),
    '6233',
    110, 'nos',
    1.0, 110.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-16', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Madhaba Munda') LIMIT 1),
    '6234',
    25, 'kg',
    1.0, 25.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-16', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Chandan Nayak') LIMIT 1),
    '6235',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-17', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Birbahadur Beshra') LIMIT 1),
    '6236',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-17', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Basanta Nayak') LIMIT 1),
    '6237',
    40, 'kg',
    1.0, 40.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-18', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6238',
    1260, 'nos',
    1.0, 1260.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-18', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6238',
    9450, 'nos',
    6.11, 57740.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-18', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Mandira Ghorai') LIMIT 1),
    '6239',
    40, 'kg',
    1.0, 40.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-18', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bijay Adhikary') LIMIT 1),
    '6240',
    30, 'kg',
    6.11, 183.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-18', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Mandira Ghorai') LIMIT 1),
    '6241',
    30, 'kg',
    6.11, 183.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-19', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ghasia Hemrem') LIMIT 1),
    '6242',
    30, 'kg',
    6.11, 183.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-20', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Dinesh') LIMIT 1),
    '6243',
    60, 'kg',
    6.11, 366.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-20', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Soymen Das') LIMIT 1),
    '6244',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-20', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Manoj Majhi') LIMIT 1),
    '6245',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-20', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Madhaba Munda') LIMIT 1),
    '6246',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-20', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Dubraj Hemrem') LIMIT 1),
    '6247',
    100, 'kg',
    1.0, 100.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-20', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Kairi Banara') LIMIT 1),
    '6248',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-22', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Balmik Mohanta') LIMIT 1),
    '6249',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-22', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Birbahadur Beshra') LIMIT 1),
    '6250',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-23', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Suchitra Kadma') LIMIT 1),
    '6251',
    30, 'kg',
    6.11, 183.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-23', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Mandira Ghorai') LIMIT 1),
    '6252',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-23', 'other',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Satya Sarpanch') LIMIT 1),
    '4713',
    70, 'nos',
    0.0, 0.0,
    'Soya Empty Bags'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-24', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6253',
    1260, 'nos',
    1.0, 1260.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-24', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6253',
    1890, 'nos',
    6.15, 11624.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-24', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6253',
    5460, 'nos',
    6.15, 33579.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-24', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Nintu Metari') LIMIT 1),
    '6254',
    30, 'kg',
    6.15, 185.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-24', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Basanti Ghorai') LIMIT 1),
    '6255',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-25', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ajit Das') LIMIT 1),
    '6256',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-25', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Muni Khan') LIMIT 1),
    '6257',
    20, 'kg',
    1.0, 20.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-26', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Rambhabati Naik') LIMIT 1),
    '6258',
    60, 'kg',
    1.0, 60.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-27', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Local') LIMIT 1),
    '6259',
    60, 'kg',
    5.9, 354.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-27', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Laxmi Mahali') LIMIT 1),
    '6260',
    30, 'kg',
    5.9, 177.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-27', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Balmik Mohanta') LIMIT 1),
    '6261',
    60, 'kg',
    1.0, 60.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-28', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Birbahadur Beshra') LIMIT 1),
    '6262',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-28', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Lokesh Jagat') LIMIT 1),
    '6263',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-28', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Santosi Behera') LIMIT 1),
    '6264',
    100, 'kg',
    1.0, 100.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-28', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Prakash Chandra Mohanta') LIMIT 1),
    '6265',
    100, 'kg',
    1.0, 100.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-29', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Mandira Ghorai') LIMIT 1),
    '6266',
    60, 'kg',
    1.0, 60.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-30', 'other',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Lingam') LIMIT 1),
    '4714',
    9950, 'nos',
    10.5, 104475.0,
    'Maize Bags'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-30', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Anam Naik') LIMIT 1),
    '6267',
    30, 'kg',
    5.9, 177.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-30', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bulti Dewan') LIMIT 1),
    '6268',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-30', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Brinda Kha') LIMIT 1),
    '6269',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-31', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6270',
    1260, 'nos',
    1.0, 1260.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-31', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6270',
    420, 'nos',
    5.7, 2394.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-31', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6270',
    6510, 'nos',
    5.7, 37107.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-31', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bangi Hansda') LIMIT 1),
    '6271',
    60, 'kg',
    1.0, 60.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-31', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Lokesh Jagat') LIMIT 1),
    '6272',
    5.7, 'nos',
    80.0, 456.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-31', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Manoj Majhi') LIMIT 1),
    '6273',
    4.8, 'nos',
    80.0, 384.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-31', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ramesh Chandra Mohanta') LIMIT 1),
    '6274',
    3.5, 'nos',
    80.0, 280.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-31', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Santhoshi Behera') LIMIT 1),
    '6275',
    5.3, 'nos',
    80.0, 424.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-31', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ranjith Patar') LIMIT 1),
    '6276',
    4.4, 'nos',
    80.0, 352.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-12-31', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Dubraj Hemrem') LIMIT 1),
    '6277',
    5.2, 'nos',
    80.0, 416.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-01', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ratikanta Mohanta') LIMIT 1),
    '6278',
    10, 'kg',
    1.0, 10.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-01', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Arjun Kumar Mohanta') LIMIT 1),
    '6279',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-01', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Karunakar Munda') LIMIT 1),
    '6280',
    3.9, 'nos',
    80.0, 312.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-01', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bhagban Mahakur') LIMIT 1),
    '6281',
    4.2, 'nos',
    80.0, 336.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-01', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Susmita Singh') LIMIT 1),
    '6282',
    5.5, 'nos',
    80.0, 440.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-01', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sahadeb ganjan') LIMIT 1),
    '6283',
    4.6, 'nos',
    80.0, 368.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-01', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Swadesh Murmu') LIMIT 1),
    '6284',
    5.7, 'nos',
    80.0, 456.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-01', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bhola Khan') LIMIT 1),
    '6285',
    4.3, 'nos',
    80.0, 344.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-01', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Rabindra Lohar') LIMIT 1),
    '6286',
    3.9, 'nos',
    80.0, 312.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-02', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ajit Das') LIMIT 1),
    '6287',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-02', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Tulu Patar') LIMIT 1),
    '6288',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-02', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Birbahadur Beshra') LIMIT 1),
    '6289',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-02', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Madhaba Munda') LIMIT 1),
    '6290',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-03', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Lokesh Jagat') LIMIT 1),
    '6291',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-03', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Phakira  Sidu') LIMIT 1),
    '6292',
    120, 'nos',
    5.7, 684.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-03', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Balmik Mohanta') LIMIT 1),
    '6293',
    120, 'nos',
    5.7, 684.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-03', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Malati Mahanta') LIMIT 1),
    '6294',
    60, 'kg',
    1.0, 60.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-03', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Raimat Majhi') LIMIT 1),
    '6295',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-03', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ratikanta Mohanta') LIMIT 1),
    '6296',
    60, 'kg',
    5.7, 342.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-03', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Soymen Das') LIMIT 1),
    '6297',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-03', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Mandira Ghorai') LIMIT 1),
    '6298',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-04', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sanjib Mandal') LIMIT 1),
    '6299',
    15, 'kg',
    1.0, 15.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-04', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bulti Dewan') LIMIT 1),
    '6300',
    50, 'kg',
    1.0, 50.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-04', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Prakash Chandra Mohanta') LIMIT 1),
    '6301',
    5, 'nos',
    80.0, 400.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-04', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Prabir Ghorai') LIMIT 1),
    '6302',
    5, 'nos',
    80.0, 400.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-04', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Raju Dewan') LIMIT 1),
    '6303',
    4.8, 'nos',
    80.0, 384.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-04', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Prashanta Khan') LIMIT 1),
    '6304',
    4.9, 'nos',
    80.0, 392.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-04', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ghasia Hemrem') LIMIT 1),
    '6305',
    4.2, 'nos',
    80.0, 336.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-04', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sujith Khan') LIMIT 1),
    '6306',
    4.2, 'nos',
    80.0, 336.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-04', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Malati Mohanta') LIMIT 1),
    '6307',
    4.1, 'nos',
    80.0, 328.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-04', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Rana Behera') LIMIT 1),
    '6308',
    4, 'nos',
    80.0, 320.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-04', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Anil Murmu') LIMIT 1),
    '6309',
    4.7, 'nos',
    80.0, 376.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-06', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bijay Adhikari') LIMIT 1),
    '6310',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-06', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Pujarani Nayak') LIMIT 1),
    '6311',
    20, 'kg',
    1.0, 20.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-06', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sujan Kalsar') LIMIT 1),
    '6312',
    50, 'kg',
    1.0, 50.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-07', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6313',
    1260, 'nos',
    1.0, 1260.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-07', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6313',
    420, 'nos',
    5.2, 2184.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-07', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6313',
    7980, 'nos',
    5.2, 41496.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-07', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Mandira Ghorai') LIMIT 1),
    '6314',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-07', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Birbahadur Beshra') LIMIT 1),
    '6315',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-08', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Basanti Ghorai') LIMIT 1),
    '6316',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-08', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bulti Dewan') LIMIT 1),
    '6317',
    100, 'kg',
    1.0, 100.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-08', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Mayna Hatui') LIMIT 1),
    '6318',
    100, 'kg',
    1.0, 100.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-09', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Prakash Chandra Mohanta') LIMIT 1),
    '6319',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-09', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Tulu Patar') LIMIT 1),
    '6320',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-09', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Mandira Ghorai') LIMIT 1),
    '6321',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-09', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Mandira Ghorai') LIMIT 1),
    '6321',
    30, 'kg',
    5.2, 156.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-10', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sanjib Mandal') LIMIT 1),
    '6322',
    20, 'kg',
    1.0, 20.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-10', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Basanti Ghorai') LIMIT 1),
    '6323',
    40, 'kg',
    1.0, 40.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-10', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Birbahadur Beshra') LIMIT 1),
    '6324',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-10', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Anam Naik') LIMIT 1),
    '6325',
    30, 'kg',
    5.2, 156.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-10', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Arjun Kumar Mohanta') LIMIT 1),
    '6326',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-11', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sujan Kalsar') LIMIT 1),
    '6327',
    5.7, 'nos',
    80.0, 456.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-11', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Prabir Ghorai') LIMIT 1),
    '6328',
    5.8, 'nos',
    80.0, 464.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-11', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Prashanta Khan') LIMIT 1),
    '6329',
    4.8, 'nos',
    80.0, 384.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-11', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Praksah Chandra Mohanta') LIMIT 1),
    '6330',
    5.2, 'nos',
    80.0, 416.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-11', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ghungura Naik') LIMIT 1),
    '6331',
    5, 'nos',
    80.0, 400.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-11', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Lokesh Jagat') LIMIT 1),
    '6332',
    3.6, 'nos',
    80.0, 288.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-11', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Soymen Das') LIMIT 1),
    '6333',
    3.5, 'nos',
    80.0, 280.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-11', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Tapas Ganjan') LIMIT 1),
    '6334',
    5.4, 'nos',
    80.0, 432.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-11', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bhola Kha') LIMIT 1),
    '6335',
    6.2, 'nos',
    80.0, 496.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-11', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('SakthiPada Mandal') LIMIT 1),
    '6336',
    4.5, 'nos',
    80.0, 360.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-11', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sishir Keyala') LIMIT 1),
    '6337',
    5, 'nos',
    80.0, 400.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-11', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Samar Keyala') LIMIT 1),
    '6338',
    5.8, 'nos',
    80.0, 464.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-11', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ranjith Kha') LIMIT 1),
    '6339',
    5.3, 'nos',
    80.0, 424.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-11', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Shubhu Naik') LIMIT 1),
    '6340',
    5.4, 'nos',
    80.0, 432.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-11', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Kurshek Malik') LIMIT 1),
    '6341',
    5.2, 'nos',
    80.0, 416.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-11', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Dubraj Hemrem') LIMIT 1),
    '6342',
    3.8, 'nos',
    80.0, 304.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-11', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ajit Das') LIMIT 1),
    '6343',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-11', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sujan Kalsar') LIMIT 1),
    '6344',
    60, 'kg',
    5.2, 312.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-11', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Raju') LIMIT 1),
    '6345',
    30, 'kg',
    5.2, 156.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-11', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Pujarani Naik') LIMIT 1),
    '6346',
    10, 'kg',
    1.0, 10.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-12', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Basanti Ghorai') LIMIT 1),
    '6347',
    10, 'kg',
    1.0, 10.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-13', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sushen Chandra Nayak') LIMIT 1),
    '6348',
    20, 'kg',
    1.0, 20.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-13', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Birbahadur Beshra') LIMIT 1),
    '6349',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-14', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Madhaba Munda') LIMIT 1),
    '6350',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-14', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Prabir Ghorai') LIMIT 1),
    '6351',
    5.9, 'nos',
    80.0, 472.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-14', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sishir Kalsar') LIMIT 1),
    '6352',
    5.6, 'nos',
    80.0, 448.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-15', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Manoj Majhi') LIMIT 1),
    '6353',
    4.4, 'nos',
    80.0, 352.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-15', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Y Ramesh') LIMIT 1),
    '6354',
    16.6, 'nos',
    80.0, 1328.0,
    'Lame Birds 3'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-15', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ramesh Chandra Mohanta') LIMIT 1),
    '6355',
    5.2, 'nos',
    80.0, 416.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-15', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Soymen Das') LIMIT 1),
    '6356',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-15', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Basanti Ghorai') LIMIT 1),
    '6357',
    54, 'kg',
    1.0, 54.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-16', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sujith Khan') LIMIT 1),
    '6358',
    100, 'kg',
    1.0, 100.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-16', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Prashanta Khan') LIMIT 1),
    '6359',
    30, 'kg',
    5.2, 156.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-17', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6360',
    1680, 'nos',
    1.0, 1680.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-17', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6360',
    420, 'nos',
    4.8, 2016.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-17', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6360',
    11130, 'nos',
    4.8, 53424.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-17', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bharati Beshera') LIMIT 1),
    '6361',
    175, 'nos',
    1.0, 175.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-17', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Pradip Patra') LIMIT 1),
    '6362',
    15, 'kg',
    4.8, 72.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-17', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Arjun Kumar Mohanta') LIMIT 1),
    '6363',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-18', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Lokesh Jagat') LIMIT 1),
    '6364',
    3.3, 'nos',
    80.0, 264.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-18', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Doyel Middya') LIMIT 1),
    '6365',
    4.3, 'nos',
    80.0, 344.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-18', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Anitha Ganjan') LIMIT 1),
    '6366',
    4.9, 'nos',
    80.0, 392.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-18', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Rajesh Das') LIMIT 1),
    '6367',
    7.8, 'nos',
    80.0, 624.0,
    'Lame Birds 2'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-18', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Manoj Majhi') LIMIT 1),
    '6368',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-18', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ratikanta Mohanta') LIMIT 1),
    '6369',
    100, 'kg',
    1.0, 100.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-19', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Malati Mohanta') LIMIT 1),
    '6370',
    30, 'kg',
    4.8, 144.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-19', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Saheb Ghorai') LIMIT 1),
    '6371',
    60, 'kg',
    4.8, 288.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-19', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Palasha Samanta') LIMIT 1),
    '6372',
    90, 'kg',
    1.0, 90.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-20', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Prabir Ghorai') LIMIT 1),
    '6373',
    30, 'kg',
    4.8, 144.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-20', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ghasia Hemrem') LIMIT 1),
    '6374',
    30, 'kg',
    4.8, 144.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-20', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Basanta Nayak') LIMIT 1),
    '6375',
    10, 'kg',
    1.0, 10.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-20', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Birbahadur Beshra') LIMIT 1),
    '6376',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-20', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bijay Adhikari') LIMIT 1),
    '6377',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-21', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6378',
    630, 'nos',
    1.0, 630.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-21', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6378',
    210, 'nos',
    4.4, 924.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-21', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6378',
    4620, 'nos',
    4.4, 20328.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-21', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sujan Kalsar') LIMIT 1),
    '6379',
    40, 'kg',
    1.0, 40.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-22', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Prasanta Khan') LIMIT 1),
    '6380',
    30, 'kg',
    4.4, 132.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-22', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sanjib Mondal') LIMIT 1),
    '6381',
    20, 'kg',
    1.0, 20.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-23', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ghasia Hembrem') LIMIT 1),
    '6382',
    5.3, 'nos',
    80.0, 424.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-23', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sujan Kalsar') LIMIT 1),
    '6383',
    5.8, 'nos',
    80.0, 464.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-23', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Lakeshwar Jagat') LIMIT 1),
    '6384',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-23', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Madhaba Munda') LIMIT 1),
    '6385',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-23', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Khukumani Dolai') LIMIT 1),
    '6386',
    30, 'kg',
    4.4, 132.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-23', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Basanta Nayak') LIMIT 1),
    '6387',
    20, 'kg',
    1.0, 20.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-24', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Rajit Patar') LIMIT 1),
    '6388',
    30, 'kg',
    4.4, 132.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-24', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Prakash Chandra Mohanta') LIMIT 1),
    '6389',
    10, 'kg',
    1.0, 10.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-25', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Gopal Bag') LIMIT 1),
    '6390',
    5.3, 'nos',
    80.0, 424.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-25', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Prabir Ghorai') LIMIT 1),
    '6391',
    4.2, 'nos',
    80.0, 336.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-25', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Prashanta Khan') LIMIT 1),
    '6392',
    5, 'nos',
    80.0, 400.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-25', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ratikanta Mohanta') LIMIT 1),
    '6393',
    3.7, 'nos',
    80.0, 296.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-25', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Chhatish KuMahanta') LIMIT 1),
    '6394',
    4.2, 'nos',
    80.0, 336.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-25', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bhagban Mahakur') LIMIT 1),
    '6395',
    5.7, 'nos',
    80.0, 456.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-25', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Tagari Samat') LIMIT 1),
    '6396',
    5.2, 'nos',
    80.0, 416.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-25', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Manoj Majhi') LIMIT 1),
    '6397',
    40, 'kg',
    1.0, 40.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-25', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Lahari') LIMIT 1),
    '6398',
    5.5, 'nos',
    80.0, 440.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-26', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Mandira Ghorai') LIMIT 1),
    '6399',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-27', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ramdas Mahali') LIMIT 1),
    '6400',
    80, 'kg',
    1.0, 80.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-27', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Maisa Mahali') LIMIT 1),
    '6601',
    10, 'kg',
    4.4, 44.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-27', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Madhaba Munda') LIMIT 1),
    '6602',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-27', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ratikanta Mohanta') LIMIT 1),
    '6603',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-28', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6604',
    1680, 'nos',
    1.0, 1680.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-28', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6604',
    210, 'nos',
    4.5, 945.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-28', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6604',
    7350, 'nos',
    4.5, 33075.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-28', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Birbahudur Beshra') LIMIT 1),
    '6605',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-28', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Chhatish KuMahanta') LIMIT 1),
    '6606',
    30, 'kg',
    4.5, 135.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-29', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Mandira Ghorai') LIMIT 1),
    '6607',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-30', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ananta Hembrem') LIMIT 1),
    '6608',
    110, 'nos',
    1.0, 110.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-30', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Mandira Ghorai') LIMIT 1),
    '6609',
    40, 'kg',
    1.0, 40.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-30', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Anam Naik') LIMIT 1),
    '6610',
    30, 'kg',
    4.5, 135.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-31', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Lakeshwar Jagat') LIMIT 1),
    '6611',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-31', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Muni Khan') LIMIT 1),
    '6612',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-01-31', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Anam Naik') LIMIT 1),
    '6613',
    70, 'kg',
    1.0, 70.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-01', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Birbahudur Beshra') LIMIT 1),
    '6614',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-01', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ratikanta Mohanta') LIMIT 1),
    '6615',
    150, 'nos',
    1.0, 150.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-01', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sujan Kalsar') LIMIT 1),
    '6616',
    6.3, 'nos',
    80.0, 504.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-01', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Depin Dolai') LIMIT 1),
    '6617',
    5.6, 'nos',
    80.0, 448.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-01', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Lahari') LIMIT 1),
    '6618',
    16.2, 'nos',
    80.0, 1296.0,
    'Lame Birds 4'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-01', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Babulu Hazara') LIMIT 1),
    '6619',
    4.4, 'nos',
    80.0, 352.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-01', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Mithun Bag') LIMIT 1),
    '6620',
    4.2, 'nos',
    80.0, 336.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-01', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Shakti Pada Mandal') LIMIT 1),
    '6621',
    4.5, 'nos',
    80.0, 360.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-01', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Shissir Kalsar') LIMIT 1),
    '6622',
    4.1, 'nos',
    80.0, 328.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-01', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Amiya Kadma') LIMIT 1),
    '6623',
    3.8, 'nos',
    80.0, 304.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-01', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ratikanta Mohanta') LIMIT 1),
    '6624',
    3.4, 'nos',
    80.0, 272.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-02', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Tulu Patar') LIMIT 1),
    '6625',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-02', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Prakash Chandra Mohanta') LIMIT 1),
    '6626',
    20, 'kg',
    1.0, 20.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-03', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Birbahudur Beshra') LIMIT 1),
    '6627',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-03', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Madhaba Munda') LIMIT 1),
    '6628',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-03', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Madhu HO') LIMIT 1),
    '6629',
    30, 'kg',
    4.5, 135.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-03', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Prabir Ghorai') LIMIT 1),
    '6630',
    40, 'kg',
    1.0, 40.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-03', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Prabir Ghorai') LIMIT 1),
    '6630',
    30, 'kg',
    4.5, 135.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-04', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ramdas Mahali') LIMIT 1),
    '6631',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-04', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sanjib Mandal') LIMIT 1),
    '6632',
    20, 'kg',
    1.0, 20.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-04', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Manoj Majhi') LIMIT 1),
    '6633',
    50, 'kg',
    1.0, 50.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-05', 'other',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Lingam') LIMIT 1),
    '4715',
    5000, 'nos',
    10.75, 53750.0,
    'Maize Bags'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-05', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Khukamani Dolai') LIMIT 1),
    '6634',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-05', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Balmik Mohanta') LIMIT 1),
    '6635',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-06', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Basanti Ghorai') LIMIT 1),
    '6636',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-06', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Puja Naik') LIMIT 1),
    '6637',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-06', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Prabir Ghorai') LIMIT 1),
    '6638',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-06', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Birbahudur Beshera') LIMIT 1),
    '6639',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-07', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6640',
    1680, 'nos',
    1.0, 1680.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-07', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6640',
    360, 'nos',
    4.35, 1566.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-07', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6640',
    2940, 'nos',
    4.35, 12789.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-07', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Dinesh') LIMIT 1),
    '6641',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-07', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Dinesh') LIMIT 1),
    '6641',
    30, 'kg',
    4.35, 130.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-07', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Dinesh') LIMIT 1),
    '6641',
    60, 'kg',
    4.35, 261.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-07', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Venkatadri Hatcheries') LIMIT 1),
    '6643',
    4834, 'nos',
    29.0, 140186.0,
    'TE Above 60 Gms = 4930-2%(96)=4834'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-08', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Babuli Naik') LIMIT 1),
    '6644',
    110, 'nos',
    1.0, 110.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-08', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Prashanta Khan') LIMIT 1),
    '6645',
    5.4, 'nos',
    80.0, 432.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-08', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Birbahudur Beshera') LIMIT 1),
    '6646',
    4, 'nos',
    80.0, 320.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-08', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Lakeshwar Jagat') LIMIT 1),
    '6647',
    5, 'nos',
    80.0, 400.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-08', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Raju Dewan') LIMIT 1),
    '6648',
    6, 'nos',
    80.0, 480.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-08', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Madhu HO') LIMIT 1),
    '6649',
    4.4, 'nos',
    80.0, 352.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-08', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ramdas Mahali') LIMIT 1),
    '6650',
    4.2, 'nos',
    80.0, 336.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-08', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Prabir Ghorai') LIMIT 1),
    '6651',
    5.1, 'nos',
    80.0, 408.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-08', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Pitambara Mohanata') LIMIT 1),
    '6652',
    5.1, 'nos',
    80.0, 408.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-08', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Soymen Das') LIMIT 1),
    '6653',
    5.7, 'nos',
    80.0, 456.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-08', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Muni Khan') LIMIT 1),
    '6654',
    5.7, 'nos',
    80.0, 456.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-08', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Suresh Patra') LIMIT 1),
    '6655',
    5.7, 'nos',
    80.0, 456.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-08', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Santhosh Behera') LIMIT 1),
    '6656',
    4.6, 'nos',
    80.0, 368.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-08', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Rakhai Gogan') LIMIT 1),
    '6657',
    4.3, 'nos',
    80.0, 344.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-08', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Mayna Hatui') LIMIT 1),
    '6658',
    3.2, 'nos',
    80.0, 256.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-09', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Gopal Bag') LIMIT 1),
    '6659',
    90, 'kg',
    1.0, 90.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-09', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Prabir Ghorai') LIMIT 1),
    '6660',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-09', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Muni Khan') LIMIT 1),
    '6661',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-09', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Madhu HO') LIMIT 1),
    '6662',
    30, 'kg',
    4.35, 131.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-09', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Soymen Das') LIMIT 1),
    '6663',
    30, 'kg',
    4.35, 131.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-10', 'other',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Somayya') LIMIT 1),
    '4716',
    900, 'nos',
    2.0, 1800.0,
    'Soya Bags'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-10', 'other',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Somayya') LIMIT 1),
    '4716',
    500, 'nos',
    1.5, 750.0,
    'Dorb Bags'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-10', 'other',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Somayya') LIMIT 1),
    '4716',
    3600, 'nos',
    0.75, 2700.0,
    'Small Bags'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-10', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Prakash Chandra Mohanta') LIMIT 1),
    '6664',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-11', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sushen Cha Nayak') LIMIT 1),
    '6665',
    40, 'kg',
    1.0, 40.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-11', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ananta Hembrem') LIMIT 1),
    '6666',
    100, 'kg',
    1.0, 100.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-11', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Birbahudur Beshera') LIMIT 1),
    '6667',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-12', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sanjib Mandal') LIMIT 1),
    '6668',
    20, 'kg',
    1.0, 20.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-12', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Balmiki Mohanta') LIMIT 1),
    '6669',
    60, 'kg',
    1.0, 60.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-12', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Prabir Ghorai') LIMIT 1),
    '6670',
    40, 'kg',
    1.0, 40.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-12', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ananta Hembrem') LIMIT 1),
    '6671',
    30, 'kg',
    4.35, 131.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-12', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Maisa Mahali') LIMIT 1),
    '6672',
    10, 'kg',
    4.35, 44.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-12', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Trinath Birua') LIMIT 1),
    '6673',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-12', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ghungura Naik') LIMIT 1),
    '6674',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-12', 'gas',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Laxmi Mahali') LIMIT 1),
    '6675',
    1, 'nos',
    1946.0, 1946.0,
    'Hp Gas Cylinder 19 Kg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-13', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Birbahudur Beshera') LIMIT 1),
    '6676',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-13', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Prakash Chandra Mohanta') LIMIT 1),
    '6677',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-14', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sita Tudu') LIMIT 1),
    '6678',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-15', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Raju Dewan') LIMIT 1),
    '6679',
    6.1, 'nos',
    80.0, 488.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-15', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Manoj Majhi') LIMIT 1),
    '6680',
    4.8, 'nos',
    80.0, 384.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-15', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Anam Naik') LIMIT 1),
    '6681',
    5.7, 'nos',
    80.0, 456.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-15', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Santhanu Ganjan') LIMIT 1),
    '6682',
    4.6, 'nos',
    80.0, 368.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-16', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Laxmi Mahali') LIMIT 1),
    '6683',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-17', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Basanti Ghorai') LIMIT 1),
    '6684',
    20, 'kg',
    1.0, 20.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-17', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Prabir Ghorai') LIMIT 1),
    '6685',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-17', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ananta Hembrem') LIMIT 1),
    '6686',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-18', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Naraendra Reddy') LIMIT 1),
    '6687',
    30, 'kg',
    4.6, 138.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-18', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Birabahudur Beshra') LIMIT 1),
    '6688',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-18', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Madhu HO') LIMIT 1),
    '6689',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-18', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Laxmi Mahali') LIMIT 1),
    '6690',
    5.1, 'nos',
    80.0, 408.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-18', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Lakeshwar Jagat') LIMIT 1),
    '6691',
    5.3, 'nos',
    80.0, 424.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-18', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ananta Hembrem') LIMIT 1),
    '6692',
    4.4, 'nos',
    80.0, 352.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-18', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Santu Ganjan') LIMIT 1),
    '6693',
    4.1, 'nos',
    80.0, 328.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-19', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6694',
    2100, 'nos',
    1.0, 2100.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-19', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6694',
    210, 'nos',
    4.6, 966.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-19', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6694',
    3150, 'nos',
    4.6, 14490.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-19', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sujan Kalsar') LIMIT 1),
    '6695',
    6.5, 'nos',
    80.0, 520.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-20', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Birabahudur Beshra') LIMIT 1),
    '6696',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-20', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Balmik Mohanta') LIMIT 1),
    '6697',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-20', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Dipen Dolai') LIMIT 1),
    '6698',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-20', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bangi Hansda') LIMIT 1),
    '6699',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-20', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Babuli Naik') LIMIT 1),
    '6700',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-21', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Prakash Chandra Mohanta') LIMIT 1),
    '6501',
    130, 'nos',
    1.0, 130.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-21', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Prakash Chandra Mohanta') LIMIT 1),
    '6501',
    150, 'nos',
    4.6, 690.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-21', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Prabir Ghorai') LIMIT 1),
    '6502',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-21', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Pabitra Nayak') LIMIT 1),
    '6503',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-22', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Birabahudur Beshra') LIMIT 1),
    '6504',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-22', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Basanti Ghorai') LIMIT 1),
    '6505',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-22', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Prabir Ghorai') LIMIT 1),
    '6506',
    4.5, 'nos',
    80.0, 360.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-22', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ranjit Patar') LIMIT 1),
    '6507',
    5.6, 'nos',
    80.0, 448.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-22', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bangi Hansda') LIMIT 1),
    '6508',
    4.1, 'nos',
    80.0, 328.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-22', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Pabitra Nayak') LIMIT 1),
    '6509',
    4, 'nos',
    80.0, 320.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-22', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Gana HO') LIMIT 1),
    '6510',
    4.2, 'nos',
    80.0, 336.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-22', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Jhanta Behera') LIMIT 1),
    '6511',
    3.6, 'nos',
    80.0, 288.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-22', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ghasia Hemrem') LIMIT 1),
    '6512',
    4.6, 'nos',
    80.0, 368.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-22', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Gobardhan Chatter') LIMIT 1),
    '6513',
    9.5, 'nos',
    80.0, 760.0,
    'Lame Birds 2'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-23', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sujan Kalsar') LIMIT 1),
    '6514',
    3.5, 'nos',
    80.0, 280.0,
    'Lame Birds 2'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-23', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bijay Adhikari') LIMIT 1),
    '6515',
    90, 'kg',
    1.0, 90.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-24', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Tulu Patar') LIMIT 1),
    '6516',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-24', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Rambhabati Nayak') LIMIT 1),
    '6517',
    60, 'kg',
    1.0, 60.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-24', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Rambhabati Nayak') LIMIT 1),
    '6517',
    90, 'kg',
    4.6, 414.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-25', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Manoj Majhi') LIMIT 1),
    '6518',
    50, 'kg',
    1.0, 50.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-25', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Birbahudur Beshera') LIMIT 1),
    '6519',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-25', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Prabir Ghorai') LIMIT 1),
    '6520',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-26', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Serfa Hembrem') LIMIT 1),
    '6521',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-27', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Birbahudur Beshera') LIMIT 1),
    '6522',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-27', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Babuli Nayak') LIMIT 1),
    '6523',
    20, 'kg',
    1.0, 20.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-27', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Chandan Nayak') LIMIT 1),
    '6524',
    5.1, 'nos',
    80.0, 408.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-27', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Gana Ho') LIMIT 1),
    '6525',
    4.1, 'nos',
    80.0, 328.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-28', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Gobardhan Chattar') LIMIT 1),
    '6526',
    160, 'nos',
    1.0, 160.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-02-28', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Prabir Ghorai') LIMIT 1),
    '6527',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-01', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6528',
    1470, 'nos',
    1.0, 1470.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-01', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6528',
    2310, 'nos',
    3.9, 9009.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-01', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Prabir Ghorai') LIMIT 1),
    '6529',
    4.3, 'nos',
    80.0, 344.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-01', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Anam Naik') LIMIT 1),
    '6530',
    5.1, 'nos',
    80.0, 408.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-01', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Dipen Dolai') LIMIT 1),
    '6531',
    5.7, 'nos',
    80.0, 456.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-01', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Serfa Hembrem') LIMIT 1),
    '6532',
    3.8, 'nos',
    80.0, 304.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-01', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Karunakar Munda') LIMIT 1),
    '6533',
    4.8, 'nos',
    80.0, 384.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-01', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Tapas Ganjan') LIMIT 1),
    '6534',
    4.7, 'nos',
    80.0, 376.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-01', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bhola Kha') LIMIT 1),
    '6535',
    5.2, 'nos',
    80.0, 416.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-01', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sushmita Sing') LIMIT 1),
    '6536',
    5.1, 'nos',
    80.0, 408.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-01', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Omea Kadma') LIMIT 1),
    '6537',
    4.1, 'nos',
    80.0, 328.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-01', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Mayna Hatia') LIMIT 1),
    '6538',
    4.5, 'nos',
    80.0, 360.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-01', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Chatu Das') LIMIT 1),
    '6539',
    5.7, 'nos',
    80.0, 456.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-01', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Mithun Bag') LIMIT 1),
    '6540',
    3.9, 'nos',
    80.0, 312.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-01', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Asith Kalsar') LIMIT 1),
    '6541',
    4.6, 'nos',
    80.0, 368.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-01', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Shambu Nayak') LIMIT 1),
    '6542',
    5.7, 'nos',
    80.0, 456.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-01', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sishir Kowra') LIMIT 1),
    '6543',
    4.9, 'nos',
    80.0, 392.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-01', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Samar Kewra') LIMIT 1),
    '6544',
    5.8, 'nos',
    80.0, 464.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-01', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Balmik Mohanta') LIMIT 1),
    '6545',
    3.8, 'nos',
    80.0, 304.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-01', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Birbahudur Beshera') LIMIT 1),
    '6546',
    3.7, 'nos',
    80.0, 296.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-01', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Dubraj Hemrem') LIMIT 1),
    '6547',
    5, 'nos',
    80.0, 400.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-01', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ananta Hembrem') LIMIT 1),
    '6548',
    4, 'nos',
    80.0, 320.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-01', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sita Tudu') LIMIT 1),
    '6549',
    40, 'kg',
    1.0, 40.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-01', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Muni Khan') LIMIT 1),
    '6550',
    30, 'kg',
    3.9, 117.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-02', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Madhu HO') LIMIT 1),
    '6551',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-02', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Madhu HO') LIMIT 1),
    '6551',
    30, 'kg',
    3.9, 117.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-02', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Soymen Das') LIMIT 1),
    '6552',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-03', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Basanti Ghorai') LIMIT 1),
    '6553',
    10, 'kg',
    1.0, 10.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-04', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Birbahudur Beshra') LIMIT 1),
    '6554',
    60, 'kg',
    1.0, 60.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-04', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ghungura Naik') LIMIT 1),
    '6555',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-04', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ratikanta Mohanta') LIMIT 1),
    '6556',
    30, 'kg',
    3.9, 117.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-04', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Trinath Birua') LIMIT 1),
    '6557',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-04', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Lakeshwar Jagat') LIMIT 1),
    '6558',
    5.5, 'nos',
    80.0, 440.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-05', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Pujarani Naik') LIMIT 1),
    '6559',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-06', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Soymen Das') LIMIT 1),
    '6560',
    3.5, 'nos',
    80.0, 280.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-06', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Birbahudur Beshra') LIMIT 1),
    '6561',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-06', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Tulu Patar') LIMIT 1),
    '6562',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-06', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Chandan Nak') LIMIT 1),
    '6563',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-06', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bijay Adhikari') LIMIT 1),
    '6564',
    80, 'kg',
    1.0, 80.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-07', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bulti Dewan') LIMIT 1),
    '6565',
    70, 'kg',
    1.0, 70.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-07', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Prabir Ghorai') LIMIT 1),
    '6566',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-08', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Balmik Mohanta') LIMIT 1),
    '6567',
    5.1, 'nos',
    80.0, 408.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-08', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Prabir Ghorai') LIMIT 1),
    '6568',
    5.5, 'nos',
    80.0, 440.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-08', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Anam Naik') LIMIT 1),
    '6569',
    5.4, 'nos',
    80.0, 432.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-08', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bhagban Mahakur') LIMIT 1),
    '6570',
    4.8, 'nos',
    80.0, 384.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-08', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bapi Ganjan') LIMIT 1),
    '6571',
    5.5, 'nos',
    80.0, 440.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-08', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Birbahudur Beshra') LIMIT 1),
    '6572',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-08', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Balmik Mohanta') LIMIT 1),
    '6573',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-08', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Lakeshwar Jagat') LIMIT 1),
    '6574',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-08', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ananta Hembrem') LIMIT 1),
    '6575',
    5.2, 'nos',
    80.0, 416.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-08', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Tagari Samat') LIMIT 1),
    '6576',
    8.7, 'nos',
    80.0, 696.0,
    'Lame Birds 2'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-08', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Prasanta Murmu') LIMIT 1),
    '6577',
    3.7, 'nos',
    80.0, 296.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-09', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Gopal Bag') LIMIT 1),
    '6578',
    5.6, 'nos',
    80.0, 448.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-09', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ramdas Mahali') LIMIT 1),
    '6579',
    3.7, 'nos',
    80.0, 296.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-09', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hirlala Khan') LIMIT 1),
    '6580',
    60, 'kg',
    1.0, 60.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-09', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Birbahudur Beshra') LIMIT 1),
    '6581',
    60, 'kg',
    1.0, 60.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-10', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6582',
    1050, 'nos',
    1.0, 1050.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-10', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6582',
    210, 'nos',
    3.6, 756.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-10', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6582',
    2100, 'nos',
    3.6, 7560.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-10', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Prabir Ghorai') LIMIT 1),
    '6583',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-10', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Darshana HO') LIMIT 1),
    '6584',
    30, 'kg',
    3.6, 108.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-10', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Basanti Ghorai') LIMIT 1),
    '6585',
    100, 'kg',
    1.0, 100.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-10', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Basanti Ghorai') LIMIT 1),
    '6585',
    30, 'kg',
    3.6, 108.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-10', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Basanti Ghorai') LIMIT 1),
    '6585',
    10, 'kg',
    3.6, 36.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-11', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bulti Dewan') LIMIT 1),
    '6586',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-11', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Fakira Sidu') LIMIT 1),
    '6587',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-12', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Dilip Naik') LIMIT 1),
    '6588',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-13', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Dipen Dolai') LIMIT 1),
    '6589',
    30, 'kg',
    3.6, 108.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-14', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Lakeshwar Jagat') LIMIT 1),
    '6590',
    4.4, 'nos',
    80.0, 352.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-14', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ramesh Chandra Mohanta') LIMIT 1),
    '6591',
    5.6, 'nos',
    80.0, 448.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-14', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Madhu Ho') LIMIT 1),
    '6592',
    3.5, 'nos',
    80.0, 280.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-14', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sanjib Mandal') LIMIT 1),
    '6593',
    10, 'kg',
    1.0, 10.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-14', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Lalitha Naik') LIMIT 1),
    '6594',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-14', 'gas',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Trinath Birua') LIMIT 1),
    '6595',
    1, 'nos',
    1946.0, 1946.0,
    'Hp Gas Cylinder 19 Kg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-14', 'gas',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Nita Mahanta') LIMIT 1),
    '6596',
    1, 'nos',
    1946.0, 1946.0,
    'Hp Gas Cylinder 19 Kg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-15', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ghasia Hemrem') LIMIT 1),
    '6597',
    5.4, 'nos',
    80.0, 432.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-15', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Tulu Patar') LIMIT 1),
    '6598',
    5, 'nos',
    80.0, 400.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-15', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Chatu Das') LIMIT 1),
    '6599',
    12.4, 'nos',
    80.0, 992.0,
    'Lame Birds 2'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-15', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bangi Hansda') LIMIT 1),
    '6600',
    5.1, 'nos',
    80.0, 408.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-15', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Babuli Naik') LIMIT 1),
    '6799',
    6, 'nos',
    80.0, 480.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-15', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Mithun Bag') LIMIT 1),
    '6800',
    5.9, 'nos',
    80.0, 472.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-15', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Samar Keora') LIMIT 1),
    '6801',
    5.9, 'nos',
    80.0, 472.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-15', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Gurbindar Singh') LIMIT 1),
    '6802',
    5.9, 'nos',
    80.0, 472.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-16', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Birbahudur Beshera') LIMIT 1),
    '6803',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-16', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Trinath Birua') LIMIT 1),
    '6804',
    105, 'nos',
    1.0, 105.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-16', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Tulu Patar') LIMIT 1),
    '6805',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-17', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Serfa Hembrem') LIMIT 1),
    '6806',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-18', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6807',
    1470, 'nos',
    1.0, 1470.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-18', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6807',
    210, 'nos',
    3.6, 756.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-18', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6807',
    2310, 'nos',
    3.6, 8316.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-18', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Birbahudur Beshera') LIMIT 1),
    '6808',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-18', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Prabir Ghorai') LIMIT 1),
    '6809',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-18', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Dimbaj Kumar Mohanta') LIMIT 1),
    '6810',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-19', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Babuli Nayak') LIMIT 1),
    '6811',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-19', 'gas',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ramdas Mahali') LIMIT 1),
    '6812',
    1, 'nos',
    1946.0, 1946.0,
    'Hp Gas Cylinder 19 Kg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-20', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Birbahudur Beshera') LIMIT 1),
    '6813',
    60, 'kg',
    1.0, 60.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-20', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Gopal Bag') LIMIT 1),
    '6814',
    15, 'kg',
    1.0, 15.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-20', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Gopal Bag') LIMIT 1),
    '6814',
    41, 'kg',
    3.6, 148.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-21', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Basanti Ghorai') LIMIT 1),
    '6815',
    60, 'kg',
    1.0, 60.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-21', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sanjib Mandal') LIMIT 1),
    '6816',
    10, 'kg',
    1.0, 10.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-21', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sita Tudu') LIMIT 1),
    '6817',
    20, 'kg',
    1.0, 20.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-21', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Manoj Majhi') LIMIT 1),
    '6818',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-21', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Malati Mohanta') LIMIT 1),
    '6819',
    2.9, 'nos',
    80.0, 232.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-21', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Basanta Nayak') LIMIT 1),
    '6820',
    3.2, 'nos',
    80.0, 256.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-22', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Birbahudur Beshera') LIMIT 1),
    '6821',
    5.6, 'nos',
    80.0, 448.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-22', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Manoj majhi') LIMIT 1),
    '6822',
    5.2, 'nos',
    80.0, 416.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-22', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sita Tudu') LIMIT 1),
    '6823',
    3.2, 'nos',
    80.0, 256.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-22', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Prabir Ghorai') LIMIT 1),
    '6824',
    5.1, 'nos',
    80.0, 408.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-22', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Pitambara Mohanata') LIMIT 1),
    '6825',
    4.9, 'nos',
    80.0, 392.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-22', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Muni Khan') LIMIT 1),
    '6826',
    40, 'kg',
    1.0, 40.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-24', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Prabir Ghorai') LIMIT 1),
    '6827',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-25', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ananta Hembrem') LIMIT 1),
    '6828',
    6.4, 'nos',
    80.0, 512.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-25', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Laxmi Mahali') LIMIT 1),
    '6829',
    4.6, 'nos',
    80.0, 368.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-25', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Balmiki Mohanta') LIMIT 1),
    '6830',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-25', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Birbahudur Beshra') LIMIT 1),
    '6831',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-25', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Dipen Dolai') LIMIT 1),
    '6832',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-25', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Gana HO') LIMIT 1),
    '6833',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-25', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sushen Chandra Naik') LIMIT 1),
    '6834',
    10, 'kg',
    1.0, 10.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-26', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6835',
    1470, 'nos',
    1.0, 1470.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-26', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6835',
    150, 'nos',
    3.2, 480.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-26', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6835',
    2100, 'nos',
    3.2, 6720.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-26', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Tulu Patar') LIMIT 1),
    '6836',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-26', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Trinath Birua') LIMIT 1),
    '6837',
    4.3, 'nos',
    80.0, 344.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-27', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bharathi Beshra') LIMIT 1),
    '6838',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-27', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Prabir Ghorai') LIMIT 1),
    '6839',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-27', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ranji Patar') LIMIT 1),
    '6840',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-28', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bijay Adhikari') LIMIT 1),
    '6841',
    164, 'nos',
    1.0, 164.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-28', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sanjib Mandal') LIMIT 1),
    '6842',
    15, 'kg',
    1.0, 15.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-28', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Malati Mohanta') LIMIT 1),
    '6843',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-29', 'other',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Somayya') LIMIT 1),
    '4717',
    5000, 'nos',
    11.0, 55000.0,
    'Maize Bags'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-29', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sita tudu') LIMIT 1),
    '6844',
    50, 'kg',
    1.0, 50.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-29', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sita tudu') LIMIT 1),
    '6844',
    25, 'kg',
    3.2, 80.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-30', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Birbahudur Beshera') LIMIT 1),
    '6845',
    60, 'kg',
    1.0, 60.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-30', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Dipen Dolai') LIMIT 1),
    '6846',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-30', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Lakeshwar Jagat') LIMIT 1),
    '6847',
    5.2, 'nos',
    80.0, 416.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-31', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ramdas Mahali') LIMIT 1),
    '6848',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-31', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ramdas Mahali') LIMIT 1),
    '6848',
    31, 'kg',
    3.2, 99.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-31', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Balmik Mohanta') LIMIT 1),
    '6849',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-31', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Dasara Munda') LIMIT 1),
    '6850',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-31', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Raju Dewan') LIMIT 1),
    '6851',
    6.6, 'nos',
    80.0, 528.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-31', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Dipen Dolai') LIMIT 1),
    '6852',
    6.3, 'nos',
    80.0, 504.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-03-31', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ghungura Naik') LIMIT 1),
    '6853',
    3.7, 'nos',
    80.0, 296.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-01', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sujan Kalsar') LIMIT 1),
    '6854',
    60, 'kg',
    3.2, 192.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-01', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Birbahadur Beshra') LIMIT 1),
    '6855',
    60, 'kg',
    1.0, 60.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-01', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Biram Hansda') LIMIT 1),
    '6856',
    4.1, 'nos',
    80.0, 328.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-02', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Dipen Dolai') LIMIT 1),
    '6857',
    60, 'kg',
    1.0, 60.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-02', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Pabir Ghorai') LIMIT 1),
    '6858',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-03', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Chandan Naik') LIMIT 1),
    '6859',
    3.9, 'nos',
    80.0, 312.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-03', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Balmiki Mohanta') LIMIT 1),
    '6860',
    5.1, 'nos',
    80.0, 408.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-03', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Birbahadur Beshra') LIMIT 1),
    '6861',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-03', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Madan Hansda') LIMIT 1),
    '6862',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-03', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hiralal Khan') LIMIT 1),
    '6863',
    20, 'kg',
    1.0, 20.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-04', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Anam Naik') LIMIT 1),
    '6864',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-04', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Kaira Bahara') LIMIT 1),
    '6865',
    95, 'kg',
    1.0, 95.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-04', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bala Electrician') LIMIT 1),
    '6866',
    60, 'kg',
    0.0, 0.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-05', 'other',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Somayya') LIMIT 1),
    '4718',
    3420, 'nos',
    11.0, 37620.0,
    'Maize Bags'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-05', 'other',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Somayya') LIMIT 1),
    '4718',
    875, 'nos',
    3.5, 3062.0,
    'Maize Bags'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-05', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sujan Kalsar') LIMIT 1),
    '6867',
    4.1, 'nos',
    80.0, 328.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-05', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Tulu Patar') LIMIT 1),
    '6868',
    3.4, 'nos',
    80.0, 272.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-05', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Birbahadur Beshra') LIMIT 1),
    '6869',
    4.2, 'nos',
    80.0, 336.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-05', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Babuli Naik') LIMIT 1),
    '6870',
    5.2, 'nos',
    80.0, 416.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-05', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Raghunath Naik') LIMIT 1),
    '6871',
    3.2, 'nos',
    80.0, 256.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-05', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Shaktipada Mandal') LIMIT 1),
    '6872',
    6.2, 'nos',
    80.0, 496.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-05', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Madhu Ho') LIMIT 1),
    '6873',
    60, 'kg',
    1.0, 60.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-05', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Basanti Ghorai') LIMIT 1),
    '6874',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-05', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Prabir Ghorai') LIMIT 1),
    '6875',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-05', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Gana Ho') LIMIT 1),
    '6876',
    22, 'kg',
    3.2, 70.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-06', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Tulu Patar') LIMIT 1),
    '6877',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-06', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sujit Kumar Mohanta') LIMIT 1),
    '6878',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-06', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bijay Adhikari') LIMIT 1),
    '6879',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-06', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Prabir Ghorai') LIMIT 1),
    '6880',
    5.3, 'nos',
    80.0, 424.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-06', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Manoj Majhi') LIMIT 1),
    '6881',
    4.8, 'nos',
    80.0, 384.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-07', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Debaraj Hembram') LIMIT 1),
    '6882',
    5.1, 'nos',
    80.0, 408.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-07', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Dipen Dolai') LIMIT 1),
    '6883',
    30, 'kg',
    3.2, 96.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-07', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Birbahadur Beshra') LIMIT 1),
    '6884',
    60, 'kg',
    1.0, 60.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-08', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6885',
    1890, 'nos',
    1.0, 1890.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-08', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '6885',
    3150, 'nos',
    3.6, 11340.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-08', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ramdas Mahali') LIMIT 1),
    '6886',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-08', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Lakeshwar Jagat') LIMIT 1),
    '6887',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-08', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sita Tudu') LIMIT 1),
    '6888',
    40, 'kg',
    1.0, 40.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-09', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hiralal Khan') LIMIT 1),
    '6889',
    30, 'kg',
    3.6, 108.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-09', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Chaitan Murmu') LIMIT 1),
    '6890',
    20, 'kg',
    1.0, 20.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-10', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Arjun Kumar Mohanta') LIMIT 1),
    '6891',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-10', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Birbahadur Beshra') LIMIT 1),
    '6892',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-11', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Basanti Ghorai') LIMIT 1),
    '6893',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-11', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sanjib Mandal') LIMIT 1),
    '6894',
    15, 'kg',
    1.0, 15.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-11', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ramdas Mahali') LIMIT 1),
    '6895',
    10, 'kg',
    1.0, 10.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-11', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Prabir Ghorai') LIMIT 1),
    '6896',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-11', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Balmiki Mohanta') LIMIT 1),
    '6897',
    2.8, 'nos',
    80.0, 224.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-11', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sujan Kalasar') LIMIT 1),
    '6898',
    5.8, 'nos',
    80.0, 464.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-11', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Jishu Rish') LIMIT 1),
    '6899',
    6, 'nos',
    80.0, 480.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-12', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sujan Kalasar') LIMIT 1),
    '6900',
    100, 'kg',
    1.0, 100.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-12', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Balmiki Mohanta') LIMIT 1),
    '7001',
    4.9, 'nos',
    80.0, 392.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-12', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Birbahadur Beshra') LIMIT 1),
    '7002',
    4.3, 'nos',
    80.0, 344.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-13', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ramdas Mahali') LIMIT 1),
    '7003',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-13', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sujay Kewra') LIMIT 1),
    '7004',
    4.5, 'nos',
    80.0, 360.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-13', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Gurbindar Singh') LIMIT 1),
    '7005',
    4.6, 'nos',
    80.0, 368.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-13', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Samar Kewra') LIMIT 1),
    '7006',
    5.8, 'nos',
    80.0, 464.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-13', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bangi Hansda') LIMIT 1),
    '7007',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-14', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Raju Dewan') LIMIT 1),
    '7008',
    5.8, 'nos',
    80.0, 464.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-14', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ramdas Mahali') LIMIT 1),
    '7009',
    3.8, 'nos',
    80.0, 304.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-14', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Malati Mohanta') LIMIT 1),
    '7010',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-14', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Malati Mohanta') LIMIT 1),
    '7010',
    30, 'kg',
    3.6, 108.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-15', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Birbahadur Beshra') LIMIT 1),
    '7011',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-15', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Rambhabali Nayak') LIMIT 1),
    '7012',
    20, 'kg',
    1.0, 20.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-15', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Dipen Dolai') LIMIT 1),
    '7013',
    4.8, 'nos',
    80.0, 384.0,
    'Lame Birds 1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-15', 'manure',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Yadaya') LIMIT 1),
    '7014',
    1, 'kg',
    2000.0, 2000.0,
    'Litter (Tractor) Bpet1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-16', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Talu Patar') LIMIT 1),
    '7015',
    30, 'kg',
    3.6, 108.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-17', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Birbahudur beshra') LIMIT 1),
    '7016',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-17', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Balmik mahanta') LIMIT 1),
    '7017',
    30, 'kg',
    3.6, 108.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-18', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sanjib mandal') LIMIT 1),
    '7018',
    15, 'kg',
    1.0, 15.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-18', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Anam  Naik') LIMIT 1),
    '7019',
    20, 'kg',
    1.0, 20.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-19', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Birbahudur beshra') LIMIT 1),
    '7020',
    4, 'nos',
    80.0, 320.0,
    'Lame Birds'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-19', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Dubaraj Hemram') LIMIT 1),
    '7021',
    5.7, 'nos',
    80.0, 456.0,
    'Lame Birds'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-19', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Lakeshwar Jagat') LIMIT 1),
    '7022',
    4.6, 'nos',
    80.0, 368.0,
    'Lame Birds'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-19', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Pitambara mahanta') LIMIT 1),
    '7023',
    5.6, 'nos',
    80.0, 448.0,
    'Lame Birds'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-19', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Anam Naik') LIMIT 1),
    '7024',
    5.5, 'nos',
    80.0, 440.0,
    'Lame Birds'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-19', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Rupa HO') LIMIT 1),
    '7025',
    5.5, 'nos',
    80.0, 440.0,
    'Lame Birds'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-19', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Basanta Naik') LIMIT 1),
    '7026',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-20', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '7027',
    2940, 'nos',
    1.0, 2940.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-20', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '7027',
    3780, 'nos',
    4.65, 17577.0,
    'Tables Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-22', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Shibam Sardar') LIMIT 1),
    '7028',
    70, 'kg',
    4.65, 326.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-22', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Shibam Sardar') LIMIT 1),
    '7028',
    140, 'nos',
    4.65, 651.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-22', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Kairi Banara') LIMIT 1),
    '7029',
    50, 'kg',
    1.0, 50.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-22', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Birbahadur Beshra') LIMIT 1),
    '7030',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-24', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Birbahadur Beshra') LIMIT 1),
    '7031',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-24', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Tulu Patar') LIMIT 1),
    '7032',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-25', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sanjib Mandal') LIMIT 1),
    '7033',
    15, 'kg',
    1.0, 15.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-25', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Dubraj Hemrem') LIMIT 1),
    '7034',
    10, 'kg',
    1.0, 10.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-25', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Lakeshwar Jagat') LIMIT 1),
    '7035',
    5.4, 'nos',
    80.0, 432.0,
    'Lame Birds -1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-26', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Birbahadur Beshra') LIMIT 1),
    '7036',
    5.4, 'nos',
    80.0, 432.0,
    'Lame Birds -1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-26', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sita Tudu') LIMIT 1),
    '7037',
    5.2, 'nos',
    80.0, 416.0,
    'Lame Birds -1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-26', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sita Tudu') LIMIT 1),
    '7038',
    4.6, 'nos',
    80.0, 368.0,
    'Lame Birds -1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-26', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sashikanta Mohanta') LIMIT 1),
    '7039',
    4.6, 'nos',
    80.0, 368.0,
    'Lame Birds -1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-27', 'other',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('A Gobinda') LIMIT 1),
    '4719',
    3575, 'nos',
    12.75, 45581.0,
    'Maize Bags'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-28', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ananta Hemram') LIMIT 1),
    '7040',
    100, 'kg',
    1.0, 100.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-28', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Serfa Hebram') LIMIT 1),
    '7041',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-29', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Birbahadur Beshra') LIMIT 1),
    '7042',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-29', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Madhu HO') LIMIT 1),
    '7043',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-29', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sakunthala Mohanta') LIMIT 1),
    '7044',
    50, 'kg',
    1.0, 50.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-29', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sahib Ghorai') LIMIT 1),
    '7045',
    60, 'kg',
    4.65, 279.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-30', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Mangali Baitha') LIMIT 1),
    '7046',
    4.3, 'nos',
    80.0, 344.0,
    'Lame Birds -1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-30', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Shishir Kewra') LIMIT 1),
    '7047',
    3.4, 'nos',
    80.0, 272.0,
    'Lame Birds -1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-04-30', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sujay Kewra') LIMIT 1),
    '7048',
    3.3, 'nos',
    80.0, 264.0,
    'Lame Birds -1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-01', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Tulu Patar') LIMIT 1),
    '7049',
    50, 'kg',
    1.0, 50.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-01', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Birbahadur Beshra') LIMIT 1),
    '7050',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-01', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Lakeshwar Jagat') LIMIT 1),
    '7051',
    5.6, 'nos',
    80.0, 448.0,
    'Lame Birds -1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-01', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Malati Mohanta') LIMIT 1),
    '7052',
    3.6, 'nos',
    80.0, 288.0,
    'Lame Birds -1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-02', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Tulu Patar') LIMIT 1),
    '7053',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-02', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sanjib Mandal') LIMIT 1),
    '7054',
    15, 'kg',
    1.0, 15.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-03', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Chaitan Murmu') LIMIT 1),
    '7055',
    5.5, 'nos',
    80.0, 440.0,
    'Lame Birds -1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-03', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Birbahadur Beshra') LIMIT 1),
    '7056',
    4.1, 'nos',
    80.0, 328.0,
    'Lame Birds -1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-03', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Anam Naik') LIMIT 1),
    '7057',
    5.1, 'nos',
    80.0, 408.0,
    'Lame Birds -1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-03', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Rambhabati Naik') LIMIT 1),
    '7058',
    20, 'kg',
    1.0, 20.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-03', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Balmik Mohanta') LIMIT 1),
    '7059',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-03', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Electrcity Office') LIMIT 1),
    '7060',
    60, 'kg',
    0.0, 0.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-03', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Asit Kalsar') LIMIT 1),
    '7061',
    4.9, 'nos',
    80.0, 392.0,
    'Lame Birds -1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-04', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Arjun Kumar Mohanta') LIMIT 1),
    '7062',
    20, 'kg',
    1.0, 20.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-04', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sita Tudu') LIMIT 1),
    '7063',
    60, 'kg',
    1.0, 60.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-04', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Malati Mohanta') LIMIT 1),
    '7064',
    30, 'kg',
    4.65, 140.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-05', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Madhu HO') LIMIT 1),
    '7065',
    50, 'kg',
    1.0, 50.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-05', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Birbahadur Beshra') LIMIT 1),
    '7066',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-05', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ranjan Biswas') LIMIT 1),
    '7067',
    60, 'kg',
    4.65, 279.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-05', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Prashanta Porya') LIMIT 1),
    '7068',
    15, 'kg',
    1.0, 15.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-05', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Prashanta Porya') LIMIT 1),
    '7068',
    15, 'kg',
    4.65, 70.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-05', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Tulu Patar') LIMIT 1),
    '7069',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-06', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '7070',
    4318, 'nos',
    1.0, 4318.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-06', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '7070',
    210, 'nos',
    4.65, 977.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-06', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '7070',
    7980, 'nos',
    4.65, 37107.0,
    'Tables Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-07', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Serfa Hembram') LIMIT 1),
    '7071',
    25, 'kg',
    1.0, 25.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-08', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Pabita Nayak') LIMIT 1),
    '7072',
    5.1, 'nos',
    80.0, 408.0,
    'Lame Birds -1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-09', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ratikanta Mohanta') LIMIT 1),
    '7073',
    4.5, 'nos',
    80.0, 360.0,
    'Lame Birds -1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-09', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Balmik Mohanta') LIMIT 1),
    '7074',
    4.1, 'nos',
    80.0, 328.0,
    'Lame Birds -1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-09', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bangi Hansda') LIMIT 1),
    '7075',
    20, 'kg',
    1.0, 20.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-10', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ramdas Mahali') LIMIT 1),
    '7076',
    4.2, 'nos',
    80.0, 336.0,
    'Lame Birds -1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-10', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Dubraj Hembram') LIMIT 1),
    '7077',
    4.3, 'nos',
    80.0, 344.0,
    'Lame Birds -1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-10', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sita Tudu') LIMIT 1),
    '7078',
    4.8, 'nos',
    80.0, 384.0,
    'Lame Birds -1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-10', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Birabahudur Beshra') LIMIT 1),
    '7079',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-10', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sanjib Mandal') LIMIT 1),
    '7080',
    10, 'kg',
    1.0, 10.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-10', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sujit kumar Mohanta') LIMIT 1),
    '7081',
    10, 'kg',
    1.0, 10.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-11', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Chaithan Murmu') LIMIT 1),
    '7082',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-12', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Madhu HO') LIMIT 1),
    '7083',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-12', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Balmik Mohanta') LIMIT 1),
    '7084',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-12', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Dipen Dolai') LIMIT 1),
    '7085',
    30, 'kg',
    4.65, 140.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-12', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Tulu Patar') LIMIT 1),
    '7086',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-13', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Hiralal Khan') LIMIT 1),
    '7087',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-13', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Birabahudur Beshra') LIMIT 1),
    '7088',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-13', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Madan Hansda') LIMIT 1),
    '7089',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-13', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bachu Midya') LIMIT 1),
    '7090',
    30, 'kg',
    4.65, 140.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-13', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Saheb Ghorai') LIMIT 1),
    '7091',
    30, 'kg',
    4.65, 140.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-13', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Jhantu Behera') LIMIT 1),
    '7092',
    30, 'kg',
    4.65, 140.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-14', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Pujarani Nayak') LIMIT 1),
    '7093',
    45, 'kg',
    1.0, 45.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-15', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Birabahudur Beshra') LIMIT 1),
    '7094',
    60, 'kg',
    1.0, 60.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-15', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Babuli Naik') LIMIT 1),
    '7095',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-16', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Rambati Nayak') LIMIT 1),
    '7096',
    80, 'kg',
    1.0, 80.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-16', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sufal Ari') LIMIT 1),
    '7097',
    30, 'kg',
    1.0, 30.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-17', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Fakir Sidu') LIMIT 1),
    '7098',
    4.8, 'nos',
    80.0, 384.0,
    'Lame Birds -1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-17', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sashikanta Mohanta') LIMIT 1),
    '7099',
    5.1, 'nos',
    80.0, 408.0,
    'Lame Birds -1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-17', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Nita Mohanta') LIMIT 1),
    '7100',
    70, 'kg',
    1.0, 70.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-18', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '7101',
    3780, 'nos',
    1.0, 3780.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-18', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Meghana Agencies') LIMIT 1),
    '7101',
    11550, 'nos',
    4.65, 53708.0,
    'Tables Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-18', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Serfa Hembram') LIMIT 1),
    '7102',
    40, 'kg',
    1.0, 40.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-18', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Birbahudhur Beshra') LIMIT 1),
    '7103',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-19', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sanjib Mandal') LIMIT 1),
    '7104',
    10, 'kg',
    1.0, 10.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-19', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Babuli Naik') LIMIT 1),
    '7105',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-19', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Anam Naik') LIMIT 1),
    '7106',
    4.1, 'nos',
    80.0, 328.0,
    'Lame Birds -1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-20', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Dipen Dolai') LIMIT 1),
    '7107',
    4.3, 'nos',
    80.0, 344.0,
    'Lame Birds -1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-20', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Madhu HO') LIMIT 1),
    '7108',
    5.6, 'nos',
    80.0, 448.0,
    'Lame Birds -1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-20', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bachu Midya') LIMIT 1),
    '7109',
    30, 'kg',
    4.65, 140.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-20', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Shambhu Dolai') LIMIT 1),
    '7110',
    30, 'kg',
    4.65, 140.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-20', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Birbahudhur Beshra') LIMIT 1),
    '7111',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-21', 'other',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Somayya') LIMIT 1),
    '4720',
    3550, 'nos',
    12.5, 44375.0,
    'Maize Bags'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-21', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Birbahudhur Beshra') LIMIT 1),
    '7112',
    4.3, 'nos',
    80.0, 344.0,
    'Lame Birds -1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-21', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Raghunath Naik') LIMIT 1),
    '7113',
    20, 'kg',
    1.0, 20.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-21', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Raja Mohanta') LIMIT 1),
    '7114',
    30, 'kg',
    4.65, 140.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-22', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Balmik Mohanta') LIMIT 1),
    '7115',
    135, 'nos',
    1.0, 135.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-23', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ramdas Mahali') LIMIT 1),
    '7116',
    40, 'kg',
    1.0, 40.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-24', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Pabitra Nayak') LIMIT 1),
    '7117',
    5.1, 'nos',
    80.0, 408.0,
    'Lame Birds -1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-24', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Mithun Bag') LIMIT 1),
    '7118',
    5.9, 'nos',
    80.0, 472.0,
    'Lame Birds -1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-24', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Samar Kewra') LIMIT 1),
    '7119',
    5.1, 'nos',
    80.0, 408.0,
    'Lame Birds -1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-24', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Arup Biswas') LIMIT 1),
    '7120',
    30, 'kg',
    4.65, 140.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-24', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Babul Dhal') LIMIT 1),
    '7121',
    90, 'kg',
    1.0, 90.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-24', 'te',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Babul Dhal') LIMIT 1),
    '7121',
    30, 'kg',
    4.65, 140.0,
    'Table Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-24', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Birbahudhur Beshra') LIMIT 1),
    '7122',
    30, 'kg',
    1.0, 30.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-24', 'manure',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Tirupati') LIMIT 1),
    '7123',
    1, 'kg',
    9000.0, 9000.0,
    'Litter (Tripper) Bpet1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-25', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Babuli Naik') LIMIT 1),
    '7124',
    60, 'kg',
    1.0, 60.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-26', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Dipen Dolai') LIMIT 1),
    '7125',
    4.6, 'nos',
    80.0, 368.0,
    'Lame Birds -1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-26', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Raja Mohanta') LIMIT 1),
    '7126',
    4.1, 'nos',
    80.0, 328.0,
    'Lame Birds -1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-26', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Pujarani Nayak') LIMIT 1),
    '7127',
    40, 'kg',
    1.0, 40.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-27', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Balmik Mohanta') LIMIT 1),
    '7128',
    50, 'kg',
    1.0, 50.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-27', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Jhantu Behera') LIMIT 1),
    '7129',
    60, 'kg',
    4.65, 279.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-28', 'bird_lame',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Manoj Majhi') LIMIT 1),
    '7130',
    6.1, 'nos',
    80.0, 488.0,
    'Lame Birds -1'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-28', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sanjib Mandal') LIMIT 1),
    '7131',
    10, 'kg',
    1.0, 10.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-28', 'be',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Chaitan Murmu') LIMIT 1),
    '7132',
    10, 'kg',
    1.0, 10.0,
    'Broken Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2026-05-28', 'je',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Dipen Dolai') LIMIT 1),
    '7133',
    30, 'kg',
    4.65, 140.0,
    'Jumbo Eggs'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-07-10', 'bird_cull',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Tayyab Poultry') LIMIT 1),
    '554',
    300, 'nos',
    45.0, 40500.0,
    'F=300 M=0 NetWt=900kg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-07-29', 'bird_cull',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Gajavalli VNM Satyanarayana') LIMIT 1),
    '587',
    222, 'nos',
    45.0, 27225.0,
    'F=222 M=0 NetWt=605kg'
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='19'),
    '2025-08-01', 'bird_cull',
    (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Gajavalli VNM Satyanarayana') LIMIT 1),
    '592',
    234, 'nos',
    45.0, 31050.0,
    'F=0 M=234 NetWt=690kg'
  )
ON CONFLICT ON CONSTRAINT nhe_sales_unique DO UPDATE SET
  amount = EXCLUDED.amount,
  rate = EXCLUDED.rate;
