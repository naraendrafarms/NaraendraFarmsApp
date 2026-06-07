-- Flock 17 Bird Transfers (Kpally to BPET1 shifting, started Jul 26 2024)
INSERT INTO public.bird_transfers (
  flock_id, transfer_date,
  dc_no, grade, gender, vehicle_no,
  no_of_boxes, birds_per_box, total_birds,
  from_farm_id, to_farm_id
) VALUES
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-07-26',
    '2501', 'A', 'female', 'AP23TA2000',
    50, 12, 600,
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    (SELECT id FROM public.farms WHERE code='BPET1')
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-07-26',
    '2502', 'A', 'female', 'AP28TE3623',
    50, 12, 600,
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    (SELECT id FROM public.farms WHERE code='BPET1')
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-07-26',
    '2503', 'A', 'female', 'AP23TA2000',
    50, 12, 600,
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    (SELECT id FROM public.farms WHERE code='BPET1')
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-07-26',
    '2504', 'A', 'female', 'AP28TE3623',
    50, 12, 600,
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    (SELECT id FROM public.farms WHERE code='BPET1')
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-07-26',
    '2505', 'A', 'female', 'AP23TA2000',
    50, 12, 600,
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    (SELECT id FROM public.farms WHERE code='BPET1')
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-07-26',
    '2506', 'A', 'female', 'AP28TE3623',
    50, 12, 600,
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    (SELECT id FROM public.farms WHERE code='BPET1')
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-07-26',
    '2507', 'A', 'female', 'AP23TA2000',
    50, 12, 600,
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    (SELECT id FROM public.farms WHERE code='BPET1')
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-07-26',
    '2508', 'A', 'female', 'AP28TE3623',
    50, 12, 600,
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    (SELECT id FROM public.farms WHERE code='BPET1')
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-07-26',
    '2509', 'A', 'female', 'AP23TA2000',
    50, 12, 600,
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    (SELECT id FROM public.farms WHERE code='BPET1')
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-07-26',
    '2510', 'A', 'female', 'AP28TE3623',
    47, 12, 564,
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    (SELECT id FROM public.farms WHERE code='BPET1')
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-07-26',
    '2510', 'B', 'female', 'AP28TE3623',
    3, 12, 36,
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    (SELECT id FROM public.farms WHERE code='BPET1')
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-07-26',
    '2511', 'B', 'female', 'AP23TA2000',
    50, 15, 750,
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    (SELECT id FROM public.farms WHERE code='BPET1')
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-07-26',
    '2512', 'B', 'female', 'AP28TE3623',
    50, 15, 750,
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    (SELECT id FROM public.farms WHERE code='BPET1')
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-07-27',
    '2513', 'B', 'female', 'AP23TA2000',
    50, 15, 750,
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    (SELECT id FROM public.farms WHERE code='BPET1')
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-07-27',
    '2514', 'B', 'female', 'AP28TE3623',
    50, 15, 750,
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    (SELECT id FROM public.farms WHERE code='BPET1')
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-07-27',
    '2515', 'B', 'female', 'AP23TA2000',
    50, 15, 750,
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    (SELECT id FROM public.farms WHERE code='BPET1')
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-07-27',
    '2516', 'B', 'female', 'AP28TE3623',
    50, 15, 750,
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    (SELECT id FROM public.farms WHERE code='BPET1')
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-07-27',
    '2517', 'B', 'female', 'AP23TA2000',
    50, 15, 750,
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    (SELECT id FROM public.farms WHERE code='BPET1')
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-07-27',
    '2518', 'B', 'female', 'AP28TE3623',
    50, 15, 750,
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    (SELECT id FROM public.farms WHERE code='BPET1')
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-07-27',
    '2519', 'B', 'female', 'AP23TA2000',
    50, 12, 600,
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    (SELECT id FROM public.farms WHERE code='BPET1')
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-07-27',
    '2520', 'B', 'female', 'AP28TE3623',
    50, 12, 600,
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    (SELECT id FROM public.farms WHERE code='BPET1')
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-07-27',
    '2521', 'B', 'female', 'AP23TA2000',
    50, 12, 600,
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    (SELECT id FROM public.farms WHERE code='BPET1')
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-07-27',
    '2522', 'B', 'female', 'AP28TE3623',
    50, 12, 600,
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    (SELECT id FROM public.farms WHERE code='BPET1')
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-07-27',
    '2523', 'B', 'female', 'AP23TA2000',
    50, 12, 600,
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    (SELECT id FROM public.farms WHERE code='BPET1')
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-07-27',
    '2524', 'B', 'female', 'AP28TE3623',
    50, 12, 600,
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    (SELECT id FROM public.farms WHERE code='BPET1')
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-07-28',
    '2525', 'B', 'female', 'AP23TA2000',
    50, 12, 600,
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    (SELECT id FROM public.farms WHERE code='BPET1')
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-07-28',
    '2526', 'B', 'female', 'AP28TE3623',
    50, 12, 600,
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    (SELECT id FROM public.farms WHERE code='BPET1')
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-07-28',
    '2527', 'B', 'female', 'AP23TA2000',
    50, 15, 750,
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    (SELECT id FROM public.farms WHERE code='BPET1')
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-07-28',
    '2528', 'B', 'female', 'AP28TE3623',
    50, 15, 750,
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    (SELECT id FROM public.farms WHERE code='BPET1')
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-07-28',
    '2529', 'B', 'female', 'AP23TA2000',
    7, 15, 105,
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    (SELECT id FROM public.farms WHERE code='BPET1')
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-07-28',
    '2529', 'C', 'female', 'AP23TA2000',
    43, 15, 645,
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    (SELECT id FROM public.farms WHERE code='BPET1')
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-07-28',
    '2530', 'C', 'female', 'AP28TE3623',
    50, 15, 750,
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    (SELECT id FROM public.farms WHERE code='BPET1')
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-07-28',
    '2531', 'C', 'female', 'AP23TA2000',
    50, 15, 750,
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    (SELECT id FROM public.farms WHERE code='BPET1')
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-07-28',
    '2532', 'C', 'female', 'AP28TE3623',
    50, 15, 750,
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    (SELECT id FROM public.farms WHERE code='BPET1')
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-07-28',
    '2533', 'C', 'female', 'AP23TA2000',
    50, 15, 750,
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    (SELECT id FROM public.farms WHERE code='BPET1')
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-07-28',
    '2534', 'C', 'female', 'AP28TE3623',
    50, 15, 750,
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    (SELECT id FROM public.farms WHERE code='BPET1')
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-07-28',
    '2535', 'A', 'male', 'AP23TA2000',
    50, 8, 400,
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    (SELECT id FROM public.farms WHERE code='BPET1')
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-07-28',
    '2536', 'A', 'male', 'AP28TE3623',
    34, 8, 272,
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    (SELECT id FROM public.farms WHERE code='BPET1')
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-07-28',
    '2536', 'C', 'female', 'AP28TE3623',
    16, 15, 240,
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    (SELECT id FROM public.farms WHERE code='BPET1')
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-08-01',
    '2537', 'C', 'female', 'AP23TA2000',
    50, 15, 750,
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    (SELECT id FROM public.farms WHERE code='BPET1')
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-08-01',
    '2538', 'C', 'female', 'AP28TE3623',
    50, 15, 750,
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    (SELECT id FROM public.farms WHERE code='BPET1')
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-08-01',
    '2539', 'C', 'female', 'AP23TA2000',
    50, 15, 750,
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    (SELECT id FROM public.farms WHERE code='BPET1')
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-08-01',
    '2540', 'C', 'female', 'AP28TE3623',
    50, 15, 750,
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    (SELECT id FROM public.farms WHERE code='BPET1')
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-08-01',
    '2541', 'C', 'female', 'AP23TA2000',
    50, 15, 750,
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    (SELECT id FROM public.farms WHERE code='BPET1')
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-08-01',
    '2542', 'C', 'female', 'AP28TE3623',
    50, 15, 750,
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    (SELECT id FROM public.farms WHERE code='BPET1')
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-08-01',
    '2543', 'C', 'female', 'AP23TA2000',
    50, 15, 750,
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    (SELECT id FROM public.farms WHERE code='BPET1')
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-08-01',
    '2544', 'C', 'female', 'AP28TE3623',
    50, 15, 750,
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    (SELECT id FROM public.farms WHERE code='BPET1')
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-08-01',
    '2545', 'C', 'female', 'AP23TA2000',
    50, 16, 800,
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    (SELECT id FROM public.farms WHERE code='BPET1')
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-08-01',
    '2546', 'C', 'female', 'AP28TE3623',
    9, 16, 144,
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    (SELECT id FROM public.farms WHERE code='BPET1')
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-08-01',
    '2546', 'D', 'female', 'AP28TE3623',
    41, 16, 656,
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    (SELECT id FROM public.farms WHERE code='BPET1')
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-08-01',
    '2547', 'D', 'female', 'AP23TA2000',
    50, 15, 750,
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    (SELECT id FROM public.farms WHERE code='BPET1')
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-08-01',
    '2548', 'D', 'female', 'AP28TE3623',
    50, 15, 750,
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    (SELECT id FROM public.farms WHERE code='BPET1')
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-08-02',
    '2549', 'D', 'female', 'AP23TA2000',
    50, 15, 750,
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    (SELECT id FROM public.farms WHERE code='BPET1')
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-08-02',
    '2550', 'D', 'female', 'AP28TE3623',
    50, 15, 750,
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    (SELECT id FROM public.farms WHERE code='BPET1')
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-08-02',
    '2851', 'A', 'male', 'AP23TA2000',
    50, 10, 500,
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    (SELECT id FROM public.farms WHERE code='BPET1')
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-08-02',
    '2852', 'A', 'male', 'AP28TE3623',
    5, 10, 50,
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    (SELECT id FROM public.farms WHERE code='BPET1')
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-08-02',
    '2852', 'B', 'male', 'AP28TE3623',
    45, 10, 450,
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    (SELECT id FROM public.farms WHERE code='BPET1')
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-08-02',
    '2853', 'B', 'male', 'AP23TA2000',
    50, 8, 400,
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    (SELECT id FROM public.farms WHERE code='BPET1')
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-08-02',
    '2854', 'B', 'male', 'AP28TE3623',
    48, 8, 384,
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    (SELECT id FROM public.farms WHERE code='BPET1')
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-08-02',
    '2854', 'C', 'male', 'AP28TE3623',
    2, 8, 16,
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    (SELECT id FROM public.farms WHERE code='BPET1')
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-08-02',
    '2855', 'C', 'male', 'AP23TA2000',
    50, 8, 400,
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    (SELECT id FROM public.farms WHERE code='BPET1')
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-08-02',
    '2856', 'C', 'male', 'AP28TE3623',
    50, 8, 400,
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    (SELECT id FROM public.farms WHERE code='BPET1')
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-08-02',
    '2857', 'C', 'male', 'AP23TA2000',
    2, 8, 16,
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    (SELECT id FROM public.farms WHERE code='BPET1')
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-08-02',
    '2857', 'D', 'male', 'AP23TA2000',
    48, 8, 384,
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    (SELECT id FROM public.farms WHERE code='BPET1')
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-08-02',
    '2858', 'D', 'male', 'AP28TE3623',
    48, 8, 384,
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    (SELECT id FROM public.farms WHERE code='BPET1')
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-08-02',
    '2858', 'D', 'female', 'AP28TE3623',
    2, 15, 30,
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    (SELECT id FROM public.farms WHERE code='BPET1')
  ),
  (
    (SELECT id FROM public.flocks WHERE flock_no='17'),
    '2024-08-03',
    '2859', 'D', 'female', '-',
    22, 15, 330,
    (SELECT id FROM public.farms WHERE code='KPALLY'),
    (SELECT id FROM public.farms WHERE code='BPET1')
  )
ON CONFLICT DO NOTHING;
