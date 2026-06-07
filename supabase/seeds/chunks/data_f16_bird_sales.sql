-- Flock 16 Bird Sales (Final Cull)
INSERT INTO public.nhe_sales (
  flock_id, sale_date, dc_no, party_id, sale_type,
  quantity, unit, rate, amount
) VALUES
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2025-04-10', '319', (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('P Veerabhadra Rao') LIMIT 1), 'bird_cull',
    1243, 'nos', 100, 536500
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2025-04-10', '320', (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ammulu Chicken Center') LIMIT 1), 'bird_cull',
    699, 'nos', 100, 301500
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2025-04-10', '321', (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('A1 poultry') LIMIT 1), 'bird_cull',
    495, 'nos', 100, 214500
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2025-04-10', '322', (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Alkareem Chicken Shop') LIMIT 1), 'bird_cull',
    561, 'nos', 100, 238500
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2025-04-10', '323', (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Laxmi Ganapathy') LIMIT 1), 'bird_cull',
    585, 'nos', 100, 246500
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2025-04-10', '324', (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sri Hari''s') LIMIT 1), 'bird_cull',
    645, 'nos', 100, 272000
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2025-04-10', '325', (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Perabathula Purna Chandar Rao') LIMIT 1), 'bird_cull',
    782, 'nos', 100, 334000
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2025-04-10', '326', (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Madheen Marketing') LIMIT 1), 'bird_cull',
    685, 'nos', 100, 288500
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2025-04-10', '327', (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Madheen Marketing') LIMIT 1), 'bird_cull',
    669, 'nos', 100, 281000
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2025-04-10', '328', (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sneha Chicken Center') LIMIT 1), 'bird_cull',
    560, 'nos', 100, 232500
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2025-04-10', '329', (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Bandi Somaiah') LIMIT 1), 'bird_cull',
    495, 'nos', 100, 211500
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2025-04-11', '330', (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Perabathula Purna Chandar Rao') LIMIT 1), 'bird_cull',
    965, 'nos', 110, 458700
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2025-04-11', '331', (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Kashi') LIMIT 1), 'bird_cull',
    1532, 'nos', 110, 708950
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2025-04-11', '332', (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('K Lakshmi') LIMIT 1), 'bird_cull',
    1740, 'nos', 110, 827200
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2025-04-11', '333', (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Dasari Vinod (Kashi)') LIMIT 1), 'bird_cull',
    1573, 'nos', 110, 751300
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2025-04-11', '334', (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Kota Brahm') LIMIT 1), 'bird_cull',
    1034, 'nos', 110, 499400
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2025-04-11', '335', (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sri Venkateswara C') LIMIT 1), 'bird_cull',
    760, 'nos', 110, 371800
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2025-04-11', '336', (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Perabathula Purna Chandar Rao') LIMIT 1), 'bird_cull',
    660, 'nos', 110, 317900
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2025-04-11', '337', (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Perabathula Purna Chandar Rao') LIMIT 1), 'bird_cull',
    616, 'nos', 110, 293150
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2025-04-11', '338', (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Naidu') LIMIT 1), 'bird_cull',
    650, 'nos', 110, 304150
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2025-04-11', '339', (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Naidu') LIMIT 1), 'bird_cull',
    580, 'nos', 110, 281600
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2025-04-12', '340', (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Ethakula Esubabu') LIMIT 1), 'bird_cull',
    672, 'nos', 110, 305800
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2025-04-12', '341', (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Kashi') LIMIT 1), 'bird_cull',
    680, 'nos', 110, 310750
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2025-04-12', '342', (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Inashed') LIMIT 1), 'bird_cull',
    640, 'nos', 110, 304700
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2025-04-12', '343', (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Balakrishna') LIMIT 1), 'bird_cull',
    1579, 'nos', 110, 733700
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2025-04-12', '344', (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Perabathula Purna Chandar Rao') LIMIT 1), 'bird_cull',
    765, 'nos', 110, 362450
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2025-04-12', '345', (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Kashi') LIMIT 1), 'bird_cull',
    591, 'nos', 110, 275000
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2025-04-12', '346', (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Kashi') LIMIT 1), 'bird_cull',
    635, 'nos', 110, 294250
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2025-04-12', '347', (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Kashi') LIMIT 1), 'bird_cull',
    540, 'nos', 110, 257400
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2025-04-14', '348', (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Krishna') LIMIT 1), 'bird_cull',
    1180, 'nos', 120, 619200
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2025-04-14', '349', (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Kashi') LIMIT 1), 'bird_cull',
    420, 'nos', 120, 222000
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2025-04-14', '350', (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sneha Chicken Center') LIMIT 1), 'bird_cull',
    601, 'nos', 120, 325200
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2025-04-14', '501', (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Laxmi Ganapathy') LIMIT 1), 'bird_cull',
    520, 'nos', 120, 277800
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2025-04-14', '502', (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Shakeer') LIMIT 1), 'bird_cull',
    480, 'nos', 120, 254400
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2025-04-14', '503', (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Krishna') LIMIT 1), 'bird_cull',
    1325, 'nos', 120, 686400
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2025-04-15', '504', (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Laxmi Ganapathy') LIMIT 1), 'bird_cull',
    550, 'nos', 120, 292200
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2025-04-15', '505', (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Balakrishna') LIMIT 1), 'bird_cull',
    353, 'nos', 120, 183600
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2025-04-15', '506', (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Madhéen marketing') LIMIT 1), 'bird_cull',
    650, 'nos', 120, 339600
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2025-04-16', '508', (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Laxmi Ganapathy') LIMIT 1), 'bird_cull',
    550, 'nos', 120, 288600
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2025-04-20', '507', (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Surya Chicken') LIMIT 1), 'bird_cull',
    639, 'nos', 120, 328200
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2025-04-20', '509', (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Sri Sai Chicken Center') LIMIT 1), 'bird_cull',
    733, 'nos', 120, 382200
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2025-04-21', '510', (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Shaik ahmad') LIMIT 1), 'bird_cull',
    540, 'nos', 120, 267600
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2025-04-21', '511', (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Shaik ahmad') LIMIT 1), 'bird_cull',
    207, 'nos', 90, 109800
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2025-04-23', '512', (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Madheen Marketing') LIMIT 1), 'bird_cull',
    285, 'nos', 70, 71050
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='16'),
    '2025-04-23', '512', (SELECT id FROM public.parties WHERE LOWER(name)=LOWER('Madheen Marketing') LIMIT 1), 'bird_cull',
    30, 'nos', 50, 3250
  )
ON CONFLICT DO NOTHING;
